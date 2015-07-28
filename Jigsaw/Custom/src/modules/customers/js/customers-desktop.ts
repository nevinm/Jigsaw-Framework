/// <reference path="../../../definitions/_definitions.d.ts" />

/// <reference path="../../../definitions/jquery.d.ts" />
/// <reference path="../../../definitions/kendo.web.d.ts" />
/// <reference path="../../../definitions/Q.d.ts" />
/// <reference path="../../../definitions/underscore.d.ts" />
/// <reference path="../../../definitions/knockout.d.ts" />

/// <reference path="../../../definitions/require.d.ts" />
/// <reference path="../../../templates/definitions.d.ts" />
/// <reference path="../../../metadata/definitions.d.ts" />

import _data = require('modules/data');
import data = require('modules/data-desktop');
import ordersModule = require('modules/orders/js/orders-desktop');

import _app = require('app');
import app = require('app-desktop');

import helpers = require('./helpers');

export class CustomersModule extends _data.BarDataModule {
    constructor() {
        super({
            url: helpers.customers.url,
            itemsViewModel: helpers.customers.itemsViewModel,
            barViewModel: helpers.customers.barViewModel(app.viewLayoutModule.viewModel),
            myItemsModule: data.myItemsModule,
            coreModule: app.coreModule,
            breadcrumbTitle: 'Customers'
        });

        helpers.customers.barView.withViewModel(this.barViewModel);
        this.sidebarItemNavigate

        helpers.customers.setUp({
            that: this,
            myItemsModule: data.myItemsModule
        });

        helpers.customers.addRibbonButton(app.coreModule.ribbon, app.coreModule.menu);
    }

    requiredModules(): _app.Modules.IModule[] {
        return super.requiredModules().concat(helpers.customers.myItemsCollectionModule,
            app.coreModule, app.viewLayoutModule, app.sidebarModule,
            data.myItemsModule, app.notificationsModule,
            helpers.customers.stylesModule, helpers.customers.ensureMetadataFetchedModule);
    }

    load(): Q.Promise<any> {
        app.coreModule.breadcrumb.next(this.breadcrumb);

        // reset selected item on the data grid.
        this.itemsViewModel.reset();

        // when base modules are loaded show load this module
        return Q.all([
            app.viewLayoutModule.viewbar.show(helpers.customers.barView),
            app.viewLayoutModule.content.show(helpers.customers.dataView),
            app.viewLayoutModule.viewModel.collapseViewbar(),
        ]);
    }

}

export var customersModule = new CustomersModule();

export function __init__() {
    customersModule.initialize();

    app.notificationsModule.localNotifications.blendWith(
        new helpers.customers.Notifications.CustomerSidebarNotificationCollection(helpers.customers.myItemsCollectionModule.collection));

    data.mySearchesModule.registerCollection(customersModule.itemsViewModel.searchManager.savedSearches);
}

