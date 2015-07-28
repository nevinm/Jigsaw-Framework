/// <reference path="../definitions/require.d.ts" />
/// <reference path="../definitions/jquery.d.ts" />

/// <reference path="../templates/definitions.d.ts" />

import _app = require('../app');
import app = require('../app-desktop');
import templates = require('templates/test');

app.coreModule.ribbon
    .tab("System")
    .group("Tests", 30)
    .addAll([
        new _app.Jigsaw.Ribbon.RibbonButton("Run scoped", () => { _app.history.navigate("test"); }, "Run tests inside Jigsaw", "fa fa-shield"),
        new _app.Jigsaw.Ribbon.RibbonButton("Run all", () => { window.location.href = <any>"/test"; }, "", "fa fa-shield"),
        new _app.Jigsaw.Ribbon.RibbonButton("Glimpse", () => { window.location.href = <any>"/glimpse.axd"; }, "Check options for Glimpse", "fa fa-shield")
    ]);

export class CoreModule extends _app.Modules.ModuleBase {
    contentView = new _app.Marionette.View({ template: templates.TestMain });

    constructor() {
        super();
    }

    requiredModules() {
        return [app.coreModule];
    }

    load(): Q.Promise<any> {
        return app.coreModule.content.show(this.contentView);
    }
}

var coreModule = new CoreModule();

export function __init__() {
    _app.history.register("test", () => _app.moduleManager.load(coreModule));

}

