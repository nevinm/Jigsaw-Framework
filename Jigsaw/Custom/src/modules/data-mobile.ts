
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
import app = require('../app-mobile');

import templates = require('templates/data-mobile');

import _data = require('./data');

export module Templates {

}

export module Knockout {

    export interface ListViewManagerOptions {
        /** contains the ListView item template, this must be a KendoUI template */
        itemTemplate: string;

        dataSource: _data.Server.DataSource;
        defaultSort: string;
    }

    /** for some reason on KendoUI v2013.2.918 the mobile ListView widget can't be extended using
    TypeScript. That's why we use a wrapper around the original ListView to add the new functionality. */
    export class ListViewManager implements _app.Common.IDisposable {
        disposables = [];
        listView: kendo.mobile.ui.ListView;
        selectedItem = ko.observable();
        selectedElement: JQuery;
        kendoDataSource: _data.Server.Kendo.BreezeDataSource;
        pager: _data.Server.Kendo.KendoPager;

        constructor(element, options: ListViewManagerOptions) {

            var manager = options.dataSource.manager,
                entityType = manager.metadataStore.getEntityType(options.dataSource.typeName),
                keyPropertyNames = _data.Server.Kendo.keyPropertyNames(entityType),
                dataSourceOptions: _data.Server.Kendo.BreezeDataSourceOptions = {
                    dataSource: options.dataSource,
                    defaultSort: options.defaultSort,
                },
                dataSource = new _data.Server.Kendo.BreezeDataSource(dataSourceOptions),
                itemTemplate = _.template(options.itemTemplate),
                listViewOptions: kendo.mobile.ui.ListViewOptions = {
                    dataSource: dataSource,
                    template: itemTemplate,
                    click: (e: kendo.mobile.ui.ListViewClickEvent) => this.listViewItemClicked(e.dataItem, e.item),
                    pullToRefresh: true,
                    endlessScroll: false,
                };

            this.disposables.push(options.dataSource.refresh(() => dataSource.read()));

            this.kendoDataSource = dataSource;
            this.listView = $(element).kendoMobileListView(listViewOptions).data('kendoMobileListView');

            this.disposables.push(this.setUpSelectedItem());

            var pagerOptions: kendo.ui.PagerOptions = { dataSource: dataSource, buttonCount: 5 },
                elementBeforePager = $(element).parents('.km-content.km-scroll-wrapper')[0] || element,
                pagerElement = $('<div>').insertAfter(elementBeforePager)[0];
            this.pager = new _data.Server.Kendo.KendoPager(pagerElement, options.dataSource.page, pagerOptions);
        }

        private listViewItemClicked(dataItem, element: JQuery) {
            this.selectedItem(dataItem);

            if (this.selectedElement) {
                this.selectedElement.removeClass('k-state-selected');
            }

            $(element).addClass('k-state-selected');
            this.selectedElement = element;
        }

        private setUpSelectedItem() {
            return this.selectedItem.subscribe(model => {
                var data = this.kendoDataSource.data(),
                    index = data.indexOf(model),
                    element = this.listView.element.children().eq(index);

                if (element !== this.selectedElement) {
                    if (this.selectedElement) {
                        this.selectedElement.removeClass('k-state-selected');
                    }

                    $(element).addClass('k-state-selected');
                    this.selectedElement = element;
                }
            });
        }

        dispose() {
            this.pager.destroy();
            this.listView.destroy();
            _.each(this.disposables, disposable => disposable.dispose());
        }

    }

    export interface KendoMobileListViewOptions {
        dataSource: _data.Server.DataSource;
        defaultSort: string;
        template?: string;
        pageSize?: number;
        selected?: GuardedObservable<any>;

        widget: KnockoutObservable<kendo.mobile.ui.ListView>;
    }

    ko.bindingHandlers['breezeKendoMobileListView'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = ko.unwrap(valueAccessor()),
                template = value.template || $(element).html(),
                options: KendoMobileListViewOptions = _.defaults(value, {
                    template: template,
                }),
                manager = options.dataSource.manager,
                metadataPromise = _data.Server.Metadata.ensureMetadataIsFetched(manager)
            ;
            $(element).empty();

            metadataPromise // the metadata can only be requested once for each service
                .then(() => {
                    var listViewManager = new ListViewManager(element, {
                            dataSource: options.dataSource,
                            defaultSort: options.defaultSort,
                            itemTemplate: options.template
                        }),
                        selectedDisposable = _app.Knockout.bind<breeze.Entity, any>({
                            from: options.selected,
                            to: listViewManager.selectedItem,
                            forward: (item) => item ? listViewManager.kendoDataSource.getModelForEntity(item) : null,
                            backward: item => item ? listViewManager.kendoDataSource.getEntityForModel(item) : null
                        }),
                        pageDisposable = _data.Server.Kendo.bindPage(options.selected, listViewManager.pager),
                        refreshDisposable = _data.Server.Kendo.refreshWhenSave(listViewManager.kendoDataSource, options.dataSource.manager);
                    
                    // perform cleaning operations when the node is disposed
                    ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                        _app.Common.bulkDispose(selectedDisposable, pageDisposable, listViewManager);
                    });
                })
                .done();

            return { controlsDescendantBindings: true };
        }
    }

    export interface PointerToBindingOptions {
        selector: string;
        when: KnockoutObservable<any>;
    }

    /** everytime the 'when' observable changes the 'top' of the target element is updated
    and made equal to the 'top' of the selected element */
    ko.bindingHandlers['pointerTo'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value: PointerToBindingOptions = valueAccessor(),
                subscription = value.when.subscribe(() => {
                    var selector = $(value.selector),
                        position = selector.offset();
                    
                    if (position) {
                        $(element).css({
                            top: position.top,
                            'margin-top': selector.outerHeight() / 2 - $(element).outerHeight() / 2
                        });
                    }
                });

            ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                subscription.dispose();
            });
        }
    }

}

export interface IPanelBarEditViewModelOptions extends _data.IDataEditViewModelOptions {
    panelBarViewModel: app.Jigsaw.Layout.ViewLayoutViewModel;
}

/** represents an EditViewModel that is shown on a collapsable/expandable layout form */
export class PanelBarEditViewModel extends _data.DataEditViewModel {
    options: IPanelBarEditViewModelOptions;

    constructor(itemsViewModel: _data.DataItemsViewModel, options: IPanelBarEditViewModelOptions) {
        super(itemsViewModel, options);
    }

    close() {
        return super.close().then(() => this.options.panelBarViewModel.collapseViewbar());
    }

    show() {
        return this.options.panelBarViewModel.expandViewbar();
    }
}

export var myItemsModule = new _data.Sidebar.MyItems.MyItemsModule(app.sidebarModule);

export var mySearchesModule = new _data.Sidebar.MySearches.SavedSearchModule(app.sidebarModule);

export var notificationsModule = new _data.Notifications.NotificationModule(app.coreModule, app.notificationsModule);