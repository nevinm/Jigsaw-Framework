/// <amd-dependency path="text!modules/customers/templates/CustomerEdit.html" />
/// <amd-dependency path="text!modules/orders/templates/ActiveCustomer.html" />
/// <amd-dependency path="text!modules/orders/templates/DataSourceNotificationPanelItem.html" />
/// <amd-dependency path="text!modules/orders/templates/QueryFilter.html" />
/// <amd-dependency path="text!modules/orders/templates/OrderEdit.html" />
/// <amd-dependency path="text!modules/orders/assets/styles.css" />
define(["require", "exports", 'modules/data', 'app', 'metadata/northwind', "text!modules/customers/templates/CustomerEdit.html", "text!modules/orders/templates/ActiveCustomer.html", "text!modules/orders/templates/DataSourceNotificationPanelItem.html", "text!modules/orders/templates/QueryFilter.html", "text!modules/orders/templates/OrderEdit.html", "text!modules/orders/assets/styles.css"], function(require, exports, _data, _app, metadata) {
    var customersTemplateCustomerEdit = require('text!modules/customers/templates/CustomerEdit.html');
    var ordersTemplateDataSrcNotiPanelItem = require('text!modules/orders/templates/DataSourceNotificationPanelItem.html');
    var ordersTemplateQueryFilter = require('text!modules/orders/templates/QueryFilter.html');
    var ordersTemplateOrderEdit = require('text!modules/orders/templates/OrderEdit.html');
    var ordersTemplateActiveCustomer = require('text!modules/orders/templates/ActiveCustomer.html');

    var ordersTemplateStyles = require('text!modules/orders/assets/styles.css');

    (function (orders) {
        function addRibbonButton(ribbon) {
            var _this = this;
            ribbon.tab("Users").group("Northwind").add(new _app.Jigsaw.Ribbon.RibbonButton("Orders", function () {
                _app.history.navigate(_this.url);
            }, "Loads the Order Module", "fa fa-user"), 2);

            // add contextual Users Tab if there's any user filter applied
            var disposable;
            this.itemsViewModel.queryFilter.parameters.subscribe(function (x) {
                if (x.length) {
                    disposable = ribbon.tab("Customers", 90).group("Sample").addAll([
                        new _app.Jigsaw.Ribbon.RibbonButton("Test"),
                        new _app.Jigsaw.Ribbon.RibbonButton("Erase"),
                        new _app.Jigsaw.Ribbon.RibbonButton("More Info")
                    ]);
                } else {
                    disposable && disposable.dispose();
                }
            });
        }
        orders.addRibbonButton = addRibbonButton;

        (function (Notifications) {
            // register templates of notifications without template
            _app.Jigsaw.Notifications.notificationTemplate.candidate(ordersTemplateDataSrcNotiPanelItem, function (x) {
                return x.Owner === 'order-data';
            });
        })(orders.Notifications || (orders.Notifications = {}));
        var Notifications = orders.Notifications;

        orders.url = "/orders", orders.manager = _data.Server.createManager('api/northwind', metadata.metadata), orders.dataSource = new _data.Server.DataSource({
            manager: orders.manager,
            endPoint: new breeze.EntityQuery("orders"),
            typeName: "Order"
        }), orders.itemsViewModel = new _data.DataItemsViewModel(orders.dataSource, {
            jumpToSearchUri: 'api/northwind/nextOrder',
            jumpToSearchProperty: 'ShipName',
            columns: ['ShipName', 'ShipAddress', 'ShipCity'],
            savedSearchesGroup: 'Orders',
            queryFilter: function (query, customer) {
                return query.where('CustomerID', breeze.FilterQueryOp.Equals, customer.CustomerID());
            }
        }), orders.dataView = _data.Templates.DataItems({
            title: "Orders",
            addNew: false,
            excelExport: false,
            viewModel: orders.itemsViewModel,
            filterTemplate: ordersTemplateQueryFilter
        }), orders.barView = _data.Templates.ViewBar(_.template(ordersTemplateOrderEdit)), orders.activeView = new _app.Marionette.View({
            viewModel: orders.itemsViewModel,
            template: function () {
                return _.template(ordersTemplateActiveCustomer)({
                    customerSummary: _data.Templates.SummaryTab(_.template(customersTemplateCustomerEdit)({ throttle: false }))
                });
            }
        }), orders.stylesModule = new _app.Jigsaw.Theming.ContentStyleSheet(ordersTemplateStyles);

        function barViewModel(sizeController) {
            return new _data.PanelBarEditViewModel(orders.itemsViewModel, {
                panelBarViewModel: sizeController
            });
        }
        orders.barViewModel = barViewModel;
    })(exports.orders || (exports.orders = {}));
    var orders = exports.orders;
});
