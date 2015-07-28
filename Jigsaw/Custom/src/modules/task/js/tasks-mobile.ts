

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

import helpers = require('./task-helpers');

export class TasksModule extends _data.DataModule {
    constructor() {
        super({
            url: helpers.task.url,
            itemsViewModel: helpers.task.itemsViewModel,
            barViewModel: new _data.VersionPager.VersionPagerPanelBarEditViewModel(helpers.task.itemsViewModel, _.defaults({
                panelBarViewModel: app.viewLayoutModule.viewModel,
            }, helpers.task.barViewModelOptions)),
            myItemsModule: data.myItemsModule,
            coreModule: app.coreModule,
        });

        helpers.task.barView.withViewModel(this.barViewModel);
        helpers.task.addRibbonButton(app.coreModule.ribbon);
    }

    requiredModules(): _app.Modules.IModule[] {
        return super.requiredModules().concat(
            app.coreModule, app.viewLayoutModule, app.sidebarModule,
            data.myItemsModule, app.notificationsModule,
            helpers.task.stylesModule);
    }

    load(): Q.Promise<any> {
        // reset selected item on the data grid.
        this.itemsViewModel.reset();

        // when base modules are loaded show load this module
        return Q.all([
            app.viewLayoutModule.viewbar.show(helpers.task.barView),
            app.viewLayoutModule.content.show(helpers.task.dataView),
            app.viewLayoutModule.viewModel.collapseViewbar(),
        ]);
    }

}


export var customersModule = new TasksModule();

export function __init__() {
    customersModule.initialize();
}



