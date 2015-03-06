/// <reference path="../definitions/require.d.ts" />
/// <reference path="../definitions/jquery.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", '../app', '../app-desktop', 'templates/beta'], function(require, exports, _app, app, template) {
    app.coreModule.ribbon.tab("System").group("Beta").add(new _app.Jigsaw.Ribbon.RibbonButton("Navigate", function () {
        _app.history.navigate("/beta");
    }, '', 'fa fa-star-half-o'));

    app.coreModule.ribbon.tab("System").group("Messages", 70).addAll([
        new _app.Jigsaw.Ribbon.RibbonButton("Raise an Error", function () {
            throw new Error("this is an error raised intentionally from the ribbon (will be removed after 3s).");
        }, "this will raise an error.", "fa fa-ban"),
        new _app.Jigsaw.Ribbon.RibbonButton("Info Message", function () {
            app.coreModule.messageQueue.add({ title: "From Ribbon", body: "Hello from the ribbon." });
        }, "this will show an info message below", "fa fa-info")
    ]);

    app.coreModule.ribbon.tab('System').group('SmartAdmin Notifications', 80).addAll([
        new _app.Jigsaw.Ribbon.RibbonButton("BigBox", function () {
            return _app.Jigsaw.Messages.bigBox({ title: 'From ribbon', body: 'from ribbon', level: _app.Jigsaw.Messages.MessageLevel.Error });
        }),
        new _app.Jigsaw.Ribbon.RibbonButton("SmallBox", function () {
            return _app.Jigsaw.Messages.smallBox({ title: 'From ribbon', body: 'from ribbon', level: _app.Jigsaw.Messages.MessageLevel.Info });
        }),
        new _app.Jigsaw.Ribbon.RibbonButton("ExtraSmallBox", function () {
            return _app.Jigsaw.Messages.extraSmallBox({ title: 'From ribbon', body: 'from ribbon', level: _app.Jigsaw.Messages.MessageLevel.Warning });
        })
    ]);

    //app.coreModule.menu.add(messageRibbonButton.content[0]);
    var BetaViewModel = (function (_super) {
        __extends(BetaViewModel, _super);
        function BetaViewModel() {
            _super.apply(this, arguments);
        }
        BetaViewModel.prototype.ia = function () {
            console.log('IA');
        };

        BetaViewModel.prototype.ib = function () {
            console.log('IB');
        };

        BetaViewModel.prototype.ss = function () {
            console.log('SS');
        };
        return BetaViewModel;
    })(_app.Common.ViewModelBase);
    exports.BetaViewModel = BetaViewModel;

    var BetaModule = (function (_super) {
        __extends(BetaModule, _super);
        function BetaModule() {
            _super.call(this);
            this.layoutView = new _app.Marionette.View({
                template: function () {
                    return "<p>some content</p>";
                }
            });
            this.contentView = new _app.Marionette.View({
                template: template.BetaMain,
                viewModel: new BetaViewModel()
            });
        }
        BetaModule.prototype.requiredModules = function () {
            return [app.viewLayoutModule];
        };

        BetaModule.prototype.load = function () {
            // when base modules are loaded show load this module
            return Q.all([
                app.viewLayoutModule.content.show(this.contentView),
                app.viewLayoutModule.viewbar.show(this.layoutView)
            ]);
        };
        return BetaModule;
    })(_app.Modules.ModuleBase);
    exports.BetaModule = BetaModule;

    exports.betaModule = new BetaModule();

    /** this module exists for developing purposes to test if the memory allocated by other modules is
    released when this module is loaded */
    var EmptyModule = (function (_super) {
        __extends(EmptyModule, _super);
        function EmptyModule() {
            _super.apply(this, arguments);
        }
        EmptyModule.prototype.requiredModules = function () {
            return [app.coreModule];
        };

        EmptyModule.prototype.load = function () {
            return Q(true);
        };
        return EmptyModule;
    })(_app.Modules.ModuleBase);

    var emptyModule = new EmptyModule();

    var HelloWorldModule = (function (_super) {
        __extends(HelloWorldModule, _super);
        function HelloWorldModule() {
            _super.apply(this, arguments);
            this.view = new _app.Marionette.View({ template: function () {
                    return "<h1>Hello World!<h1>";
                } });
        }
        HelloWorldModule.prototype.requiredModules = function () {
            return [app.coreModule];
        };

        HelloWorldModule.prototype.load = function () {
            app.coreModule.content.show(this.view);
            return Q(true);
        };
        return HelloWorldModule;
    })(_app.Modules.ModuleBase);

    var hellowWorldModule = new HelloWorldModule();

    var PartialViewModule = (function (_super) {
        __extends(PartialViewModule, _super);
        function PartialViewModule() {
            _super.call(this);

            this.view = new _app.Marionette.View({
                template: _app.Marionette.urlTemplate("/path-to-view", { some: 'parameter' })
            });
        }
        PartialViewModule.prototype.requiredModules = function () {
            return [app.coreModule];
        };

        PartialViewModule.prototype.load = function () {
            return app.coreModule.content.show(this.view);
        };
        return PartialViewModule;
    })(_app.Modules.ModuleBase);

    //_app.history.register("/", () => _app.moduleManager.load(betaModule));
    _app.history.register("/beta", function () {
        return _app.moduleManager.load(exports.betaModule);
    });

    _app.history.register("/hello-world", function () {
        return _app.moduleManager.load(hellowWorldModule);
    });

    app.coreModule.ribbon.tab("System").group("Developer").addAll([
        new _app.Jigsaw.Ribbon.RibbonButton("Empty", function () {
            _app.history.navigate("/empty");
        }),
        new _app.Jigsaw.Ribbon.RibbonButton("Clear Storage", function () {
            localStorage.clear();
        }, '', 'fa fa-trash-o')
    ]);
    _app.history.register("/empty", function () {
        return _app.moduleManager.load(emptyModule);
    });

    function __init__() {
    }
    exports.__init__ = __init__;
});
