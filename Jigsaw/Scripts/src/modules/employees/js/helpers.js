/// <amd-dependency path="text!modules/customers/templates/CustomerEdit.html" />
/// <amd-dependency path="text!modules/employees/assets/myItemStyles.css" />
/// <amd-dependency path="text!modules/employees/templates/MyItem.html" />
/// <amd-dependency path="text!modules/employees/templates/MyItemTitle.html" />
/// <amd-dependency path="text!modules/employees/templates/DataSourceNotificationPanelItem.html" />
define(["require", "exports", 'modules/data', 'app', 'metadata/northwind', "text!modules/customers/templates/CustomerEdit.html", "text!modules/employees/assets/myItemStyles.css", "text!modules/employees/templates/MyItem.html", "text!modules/employees/templates/MyItemTitle.html", "text!modules/employees/templates/DataSourceNotificationPanelItem.html"], function(require, exports, _data, _app, metadata) {
    //import orderTemplates = require('templates/data.order');
    //import employeeTemplates = require('templates/data.employee');
    var employeeTemplateMyItemStyles = require('text!modules/employees/assets/myItemStyles.css');
    var employeeTemplateMyItem = require('text!modules/employees/templates/MyItem.html');
    var employeeTemplateMyItemTitle = require('text!modules/employees/templates/MyItemTitle.html');
    var employeeTemplateDataSourceNotificationPanelItem = require('text!modules/employees/templates/DataSourceNotificationPanelItem.html');
    var customersTemplateCustomerEdit = require('text!modules/customers/templates/CustomerEdit.html');

    (function (employees) {
        //var templates = employeeTemplates;
        function addRibbonButton(ribbon) {
            var _this = this;
            ribbon.tab("Users").group("Northwind").add(new _app.Jigsaw.Ribbon.RibbonButton("Employees", function () {
                _app.history.navigate(_this.url);
            }, "Loads the Employee Module", "fa fa-user"), 10);
        }
        employees.addRibbonButton = addRibbonButton;

        function loadViews(layoutModule) {
            return Q.all([
                layoutModule.content.show(employees.dataView),
                layoutModule.viewbar.show(employees.barView)
            ]);
        }
        employees.loadViews = loadViews;

        function downloadTemplates() {
            return Q.all([
                employees.viewbarReadOnlyTemplate.download(),
                employees.viewbarTemplate.download()
            ]);
        }
        employees.downloadTemplates = downloadTemplates;

        var DataPopup = (function () {
            function DataPopup(template, readOnlyTemplate) {
                this.template = _app.Marionette.remoteSourceTemplate(template);
                this.readOnlyTemplate = _app.Marionette.remoteSourceTemplate(readOnlyTemplate);
            }
            DataPopup.prototype.show = function (entity, dataSource, options) {
                var selectedTemplate = options && options.readOnly ? this.readOnlyTemplate : this.template, view = _data.Templates.PopupLayout(selectedTemplate), window = new _app.Views.WindowView(view, { close: close, size: 2 /* LARGE */ }), viewModel = new _data.DataPopupViewModel(entity, dataSource, window, {
                    wordExportUrl: 'export/wordExportEmployee',
                    pdfExportUrl: 'export/pdfExportEmployee'
                });

                view.options.viewModel = viewModel;

                viewModel.isReadOnly(options && options.readOnly);
                viewModel.customCommands.group("Custom").add([
                    new _app.Jigsaw.Ribbon.RibbonButton("Export to Pdf", function () {
                        viewModel.pdfExport().done();
                    }),
                    new _app.Jigsaw.Ribbon.RibbonButton("Export to Word", function () {
                        viewModel.wordExport().done();
                    })
                ]);

                return window.showDialog();

                /** called when the window is to be closed */
                function close() {
                    viewModel.close().fail(function () {
                    }).done();
                }
            };
            return DataPopup;
        })();
        employees.DataPopup = DataPopup;

        (function (Notifications) {
            // register templates of notifications without template
            _app.Jigsaw.Notifications.notificationTemplate.candidate(employeeTemplateDataSourceNotificationPanelItem, function (x) {
                return x.Owner === 'employee-data';
            });
        })(employees.Notifications || (employees.Notifications = {}));
        var Notifications = employees.Notifications;

        employees.url = '/employees', employees.manager = _data.Server.createManager('api/northwind', metadata.metadata), employees.endPoint = new breeze.EntityQuery("employees"), employees.dataSource = new _data.Server.DataSource({ manager: employees.manager, endPoint: employees.endPoint, typeName: "Employee" }), employees.itemsViewModel = new _data.DataItemsViewModel(employees.dataSource, {
            jumpToSearchUri: 'api/northwind/nextEmployee',
            jumpToSearchProperty: 'EmployeeID',
            excelExportPath: 'api/northwind/ExcelExportEmployees',
            savedSearchesGroup: 'Employee',
            columns: ['Title', 'FirstName', 'LastName', 'Country', 'City', 'HomePhone']
        }), employees.dataView = _data.Templates.DataItems({
            title: 'Employees',
            excelExport: true,
            advancedSearchSettingsUrl: 'api/northwind/LoadCodeRuleEmployeeSearchSettings',
            dragHint: employeeTemplateMyItem,
            viewModel: employees.itemsViewModel
        }), employees.viewbarReadOnlyTemplate = new _app.Common.RemoteResource('template/employeeviewbar', { readOnly: true }), employees.viewbarTemplate = new _app.Common.RemoteResource('template/employeeviewbar', { readOnly: false }), employees.barView = _data.Templates.ViewBar(_app.Marionette.remoteSourceTemplate(employees.viewbarReadOnlyTemplate)), employees.stylesModule = new _app.Jigsaw.Theming.ContentStyleSheet(employeeTemplateMyItemStyles);

        function barViewModel(sizeController) {
            return new _data.PanelBarEditViewModel(employees.itemsViewModel, {
                panelBarViewModel: sizeController,
                dataPopup: new DataPopup(employees.viewbarTemplate, employees.viewbarReadOnlyTemplate),
                readOnly: true,
                wordExportUrl: 'export/wordExportEmployee',
                pdfExportUrl: 'export/pdfExportEmployee'
            });
        }
        employees.barViewModel = barViewModel;
    })(exports.employees || (exports.employees = {}));
    var employees = exports.employees;
});
