/* These are not commented */
/// <amd-dependency path="text!modules/customers/templates/CustomerEdit.html" />
/// <amd-dependency path="text!modules/customers/templates/DataSourceNotificationPanelItem.html" />
/// <amd-dependency path="text!modules/customers/templates/MyCustomerItem.html" />
/// <amd-dependency path="text!modules/customers/templates/MyCustomerItemTitle.html" />
/// <amd-dependency path="text!modules/customers/templates/MyCustomerNotificationPanelItem.html" />
/// <amd-dependency path="text!modules/customers/templates/mobile/CustomerListViewItem.html" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", 'app', 'modules/data', 'metadata/northwind', 'modules/orders/js/helpers', "text!modules/customers/templates/CustomerEdit.html", "text!modules/customers/templates/DataSourceNotificationPanelItem.html", "text!modules/customers/templates/MyCustomerItem.html", "text!modules/customers/templates/MyCustomerItemTitle.html", "text!modules/customers/templates/MyCustomerNotificationPanelItem.html", "text!modules/customers/templates/mobile/CustomerListViewItem.html", "text!modules/customers/assets/styles.css", "text!modules/customers/assets/myCustomerStyles.css"], function(require, exports, _app, _data, metadata, helpers) {
    var customersTemplateCustomerEdit = require('text!modules/customers/templates/CustomerEdit.html');
    var customersTemplateDataSourceNotificationPanelItem = require('text!modules/customers/templates/DataSourceNotificationPanelItem.html');
    var customersTemplateMyCustomerItem = require('text!modules/customers/templates/MyCustomerItem.html');
    var customersTemplateMyCustomerItemTitle = require('text!modules/customers/templates/MyCustomerItemTitle.html');
    var customersTemplateMyCustomerNotificationPanelItem = require('text!modules/customers/templates/MyCustomerNotificationPanelItem.html');
    var customersTemplateMobileCustomerListViewItem = require('text!modules/customers/templates/mobile/CustomerListViewItem.html');

    var customersTemplateStyles = require('text!modules/customers/assets/styles.css');
    var customersTemplateMyCustomerStyles = require('text!modules/customers/assets/myCustomerStyles.css');

    (function (customers) {
        var CustomerDataSource = (function (_super) {
            __extends(CustomerDataSource, _super);
            function CustomerDataSource(manager) {
                _super.call(this, {
                    manager: manager,
                    endPoint: new breeze.EntityQuery("customers"),
                    typeName: "Customer"
                });
            }
            CustomerDataSource.prototype.createEntity = function (props) {
                // ensure that the 'CustomerID' is always set on the new entity
                var options = _.defaults(props || {}, { CustomerID: breeze.core.getUuid() });
                return _super.prototype.createEntity.call(this, options);
            };
            return CustomerDataSource;
        })(_data.Server.DataSource);
        customers.CustomerDataSource = CustomerDataSource;

        (function (Notifications) {
            var customerSidebarNotification = 'customer-sidebar-notification';

            var CustomerSidebarNotification = (function () {
                function CustomerSidebarNotification(Entity, itemAdded) {
                    if (typeof itemAdded === "undefined") { itemAdded = true; }
                    this.Entity = Entity;
                    this.itemAdded = itemAdded;
                    this.Owner = customerSidebarNotification;
                    this.Author = 'me';
                    this.TimeStamp = new Date();
                    this.Level = _app.Jigsaw.Notifications.NotificationLevel.Success;
                }
                return CustomerSidebarNotification;
            })();
            Notifications.CustomerSidebarNotification = CustomerSidebarNotification;
            _app.Jigsaw.Notifications.notificationTemplate.candidate(customersTemplateMyCustomerNotificationPanelItem, function (x) {
                return x instanceof CustomerSidebarNotification;
            });

            var CustomerSidebarNotificationCollection = (function (_super) {
                __extends(CustomerSidebarNotificationCollection, _super);
                function CustomerSidebarNotificationCollection(myItems) {
                    var _this = this;
                    _super.call(this, customerSidebarNotification);

                    _app.Knockout.watchObservableArray(myItems.items, function (element) {
                        if (!element.entityAspect.entityState.isDetached()) {
                            _this.add(new CustomerSidebarNotification(element));
                        }
                    }, function (element) {
                        if (!element.entityAspect.entityState.isDetached()) {
                            _this.add(new CustomerSidebarNotification(element, false));
                        }
                    });
                }
                return CustomerSidebarNotificationCollection;
            })(_app.Jigsaw.Notifications.NotificationSetCollection);
            Notifications.CustomerSidebarNotificationCollection = CustomerSidebarNotificationCollection;

            // register templates of notifications without template
            _app.Jigsaw.Notifications.notificationTemplate.candidate(customersTemplateDataSourceNotificationPanelItem, function (x) {
                return x.Owner === 'customer-data';
            });
        })(customers.Notifications || (customers.Notifications = {}));
        var Notifications = customers.Notifications;

        customers.url = "/customers", customers.manager = _data.Server.createManager('api/northwind', metadata.metadata), customers.dataSource = new CustomerDataSource(customers.manager), customers.ensureMetadataFetchedModule = new _data.EnsureMetadataFetchedModule(customers.dataSource), customers.columns = ['ContactName', 'ContactTitle', 'City', 'Country', 'Phone', 'Fax'], customers.jumpToSearchProperty = 'ContactName', customers.itemsViewModel = new _data.DataItemsViewModel(customers.dataSource, {
            jumpToSearchUri: 'api/northwind/nextCustomer',
            jumpToSearchProperty: customers.jumpToSearchProperty,
            excelExportPath: 'api/northwind/ExcelExportCustomers',
            columns: customers.columns,
            savedSearchesGroup: 'Customers',
            wizzardViewBuilder: function () {
                return _data.Templates.WizzardView(_.template(customersTemplateCustomerEdit), {
                    title: 'Customer',
                    classIdentifier: 'fa fa-user'
                });
            },
            wizzardSaveDraft: function (item) {
                return customers.myItemsCollectionModule.collection.addDraft(item);
            },
            messageQueueType: _app.Jigsaw.Messages.MessageQueueType.Inline
        }), customers.dataView = _data.Templates.DataItems({
            title: "Customers",
            addNew: true,
            excelExport: true,
            advancedSearchSettingsUrl: 'api/northwind/LoadCodeRuleCustomerSearchSettings',
            advancedSearchSettings: metadata.loadCodeRuleCustomerSearchSettings,
            dragHint: customersTemplateMyCustomerItem,
            viewModel: customers.itemsViewModel,
            columns: customers.columns.concat({
                title: "Orders",
                command: [{
                        name: "view", click: (function (e) {
                            e.preventDefault();

                            var customer = customers.dataView.grid.entityForElement(e.currentTarget);

                            // load the orders module and filter entities by the customer
                            _app.history.navigateSilent(helpers.orders.url).then(function () {
                                return helpers.orders.itemsViewModel.filter(customer);
                            }).done();
                        })
                    }],
                width: "80px",
                groupable: false, filterable: false, sortable: false
            })
        }), customers.barView = _data.Templates.ViewbarWithSummary(_.template(customersTemplateCustomerEdit)), customers.stylesModule = new _app.Jigsaw.Theming.ContentStyleSheet(customersTemplateStyles);

        function barViewModel(sizeController) {
            return new _data.PanelBarEditViewModel(customers.itemsViewModel, {
                panelBarViewModel: sizeController,
                wordExportUrl: 'export/wordExportCustomer',
                pdfExportUrl: 'export/pdfExportCustomer'
            });
        }
        customers.barViewModel = barViewModel;

        customers.myItemsCollectionModule;

        function addRibbonButton(ribbon, menu) {
            var _this = this;
            ribbon.tab("Users").group("Northwind").add(new _app.Jigsaw.Ribbon.RibbonButton("Customers", function () {
                _app.history.navigate(_this.url);
            }, "Loads the Customer Module", "fa fa-user"), 1);

            if (menu) {
                menu.group("Customers", 10).addAll([
                    new _app.Jigsaw.Ribbon.RibbonButton("Add New", function () {
                        _app.history.navigateSilent('#' + _this.url).done(function () {
                            _this.itemsViewModel.addNew();
                        });
                    }),
                    new _app.Jigsaw.Ribbon.RibbonButton("Add New Wizzard", function () {
                        _this.itemsViewModel.addNewWizzard();
                    })
                ]);
            }
        }
        customers.addRibbonButton = addRibbonButton;

        function setUp(options) {
            customers.myItemsCollectionModule = new _data.Sidebar.MyItems.MyItemsCollectionModule({
                itemTemplate: function () {
                    return customersTemplateMyCustomerItem;
                },
                itemTitleTemplate: function () {
                    return customersTemplateMyCustomerItemTitle;
                },
                dataSource: customers.dataSource,
                styles: customersTemplateMyCustomerStyles,
                myItemsModule: options.myItemsModule,
                navigate: function (item) {
                    return options.that.sidebarItemNavigate(item);
                },
                ensureMetadataFetchedModule: customers.ensureMetadataFetchedModule
            });
        }
        customers.setUp = setUp;

        var Module = (function (_super) {
            __extends(Module, _super);
            function Module(customerOptions) {
                _super.call(this, {
                    url: customers.url,
                    itemsViewModel: customers.itemsViewModel,
                    barViewModel: barViewModel(customerOptions.sizeController),
                    breadcrumbTitle: 'Customers'
                });
                this.customerOptions = customerOptions;

                customers.barView.withViewModel(this.barViewModel);

                //setUp({
                //    that: this,
                //    myItemsModule: customerOptions.myItemsModule
                //});
                addRibbonButton(customerOptions.coreModule.ribbon, customerOptions.coreModule.menu);
            }
            Module.prototype.requiredModules = function () {
                return _super.prototype.requiredModules.call(this).concat(customers.stylesModule, customers.ensureMetadataFetchedModule).concat.apply(this, this.customerOptions.requiredModules);
            };

            Module.prototype.load = function () {
                this.customerOptions.coreModule.breadcrumb.next(this.breadcrumb);

                // reset selected item on the data grid.
                this.itemsViewModel.reset();

                return this.customerOptions.load();
            };
            return Module;
        })(_data.DataModule);
        customers.Module = Module;
    })(exports.customers || (exports.customers = {}));
    var customers = exports.customers;
});
