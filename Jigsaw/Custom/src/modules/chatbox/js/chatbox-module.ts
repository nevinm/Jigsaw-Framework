/// <reference path="../../../definitions/_definitions.d.ts" />

/// <reference path="../../../definitions/jquery.d.ts" />
/// <reference path="../../../definitions/kendo.web.d.ts" />
/// <reference path="../../../definitions/Q.d.ts" />
/// <reference path="../../../definitions/underscore.d.ts" />
/// <reference path="../../../definitions/knockout.d.ts" />

/// <reference path="../../../definitions/require.d.ts" />
/// <reference path="../../../templates/definitions.d.ts" />


import _app = require('../../../app')
import app = require('../../../app-desktop')

import helpers = require('modules/chatbox/js/helpers')

export class ChatBoxModule extends helpers.ChatModule {
    constructor() {
        super({
            url: helpers.url
        });
        helpers.addRibbonButton(app.coreModule.ribbon);
    }

    initialize() {
        super.initialize();
    }

    requiredModules(): _app.Modules.IModule[] {
        return super.requiredModules().concat(app.coreModule,
            helpers.stylesModule);
    }

    load(): Q.Promise<any> {
        app.coreModule.breadcrumb.next(this.breadcrumb);

        // reset selected item on the data grid.
        //this.itemsViewModel.selectedItem(null);

        return _app.Utils.requirePromise(
            "scripts/smartadmin/libs/jquery-ui-1.10.3.min.js",
            "scripts/smartadmin/app.config.js",
            "scripts/smartadmin/plugin/jquery-touch/jquery.ui.touch-punch.js",
            "scripts/smartadmin/smartwidgets/jarvis.widget.js",
            "scripts/smartadmin/plugin/easy-pie-chart/jquery.easy-pie-chart.js",
            "scripts/smartadmin/plugin/sparkline/jquery.sparkline.js",
            "scripts/smartadmin/plugin/jquery-validate/jquery.validate.js",
            "scripts/smartadmin/plugin/masked-input/jquery.maskedinput.js",
            "scripts/smartadmin/plugin/select2/select2.js",
            "scripts/smartadmin/plugin/bootstrap-slider/bootstrap-slider.js",
            "scripts/smartadmin/plugin/msie-fix/jquery.mb.browser.js",
            "scripts/smartadmin/plugin/fastclick/fastclick.js"
            )
            .then(() => _app.Utils.requirePromise(
                "scripts/smartadmin/app.js"
                ))
            .then(() => helpers.loadViews(app.coreModule))
            .then(() => _app.Utils.requirePromise(
                "scripts/smartadmin/smart-chat-ui/smart.chat.ui.min.js",
                "scripts/smartadmin/smart-chat-ui/smart.chat.manager.min.js"
                ));            
    }
}

export var chatBoxModule = new ChatBoxModule();

export function __init__() {
    chatBoxModule.initialize();
}

