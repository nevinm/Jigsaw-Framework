/// <reference path="definitions/_definitions.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", 'templates/app-mobile', 'app'], function(require, exports, templates, _app) {
    (function (Jigsaw) {
        var CoreModuleMobile = (function (_super) {
            __extends(CoreModuleMobile, _super);
            function CoreModuleMobile() {
                _super.apply(this, arguments);
                // the mobile version should have the bootstrap responsive css loaded
                this.bootstrapResponsive = new _app.Jigsaw.Theming.StyleSheet("content/modules/core-mobile.css", true);
            }
            CoreModuleMobile.prototype.requiredModules = function () {
                return _super.prototype.requiredModules.call(this).concat(this.bootstrapResponsive);
            };
            return CoreModuleMobile;
        })(_app.Jigsaw.CoreModuleBase);
        Jigsaw.CoreModuleMobile = CoreModuleMobile;

        (function (Layout) {
            var ViewLayoutView = (function (_super) {
                __extends(ViewLayoutView, _super);
                function ViewLayoutView(viewModel) {
                    var _this = this;
                    _super.call(this, {
                        template: templates.ViewLayout,
                        viewModel: viewModel,
                        regions: {
                            content: "#viewLayout-content",
                            viewbar: "#viewLayout-viewbar",
                            sidebar: '#sideLayout-sidebar'
                        }
                    });

                    viewModel.expandViewbarInteraction.handle(function () {
                        return _this.expandViewbar();
                    });
                    viewModel.collapseViewbarInteraction.handle(function () {
                        return _this.collapseViewbar();
                    });
                }
                ViewLayoutView.prototype.animateSidebarTo = function (size) {
                    var sidebar = this.find('#sideLayout-sidebar'), content = this.find('#viewLayout-content');

                    return Q.all([
                        sidebar.deferredAnimate({ width: size }, 250),
                        content.deferredAnimate({ left: size }, 250)
                    ]);
                };

                ViewLayoutView.prototype.minimizeSidebar = function () {
                    return this.animateSidebarTo(50);
                };

                ViewLayoutView.prototype.expandSidebar = function () {
                    return this.animateSidebarTo(250);
                };

                ViewLayoutView.prototype.expandViewbar = function () {
                    var element = this.find('#viewLayout-viewbar');

                    return element.css('display', 'block').deferredAnimate({ width: '60%' }, 250).then(function () {
                        return element.removeClass('viewbar-collapsed');
                    });
                };

                ViewLayoutView.prototype.collapseViewbar = function () {
                    var viewBarLayout = this.find('#viewLayout-viewbar');
                    return viewBarLayout.addClass('viewbar-collapsed').deferredAnimate({ width: '0' }, 250).then(function () {
                        return viewBarLayout.css('display', 'none');
                    });
                };
                return ViewLayoutView;
            })(_app.Marionette.Layout);
            Layout.ViewLayoutView = ViewLayoutView;

            var ViewLayoutViewModel = (function (_super) {
                __extends(ViewLayoutViewModel, _super);
                function ViewLayoutViewModel() {
                    _super.apply(this, arguments);
                    this.expandViewbarInteraction = new _app.Common.InteractionRequest();
                    this.collapseViewbarInteraction = new _app.Common.InteractionRequest();
                }
                ViewLayoutViewModel.prototype.expandViewbar = function () {
                    return this.expandViewbarInteraction.request();
                };

                ViewLayoutViewModel.prototype.collapseViewbar = function () {
                    return this.collapseViewbarInteraction.request();
                };
                return ViewLayoutViewModel;
            })(_app.Common.ViewModelBase);
            Layout.ViewLayoutViewModel = ViewLayoutViewModel;

            var ViewLayoutModule = (function (_super) {
                __extends(ViewLayoutModule, _super);
                function ViewLayoutModule(coreModule) {
                    _super.call(this);
                    this.coreModule = coreModule;

                    this.viewModel = new ViewLayoutViewModel();
                    this.contentView = new ViewLayoutView(this.viewModel);
                }
                Object.defineProperty(ViewLayoutModule.prototype, "content", {
                    get: function () {
                        return this.contentView.content;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(ViewLayoutModule.prototype, "viewbar", {
                    get: function () {
                        return this.contentView.viewbar;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(ViewLayoutModule.prototype, "sidebar", {
                    get: function () {
                        return this.contentView.sidebar;
                    },
                    enumerable: true,
                    configurable: true
                });

                ViewLayoutModule.prototype.requiredModules = function () {
                    return [this.coreModule];
                };

                ViewLayoutModule.prototype.unload = function () {
                    this.coreModule.content.close();
                    return _super.prototype.unload.call(this);
                };

                ViewLayoutModule.prototype.load = function () {
                    return this.coreModule.content.show(this.contentView);
                };
                return ViewLayoutModule;
            })(_app.Modules.ModuleBase);
            Layout.ViewLayoutModule = ViewLayoutModule;
        })(Jigsaw.Layout || (Jigsaw.Layout = {}));
        var Layout = Jigsaw.Layout;

        (function (ForceOffline) {
            var Notification = (function () {
                function Notification() {
                    this.forceOffline = _app.ajax.connection.forceOffline;
                }
                return Notification;
            })();
            ForceOffline.Notification = Notification;
            _app.Jigsaw.Ribbon.ribbonQuickStartTemplateSelector.candidate(templates.ForceOfflineNotification(), function (x) {
                return x instanceof Notification;
            });

            var Module = (function (_super) {
                __extends(Module, _super);
                function Module(coreModule) {
                    _super.call(this);
                    this.coreModule = coreModule;

                    var notification = new Notification();
                    coreModule.quickStart.push(notification);
                }
                return Module;
            })(_app.Modules.ModuleBase);
            ForceOffline.Module = Module;
        })(Jigsaw.ForceOffline || (Jigsaw.ForceOffline = {}));
        var ForceOffline = Jigsaw.ForceOffline;
    })(exports.Jigsaw || (exports.Jigsaw = {}));
    var Jigsaw = exports.Jigsaw;

    exports.coreModule = new Jigsaw.CoreModuleMobile();

    exports.syncModule = new _app.Jigsaw.Sync.SyncModule(exports.coreModule);
    exports.coreModule.addSlave(exports.syncModule);

    exports.accountModule = new _app.Jigsaw.Account.AccountModule(exports.coreModule);
    exports.coreModule.addSlave(exports.accountModule);

    exports.viewLayoutModule = new Jigsaw.Layout.ViewLayoutModule(exports.coreModule);

    var userSettings = new _app.Jigsaw.UserSettings.UserSettingsModule(exports.coreModule, exports.accountModule);

    exports.themeManager = new _app.Jigsaw.Theming.ThemeManager(exports.coreModule, exports.accountModule);

    exports.sidebarModule = new _app.Jigsaw.Sidebar.SidebarModule({
        sidebarSize: exports.viewLayoutModule.contentView,
        viewLayoutModule: exports.viewLayoutModule
    });

    exports.notificationsModule = new _app.Jigsaw.Notifications.NotificationsModule(exports.coreModule, exports.sidebarModule);

    exports.forceOfflineModule = new Jigsaw.ForceOffline.Module(exports.coreModule);

    function __init__() {
        _app.Jigsaw.Theming.loadThemes(exports.themeManager); // load themes sent by server on configuration
        exports.themeManager.initialize();
    }
    exports.__init__ = __init__;
});
