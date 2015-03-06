/* These are not commented */
/// <amd-dependency path="text!modules/chatbox/templates/MainChatWindow.html" />
/// <amd-dependency path="text!modules/chatbox/assets/styles.css" />

import _app = require('../../../app')

var templateMain = require('text!modules/chatbox/templates/MainChatWindow.html');
var templateCss = require('text!modules/chatbox/assets/styles.css');

    export function addRibbonButton(ribbon: _app.Jigsaw.Ribbon.RibbonSet) {
        ribbon
            .tab("SmartAdmin 3")
            .group("Chat")
            .add(new _app.Jigsaw.Ribbon.RibbonButton("ChatBox",
                () => { _app.history.navigate(this.url); }, "Loads the Chat Module", "fa fa-user"), 10);
    }
    export function loadViews(coreModule: _app.Jigsaw.CoreModuleBase) {
        return Q.all([
            coreModule.content.show(chatBoxView)
        ]);
    }

    export function downloadTemplates() {
        return Q.all([
        ]);
    }


    export class MainChatViewModel extends _app.Common.ViewModelBase {
        constructor() {
            super();
        }
        /* this is not used as of now */
        private openChatBox(item: any, event: any) {
            var currentTarget = event.target;
        }
    }
    export interface MainChatViewOptions {
        viewModel: MainChatViewModel;
        template: _app.Marionette.TemplateFunction;
    }
    export function MainChatView(options: MainChatViewOptions): _app.Marionette.View {
        return new _app.Marionette.View({
            template: options.template,
            viewModel: options.viewModel
        });
    }

    export var url = '/chatbox',
        mainChatViewModel = new MainChatViewModel(),
        chatBoxView = MainChatView({
            template: function () {return templateMain },
            viewModel: mainChatViewModel
        }),
        stylesModule = new _app.Jigsaw.Theming.ContentStyleSheet(templateCss);

    export interface ChatModuleOptions {
        url: string;

        /** returns the title of the breadcrumb group associated with this module */
        breadcrumbTitle?: string;
    }

    export class ChatModule extends _app.Modules.ModuleBase {
        url: string;

        breadcrumb: _app.Common.Breadcrumb<_app.Jigsaw.CoreModuleBreadcrumbItem>;
        constructor(public options: ChatModuleOptions) {
            super();
            this.url = options.url;
        }

        initialize() {
            // register module routes
            _app.history.register(this.url,
                () => _app.moduleManager.load(this));
        }

    }

