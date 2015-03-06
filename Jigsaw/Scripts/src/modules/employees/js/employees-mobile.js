/// <amd-dependency path="text!modules/employees/assets/myItemStyles.css" />
/// <amd-dependency path="text!modules/employees/templates/MyItem.html" />
/// <amd-dependency path="text!modules/employees/templates/MyItemTitle.html" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", 'modules/data', 'modules/data-mobile', 'app-mobile', './helpers', "text!modules/employees/assets/myItemStyles.css", "text!modules/employees/templates/MyItem.html", "text!modules/employees/templates/MyItemTitle.html"], function(require, exports, _data, data, app, helpers) {
    //import templates = require('templates/data.employee');
    var employeeTemplateMyItemStyles = require('text!modules/employees/assets/myItemStyles.css');
    var employeeTemplateMyItem = require('text!modules/employees/templates/MyItem.html');
    var employeeTemplateMyItemTitle = require('text!modules/employees/templates/MyItemTitle.html');

    var EmployeeModule = (function (_super) {
        __extends(EmployeeModule, _super);
        function EmployeeModule() {
            _super.call(this, {
                url: helpers.employees.url,
                itemsViewModel: helpers.employees.itemsViewModel,
                barViewModel: helpers.employees.barViewModel(app.viewLayoutModule.viewModel),
                myItemsModule: data.myItemsModule,
                coreModule: app.coreModule,
                breadcrumbTitle: 'Employees'
            });

            helpers.employees.barView.withViewModel(this.barViewModel);
            helpers.employees.addRibbonButton(app.coreModule.ribbon);
        }
        EmployeeModule.prototype.initialize = function () {
            _super.prototype.initialize.call(this);

            this.registerMyItemsSet({
                itemTitleTemplate: employeeTemplateMyItemTitle,
                itemTemplate: employeeTemplateMyItem,
                styles: employeeTemplateMyItemStyles
            });
        };

        EmployeeModule.prototype.requiredModules = function () {
            return _super.prototype.requiredModules.call(this).concat(app.coreModule, app.viewLayoutModule, app.sidebarModule, data.myItemsModule, helpers.employees.stylesModule);
        };

        EmployeeModule.prototype.load = function () {
            app.coreModule.breadcrumb.next(this.breadcrumb);

            // reset selected item on the data grid.
            this.itemsViewModel.selectedItem(null);

            return Q.all([
                helpers.employees.downloadTemplates(),
                app.viewLayoutModule.viewModel.collapseViewbar()
            ]).then(function () {
                return helpers.employees.loadViews(app.viewLayoutModule);
            });
        };
        return EmployeeModule;
    })(_data.BarDataModule);
    exports.EmployeeModule = EmployeeModule;

    exports.employeeModule = new EmployeeModule();

    function __init__() {
        exports.employeeModule.initialize();
    }
    exports.__init__ = __init__;
});
