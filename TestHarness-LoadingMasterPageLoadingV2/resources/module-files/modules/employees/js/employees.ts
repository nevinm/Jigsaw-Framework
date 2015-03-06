/// <amd-dependency path="text!modules/employees/assets/myItemStyles.css" />
/// <amd-dependency path="text!modules/employees/templates/MyItem.html" />
/// <amd-dependency path="text!modules/employees/templates/MyItemTitle.html" />

/// <reference path="../../../definitions/_definitions.d.ts" />
/// <reference path="../../../definitions/jquery.d.ts" />
/// <reference path="../../../definitions/kendo.web.d.ts" />
/// <reference path="../../../definitions/Q.d.ts" />
/// <reference path="../../../definitions/underscore.d.ts" />
/// <reference path="../../../definitions/knockout.d.ts" />
/// <reference path="../../../definitions/require.d.ts" />
/// <reference path="../../../templates/definitions.d.ts" />

import _data = require('modules/data')
import data = require('modules/data-desktop')

import _app = require('app')
import app = require('app-desktop')

//import templates = require('templates/data.employee');
var employeeTemplateMyItemStyles = require('text!modules/employees/assets/myItemStyles.css');
var employeeTemplateMyItem = require('text!modules/employees/templates/MyItem.html');
var employeeTemplateMyItemTitle = require('text!modules/employees/templates/MyItemTitle.html');

import helpers = require('./helpers');

export class EmployeeModule extends _data.BarDataModule {
    constructor() {
        super({
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

    initialize() {
        super.initialize();

        this.registerMyItemsSet({
            itemTitleTemplate: _.template(employeeTemplateMyItemTitle),
            itemTemplate: _.template(employeeTemplateMyItem),
            styles: employeeTemplateMyItemStyles
        });
    }

    requiredModules(): _app.Modules.IModule[] {
        return super.requiredModules().concat(app.coreModule,
            app.viewLayoutModule, app.sidebarModule, data.myItemsModule,
            helpers.employees.stylesModule);
    }

    load(): Q.Promise<any> {
        app.coreModule.breadcrumb.next(this.breadcrumb);

        // reset selected item on the data grid.
        this.itemsViewModel.selectedItem(null);

        return Q.all([
                helpers.employees.downloadTemplates(),
                app.viewLayoutModule.viewModel.collapseViewbar()
            ])
            .then(() => helpers.employees.loadViews(app.viewLayoutModule));
    }
}



export var employeeModule = new EmployeeModule();

export function __init__() {
    employeeModule.initialize();
}




