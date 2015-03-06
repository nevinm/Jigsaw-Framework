/// <reference path="../../../definitions/_definitions.d.ts" />

/// <reference path="../../../definitions/jquery.d.ts" />
/// <reference path="../../../definitions/kendo.web.d.ts" />
/// <reference path="../../../definitions/Q.d.ts" />
/// <reference path="../../../definitions/underscore.d.ts" />
/// <reference path="../../../definitions/knockout.d.ts" />

/// <reference path="../../../definitions/require.d.ts" />
/// <reference path="../../../templates/definitions.d.ts" />
/// <amd-dependency path="text!modules/customers/templates/DataSourceNotificationPanelItem.html" />


import _data = require('modules/data');
import data = require('modules/data-mobile');

import _app = require('app');
import app = require('app-mobile');

var customersTemplateDataSourceNotificationPanelItem = require('text!modules/customers/templates/DataSourceNotificationPanelItem.html');
import helpers = require('./helpers');

export class CustomersModule extends _data.DataModule {
    barView: _app.Marionette.View;

    constructor() {
        super({
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

    requiredModules(): _app.Modules.IModule[] {
        return super.requiredModules().concat(app.coreModule, app.viewLayoutModule, helpers.customers.stylesModule, app.sidebarModule);
    }

    load(): Q.Promise<any> {
        app.coreModule.breadcrumb.next(this.breadcrumb);

        // reset selected item on the data grid.
        this.itemsViewModel.reset();
        
        // when base modules are loaded show load this module
        return Q.all([
                app.viewLayoutModule.content.show(helpers.customers.dataView),
                app.viewLayoutModule.viewbar.show(this.barView),
                app.viewLayoutModule.viewModel.collapseViewbar()
            ]);
    }

}

export var customersModule = new CustomersModule();

_app.Jigsaw.Notifications.notificationTemplate.candidate(customersTemplateDataSourceNotificationPanelItem, x => x.Owner === 'customer-data');


export function __init__() {
    customersModule.initialize();
    
}

