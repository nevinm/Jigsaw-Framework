/// <reference path="../definitions/knockout.d.ts" />
define(["require", "exports", '../app'], function(require, exports, app) {
    function Qwait(promise, timeout) {
        if (typeof timeout === "undefined") { timeout = 300; }
        var completed = false;
        waitsFor(function () {
            return completed;
        }, 'promise resolved', timeout);
        return promise.finally(function () {
            return completed = true;
        });
    }
    exports.Qwait = Qwait;

    /** returns a new empty view */
    function view() {
        return new app.Marionette.View({ template: function () {
                return '<div>';
            } });
    }
    exports.view = view;
});
