/// <reference path="../../../definitions/_definitions.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", '../../../app', '../../../app-desktop', 'modules/chatbox/js/helpers'], function(require, exports, _app, app, helpers) {
    var ChatBoxModule = (function (_super) {
        __extends(ChatBoxModule, _super);
        function ChatBoxModule() {
            _super.call(this, {
                url: helpers.url
            });
            helpers.addRibbonButton(app.coreModule.ribbon);
        }
        ChatBoxModule.prototype.initialize = function () {
            _super.prototype.initialize.call(this);
        };

        ChatBoxModule.prototype.requiredModules = function () {
            return _super.prototype.requiredModules.call(this).concat(app.coreModule, helpers.stylesModule);
        };

        ChatBoxModule.prototype.load = function () {
            app.coreModule.breadcrumb.next(this.breadcrumb);

            // reset selected item on the data grid.
            //this.itemsViewModel.selectedItem(null);
            return _app.Utils.requirePromise("scripts/smartadmin/libs/jquery-ui-1.10.3.min.js", "scripts/smartadmin/app.config.js", "scripts/smartadmin/plugin/jquery-touch/jquery.ui.touch-punch.js", "scripts/smartadmin/smartwidgets/jarvis.widget.js", "scripts/smartadmin/plugin/easy-pie-chart/jquery.easy-pie-chart.js", "scripts/smartadmin/plugin/sparkline/jquery.sparkline.js", "scripts/smartadmin/plugin/jquery-validate/jquery.validate.js", "scripts/smartadmin/plugin/masked-input/jquery.maskedinput.js", "scripts/smartadmin/plugin/select2/select2.js", "scripts/smartadmin/plugin/bootstrap-slider/bootstrap-slider.js", "scripts/smartadmin/plugin/msie-fix/jquery.mb.browser.js", "scripts/smartadmin/plugin/fastclick/fastclick.js").then(function () {
                return _app.Utils.requirePromise("scripts/smartadmin/app.js");
            }).then(function () {
                return helpers.loadViews(app.coreModule);
            }).then(function () {
                return _app.Utils.requirePromise("scripts/smartadmin/smart-chat-ui/smart.chat.ui.min.js", "scripts/smartadmin/smart-chat-ui/smart.chat.manager.min.js");
            });
        };
        return ChatBoxModule;
    })(helpers.ChatModule);
    exports.ChatBoxModule = ChatBoxModule;

    exports.chatBoxModule = new ChatBoxModule();

    function __init__() {
        exports.chatBoxModule.initialize();
    }
    exports.__init__ = __init__;
});
