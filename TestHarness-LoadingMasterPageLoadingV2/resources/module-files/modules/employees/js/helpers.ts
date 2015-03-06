/// <amd-dependency path="text!modules/customers/templates/CustomerEdit.html" />
/// <amd-dependency path="text!modules/employees/assets/myItemStyles.css" />
/// <amd-dependency path="text!modules/employees/templates/MyItem.html" />
/// <amd-dependency path="text!modules/employees/templates/MyItemTitle.html" />
/// <amd-dependency path="text!modules/employees/templates/DataSourceNotificationPanelItem.html" />

import _data = require('modules/data')
import _app = require('app')

import metadata = require('metadata/northwind');

//import orderTemplates = require('templates/data.order');
//import employeeTemplates = require('templates/data.employee');
var employeeTemplateMyItemStyles = require('text!modules/employees/assets/myItemStyles.css');
var employeeTemplateMyItem = require('text!modules/employees/templates/MyItem.html');
var employeeTemplateMyItemTitle = require('text!modules/employees/templates/MyItemTitle.html');
var employeeTemplateDataSourceNotificationPanelItem = require('text!modules/employees/templates/DataSourceNotificationPanelItem.html');
var customersTemplateCustomerEdit = require('text!modules/customers/templates/CustomerEdit.html')

export module employees {

    //var templates = employeeTemplates;

    export function addRibbonButton(ribbon: _app.Jigsaw.Ribbon.RibbonSet) {
        ribbon
            .tab("Users")
            .group("Northwind")
            .add(new _app.Jigsaw.Ribbon.RibbonButton("Employees",
                () => { _app.history.navigate(this.url); }, "Loads the Employee Module", "fa fa-user"), 10);
    }

    export function loadViews(layoutModule: _app.Jigsaw.Layout.IViewLayoutModule) {
        return Q.all([
            layoutModule.content.show(dataView),
            layoutModule.viewbar.show(barView)
        ]);
    }

    export function downloadTemplates() {
        return Q.all([
            viewbarReadOnlyTemplate.download(),
            viewbarTemplate.download()
        ]);
    }

    export class DataPopup implements _data.IDataPopup {

        template: _app.Marionette.TemplateFunction;
        readOnlyTemplate: _app.Marionette.TemplateFunction;

        constructor(template: _app.Common.RemoteResource<string>, readOnlyTemplate: _app.Common.RemoteResource<string>) {
            this.template = _app.Marionette.remoteSourceTemplate(template);
            this.readOnlyTemplate = _app.Marionette.remoteSourceTemplate(readOnlyTemplate);
        }

        show(entity: breeze.Entity, dataSource: _data.Server.DataSource, options?: _data.IDataPopupOptions) {

            var selectedTemplate = options && options.readOnly ? this.readOnlyTemplate : this.template,
                view = _data.Templates.PopupLayout(selectedTemplate),
                window = new _app.Views.WindowView(view, { close: close, size: _app.Views.WindowSize.LARGE }),
                viewModel = new _data.DataPopupViewModel(entity, dataSource, window, {
                    wordExportUrl: 'export/wordExportEmployee',
                    pdfExportUrl: 'export/pdfExportEmployee',
                });

            view.options.viewModel = viewModel;

            viewModel.isReadOnly(options && options.readOnly);
            viewModel.customCommands
                .group("Custom")
                .add([
                    new _app.Jigsaw.Ribbon.RibbonButton("Export to Pdf", () => { viewModel.pdfExport().done(); }),
                    new _app.Jigsaw.Ribbon.RibbonButton("Export to Word", () => { viewModel.wordExport().done(); }),
                ]);

            return window.showDialog();

            /** called when the window is to be closed */
            function close() {
                viewModel.close().fail(() => { }).done();
            }
        }

    }

    export module Notifications {

        // register templates of notifications without template
        _app.Jigsaw.Notifications.notificationTemplate.candidate(employeeTemplateDataSourceNotificationPanelItem, x => x.Owner === 'employee-data');
    }

    export var url = '/employees',
        manager = _data.Server.createManager('api/northwind', metadata.metadata),
        endPoint = new breeze.EntityQuery("employees"),
        dataSource = new _data.Server.DataSource({ manager: manager, endPoint: endPoint, typeName: "Employee" }),
        itemsViewModel = new _data.DataItemsViewModel(dataSource, {
            jumpToSearchUri: 'api/northwind/nextEmployee',
            jumpToSearchProperty: 'EmployeeID',
            excelExportPath: 'api/northwind/ExcelExportEmployees',
            savedSearchesGroup: 'Employee',
            columns: ['Title', 'FirstName', 'LastName', 'Country', 'City', 'HomePhone'],
        }),
        dataView = _data.Templates.DataItems({
            title: 'Employees',
            excelExport: true,
            advancedSearchSettingsUrl: 'api/northwind/LoadCodeRuleEmployeeSearchSettings',
            dragHint: employeeTemplateMyItem,
            viewModel: itemsViewModel
        }),
        viewbarReadOnlyTemplate = new _app.Common.RemoteResource<string>('template/employeeviewbar', { readOnly: true }),
        viewbarTemplate = new _app.Common.RemoteResource<string>('template/employeeviewbar', { readOnly: false }),
        barView = _data.Templates.ViewBar(_app.Marionette.remoteSourceTemplate(viewbarReadOnlyTemplate)),
        stylesModule = new _app.Jigsaw.Theming.ContentStyleSheet(employeeTemplateMyItemStyles);

    export function barViewModel(sizeController: _app.Jigsaw.Layout.ViewbarSizeController) {
        return new _data.PanelBarEditViewModel(itemsViewModel, {
            panelBarViewModel: sizeController,
            dataPopup: new DataPopup(viewbarTemplate, viewbarReadOnlyTemplate),
            readOnly: true,
            wordExportUrl: 'export/wordExportEmployee',
            pdfExportUrl: 'export/pdfExportEmployee',
        });
    }
   
}
