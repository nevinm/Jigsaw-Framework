/// <reference path="../definitions/_definitions.d.ts" />
/// <reference path="../definitions/webrule.d.ts" />

/// <reference path="../definitions/jquery.d.ts" />
/// <reference path="../definitions/kendo.web.d.ts" />
/// <reference path="../definitions/Q.d.ts" />
/// <reference path="../definitions/underscore.d.ts" />
/// <reference path="../definitions/knockout.d.ts" />
/// <reference path="../definitions/knockout.validation.d.ts" />
/// <reference path="../definitions/knockout.mapping.d.ts" />
/// <reference path="../definitions/breeze.d.ts" />

import _app = require('../app');
import app = require('../app-desktop');

import templates = require('templates/data');

import _data = require('./data');

export module Knockout {



}

export module Templates {


}



/** For the inline editing mode there's some code that calls specific logic in the grid,
this logic doesn't belong to the viewModel and thus is here. */
export class InlineDataItemsView extends _app.Marionette.View {

    private get grid() {
        return <_data.Knockout.Kendo.BreezeGrid>this.find('.k-grid').data('kendoGrid');
    }

    /** returns true if there's some change that needs to be synced to the model. */
    hasPendingChanges() {
        return $(this.grid.tbody).has('.row-added, .row-removed, .row-dirty').length > 0;
    }

    /** syncronizes all pending datagrid changes throught the grid's datasource to the transport 
    and to the viewmodel */
    syncChanges(): Q.Promise<boolean> {
        return this.grid.sync();
    }

    addRow(): void {
        this.grid.addRow();
    }

    /** called to reject all the changes on the grid, it should refresh the current data from the server */
    refresh(local = false) {
        if (!local) {
            this.grid.dataSource.read();
        } else {
            this.grid.dataSource.readLocal();
        }
    }
}

export class InlineDataItemsViewModel extends _data.DataItemsViewModel {
    view: InlineDataItemsView;

    errorCollection = ko.observableArray<_data.Knockout.Tracks.ITrack>();

    constructor(dataSource: _data.Server.DataSource, options?: _data.IDataItemsViewModelOptions) {
        super(dataSource, options);

        var guard: (value?) => Q.Promise<any> = (value?) => {
            if (value === null) {
                return this.promisePageChanged()
            } else {
                return Q(true);
            }
        }
        this.selectedItem.guard(guard);
    }

    save() {
        // clear the error collection
        this.errorCollection.removeAll();
        this.messageQueue.clear();

        return this.view.syncChanges()
            .then(():any => {
                // validate the entities before saving them to the server, in case there's some error
                var dataSourceSummary = this.dataSource.status(),
                    failedEntities = _(this.dataSource.data).filter(entity => {
                        var aspect = entity.entityAspect,
                            isValid = aspect.entityState.isDeleted() || aspect.validateEntity();
                        return !isValid;
                    }),
                    anyValidationError = failedEntities.length > 0,
                    entitiesToSave = _.chain(this.dataSource.data)
                                        .difference(failedEntities)
                                        .filter(entity => entity.entityAspect.entityState.isAddedModifiedOrDeleted())
                                        .value();

                if (entitiesToSave) {
                    // if there's some entity to save
                    return this.dataSource.saveChanges(entitiesToSave)
                        .then(() => {
                            if (!anyValidationError) {
                                //this.messageQueue.add(new _app.Common.Message("Success", "items saved successfully"));
                            } else {
                                //this.messageQueue.add(new _app.Common.Message("Warning", "some items saved successfully, however there're others with errors."));
                                this.addValidationErrorsForEntities(failedEntities);
                            }

                            return true;
                        })
                        .fail((error) => {
                            // process errors from the server and add them to the validation summary
                            if (error.entityErrors) {
                                var entitiesWithErrors = _(error.entityErrors).map(serverError => serverError.entity);
                                this.addValidationErrorsForEntities(entitiesWithErrors);
                            } else {
                                // this should be a server error
                                this.messageQueue.clear().add({
                                    title: error.status + ' ' + error.statusText,
                                    body: error.message, level: _app.Jigsaw.Messages.MessageLevel.Error
                                });
                            }
                            this.view.refresh(true);
                            return Q.reject();
                        })
                        .finally(() => {
                            // show save summary message
                            var afterSaveSummary = this.dataSource.status(),
                                added = dataSourceSummary.added - afterSaveSummary.added,
                                modified = dataSourceSummary.modified - afterSaveSummary.modified,
                                deleted = dataSourceSummary.deleted - afterSaveSummary.deleted;

                            if (added || modified || deleted) {
                                this.messageQueue.clear().add({
                                    title: "Entities saved successfully",
                                    body: added + " added, " + modified + " modified, " + deleted + " deleted",
                                    level: _app.Jigsaw.Messages.MessageLevel.Error
                                });
                            }
                        });

                } else if (anyValidationError) {
                    this.addValidationErrorsForEntities(failedEntities);
                    return Q.reject(new Error('Validation Error'));
                } else {
                    // there's nothing to do
                    return true;
                }

            });
    }

    /** Validates each passed entity and adds the corresponding validation error to the errorCollection,
    this should be displayed on a validation summary. */
    private addValidationErrorsForEntities(entities: breeze.Entity[]) {
        _.each(entities, entity => {
            _.each(entity.entityAspect.getValidationErrors(), error => {
                this.errorCollection.push({
                    message: error.errorMessage,
                    navigate: () => this.selectedItem(entity)
                });
            });
        });
    }

    /** returns a promise that is resolved if there isn't any entity modified or
    if the user decides to save all changes */
    promisePageChanged(): Q.Promise<boolean> {
        // chech if some item has been modified
        if (this.view.hasPendingChanges()) {
            return <any>this.showMessageBox("Some of the items have changes, do you want to save them?")
                .then(result => {
                    if (result === _app.Views.MessageBoxResult.Yes) {
                        return this.save();
                    } else if (result === _app.Views.MessageBoxResult.No) {
                        // reject changes and procceed with the change
                        this.dataSource.rejectChanges();
                        return Q(true);
                    } else {
                        // cancel the selection, make the observable fail by throwing an error
                        return Q.reject();
                    }
                });
        } else {
            return Q(true);
        }
    }

    rejectAllChanges(): Q.Promise<boolean> {
        if (this.view.hasPendingChanges()) {
            return this.showMessageBox('Are you sure?', _app.Views.MessageBoxType.QuestionYesNo)
                .then(result => {
                    if (result === _app.Views.MessageBoxResult.Yes) {
                        // reject all the changes of the current entities
                        _.each(this.dataSource.data, entity => entity.entityAspect.rejectChanges());
                        this.messageQueue.clear();
                        this.errorCollection.removeAll();
                        this.view.refresh();
                        return true;
                    } else {
                        return false;
                    }
                });
        } else {
            return Q(false);
        }
    }

    addNew() {
        this.view.addRow();
        return Q(true);
    }
}



export var myItemsModule = new _data.Sidebar.MyItems.MyItemsModule(app.sidebarModule);

export var mySearchesModule = new _data.Sidebar.MySearches.SavedSearchModule(app.sidebarModule);

export var notificationsModule = new _data.Notifications.NotificationModule(app.coreModule, app.notificationsModule);

