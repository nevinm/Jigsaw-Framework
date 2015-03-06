/// <reference path="../../../definitions/_definitions.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", 'modules/data', 'modules/data-desktop', 'app-desktop', './helpers'], function(require, exports, _data, data, app, helpers) {
    var CustomersModule = (function (_super) {
        __extends(CustomersModule, _super);
        function CustomersModule() {
            _super.call(this, {
                url: helpers.customers.url,
                itemsViewModel: helpers.customers.itemsViewModel,
                barViewModel: helpers.customers.barViewModel(app.viewLayoutModule.viewModel),
                myItemsModule: data.myItemsModule,
                coreModule: app.coreModule,
                breadcrumbTitle: 'Customers'
            });

            helpers.customers.barView.withViewModel(this.barViewModel);
            this.sidebarItemNavigate;

            helpers.customers.setUp({
                that: this,
                myItemsModule: data.myItemsModule
            });

            helpers.customers.addRibbonButton(app.coreModule.ribbon, app.coreModule.menu);
        }
        CustomersModule.prototype.requiredModules = function () {
            return _super.prototype.requiredModules.call(this).concat(helpers.customers.myItemsCollectionModule, app.coreModule, app.viewLayoutModule, app.sidebarModule, data.myItemsModule, app.notificationsModule, helpers.customers.stylesModule, helpers.customers.ensureMetadataFetchedModule);
        };

        CustomersModule.prototype.load = function () {
            app.coreModule.breadcrumb.next(this.breadcrumb);

            // reset selected item on the data grid.
            this.itemsViewModel.reset();

            // when base modules are loaded show load this module
            return Q.all([
                app.viewLayoutModule.viewbar.show(helpers.customers.barView),
                app.viewLayoutModule.content.show(helpers.customers.dataView),
                app.viewLayoutModule.viewModel.collapseViewbar()
            ]);
        };
        return CustomersModule;
    })(_data.BarDataModule);
    exports.CustomersModule = CustomersModule;

    exports.customersModule = new CustomersModule();

    function __init__() {
        exports.customersModule.initialize();

        app.notificationsModule.localNotifications.blendWith(new helpers.customers.Notifications.CustomerSidebarNotificationCollection(helpers.customers.myItemsCollectionModule.collection));

        data.mySearchesModule.registerCollection(exports.customersModule.itemsViewModel.searchManager.savedSearches);
    }
    exports.__init__ = __init__;
});
