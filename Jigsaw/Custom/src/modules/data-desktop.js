/// <reference path="../definitions/_definitions.d.ts" />
/// <reference path="../definitions/webrule.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", '../app', '../app-desktop', './data'], function(require, exports, _app, app, _data) {
    /** For the inline editing mode there's some code that calls specific logic in the grid,
    this logic doesn't belong to the viewModel and thus is here. */
    var InlineDataItemsView = (function (_super) {
        __extends(InlineDataItemsView, _super);
        function InlineDataItemsView() {
            _super.apply(this, arguments);
        }
        Object.defineProperty(InlineDataItemsView.prototype, "grid", {
            get: function () {
                return this.find('.k-grid').data('kendoGrid');
            },
            enumerable: true,
            configurable: true
        });

        /** returns true if there's some change that needs to be synced to the model. */
        InlineDataItemsView.prototype.hasPendingChanges = function () {
            return $(this.grid.tbody).has('.row-added, .row-removed, .row-dirty').length > 0;
        };

        /** syncronizes all pending datagrid changes throught the grid's datasource to the transport
        and to the viewmodel */
        InlineDataItemsView.prototype.syncChanges = function () {
            return this.grid.sync();
        };

        InlineDataItemsView.prototype.addRow = function () {
            this.grid.addRow();
        };

        /** called to reject all the changes on the grid, it should refresh the current data from the server */
        InlineDataItemsView.prototype.refresh = function (local) {
            if (typeof local === "undefined") { local = false; }
            if (!local) {
                this.grid.dataSource.read();
            } else {
                this.grid.dataSource.readLocal();
            }
        };
        return InlineDataItemsView;
    })(_app.Marionette.View);
    exports.InlineDataItemsView = InlineDataItemsView;

    var InlineDataItemsViewModel = (function (_super) {
        __extends(InlineDataItemsViewModel, _super);
        function InlineDataItemsViewModel(dataSource, options) {
            var _this = this;
            _super.call(this, dataSource, options);
            this.errorCollection = ko.observableArray();

            var guard = function (value) {
                if (value === null) {
                    return _this.promisePageChanged();
                } else {
                    return Q(true);
                }
            };
            this.selectedItem.guard(guard);
        }
        InlineDataItemsViewModel.prototype.save = function () {
            var _this = this;
            // clear the error collection
            this.errorCollection.removeAll();
            this.messageQueue.clear();

            return this.view.syncChanges().then(function () {
                // validate the entities before saving them to the server, in case there's some error
                var dataSourceSummary = _this.dataSource.status(), failedEntities = _(_this.dataSource.data).filter(function (entity) {
                    var aspect = entity.entityAspect, isValid = aspect.entityState.isDeleted() || aspect.validateEntity();
                    return !isValid;
                }), anyValidationError = failedEntities.length > 0, entitiesToSave = _.chain(_this.dataSource.data).difference(failedEntities).filter(function (entity) {
                    return entity.entityAspect.entityState.isAddedModifiedOrDeleted();
                }).value();

                if (entitiesToSave) {
                    // if there's some entity to save
                    return _this.dataSource.saveChanges(entitiesToSave).then(function () {
                        if (!anyValidationError) {
                            //this.messageQueue.add(new _app.Common.Message("Success", "items saved successfully"));
                        } else {
                            //this.messageQueue.add(new _app.Common.Message("Warning", "some items saved successfully, however there're others with errors."));
                            _this.addValidationErrorsForEntities(failedEntities);
                        }

                        return true;
                    }).fail(function (error) {
                        // process errors from the server and add them to the validation summary
                        if (error.entityErrors) {
                            var entitiesWithErrors = _(error.entityErrors).map(function (serverError) {
                                return serverError.entity;
                            });
                            _this.addValidationErrorsForEntities(entitiesWithErrors);
                        } else {
                            // this should be a server error
                            _this.messageQueue.clear().add({
                                title: error.status + ' ' + error.statusText,
                                body: error.message, level: 0 /* Error */
                            });
                        }
                        _this.view.refresh(true);
                        return Q.reject();
                    }).finally(function () {
                        // show save summary message
                        var afterSaveSummary = _this.dataSource.status(), added = dataSourceSummary.added - afterSaveSummary.added, modified = dataSourceSummary.modified - afterSaveSummary.modified, deleted = dataSourceSummary.deleted - afterSaveSummary.deleted;

                        if (added || modified || deleted) {
                            _this.messageQueue.clear().add({
                                title: "Entities saved successfully",
                                body: added + " added, " + modified + " modified, " + deleted + " deleted",
                                level: 0 /* Error */
                            });
                        }
                    });
                } else if (anyValidationError) {
                    _this.addValidationErrorsForEntities(failedEntities);
                    return Q.reject(new Error('Validation Error'));
                } else {
                    // there's nothing to do
                    return true;
                }
            });
        };

        /** Validates each passed entity and adds the corresponding validation error to the errorCollection,
        this should be displayed on a validation summary. */
        InlineDataItemsViewModel.prototype.addValidationErrorsForEntities = function (entities) {
            var _this = this;
            _.each(entities, function (entity) {
                _.each(entity.entityAspect.getValidationErrors(), function (error) {
                    _this.errorCollection.push({
                        message: error.errorMessage,
                        navigate: function () {
                            return _this.selectedItem(entity);
                        }
                    });
                });
            });
        };

        /** returns a promise that is resolved if there isn't any entity modified or
        if the user decides to save all changes */
        InlineDataItemsViewModel.prototype.promisePageChanged = function () {
            var _this = this;
            // chech if some item has been modified
            if (this.view.hasPendingChanges()) {
                return this.showMessageBox("Some of the items have changes, do you want to save them?").then(function (result) {
                    if (result === 0 /* Yes */) {
                        return _this.save();
                    } else if (result === 1 /* No */) {
                        // reject changes and procceed with the change
                        _this.dataSource.rejectChanges();
                        return Q(true);
                    } else {
                        // cancel the selection, make the observable fail by throwing an error
                        return Q.reject();
                    }
                });
            } else {
                return Q(true);
            }
        };

        InlineDataItemsViewModel.prototype.rejectAllChanges = function () {
            var _this = this;
            if (this.view.hasPendingChanges()) {
                return this.showMessageBox('Are you sure?', 1 /* QuestionYesNo */).then(function (result) {
                    if (result === 0 /* Yes */) {
                        // reject all the changes of the current entities
                        _.each(_this.dataSource.data, function (entity) {
                            return entity.entityAspect.rejectChanges();
                        });
                        _this.messageQueue.clear();
                        _this.errorCollection.removeAll();
                        _this.view.refresh();
                        return true;
                    } else {
                        return false;
                    }
                });
            } else {
                return Q(false);
            }
        };

        InlineDataItemsViewModel.prototype.addNew = function () {
            this.view.addRow();
            return Q(true);
        };
        return InlineDataItemsViewModel;
    })(_data.DataItemsViewModel);
    exports.InlineDataItemsViewModel = InlineDataItemsViewModel;

    exports.myItemsModule = new _data.Sidebar.MyItems.MyItemsModule(app.sidebarModule);

    exports.mySearchesModule = new _data.Sidebar.MySearches.SavedSearchModule(app.sidebarModule);

    exports.notificationsModule = new _data.Notifications.NotificationModule(app.coreModule, app.notificationsModule);
});
