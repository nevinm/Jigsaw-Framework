define(["require", "exports"], function(require, exports) { 
    function __underscore(template) {
        var generate = _.template(template);
        generate.raw = template;
        return generate;
    }
    exports.DataItems = function() { return "<div data-bind=\"markErrorCollection: {}\"><div data-bind=\"messageQueue: messageQueue\"></div><div data-bind=\"validationSummary: {}\"></div><section class=\"all-space\" data-bind=\"measurePrev: \'top\'\"><!-- row --><div class=\"row\"><!-- SINGLE GRID --><article><div class=\"jarviswidget jarviswidget-sortable\"><header role=\"heading\"><div class=\"jarviswidget-ctrls\" role=\"menu\"><a class=\"button-icon\" href=\"javascript:void(0);\" data-bind=\"toogleFullScreen : { wrapperSelector : \'.jarviswidget\', class : \'fa fa-expand | fa fa-compress\'}\"><i></i></a></div><div class=\"widget-toolbar\" role=\"menu\"><a class=\"btn btn-default\" href=\"javascript:void(0);\" data-bind=\"qclick: rejectAllChanges, keyTips : { key : \'GR\' }\">Reject All Changes</a></div><div class=\"widget-toolbar\" role=\"menu\"><a class=\"btn btn-default\" href=\"javascript:void(0);\" data-bind=\"qclick: save, keyTips : { key : \'GS\' }\">Save All Changes</a></div><div class=\"widget-toolbar\" role=\"menu\"><a class=\"btn btn-default\" href=\"javascript:void(0);\" data-bind=\"click: addNew, keyTips : { key : \'GA\' }\">Add New</a></div><div class=\"widget-toolbar hidden-xs\"><span class=\"jumpto-search\" data-bind=\"with: jumpToSearch\"><input type=\"text\" data-bind=\"value: searchTerm, pressEnter: quickJump, keyTipsInput : { key : \'GS\'} \"><a class=\"btn btn-default\" data-bind=\"qclick: quickJump\"><i class=\"fa fa-step-forward\"></i></a></span></div><h2><strong>Suppliers</strong> &nbsp;</h2></header><!-- widget div--><div role=\"content\"><!-- widget content --><div id=\"grid-container\" class=\"widget-body all-space\"><!--      <div class=\"k-grid\" data-bind=\"keyTipsGrid: {key : \'GG\'}\"></div>--><div data-bind=\"feedParentErrorCollection: errorCollection,breezeKendoGrid: {dataSource: dataSource,selected: selectedItem,inlineEditable: true,defaultSort: \'ContactName\',ignoredColumns: [\'RowVersion\', \'UserSessionId\', \'Products\'],columns: [\'CompanyName\',\'ContactName\',\'ContactTitle\',\'Address\',\'City\',\'Country\',\'Phone\']}, keyTipsGrid: {key : \'GG\'}\"></div></div><!-- end widget content --></div><!-- end widget div --></div></article><!-- GRID END --></div><!-- end row --></section></div>"; };
    exports.DataSourceNotificationPanelItem = function() { return "Suplier \"<a data-bind=\"text: Entity.ContactName || \'un-named\', attr: { href: \'#/supplier/SupplierID/\' + Entity.SupplierID }\"></a>\" was <span data-bind=\"text: PreviousEntityState === \'Added\'? \'Added\': \'Modified\'\"></span>"; };
    exports.MyItem = function() { return "<div><span data-bind=\"text: TitleOfCourtesy\"></span> <span data-bind=\"text: FirstName\"></span> <span data-bind=\"text: LastName\"></span></div>"; };
    exports.myItemStyles = "/* data.customers - MyItems */#myitems-supplier-title {background-image: url(images/users.png);background-position: 3px center;background-repeat: no-repeat;padding: 3px 3px 3px 25px;-moz-background-size: 22px auto;-o-background-size: 22px auto;-webkit-background-size: 22px auto;background-size: 22px auto;background-color: transparent;border: none;}";
    exports.MyItemTitle = function() { return "<div id=\"myitems-employee-title\">My Employees</div>"; };
    exports.styles = "/* data */";
    
});
