/* Module : Utils */
define(["require", "exports"], function(require, exports) {
    /** remove the given element from the array */
    function remove(array, item) {
        var index = _.indexOf(array, item);
        if (index >= 0) {
            array.splice(index, 1);
        }
    }
    exports.remove = remove;

    /* executes the given function asynchronously */
    function async(expr) {
        if (window.setImmediate) {
            window.setImmediate(expr);
        } else {
            window.setTimeout(expr, 0);
        }
    }
    exports.async = async;
});
