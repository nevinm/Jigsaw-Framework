/// <reference path="../definitions/require.d.ts" />
/// <reference path="../definitions/jquery.d.ts" />

/// <reference path="../templates/definitions.d.ts" />

import _app = require('../app')
import app = require('../app-desktop')

import template = require('templates/beta')

app.coreModule.ribbon
    .tab("System")
    .group("Beta")
    .add(new _app.Jigsaw.Ribbon.RibbonButton("Navigate", () => { _app.history.navigate("/beta"); }, '', 'fa fa-star-half-o'));

app.coreModule.ribbon
    .tab("System")
    .group("Messages", 70)
    .addAll([
        new _app.Jigsaw.Ribbon.RibbonButton("Raise an Error",
            () => { throw new Error("this is an error raised intentionally from the ribbon (will be removed after 3s)."); },
            "this will raise an error.", "fa fa-ban"),
        new _app.Jigsaw.Ribbon.RibbonButton("Info Message", () => {
            app.coreModule.messageQueue.add({ title: "From Ribbon", body: "Hello from the ribbon." });
        }, "this will show an info message below", "fa fa-info")
    ]);

app.coreModule.ribbon
    .tab('System')
    .group('SmartAdmin Notifications', 80)
    .addAll([
        new _app.Jigsaw.Ribbon.RibbonButton("BigBox",
            () => _app.Jigsaw.Messages.bigBox({ title: 'From ribbon', body: 'from ribbon', level: _app.Jigsaw.Messages.MessageLevel.Error })),
        new _app.Jigsaw.Ribbon.RibbonButton("SmallBox",
            () => _app.Jigsaw.Messages.smallBox({ title: 'From ribbon', body: 'from ribbon', level: _app.Jigsaw.Messages.MessageLevel.Info })),
        new _app.Jigsaw.Ribbon.RibbonButton("ExtraSmallBox",
            () => _app.Jigsaw.Messages.extraSmallBox({ title: 'From ribbon', body: 'from ribbon', level: _app.Jigsaw.Messages.MessageLevel.Warning })),
    ]);

//app.coreModule.menu.add(messageRibbonButton.content[0]);

export class BetaViewModel extends _app.Common.ViewModelBase {

    ia(): void {
        console.log('IA');
    }

    ib(): void {
        console.log('IB');
    }

    ss(): void {
        console.log('SS');
    }


}

export class BetaModule extends _app.Modules.ModuleBase {
    contentView: _app.Marionette.View;
    layoutView = new _app.Marionette.View({
        template: () => "<p>some content</p>"
    });

    constructor() {
        super();
        this.contentView = new _app.Marionette.View({
            template: template.BetaMain,
            viewModel: new BetaViewModel()
        });
    }

    requiredModules(): _app.Modules.IModule[] {
        return [app.viewLayoutModule];
    }

    load(): Q.Promise<any> {
        // when base modules are loaded show load this module
        return Q.all([
            app.viewLayoutModule.content.show(this.contentView),
            app.viewLayoutModule.viewbar.show(this.layoutView)
        ]);
    }
}

export var betaModule = new BetaModule();

/** this module exists for developing purposes to test if the memory allocated by other modules is 
released when this module is loaded */
class EmptyModule extends _app.Modules.ModuleBase {
    requiredModules(): _app.Modules.IModule[] {
        return [app.coreModule];
    }

    load(): Q.Promise<any> {
        return Q(true);
    }
}

var emptyModule = new EmptyModule();

class HelloWorldModule extends _app.Modules.ModuleBase {
    view = new _app.Marionette.View({ template: () => "<h1>Hello World!<h1>" });

    requiredModules(): _app.Modules.IModule[] {
        return [app.coreModule];
    }

    load(): Q.Promise<any> {
        app.coreModule.content.show(this.view);
        return Q(true);
    }
}

var hellowWorldModule = new HelloWorldModule();

class PartialViewModule extends _app.Modules.ModuleBase {
    view: _app.Marionette.View;

    constructor() {
        super();

        this.view = new _app.Marionette.View({
            template: _app.Marionette.urlTemplate("/path-to-view", { some: 'parameter' })
        });
    }

    requiredModules(): _app.Modules.IModule[] {
        return [app.coreModule];
    }

    load(): Q.Promise<any> {
        return app.coreModule.content.show(this.view);
    }
}


//_app.history.register("/", () => _app.moduleManager.load(betaModule));
_app.history.register("/beta", () => _app.moduleManager.load(betaModule));

_app.history.register("/hello-world", () => _app.moduleManager.load(hellowWorldModule));

app.coreModule.ribbon
    .tab("System")
    .group("Developer").addAll([
        new _app.Jigsaw.Ribbon.RibbonButton("Empty", () => { _app.history.navigate("/empty"); }),
        new _app.Jigsaw.Ribbon.RibbonButton("Clear Storage", () => {
            localStorage.clear();
        }, '', 'fa fa-trash-o')
    ]);
_app.history.register("/empty", () => _app.moduleManager.load(emptyModule));


export function __init__() {


}


