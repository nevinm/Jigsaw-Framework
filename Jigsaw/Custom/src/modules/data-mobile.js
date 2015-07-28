/// <reference path="../definitions/_definitions.d.ts" />
/// <reference path="../definitions/webrule.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", '../app', '../app-mobile', './data'], function(require, exports, _app, app, _data) {
    (function (Knockout) {
        /** for some reason on KendoUI v2013.2.918 the mobile ListView widget can't be extended using
        TypeScript. That's why we use a wrapper around the original ListView to add the new functionality. */
        var ListViewManager = (function () {
            function ListViewManager(element, options) {
                var _this = this;
                this.disposables = [];
                this.selectedItem = ko.observable();
                var manager = options.dataSource.manager, entityType = manager.metadataStore.getEntityType(options.dataSource.typeName), keyPropertyNames = _data.Server.Kendo.keyPropertyNames(entityType), dataSourceOptions = {
                    dataSource: options.dataSource,
                    defaultSort: options.defaultSort
                }, dataSource = new _data.Server.Kendo.BreezeDataSource(dataSourceOptions), itemTemplate = _.template(options.itemTemplate), listViewOptions = {
                    dataSource: dataSource,
                    template: itemTemplate,
                    click: function (e) {
                        return _this.listViewItemClicked(e.dataItem, e.item);
                    },
                    pullToRefresh: true,
                    endlessScroll: false
                };

                this.disposables.push(options.dataSource.refresh(function () {
                    return dataSource.read();
                }));

                this.kendoDataSource = dataSource;
                this.listView = $(element).kendoMobileListView(listViewOptions).data('kendoMobileListView');

                this.disposables.push(this.setUpSelectedItem());

                var pagerOptions = { dataSource: dataSource, buttonCount: 5 }, elementBeforePager = $(element).parents('.km-content.km-scroll-wrapper')[0] || element, pagerElement = $('<div>').insertAfter(elementBeforePager)[0];
                this.pager = new _data.Server.Kendo.KendoPager(pagerElement, options.dataSource.page, pagerOptions);
            }
            ListViewManager.prototype.listViewItemClicked = function (dataItem, element) {
                this.selectedItem(dataItem);

                if (this.selectedElement) {
                    this.selectedElement.removeClass('k-state-selected');
                }

                $(element).addClass('k-state-selected');
                this.selectedElement = element;
            };

            ListViewManager.prototype.setUpSelectedItem = function () {
                var _this = this;
                return this.selectedItem.subscribe(function (model) {
                    var data = _this.kendoDataSource.data(), index = data.indexOf(model), element = _this.listView.element.children().eq(index);

                    if (element !== _this.selectedElement) {
                        if (_this.selectedElement) {
                            _this.selectedElement.removeClass('k-state-selected');
                        }

                        $(element).addClass('k-state-selected');
                        _this.selectedElement = element;
                    }
                });
            };

            ListViewManager.prototype.dispose = function () {
                this.pager.destroy();
                this.listView.destroy();
                _.each(this.disposables, function (disposable) {
                    return disposable.dispose();
                });
            };
            return ListViewManager;
        })();
        Knockout.ListViewManager = ListViewManager;

        ko.bindingHandlers['breezeKendoMobileListView'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var value = ko.unwrap(valueAccessor()), template = value.template || $(element).html(), options = _.defaults(value, {
                    template: template
                }), manager = options.dataSource.manager, metadataPromise = _data.Server.Metadata.ensureMetadataIsFetched(manager);
                $(element).empty();

                metadataPromise.then(function () {
                    var listViewManager = new ListViewManager(element, {
                        dataSource: options.dataSource,
                        defaultSort: options.defaultSort,
                        itemTemplate: options.template
                    }), selectedDisposable = _app.Knockout.bind({
                        from: options.selected,
                        to: listViewManager.selectedItem,
                        forward: function (item) {
                            return item ? listViewManager.kendoDataSource.getModelForEntity(item) : null;
                        },
                        backward: function (item) {
                            return item ? listViewManager.kendoDataSource.getEntityForModel(item) : null;
                        }
                    }), pageDisposable = _data.Server.Kendo.bindPage(options.selected, listViewManager.pager), refreshDisposable = _data.Server.Kendo.refreshWhenSave(listViewManager.kendoDataSource, options.dataSource.manager);

                    // perform cleaning operations when the node is disposed
                    ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                        _app.Common.bulkDispose(selectedDisposable, pageDisposable, listViewManager);
                    });
                }).done();

                return { controlsDescendantBindings: true };
            }
        };

        /** everytime the 'when' observable changes the 'top' of the target element is updated
        and made equal to the 'top' of the selected element */
        ko.bindingHandlers['pointerTo'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var value = valueAccessor(), subscription = value.when.subscribe(function () {
                    var selector = $(value.selector), position = selector.offset();

                    if (position) {
                        $(element).css({
                            top: position.top,
                            'margin-top': selector.outerHeight() / 2 - $(element).outerHeight() / 2
                        });
                    }
                });

                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    subscription.dispose();
                });
            }
        };
    })(exports.Knockout || (exports.Knockout = {}));
    var Knockout = exports.Knockout;

    /** represents an EditViewModel that is shown on a collapsable/expandable layout form */
    var PanelBarEditViewModel = (function (_super) {
        __extends(PanelBarEditViewModel, _super);
        function PanelBarEditViewModel(itemsViewModel, options) {
            _super.call(this, itemsViewModel, options);
        }
        PanelBarEditViewModel.prototype.close = function () {
            var _this = this;
            return _super.prototype.close.call(this).then(function () {
                return _this.options.panelBarViewModel.collapseViewbar();
            });
        };

        PanelBarEditViewModel.prototype.show = function () {
            return this.options.panelBarViewModel.expandViewbar();
        };
        return PanelBarEditViewModel;
    })(_data.DataEditViewModel);
    exports.PanelBarEditViewModel = PanelBarEditViewModel;

    exports.myItemsModule = new _data.Sidebar.MyItems.MyItemsModule(app.sidebarModule);

    exports.mySearchesModule = new _data.Sidebar.MySearches.SavedSearchModule(app.sidebarModule);

    exports.notificationsModule = new _data.Notifications.NotificationModule(app.coreModule, app.notificationsModule);
});
