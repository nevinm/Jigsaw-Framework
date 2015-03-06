/// <amd-dependency path="text!modules/supplier/templates/DataItems.html" />
/// <amd-dependency path="text!modules/supplier/templates/DataSourceNotificationPanelItem.html" />
/// <amd-dependency path="text!modules/supplier/templates/MyItem.html" />
/// <amd-dependency path="text!modules/supplier/templates/MyItemTitle.html" />
/// <amd-dependency path="text!modules/supplier/assets/myItemStyles.css" />
/// <amd-dependency path="text!modules/supplier/assets/styles.css" />


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

//import templates = require('templates/data.supplier');
import metadata = require('metadata/northwind');

var supplierTemplateDataItems = require('text!modules/supplier/templates/DataItems.html');
var supplierTemplateDataSourceNotificationPanelItem = require('text!modules/supplier/templates/DataSourceNotificationPanelItem.html');
var supplierTemplateMyItem = require('text!modules/supplier/templates/MyItem.html');
var supplierTemplateMyItemTitle = require('text!modules/supplier/templates/MyItemTitle.html');
var supplierStylemMyItemStyles = require('text!modules/supplier/assets/myItemStyles.css');
var supplierStyles = require('text!modules/supplier/assets/styles.css');


export class SupplierModule extends _data.DataModule {
    itemsViewModel: data.InlineDataItemsViewModel;

    /** Contains styles used to customize controls specific to the Customers module */
    private stylesModule;

    dataView: data.InlineDataItemsView;

    constructor() {

        var manager = _data.Server.createManager('api/northwind', metadata.metadata),
            dataSource = new _data.Server.DataSource({
                manager: manager,
                endPoint: new breeze.EntityQuery("suppliers"),
                typeName: "Supplier"
            });

        var itemsViewModel = new data.InlineDataItemsViewModel(dataSource, {
            jumpToSearchUri: 'api/northwind/nextSupplier',
            jumpToSearchProperty: 'SupplierID',
        });

        super({
            url: "/supplier",
            itemsViewModel: itemsViewModel,
            breadcrumbTitle: 'Suppliers'
        });
        
        this.dataView = new data.InlineDataItemsView({
            template: _.template(supplierTemplateDataItems),
            viewModel: itemsViewModel
        });
        itemsViewModel.view = this.dataView;

        this.addRibbonButton();
        this.stylesModule = new _app.Jigsaw.Theming.ContentStyleSheet(supplierStyles);

        // register templates of notifications without template
        _app.Jigsaw.Notifications.notificationTemplate.candidate(supplierTemplateDataSourceNotificationPanelItem, x => x.Owner === 'suplier-data');
    }

    canUnload(): Q.Promise<boolean> {
        return this.itemsViewModel.promisePageChanged();
    }

    addRibbonButton() {
        app.coreModule.ribbon
            .tab("Users")
            .group("Northwind")
            .add(new _app.Jigsaw.Ribbon.RibbonButton("Suppliers",
                () => { _app.history.navigate(this.url); }, "Loads the Suppliers Module", "fa fa-calendar"), 20);
    }

    requiredModules(): _app.Modules.IModule[] {
        return super.requiredModules().concat(app.coreModule,
            app.viewLayoutModule, app.sidebarModule, data.myItemsModule,
            this.stylesModule);
    }

    load(): Q.Promise<any> {        
        app.coreModule.breadcrumb.next(this.breadcrumb);

        return Q.all([
            app.viewLayoutModule.content.show(this.dataView),
            app.viewLayoutModule.viewModel.collapseViewbar()
        ]);
    }
}

export var customersModule = new SupplierModule();

export function __init__() {
    customersModule.initialize();
}

