/// <amd-dependency path="text!modules/smartadmin/templates/Basic.html" />
/// <amd-dependency path="text!modules/smartadmin/assets/demo.css" />
/// <amd-dependency path="text!modules/smartadmin/assets/styles.css" />

import _app = require('app')
import app = require('app-desktop')

//import template = require('templates/bootstrap');
//import smartadmin = require('templates/smartadmin');
var smartadminTemplateBasic = require('text!modules/smartadmin/templates/Basic.html');
var smartadminDemo = require('text!modules/smartadmin/assets/demo.css')
var smartadminStyles = require('text!modules/smartadmin/assets/styles.css')


class BasicBootstrapModule extends _app.Modules.ModuleBase {
    view = new _app.Marionette.View({ template: _.template(smartadminTemplateBasic) });

    requiredModules(): _app.Modules.IModule[] {
        return [app.coreModule];
    }

    load(): Q.Promise<any> {
        return app.coreModule.content.show(this.view);
    }
}

var basicBootstrapModule = new BasicBootstrapModule();

app.coreModule.ribbon
    .tab("System")
    .group("Bootstrap", 10)
    .add(new _app.Jigsaw.Ribbon.RibbonButton("Basic", () => { _app.history.navigate("/bootstrap"); }, "Load basic Bootstrap demo page", "fa fa-btc"));

_app.history.register("/bootstrap", () => _app.moduleManager.load(basicBootstrapModule));


class LoadScriptsModule extends _app.Modules.ModuleBase {
    scripts: string[];

    private _loaded = false;

    constructor(...scripts: string[]) {
        super();

        this.scripts = scripts;
    }

    private loadScript(src: string) {
        var result = Q.defer();

        // adding the script tag to the head as suggested before
        var body = document.getElementsByTagName('body')[0],
            script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = src;

        // then bind the event to the callback function
        // there are several events for cross browser compatibility
        script.onload = () => result.resolve(true);

        // fire the loading
        body.appendChild(script);

        return result.promise;
    }

    load() {
        if (this._loaded) return Q(true);

        return <any>Q.all(_.map(this.scripts, s => this.loadScript(s)));
    }
}


class SmartAdminView extends _app.Marionette.View {
    _template = '';

    renderOverride() {
        this.element = $('<div>').addClass('all-space').css('overflow-y', 'auto').css('overflow-x', 'hidden');
        return Q(this.options.template())
            .then(content => this._template = content);
    }

    domReady() {
        super.domReady();
        this.element.html(this._template);
    }
}

var themeFiles = [
    { uri: 'dashboard.html', title: 'Dashboard', group: '', priority:0 },
    { uri: 'inbox.html', title: 'Inbox', group: '', priority: 0},
    // { uri: 'flot.html', title: 'Flot Chart', group: 'Graphs' },
    // { uri: 'morris.html', title: 'Morris Charts', group: 'Graphs' },
    // { uri: 'inline-charts.html', title: 'Inline Charts', group: 'Graphs' },
    // { uri: 'dygraphs.html', title: 'Dygraphs', group: 'Graphs' },
    { uri: 'table.html', title: 'Normal Tables', group: 'Tables', priority: 2 },
    { uri: 'datatables.html', title: 'Data Tables', group: 'Tables', priority: 2 },
    { uri: 'jqgrid.html', title: 'Jquery Grid', group: 'Tables', priority: 2 },
    { uri: 'form-elements.html', title: 'Smart Form Elements', group: 'Forms', priority: 3 },
    { uri: 'form-templates.html', title: 'Smart Form Layouts', group: 'Forms', priority: 3 },
    { uri: 'validation.html', title: 'Smart Form Validation', group: 'Forms', priority: 3 },
    { uri: 'bootstrap-forms.html', title: 'Bootstrap Form Elements', group: 'Forms', priority: 3 },
    { uri: 'plugins.html', title: 'Form Plugins', group: 'Forms', priority: 3 },
    { uri: 'wizard.html', title: 'Wizards', group: 'Forms', priority: 3 },
    { uri: 'other-editors.html', title: 'Bootstrap Editors', group: 'Forms', priority: 3 },
    { uri: 'dropzone.html', title: 'Dropzone', group: 'Forms', priority: 3 },
    { uri: 'bootstrap-validator.html', title: 'Bootstrap Validator', group: 'Forms', priority: 3 },
    { uri: 'image-editor.html', title: 'Image Cropping', group: 'Forms', priority: 3 },
    { uri: 'general-elements.html', title: 'General Elements', group: 'UI Elements', priority: 4 },
    { uri: 'buttons.html', title: 'Buttons', group: 'UI Elements', priority: 4 },
    { uri: 'fa.html', title: 'Font Awesome', group: 'UI Elements', priority: 4 },
    { uri: 'glyph.html', title: 'Glyph Icons', group: 'UI Elements', priority: 4 },
    //{ uri: 'flags.html', title: 'Flags', group: 'UI Elements' },
    { uri: 'grid.html', title: 'Grid', group: 'UI Elements', priority: 4 },
    { uri: 'treeview.html', title: 'Tree View', group: 'UI Elements', priority: 4 },
    { uri: 'nestable-list.html', title: 'Nestable Lists', group: 'UI Elements', priority: 4 },
    { uri: 'jqui.html', title: 'JQuery UI', group: 'UI Elements', priority: 4 },
    { uri: 'typography.html', title: 'Typography', group: 'UI Elements', priority: 4 },
    { uri: 'calendar.html', title: 'Calendar', group: '', priority: 5 },
    { uri: 'widgets.html', title: 'Widgets', group: '', priority: 6 },
    { uri: 'projects.html', title: 'Projects', group: 'App Views', priority: 7 },
    { uri: 'blog.html', title: 'Blog', group: 'App Views', priority: 7 },
    { uri: 'gallery.html', title: 'Gallery', group: 'App Views', priority: 7 },
    { uri: 'profile.html', title: 'Profile', group: 'App Views', priority: 7 },
    { uri: 'timeline.html', title: 'Timeline', group: 'App Views', priority: 7 },
    { uri: 'gmap-xml.html', title: 'GMap Skins', group: 'Gmap', priority: 8 },
    //{ uri: 'forum.html', title: 'Forum Layout', group: 'App Views' },
    { uri: 'pricing-table.html', title: 'Pricing Tables', group: 'Miscellaneous', priority: 9},
    { uri: 'invoice.html', title: 'Invoice', group: 'Miscellaneous', priority: 9 },
    { uri: 'error404.html', title: 'Error 404', group: 'Miscellaneous', priority: 9 },
    { uri: 'error500.html', title: 'Error 500', group: 'Miscellaneous', priority: 9 },
    { uri: 'blank_.html', title: 'Blank Page', group: 'Miscellaneous', priority: 9 },
    { uri: 'email-template.html', title: 'Email Template', group: 'Miscellaneous', priority: 9 },
    { uri: 'search.html', title: 'Search Page', group: 'Miscellaneous', priority: 9 },
    { uri: 'ckeditor.html', title: 'CK Editor', group: 'Miscellaneous', priority: 9 },
    // { uri: 'chartjs.html', title: 'Charts', group: 'Miscellaneous' },
    //{ uri: 'chat.html', title: 'Chat', group: '', priority: 10},
    //{ uri: 'projects-edit.html', title: 'Edit projects', group: 'Miscellaneous' },
    //{ uri: 'realstapp.html', title: 'Real Stapp', group: 'Miscellaneous' },
    { uri: 'support.html', title: 'Suppport', group: 'Support', priority: 11 },
    //{ uri: 'difver.html', title: 'Different Versions' },
    //{ uri: 'applayout.html', title: 'App Settings' },
];

class SmartAdminModule extends _app.Modules.ModuleBase {
    styles = new _app.Jigsaw.Theming.ContentStyleSheet(smartadminDemo);
    themeStyles = new _app.Jigsaw.Theming.StyleSheet('content/smartadmin/main-theme.css');

    constructor() {
        super();

        // add dashboard as the home page
        _app.history.register("/", () => {
            _app.moduleManager.load(this).then(() => this.showView('dashboard.html'));
        });

        // register views
        _app.history.register("/smartadmin/:uri", uri => {
            _app.moduleManager.load(this).then(() => this.showView(uri));
        });

        for (var i = 0; i < 3; i++) {
            _.each(themeFiles.slice((i) * themeFiles.length / 3, (i+1)*themeFiles.length / 3), file => {
                app.coreModule.ribbon
                    .tab("SmartAdmin " + (i+1))
                    .group(file.group, file.priority)
                    .add(new _app.Jigsaw.Ribbon.RibbonButton(file.title,
                        () => { _app.history.navigate("/smartadmin/" + file.uri); }, "", "fa fa-btc"));
            });
        }
        this.renderLayoutRibbonSelect();
        this.renderChartRibbonSelect();

    }
    private renderLayoutRibbonSelect() {
        var forumLayouts: Array<string> = ["General View", "Topic View", "Post View"];
        //var forumLayouts: Array<string> = _.map(layoutDict, (layout: string) => layout);
        var layoutDict: { [key: string]: string } = {};
        layoutDict['General View'] = 'forum.html';
        layoutDict['Topic View'] = 'forum-topic.html';
        layoutDict['Post View'] = 'forum-post.html';
        var selectedLayoutName = ko.observable();
        var selectedLayout = ko.computed({
            read: function () {
                return selectedLayoutName;  
            },
            write: function (layout: string) {
                _app.history.navigate("/smartadmin/" + layoutDict[layout]);
                selectedLayoutName(layout);
            },
            owner: this
        });
        app.coreModule.ribbon
            .tab("SmartAdmin 3")
            .group("App Views", 7)
            .add(new _app.Jigsaw.Ribbon.RibbonSelect("Forum Layouts", forumLayouts, selectedLayout, "", "fa fa-btc"));
    }
    private renderChartRibbonSelect() {
        var forumLayouts: Array<string> = ["Chart.Js", "Dygraphs", "Inline Charts", "Morris Charts", "Flot Chart"];
        //var forumLayouts: Array<string> = _.map(layoutDict, (layout: string) => layout);
        var layoutDict: { [key: string]: string } = {};
        layoutDict['Chart.Js'] = 'chartjs.html';
        layoutDict['Morris Charts'] = 'morris.html';
        layoutDict['Dygraphs'] = 'dygraphs.html';
        layoutDict['Inline Charts'] = 'inline-charts.html';
        layoutDict['Flot Chart'] = 'flot.html';
        var selectedLayoutName = ko.observable();
        var selectedLayout = ko.computed({
            read: function () {
                return selectedLayoutName;
            },
            write: function (layout: string) {
                _app.history.navigate("/smartadmin/" + layoutDict[layout]);
                selectedLayoutName(layout);
            },
            owner: this
        });
        app.coreModule.ribbon
            .tab("SmartAdmin 1")
            .group("Graphs", 1)
            .add(new _app.Jigsaw.Ribbon.RibbonSelect("Graphs", forumLayouts, selectedLayout, "", "fa fa-btc"));
    }

    private showView(uri: string) {
        var view = new SmartAdminView({ template: () => _app.ajax.get('/scripts/smartadmin/demos/' + uri) });
        return app.coreModule.content.show(view)
    }

    requiredModules(): _app.Modules.IModule[] {
        return [app.coreModule, this.styles, this.themeStyles];
    }

    load(): Q.Promise<any> {
        //_app.history.mustReaload();

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
            .then(() => _app.Utils.requirePromise("scripts/smartadmin/app.js"));
    }
}

var smartAdminModule = new SmartAdminModule();

