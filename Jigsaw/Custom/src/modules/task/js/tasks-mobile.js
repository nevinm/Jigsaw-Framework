/// <reference path="../../../definitions/_definitions.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", 'modules/data', 'modules/data-mobile', 'app-mobile', './task-helpers'], function(require, exports, _data, data, app, helpers) {
    var TasksModule = (function (_super) {
        __extends(TasksModule, _super);
        function TasksModule() {
            _super.call(this, {
                url: helpers.task.url,
                itemsViewModel: helpers.task.itemsViewModel,
                barViewModel: new _data.VersionPager.VersionPagerPanelBarEditViewModel(helpers.task.itemsViewModel, _.defaults({
                    panelBarViewModel: app.viewLayoutModule.viewModel
                }, helpers.task.barViewModelOptions)),
                myItemsModule: data.myItemsModule,
                coreModule: app.coreModule
            });

            helpers.task.barView.withViewModel(this.barViewModel);
            helpers.task.addRibbonButton(app.coreModule.ribbon);
        }
        TasksModule.prototype.requiredModules = function () {
            return _super.prototype.requiredModules.call(this).concat(app.coreModule, app.viewLayoutModule, app.sidebarModule, data.myItemsModule, app.notificationsModule, helpers.task.stylesModule);
        };

        TasksModule.prototype.load = function () {
            // reset selected item on the data grid.
            this.itemsViewModel.reset();

            // when base modules are loaded show load this module
            return Q.all([
                app.viewLayoutModule.viewbar.show(helpers.task.barView),
                app.viewLayoutModule.content.show(helpers.task.dataView),
                app.viewLayoutModule.viewModel.collapseViewbar()
            ]);
        };
        return TasksModule;
    })(_data.DataModule);
    exports.TasksModule = TasksModule;

    exports.customersModule = new TasksModule();

    function __init__() {
        exports.customersModule.initialize();
    }
    exports.__init__ = __init__;
});
