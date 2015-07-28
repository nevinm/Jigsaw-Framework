/// <reference path="../../../definitions/_definitions.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", 'modules/data', 'app', 'app-mobile', './helpers', "text!modules/customers/templates/DataSourceNotificationPanelItem.html"], function(require, exports, _data, _app, app, helpers) {
    var customersTemplateDataSourceNotificationPanelItem = require('text!modules/customers/templates/DataSourceNotificationPanelItem.html');

    var CustomersModule = (function (_super) {
        __extends(CustomersModule, _super);
        function CustomersModule() {
            _super.call(this, {
                url: "/customers",
                itemsViewModel: helpers.customers.itemsViewModel,
                barViewModel: helpers.customers.barViewModel(app.viewLayoutModule.viewModel),
                breadcrumbTitle: 'Customers'
            });

            this.barView = helpers.customers.barView.withViewModel(this.barViewModel);

            //helpers.customers.setUp({
            //    that: this,
            //    myItemsModule: data.myItemsModule
            //});
            app.syncModule.register(helpers.customers.dataSource);

            helpers.customers.addRibbonButton(app.coreModule.ribbon);
        }
        CustomersModule.prototype.requiredModules = function () {
            return _super.prototype.requiredModules.call(this).concat(app.coreModule, app.viewLayoutModule, helpers.customers.stylesModule, app.sidebarModule);
        };

        CustomersModule.prototype.load = function () {
            app.coreModule.breadcrumb.next(this.breadcrumb);

            // reset selected item on the data grid.
            this.itemsViewModel.reset();

            // when base modules are loaded show load this module
            return Q.all([
                app.viewLayoutModule.content.show(helpers.customers.dataView),
                app.viewLayoutModule.viewbar.show(this.barView),
                app.viewLayoutModule.viewModel.collapseViewbar()
            ]);
        };
        return CustomersModule;
    })(_data.DataModule);
    exports.CustomersModule = CustomersModule;

    exports.customersModule = new CustomersModule();

    _app.Jigsaw.Notifications.notificationTemplate.candidate(customersTemplateDataSourceNotificationPanelItem, function (x) {
        return x.Owner === 'customer-data';
    });

    function __init__() {
        exports.customersModule.initialize();
    }
    exports.__init__ = __init__;
});
