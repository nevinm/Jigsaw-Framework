/* These are not commented */
/// <amd-dependency path="text!modules/chatbox/templates/MainChatWindow.html" />
/// <amd-dependency path="text!modules/chatbox/assets/styles.css" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", '../../../app', "text!modules/chatbox/templates/MainChatWindow.html", "text!modules/chatbox/assets/styles.css"], function(require, exports, _app) {
    var templateMain = require('text!modules/chatbox/templates/MainChatWindow.html');
    var templateCss = require('text!modules/chatbox/assets/styles.css');

    function addRibbonButton(ribbon) {
        var _this = this;
        ribbon.tab("SmartAdmin 3").group("Chat").add(new _app.Jigsaw.Ribbon.RibbonButton("ChatBox", function () {
            _app.history.navigate(_this.url);
        }, "Loads the Chat Module", "fa fa-user"), 10);
    }
    exports.addRibbonButton = addRibbonButton;
    function loadViews(coreModule) {
        return Q.all([
            coreModule.content.show(exports.chatBoxView)
        ]);
    }
    exports.loadViews = loadViews;

    function downloadTemplates() {
        return Q.all([]);
    }
    exports.downloadTemplates = downloadTemplates;

    var MainChatViewModel = (function (_super) {
        __extends(MainChatViewModel, _super);
        function MainChatViewModel() {
            _super.call(this);
        }
        /* this is not used as of now */
        MainChatViewModel.prototype.openChatBox = function (item, event) {
            var currentTarget = event.target;
        };
        return MainChatViewModel;
    })(_app.Common.ViewModelBase);
    exports.MainChatViewModel = MainChatViewModel;

    function MainChatView(options) {
        return new _app.Marionette.View({
            template: options.template,
            viewModel: options.viewModel
        });
    }
    exports.MainChatView = MainChatView;

    exports.url = '/chatbox', exports.mainChatViewModel = new MainChatViewModel(), exports.chatBoxView = exports.MainChatView({
        template: function () {
            return templateMain;
        },
        viewModel: exports.mainChatViewModel
    }), exports.stylesModule = new _app.Jigsaw.Theming.ContentStyleSheet(templateCss);

    var ChatModule = (function (_super) {
        __extends(ChatModule, _super);
        function ChatModule(options) {
            _super.call(this);
            this.options = options;
            this.url = options.url;
        }
        ChatModule.prototype.initialize = function () {
            var _this = this;
            // register module routes
            _app.history.register(this.url, function () {
                return _app.moduleManager.load(_this);
            });
        };
        return ChatModule;
    })(_app.Modules.ModuleBase);
    exports.ChatModule = ChatModule;
});
