/// <reference path="../definitions/require.d.ts" />
/// <reference path="../definitions/jquery.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", '../app', '../app-desktop', 'templates/test'], function(require, exports, _app, app, templates) {
    app.coreModule.ribbon.tab("System").group("Tests", 30).addAll([
        new _app.Jigsaw.Ribbon.RibbonButton("Run scoped", function () {
            _app.history.navigate("test");
        }, "Run tests inside Jigsaw", "fa fa-shield"),
        new _app.Jigsaw.Ribbon.RibbonButton("Run all", function () {
            window.location.href = "/test";
        }, "", "fa fa-shield"),
        new _app.Jigsaw.Ribbon.RibbonButton("Glimpse", function () {
            window.location.href = "/glimpse.axd";
        }, "Check options for Glimpse", "fa fa-shield")
    ]);

    var CoreModule = (function (_super) {
        __extends(CoreModule, _super);
        function CoreModule() {
            _super.call(this);
            this.contentView = new _app.Marionette.View({ template: templates.TestMain });
        }
        CoreModule.prototype.requiredModules = function () {
            return [app.coreModule];
        };

        CoreModule.prototype.load = function () {
            return app.coreModule.content.show(this.contentView);
        };
        return CoreModule;
    })(_app.Modules.ModuleBase);
    exports.CoreModule = CoreModule;

    var coreModule = new CoreModule();

    function __init__() {
        _app.history.register("test", function () {
            return _app.moduleManager.load(coreModule);
        });
    }
    exports.__init__ = __init__;
});
