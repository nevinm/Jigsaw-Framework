define(["require", "exports"], function(require, exports) { 
    function __underscore(template) {
        var generate = _.template(template);
        generate.raw = template;
        return generate;
    }
    exports.TestMain = function() { return "<iframe class=\"takeall-space\" src=\"./test\"style=\"position: absolute; top: 0px; bottom: 0px; right: 0px; left: 0px; width: 100%; height: 100%; border: 0px none;\"></iframe>"; };
    
});
