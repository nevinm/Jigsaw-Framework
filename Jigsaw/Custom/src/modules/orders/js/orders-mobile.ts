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
import data = require('modules/data-mobile');

import _app = require('app');
import app = require('app-mobile');

import helpers = require('./helpers');

export class Module extends _data.DataModule {
    barView: _app.Marionette.View;

    constructor() {
        super({
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

    requiredModules(): _app.Modules.IModule[] {
        return super.requiredModules().concat(
            app.coreModule, app.viewLayoutModule, app.sidebarModule,
            data.myItemsModule, app.notificationsModule,
            helpers.orders.stylesModule);
    }

    unload() {
        app.coreModule.active.close();
        return super.unload();
    }

    load(): Q.Promise<any> {
        app.coreModule.breadcrumb.next(this.breadcrumb);
        
        // reset selected item on the data grid.
        this.itemsViewModel.reset();

        // when base modules are loaded show load this module
        return Q.all([
            // show the views on the corresponding regions
            app.viewLayoutModule.viewbar.show(this.barView),
            app.viewLayoutModule.content.show(helpers.orders.dataView),
            app.coreModule.active.show(helpers.orders.activeView),

            // and initially the viewbar should be collapsed
            app.viewLayoutModule.viewModel.collapseViewbar(),
        ]);
    }
}

export var instance = new Module();

export function __init__() {
    instance.initialize();

    data.mySearchesModule.registerCollection(instance.itemsViewModel.searchManager.savedSearches);
}

