define(["require", "exports"], function(require, exports) { 
    function __underscore(template) {
        var generate = _.template(template);
        generate.raw = template;
        return generate;
    }
    exports.DataSourceNotificationPanelItem = function() { return "Employee \"<a data-bind=\"text: Entity.TitleOfCourtesy + \' \' + Entity.LastName || \'un-named\', attr: { href: \'#/employees/EmployeeID/\' + Entity.EmployeeID }\"></a>\" was <span data-bind=\"text: PreviousEntityState === \'Added\'? \'Added\': \'Modified\'\"></span>"; };
    exports.MyItem = function() { return "<div><span data-bind=\"text: TitleOfCourtesy\"></span> <span data-bind=\"text: FirstName\"></span> <span data-bind=\"text: LastName\"></span></div>"; };
    exports.myItemStyles = "/* data.employee - MyItems */#myitems-employee-title {background-image: url(images/users.png);background-position: 3px center;background-repeat: no-repeat;padding: 3px 3px 3px 25px;-moz-background-size: 22px auto;-o-background-size: 22px auto;-webkit-background-size: 22px auto;background-size: 22px auto;background-color: transparent;border: none;}#sidebar-collapsed #myitems-employee-title {font-size: 0;padding-bottom: 5px;padding-top: 15px;}";
    exports.MyItemTitle = function() { return "<span id=\"myitems-employee-title\">My Employees</span>"; };
    exports.styles = "/* data */#viewLayout-content .jarviswidget div[role=\"content\"] > div {margin-top: -15px;}#viewLayout-content .jarviswidget #advanced-search-container {margin-top: 5px;}";
    
});
