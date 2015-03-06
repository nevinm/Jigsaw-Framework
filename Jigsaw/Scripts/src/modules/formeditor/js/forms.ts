/// <reference path="form-editor.ts" />
/// <reference path="form-editor.ts" />
/** this module will contain the form builder modules, only a desktop version is needed */

/// <reference path="../../../definitions/_definitions.d.ts" />
/// <reference path="../../../definitions/webrule.d.ts" />

/// <reference path="../../../definitions/jquery.d.ts" />
/// <reference path="../../../definitions/kendo.web.d.ts" />
/// <reference path="../../../definitions/Q.d.ts" />
/// <reference path="../../../definitions/underscore.d.ts" />
/// <reference path="../../../definitions/knockout.d.ts" />
/// <reference path="../../../definitions/knockout.validation.d.ts" />
/// <reference path="../../../definitions/knockout.mapping.d.ts" />
/// <reference path="../../../definitions/breeze.d.ts" />

import _app = require('app');
import app = require('app-desktop');

import templates = require('templates/forms');


/** this module describes the types used to serialize a form into JSON */
export module Spec {

    export interface ILabeled {
        label?: string;
    }

    /** Fields Tyle, this should be in sync with the Server */
    export enum FormItemType {
        GroupHeader = 1,
        Text = 2,

    }

    export interface FormItem {
        type: FormItemType;
    }

    export interface GroupBreak extends FormItem, ILabeled {
    }

    export interface FormField extends FormItem, ILabeled {
        bindsTo: string;
        style: any;
        validation: any;
    }

    export interface Tab extends ILabeled {
        items: FormItem[];
    }

    export interface Survey {
        tabs: Tab[];
        rules: any[]; // todo define rule spec
    }

}

export module Templates {

    export function MetaContent(options?): string {
        var tabTemplate = templates.builder.Tab();

        return templates.MetaContent({
            renderBody: tabTemplate
        });

    }

    export function FieldWrapper(fieldTemplate: _app.Marionette.TemplateFunction) {
        return templates.builder.FieldBuilder({
            renderBody: fieldTemplate()
        });
    }
}

/** contains types related to building a form */
export module Builder {

    export class CollectionViewModel<T>{
        items = ko.observableArray<T>();

        add(item: T) {
            this.items.push(item);
        }

        insert(item: T, index: number) {
            this.items.splice(index, 0, item);
        }

        remove(item: T) {
            this.items.remove(item);
        }
    }

    export class TabBuilder  {
        label = ko.observable('');
        items: KnockoutComputed<FormItem[]>;
        private _formItems = ko.observableArray<FormItem>();

        selected = ko.observable<FormItem>();

        constructor() {

            // add the new fields buttons always at the end of the field stream
            var lastItem = new ItemAdder(this);
            this.items = ko.computed(() => {
                var items = this._formItems();
                return _.union(items, [lastItem]);
            });
        }

        serialize(): Spec.Tab {
            return {
                items: _.map(this._formItems(), field=> field.serialize())
            };
        }

        addField(item: FormItem, index = -1) {
            if (index === -1) {
                this._formItems.push(item);
            } else {
                this._formItems.splice(index, 0, item);
            }
        }

        addFieldAbove(item: FormItem, mark: FormItem) {
            var index = _.indexOf(this.items(), mark);
            if (index >= 0) {
                this.addField(item, index);
            }
        }

        removeField(item: FormItem) {
            this._formItems.remove(item);
            if (this.selected() === item) {
                this.selected(null);
            }
        }

        /** adds a field adder above the given item */
        insertAdderAbove(item: FormItem) {
            var index = _.indexOf(this.items(), item);
            if (index === 0 || (index > 0 && !(this.items()[index - 1] instanceof ItemAdder))) {
                this.addFieldAbove(new ItemAdder(this), item);
            }
        }

        reorderAbove(field: FormItem, belowField: FormItem) {
            // remove the field
            if (field !== belowField) {
                this._formItems.remove(field);
                this.addFieldAbove(field, belowField);
            }
        }

        pushBottom(field: FormItem) {
            this._formItems.remove(field);
            this.addField(field);
        }
    }

    export class FormItem  {
        serialize(): Spec.FormItem {
            throw new Error('not implemented');
        }

        hasProperties = false;
    }

    export class GroupBreak extends FormItem {
        label = ko.observable('');
    }

    export class FormField extends FormItem {
        label = ko.observable('');
        required = ko.observable(false);
        hasProperties = true;
    }

    export class ItemAdder extends FormItem {
        constructor(public tabBuilder: TabBuilder) {
            super();
        }

        close() {
            this.tabBuilder.removeField(this);
            delete this;
        }

        addTextField() {
            this.tabBuilder.addFieldAbove(new Fields.TextField(), this);
            this.close();
        }


    }

    /** this variable can be used to regster templates for the builder elements for new form items */
    var formItemTemplateSelector = _app.Knockout.makeForeachWithTemplateSelector('ItemAdder', templates.builder.ItemAdder());

    export module Fields {
        export class TextField extends FormField {
            placeholder = ko.observable('');
        }

        export class SelectableOption {
            value = ko.observable('');
        }

        export class SelectableField extends FormField {
            options = ko.observableArray<SelectableOption>();
            

        }
    }

    /**  */
    export class FormItemPropertiesViewModel extends _app.Common.ViewModelBase {
        constructor(private item: KnockoutComputed<FormItem>, private panelbarViewModel: app.Jigsaw.Layout.ViewLayoutViewModel) {
            super();

            // collapse/expand the viewbar if there's some field selected
            item.subscribe(x => {
                if (item() != null && item().hasProperties) {
                    panelbarViewModel.expandViewbar().done();
                } else {
                    panelbarViewModel.collapseViewbar().done();
                }
            });
        }
    }

    /** used to register new item template properties */
    var formItemPropertyTemplateSelector = new _app.Knockout.TemplateSelector();

    ko.bindingHandlers['formItemProperty'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = valueAccessor();

            ko.applyBindingsToNode(element, {
                template: {
                    name: x => formItemPropertyTemplateSelector.select(x),
                    data: value,
                    templateEngine: _app.Knockout.StringTemplateEngine
                }
            }, viewModel);

            return { 'controlsDescendantBindings': true };
        }
    };

    /** each field type views should be registered with these templates */
    export function registerFieldTemplates(fieldType, builderTemplate: string, propertyTemplate: string) {
        formItemTemplateSelector.candidate(builderTemplate, x=> x instanceof fieldType);
        formItemPropertyTemplateSelector.candidate(propertyTemplate, x => x instanceof fieldType);
    }

    // register field templates for each field type
    registerFieldTemplates(Fields.TextField, Templates.FieldWrapper(templates.builder.TextFieldBuilder), templates.builder.TextFieldBuilderProperty());



}

/** contains classes related to displaying forms, starting from their specs.
The form is entirely built using underscore template engine for better performance.
 */
export module Display {

    export class FieldContext {
        value: KnockoutObservable<any>;

        visible: KnockoutObservable<boolean>;
        // ...
    }

    /** builds a META tab from the given specs and binds it's values to the passed object,
    metaTab: { spec: ..., value: {} } */
    ko.bindingHandlers['metaTab'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

        }
    }

    /** builds a survey from the given specs and binds it's vlaues to the passed object */
    ko.bindingHandlers['metaSurvey'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) { }
    }
}


export class MetaContentViewModel extends _app.Common.ViewModelBase {
    tab: KnockoutObservable<Builder.TabBuilder> = ko.observable(new Builder.TabBuilder());

    save() {

    }

    cancel() {

    }
}

export class FieldShortcutsViewModel extends _app.Common.ViewModelBase {
    constructor(private tab: KnockoutObservable<Builder.TabBuilder>) {
        super();
    }

    textField() {
        this.tab().addField(new Builder.Fields.TextField());
    }
}

export class MetaBuilderModule extends _app.Modules.ModuleBase {

    contentViewModel: MetaContentViewModel;
    barViewModel: Builder.FormItemPropertiesViewModel;
    sidebarViewModel: FieldShortcutsViewModel;

    contentView: _app.Marionette.View;
    barView: _app.Marionette.View;
    sidebarView: _app.Marionette.View;

    private stylesModule = new _app.Jigsaw.Theming.ContentStyleSheet(templates.builder.styles);

    constructor(private coreModule: app.Jigsaw.CoreModule, private viewLayoutModule: app.Jigsaw.Layout.ViewLayoutModule) {
        super();

        this.contentViewModel = new MetaContentViewModel();
        this.contentView = new _app.Marionette.View({
            template: Templates.MetaContent,
            viewModel: this.contentViewModel
        });

        var selected = ko.computed(() => {
            var tab = this.contentViewModel.tab();
            return tab ? tab.selected() : null;
        });
        this.barViewModel = new Builder.FormItemPropertiesViewModel(selected, viewLayoutModule.viewModel);
        this.barView = new _app.Marionette.View({
            template: templates.builder.FormItemProperty,
            viewModel: this.barViewModel
        });
        
        this.sidebarViewModel = new FieldShortcutsViewModel(this.contentViewModel.tab);
        this.sidebarView = new _app.Marionette.View({
            template: templates.BuilderFieldShortcuts,
            viewModel: this.sidebarViewModel
        });
    }

    requiredModules(): _app.Modules.IModule[] {
        return [this.coreModule, this.viewLayoutModule, this.stylesModule];
    }

    load(): Q.Promise<any> {

        // when base modules are loaded show load this module
        return Q.all([
            this.viewLayoutModule.content.show(this.contentView),
            this.viewLayoutModule.viewbar.show(this.barView),
            this.viewLayoutModule.sidebar.show(this.sidebarView),
            this.viewLayoutModule.viewModel.collapseViewbar()
        ]);
    }
}


export var metaModule = new MetaBuilderModule(app.coreModule, app.viewLayoutModule);

_app.history.register('meta', () => _app.moduleManager.load(metaModule));

app.coreModule.ribbon
    .tab("System")
    .group("Form Builder", 30)
    .add(new _app.Jigsaw.Ribbon.RibbonButton("Meta", () => { _app.history.navigate("meta"); }, '', 'fa fa-puzzle-piece'));


/**
    Edit for adding editor module to the menubar
*/

import editor = require('modules/formeditor/js/form-editor');

// Runs only if is desktop
if (!JigsawConfig.Mobile) {
    editor.__init__();
}