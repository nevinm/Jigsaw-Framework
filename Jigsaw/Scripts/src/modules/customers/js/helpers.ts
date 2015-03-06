/* These are not commented */
/// <amd-dependency path="text!modules/customers/templates/CustomerEdit.html" />
/// <amd-dependency path="text!modules/customers/templates/DataSourceNotificationPanelItem.html" />
/// <amd-dependency path="text!modules/customers/templates/MyCustomerItem.html" />
/// <amd-dependency path="text!modules/customers/templates/MyCustomerItemTitle.html" />
/// <amd-dependency path="text!modules/customers/templates/MyCustomerNotificationPanelItem.html" />
/// <amd-dependency path="text!modules/customers/templates/mobile/CustomerListViewItem.html" />

/// <amd-dependency path="text!modules/customers/assets/styles.css" />
/// <amd-dependency path="text!modules/customers/assets/myCustomerStyles.css" />

import _app = require('app')

var customersTemplateCustomerEdit = require('text!modules/customers/templates/CustomerEdit.html')
var customersTemplateDataSourceNotificationPanelItem = require('text!modules/customers/templates/DataSourceNotificationPanelItem.html');
var customersTemplateMyCustomerItem = require('text!modules/customers/templates/MyCustomerItem.html');
var customersTemplateMyCustomerItemTitle = require('text!modules/customers/templates/MyCustomerItemTitle.html');
var customersTemplateMyCustomerNotificationPanelItem = require('text!modules/customers/templates/MyCustomerNotificationPanelItem.html');
var customersTemplateMobileCustomerListViewItem = require('text!modules/customers/templates/mobile/CustomerListViewItem.html');

var customersTemplateStyles = require('text!modules/customers/assets/styles.css')
var customersTemplateMyCustomerStyles = require('text!modules/customers/assets/myCustomerStyles.css')


import _data = require('modules/data')
import metadata = require('metadata/northwind');



import orders = require('modules/orders/js/orders-desktop');

import helpers = require('modules/orders/js/helpers');

export module customers {

    export class CustomerDataSource extends _data.Server.DataSource {

        constructor(manager: breeze.EntityManager) {
            super({
                manager: manager,
                endPoint: new breeze.EntityQuery("customers"),
                typeName: "Customer"
            });
        }

        createEntity(props?) {
            // ensure that the 'CustomerID' is always set on the new entity
            var options = _.defaults(props || {}, { CustomerID: breeze.core.getUuid() });
            return super.createEntity(options);
        }
    }

    export module Notifications {

        var customerSidebarNotification = 'customer-sidebar-notification';

        export class CustomerSidebarNotification implements _app.Jigsaw.Notifications.INotificationBase {
            Owner = customerSidebarNotification;
            Author = 'me';
            TimeStamp = new Date();
            Level = _app.Jigsaw.Notifications.NotificationLevel.Success;

            constructor(public Entity: breeze.Entity, public itemAdded = true) {

            }
        }
        _app.Jigsaw.Notifications.notificationTemplate.candidate(customersTemplateMyCustomerNotificationPanelItem, x => x instanceof CustomerSidebarNotification);

        export class CustomerSidebarNotificationCollection extends _app.Jigsaw.Notifications.NotificationSetCollection<CustomerSidebarNotification> {
            constructor(myItems: _data.Sidebar.MyItems.MyItemsCollection) {
                super(customerSidebarNotification);

                _app.Knockout.watchObservableArray(<any>myItems.items,
                    (element: breeze.Entity) => {
                        if (!element.entityAspect.entityState.isDetached()) {
                            this.add(new CustomerSidebarNotification(element))
                    }
                    },
                    (element: breeze.Entity) => {
                        if (!element.entityAspect.entityState.isDetached()) {
                            this.add(new CustomerSidebarNotification(element, false));
                        }
                    });
            }
        }

        // register templates of notifications without template
        _app.Jigsaw.Notifications.notificationTemplate.candidate(customersTemplateDataSourceNotificationPanelItem, x => x.Owner === 'customer-data');
    }

    export var url = "/customers",
        manager = _data.Server.createManager('api/northwind', metadata.metadata),
        dataSource = new CustomerDataSource(manager),
        ensureMetadataFetchedModule = new _data.EnsureMetadataFetchedModule(dataSource),
        columns = ['ContactName', 'ContactTitle', 'City', 'Country', 'Phone', 'Fax'],
        jumpToSearchProperty = 'ContactName',
        itemsViewModel = new _data.DataItemsViewModel(dataSource, {
            jumpToSearchUri: 'api/northwind/nextCustomer',
            jumpToSearchProperty: jumpToSearchProperty,
            excelExportPath: 'api/northwind/ExcelExportCustomers',
            columns: columns,
            savedSearchesGroup: 'Customers',
            wizzardViewBuilder: () => _data.Templates.WizzardView(_.template(customersTemplateCustomerEdit), {
                title: 'Customer',
                classIdentifier: 'fa fa-user'
            }),
            wizzardSaveDraft: item => myItemsCollectionModule.collection.addDraft(item),
            messageQueueType: _app.Jigsaw.Messages.MessageQueueType.Inline,
        }),
        dataView = _data.Templates.DataItems({
            title: "Customers",
            addNew: true,
            excelExport: true,
            advancedSearchSettingsUrl: 'api/northwind/LoadCodeRuleCustomerSearchSettings',
            advancedSearchSettings: metadata.loadCodeRuleCustomerSearchSettings,
            dragHint: customersTemplateMyCustomerItem,
            viewModel: itemsViewModel,
            columns: columns.concat(<any>{
                title: "Orders",
                command: [{
                    name: "view", click: (e => {
                        e.preventDefault();

                        var customer = dataView.grid.entityForElement(e.currentTarget);
                        // load the orders module and filter entities by the customer
                        _app.history.navigateSilent(helpers.orders.url)
                            .then(() => helpers.orders.itemsViewModel.filter(customer))
                            .done();
                    })
                }],
                width: "80px",
                groupable: false, filterable: false, sortable: false
            })
        }),
        barView = _data.Templates.ViewbarWithSummary(_.template(customersTemplateCustomerEdit)),
        stylesModule = new _app.Jigsaw.Theming.ContentStyleSheet(customersTemplateStyles);

    export function barViewModel(sizeController: _app.Jigsaw.Layout.ViewbarSizeController) {
        return new _data.PanelBarEditViewModel(itemsViewModel, {
            panelBarViewModel: sizeController,
            wordExportUrl: 'export/wordExportCustomer',
            pdfExportUrl: 'export/pdfExportCustomer',
        });
    }

    export var myItemsCollectionModule: _data.Sidebar.MyItems.MyItemsCollectionModule;

    export function addRibbonButton(ribbon: _app.Jigsaw.Ribbon.RibbonSet, menu?: _app.Jigsaw.Ribbon.MenuSet) {
        ribbon
            .tab("Users")
            .group("Northwind")
            .add(new _app.Jigsaw.Ribbon.RibbonButton("Customers",
                () => { _app.history.navigate(this.url); }, "Loads the Customer Module", "fa fa-user"), 1);

        if (menu) {
            menu
                .group("Customers", 10)
                .addAll([
                    new _app.Jigsaw.Ribbon.RibbonButton("Add New",
                        () => {
                            _app.history.navigateSilent('#' + this.url)
                                .done(() => {
                                    this.itemsViewModel.addNew();
                                });
                        }),
                    new _app.Jigsaw.Ribbon.RibbonButton("Add New Wizzard",
                        () => {
                            this.itemsViewModel.addNewWizzard();
                        })
                ]);
        }
    }

    export interface CustomersSetupOptions {
        that: _data.BarDataModule;
        myItemsModule: _data.Sidebar.MyItems.MyItemsModule;
    }

    export function setUp(options: CustomersSetupOptions) {
        myItemsCollectionModule = new _data.Sidebar.MyItems.MyItemsCollectionModule({
            itemTemplate: () => {  return customersTemplateMyCustomerItem },
            itemTitleTemplate: () => {  return customersTemplateMyCustomerItemTitle },
            dataSource: dataSource,
            styles: customersTemplateMyCustomerStyles,
            myItemsModule: options.myItemsModule,
            navigate: item => options.that.sidebarItemNavigate(item),
            ensureMetadataFetchedModule: ensureMetadataFetchedModule
        });
    }

    export interface ModuleOptions {
        coreModule: _app.Jigsaw.CoreModuleBase;
        myItemsModule: _data.Sidebar.MyItems.MyItemsModule;
        sizeController: _app.Jigsaw.Layout.ViewbarSizeController;
        requiredModules: _app.Modules.IModule[];
        load: () => Q.Promise<any>;
    }

    export class Module extends _data.DataModule {
        constructor(private customerOptions: ModuleOptions) {
            super({
                url: url,
                itemsViewModel: itemsViewModel,
                barViewModel: barViewModel(customerOptions.sizeController),
                breadcrumbTitle: 'Customers'
            });

            barView.withViewModel(this.barViewModel);

            //setUp({
            //    that: this,
            //    myItemsModule: customerOptions.myItemsModule
            //});

            addRibbonButton(customerOptions.coreModule.ribbon, customerOptions.coreModule.menu);
        }

        requiredModules(): _app.Modules.IModule[] {
            return super.requiredModules().concat(stylesModule, ensureMetadataFetchedModule)
                .concat.apply(this, this.customerOptions.requiredModules);
        }

        load(): Q.Promise<any> {
            this.customerOptions.coreModule.breadcrumb.next(this.breadcrumb);

            // reset selected item on the data grid.
            this.itemsViewModel.reset();

            return this.customerOptions.load();
        }

    }
}    