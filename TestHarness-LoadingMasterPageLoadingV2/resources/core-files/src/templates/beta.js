define(["require", "exports"], function(require, exports) { 
    function __underscore(template) {
        var generate = _.template(template);
        generate.raw = template;
        return generate;
    }
    exports.BetaMain = function() { return "<div>This is the BETA MODULE...<a href=\"#test\">go to test module</a><div><a href=\"#\" class=\"btn btn-default\" data-bind=\"keyTips: { key : \'IB\' }, click : ia\">button</a><a href=\"#\" class=\"btn\" data-bind=\"keyTips: { key : \'IC\' },click: ib\">button</a><a href=\"#\" class=\"btn btn-success\" data-bind=\"keyTips: { key : \'SS\' }, click: ss\">button</a></div><div data-bind=\"tooltip: {title : \'Some tooltip\'}\">Some tooltip</div><div class=\"container\"><div class=\"row\"><h2>Multi level dropdown menu in Bootstrap 3</h2><hr><div class=\"dropdown\"><a id=\"dLabel\" role=\"button\" data-toggle=\"dropdown\" class=\"btn btn-primary\" data-target=\"#\" href=\"#\">Dropdown <span class=\"caret\"></span></a><ul class=\"dropdown-menu multi-level\" role=\"menu\" aria-labelledby=\"dropdownMenu\"><li><a href=\"#\">Some action</a></li><li><a href=\"#\">Some other action</a></li><li class=\"divider\"></li><li class=\"dropdown-submenu\"><a tabindex=\"-1\" href=\"#\">Hover me for more options</a><ul class=\"dropdown-menu\"><li><a tabindex=\"-1\" href=\"#\">Second level</a></li><li class=\"dropdown-submenu\"><a href=\"#\">Even More..</a><ul class=\"dropdown-menu\"><li><a href=\"#\">3rd level</a></li><li><a href=\"#\">3rd level</a></li></ul></li><li><a href=\"#\">Second level</a></li><li><a href=\"#\">Second level</a></li></ul></li></ul></div></div></div></div>"; };
    exports.NotificationPanelItem = function() { return "Scheduled Notification by <span class=\"user-name\" data-bind=\"text: \'@\' + author\"></span>"; };
    
});
