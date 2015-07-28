/// <amd-dependency path="text!modules/customers/templates/CustomerEdit.html" />
/// <amd-dependency path="text!modules/orders/templates/ActiveCustomer.html" />
/// <amd-dependency path="text!modules/orders/templates/DataSourceNotificationPanelItem.html" />
/// <amd-dependency path="text!modules/orders/templates/QueryFilter.html" />
/// <amd-dependency path="text!modules/orders/templates/OrderEdit.html" />
/// <amd-dependency path="text!modules/orders/assets/styles.css" />

import _data = require('modules/data')
import _app = require('app')

import metadata = require('metadata/northwind');

var customersTemplateCustomerEdit = require('text!modules/customers/templates/CustomerEdit.html')
var ordersTemplateDataSrcNotiPanelItem = require('text!modules/orders/templates/DataSourceNotificationPanelItem.html')
var ordersTemplateQueryFilter = require('text!modules/orders/templates/QueryFilter.html')
var ordersTemplateOrderEdit = require('text!modules/orders/templates/OrderEdit.html')
var ordersTemplateActiveCustomer = require('text!modules/orders/templates/ActiveCustomer.html')

var ordersTemplateStyles = require('text!modules/orders/assets/styles.css')


export module orders {

    export function addRibbonButton(ribbon: _app.Jigsaw.Ribbon.RibbonSet) {
        ribbon
            .tab("Users")
            .group("Northwind")
            .add(new _app.Jigsaw.Ribbon.RibbonButton("Orders",
                () => { _app.history.navigate(this.url); }, "Loads the Order Module", "fa fa-user"), 2);

        // add contextual Users Tab if there's any user filter applied
        var disposable: _app.Common.IDisposable;
        this.itemsViewModel.queryFilter.parameters.subscribe(x => {
            if (x.length) {
                disposable = ribbon
                    .tab("Customers", 90)
                    .group("Sample")
                    .addAll([
                        new _app.Jigsaw.Ribbon.RibbonButton("Test"),
                        new _app.Jigsaw.Ribbon.RibbonButton("Erase"),
                        new _app.Jigsaw.Ribbon.RibbonButton("More Info"),
                    ]);
            } else {
                disposable && disposable.dispose();
            }
        });
    }

    export module Notifications {

        // register templates of notifications without template
        _app.Jigsaw.Notifications.notificationTemplate.candidate(ordersTemplateDataSrcNotiPanelItem, x => x.Owner === 'order-data');
    }

    export var url = "/orders",
        manager = _data.Server.createManager('api/northwind', metadata.metadata),
        dataSource = new _data.Server.DataSource({
            manager: manager,
            endPoint: new breeze.EntityQuery("orders"),
            typeName: "Order"
        }),
        // create the view-model behind the content area
        itemsViewModel = new _data.DataItemsViewModel(dataSource, {
            jumpToSearchUri: 'api/northwind/nextOrder',
            jumpToSearchProperty: 'ShipName',
            columns: ['ShipName', 'ShipAddress', 'ShipCity'],
            savedSearchesGroup: 'Orders',
            queryFilter: (query, customer) =>
                query.where('CustomerID', breeze.FilterQueryOp.Equals, customer.CustomerID())
        }),
        // view used for the main content area
        dataView = _data.Templates.DataItems({
            title: "Orders",
            addNew: false,
            excelExport: false,
            viewModel: itemsViewModel,
            filterTemplate: ordersTemplateQueryFilter
        }),
        // view used on the view-bar
        barView = _data.Templates.ViewBar(_.template(ordersTemplateOrderEdit)),
        activeView = new _app.Marionette.View({
            viewModel: itemsViewModel,
            template: () => _.template(ordersTemplateActiveCustomer)({
                customerSummary: _data.Templates.SummaryTab(_.template(customersTemplateCustomerEdit)({ throttle: false }))
            }),
        }),
        stylesModule = new _app.Jigsaw.Theming.ContentStyleSheet(ordersTemplateStyles);

    export function barViewModel(sizeController: _app.Jigsaw.Layout.ViewbarSizeController) {
        return new _data.PanelBarEditViewModel(itemsViewModel, {
            panelBarViewModel: sizeController,
        });
    }
}

