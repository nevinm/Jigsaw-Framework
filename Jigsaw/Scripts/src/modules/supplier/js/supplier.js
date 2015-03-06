/// <amd-dependency path="text!modules/supplier/templates/DataItems.html" />
/// <amd-dependency path="text!modules/supplier/templates/DataSourceNotificationPanelItem.html" />
/// <amd-dependency path="text!modules/supplier/templates/MyItem.html" />
/// <amd-dependency path="text!modules/supplier/templates/MyItemTitle.html" />
/// <amd-dependency path="text!modules/supplier/assets/myItemStyles.css" />
/// <amd-dependency path="text!modules/supplier/assets/styles.css" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", 'modules/data', 'modules/data-desktop', 'app', 'app-desktop', 'metadata/northwind', "text!modules/supplier/templates/DataItems.html", "text!modules/supplier/templates/DataSourceNotificationPanelItem.html", "text!modules/supplier/templates/MyItem.html", "text!modules/supplier/templates/MyItemTitle.html", "text!modules/supplier/assets/myItemStyles.css", "text!modules/supplier/assets/styles.css"], function(require, exports, _data, data, _app, app, metadata) {
    var supplierTemplateDataItems = require('text!modules/supplier/templates/DataItems.html');
    var supplierTemplateDataSourceNotificationPanelItem = require('text!modules/supplier/templates/DataSourceNotificationPanelItem.html');
    var supplierTemplateMyItem = require('text!modules/supplier/templates/MyItem.html');
    var supplierTemplateMyItemTitle = require('text!modules/supplier/templates/MyItemTitle.html');
    var supplierStylemMyItemStyles = require('text!modules/supplier/assets/myItemStyles.css');
    var supplierStyles = require('text!modules/supplier/assets/styles.css');

    var SupplierModule = (function (_super) {
        __extends(SupplierModule, _super);
        function SupplierModule() {
            var manager = _data.Server.createManager('api/northwind', metadata.metadata), dataSource = new _data.Server.DataSource({
                manager: manager,
                endPoint: new breeze.EntityQuery("suppliers"),
                typeName: "Supplier"
            });

            var itemsViewModel = new data.InlineDataItemsViewModel(dataSource, {
                jumpToSearchUri: 'api/northwind/nextSupplier',
                jumpToSearchProperty: 'SupplierID'
            });

            _super.call(this, {
                url: "/supplier",
                itemsViewModel: itemsViewModel,
                breadcrumbTitle: 'Suppliers'
            });

            this.dataView = new data.InlineDataItemsView({
                template: _.template(supplierTemplateDataItems),
                viewModel: itemsViewModel
            });
            itemsViewModel.view = this.dataView;

            this.addRibbonButton();
            this.stylesModule = new _app.Jigsaw.Theming.ContentStyleSheet(supplierStyles);

            // register templates of notifications without template
            _app.Jigsaw.Notifications.notificationTemplate.candidate(supplierTemplateDataSourceNotificationPanelItem, function (x) {
                return x.Owner === 'suplier-data';
            });
        }
        SupplierModule.prototype.canUnload = function () {
            return this.itemsViewModel.promisePageChanged();
        };

        SupplierModule.prototype.addRibbonButton = function () {
            var _this = this;
            app.coreModule.ribbon.tab("Users").group("Northwind").add(new _app.Jigsaw.Ribbon.RibbonButton("Suppliers", function () {
                _app.history.navigate(_this.url);
            }, "Loads the Suppliers Module", "fa fa-calendar"), 20);
        };

        SupplierModule.prototype.requiredModules = function () {
            return _super.prototype.requiredModules.call(this).concat(app.coreModule, app.viewLayoutModule, app.sidebarModule, data.myItemsModule, this.stylesModule);
        };

        SupplierModule.prototype.load = function () {
            app.coreModule.breadcrumb.next(this.breadcrumb);

            return Q.all([
                app.viewLayoutModule.content.show(this.dataView),
                app.viewLayoutModule.viewModel.collapseViewbar()
            ]);
        };
        return SupplierModule;
    })(_data.DataModule);
    exports.SupplierModule = SupplierModule;

    exports.customersModule = new SupplierModule();

    function __init__() {
        exports.customersModule.initialize();
    }
    exports.__init__ = __init__;
});
