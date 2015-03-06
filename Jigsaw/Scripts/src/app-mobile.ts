/// <reference path="definitions/_definitions.d.ts" />

/// <reference path="definitions/jquery.d.ts" />
/// <reference path="definitions/kendo.web.d.ts" />
/// <reference path="definitions/Q.d.ts" />
/// <reference path="definitions/underscore.d.ts" />
/// <reference path="definitions/knockout.d.ts" />

/// <reference path="definitions/require.d.ts" />
/// <reference path="templates/definitions.d.ts" />

// this file holds the core module, most modules will depend on this one

import templates = require('templates/app-mobile');

import _app = require('app');

export module Knockout {

}

export module Jigsaw {

    export class CoreModuleMobile extends _app.Jigsaw.CoreModuleBase {

        // the mobile version should have the bootstrap responsive css loaded
        private bootstrapResponsive = new _app.Jigsaw.Theming.StyleSheet("content/modules/core-mobile.css", true);

        requiredModules(): _app.Modules.IModule[] {
            return super.requiredModules().concat(this.bootstrapResponsive);
        }
    }

    export module Layout {

        export class ViewLayoutView extends _app.Marionette.Layout implements _app.Jigsaw.Layout.SidebarSizeController {
            
            content: _app.Marionette.Region;
            viewbar: _app.Marionette.Region;
            sidebar: _app.Marionette.Region;

            constructor(viewModel: ViewLayoutViewModel) {
                super({
                    template: templates.ViewLayout,
                    viewModel: viewModel,
                    regions: {
                        content: "#viewLayout-content",
                        viewbar: "#viewLayout-viewbar",
                        sidebar: '#sideLayout-sidebar'
                    }
                });

                viewModel.expandViewbarInteraction.handle(() => this.expandViewbar());
                viewModel.collapseViewbarInteraction.handle(() => this.collapseViewbar());
            }

            private animateSidebarTo(size: number) {
                var sidebar = this.find('#sideLayout-sidebar'),
                    content = this.find('#viewLayout-content');

                return Q.all([
                    sidebar.deferredAnimate({ width: size }, 250),
                    content.deferredAnimate({ left: size }, 250)
                ]);
            }

            minimizeSidebar() {
                return this.animateSidebarTo(50);
            }

            expandSidebar() {
                return this.animateSidebarTo(250);
            }

            expandViewbar() {
                var element = this.find('#viewLayout-viewbar');

                return element.css('display', 'block').deferredAnimate({ width: '60%' }, 250)
                    .then(() => element.removeClass('viewbar-collapsed'));
            }

            collapseViewbar() {
                var viewBarLayout = this.find('#viewLayout-viewbar');
                return viewBarLayout
                    .addClass('viewbar-collapsed')
                    .deferredAnimate({ width: '0' }, 250).then(() => viewBarLayout.css('display', 'none'));
            }
        }

        export class ViewLayoutViewModel extends _app.Common.ViewModelBase implements _app.Jigsaw.Layout.ViewbarSizeController {
            expandViewbarInteraction = new _app.Common.InteractionRequest<void, Q.Promise<any>>();
            collapseViewbarInteraction = new _app.Common.InteractionRequest<void, Q.Promise<any>>();

            expandViewbar() {
                return this.expandViewbarInteraction.request();
            }

            collapseViewbar() {
                return this.collapseViewbarInteraction.request();
            }
        }

        export class ViewLayoutModule extends _app.Modules.ModuleBase implements _app.Jigsaw.Layout.IViewLayoutModule {
            viewModel: ViewLayoutViewModel;
            contentView: ViewLayoutView;

            get content() { return this.contentView.content; }
            get viewbar() { return this.contentView.viewbar; }
            get sidebar() { return this.contentView.sidebar; }

            constructor(private coreModule: CoreModuleMobile) {
                super();

                this.viewModel = new ViewLayoutViewModel();
                this.contentView = new ViewLayoutView(this.viewModel);
            }

            requiredModules(): _app.Modules.IModule[] {
                return [this.coreModule];
            }

            unload() {
                this.coreModule.content.close();
                return super.unload();
            }

            load() {
                return this.coreModule.content.show(this.contentView);
            }
        }

    }


    export module ForceOffline {
        export class Notification {
            forceOffline = _app.ajax.connection.forceOffline;
        }
        _app.Jigsaw.Ribbon.ribbonQuickStartTemplateSelector.candidate(templates.ForceOfflineNotification(), x => x instanceof Notification);

        export class Module extends _app.Modules.ModuleBase {
            constructor(private coreModule: _app.Jigsaw.CoreModuleBase) {
                super();

                var notification = new Notification();
                coreModule.quickStart.push(notification);
            }
        }
    }

}

export var coreModule = new Jigsaw.CoreModuleMobile();

export var syncModule = new _app.Jigsaw.Sync.SyncModule(coreModule);
coreModule.addSlave(syncModule);

export var accountModule = new _app.Jigsaw.Account.AccountModule(coreModule);
coreModule.addSlave(accountModule);

export var viewLayoutModule = new Jigsaw.Layout.ViewLayoutModule(coreModule);

var userSettings = new _app.Jigsaw.UserSettings.UserSettingsModule(coreModule, accountModule);

export var themeManager = new _app.Jigsaw.Theming.ThemeManager(coreModule, accountModule);

export var sidebarModule = new _app.Jigsaw.Sidebar.SidebarModule({
    sidebarSize: viewLayoutModule.contentView,
    viewLayoutModule: viewLayoutModule
});

export var notificationsModule = new _app.Jigsaw.Notifications.NotificationsModule(coreModule, sidebarModule);

export var forceOfflineModule = new Jigsaw.ForceOffline.Module(coreModule);

export function __init__() {
    _app.Jigsaw.Theming.loadThemes(themeManager); // load themes sent by server on configuration
    themeManager.initialize();
}

