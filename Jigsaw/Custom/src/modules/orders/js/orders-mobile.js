/// <reference path="../../../definitions/_definitions.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", 'modules/data', 'modules/data-mobile', 'app-mobile', './helpers'], function(require, exports, _data, data, app, helpers) {
    var Module = (function (_super) {
        __extends(Module, _super);
        function Module() {
            _super.call(this, {
                url: helpers.orders.url,
                itemsViewModel: helpers.orders.itemsViewModel,
                barViewModel: helpers.orders.barViewModel(app.viewLayoutModule.viewModel),
                myItemsModule: data.myItemsModule,
                coreModule: app.coreModule,
                breadcrumbTitle: 'Orders'
            });

            this.barView = helpers.orders.barView.withViewModel(this.barViewModel);

            helpers.orders.addRibbonButton(app.coreModule.ribbon);
        }
        Module.prototype.requiredModules = function () {
            return _super.prototype.requiredModules.call(this).concat(app.coreModule, app.viewLayoutModule, app.sidebarModule, data.myItemsModule, app.notificationsModule, helpers.orders.stylesModule);
        };

        Module.prototype.unload = function () {
            app.coreModule.active.close();
            return _super.prototype.unload.call(this);
        };

        Module.prototype.load = function () {
            app.coreModule.breadcrumb.next(this.breadcrumb);

            // reset selected item on the data grid.
            this.itemsViewModel.reset();

            // when base modules are loaded show load this module
            return Q.all([
                app.viewLayoutModule.viewbar.show(this.barView),
                app.viewLayoutModule.content.show(helpers.orders.dataView),
                app.coreModule.active.show(helpers.orders.activeView),
                app.viewLayoutModule.viewModel.collapseViewbar()
            ]);
        };
        return Module;
    })(_data.DataModule);
    exports.Module = Module;

    exports.instance = new Module();

    function __init__() {
        exports.instance.initialize();

        data.mySearchesModule.registerCollection(exports.instance.itemsViewModel.searchManager.savedSearches);
    }
    exports.__init__ = __init__;
});
