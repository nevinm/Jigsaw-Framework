/** Form editor module */
/// <amd-dependency path="text!modules/formeditor/templates/TemplateQueryFilter.html" />
/// <amd-dependency path="text!modules/formeditor/templates/ControlEdit.html" />
/// <amd-dependency path="text!modules/formeditor/templates/FormTemplateBasicEdit.html" />
/// <amd-dependency path="text!modules/formeditor/templates/TestFormEdit.html" />
/// <amd-dependency path="text!modules/formeditor/templates/MyCustomerItem.html" />
/// <amd-dependency path="text!modules/formeditor/assets/styles.css" />
/// <amd-dependency path='text!modules/formeditor/templates/MyCustomerItem.html' />


/// <reference path="../../../definitions/_definitions.d.ts" />
/// <reference path="../../../definitions/Q.d.ts" />
/// <reference path="../../../definitions/underscore.d.ts" />
/// <reference path="../../../definitions/knockout.d.ts" />

/// <reference path="../../../definitions/require.d.ts" />
/// <reference path="../../../templates/definitions.d.ts" />
var formEditortemplateQueryFilter = require('text!modules/formeditor/templates/TemplateQueryFilter.html');
var formEditortemplateControlEdit = require('text!modules/formeditor/templates/ControlEdit.html');
var formEditortemplateFormTemplateBasicEdit = require('text!modules/formeditor/templates/FormTemplateBasicEdit.html');
var formEditortemplateTestFormEdit = require('text!modules/formeditor/templates/TestFormEdit.html');
var formEditortemplateStyles = require('text!modules/formeditor/assets/styles.css');
var formEditortemplateMyCustomerItem = require('text!modules/formeditor/templates/MyCustomerItem.html');
var formEditortemplateGeneralTemplatesStyles = require('text!modules/formeditor/templates/MyCustomerItem.html');

import fn = require('modules/formeditor/spec/breeze-testfn');
import _app = require('app');
import app = require('app-desktop');
import _data = require('modules/data');
import data = require('modules/data-desktop');
import formTemplates = require('templates/forms');
import metadata = require('metadata/northwind');
//import customerTemplates = require('templates/data.customer');
//import generalTemplates = require('templates/data');

export interface TemplateFunction {
    (rc): string; raw: string;
}

export module helpers {
    export module templateList {
        export var url = "form-builder",
            entityManager = fn.newEntityManager(),
            dataSource = new fn.MockCustomDataSource(entityManager, fn.EDITOR),
            columns = ['FormName', 'FormTitle', 'FormDescription', 'Author', 'CreatedDate', 'LastModified'],
            jumpToSearchProperty = 'Id',
            itemsViewModel = new _data.DataItemsViewModel(dataSource, {
                jumpToSearchUri: 'api/northwind/nextFormTemplate',
                jumpToSearchProperty: jumpToSearchProperty,
                excelExportPath: 'api/northwind/ExcelExportFormTemplates',
                columns: columns,
                savedSearchesGroup: 'Form Templates'
            }),
            barView = _data.Templates.ViewbarWithSummary(_.template(formEditortemplateFormTemplateBasicEdit)),
            dataView = _data.Templates.DataItems({
                title: "Form Templates",
                addNew: true,
                excelExport: false,
                //Commenting the following two lines breaks the design of the page :(
                advancedSearchSettingsUrl: 'api/northwind/LoadCodeRuleFormTemplateSearchSettings',
                advancedSearchSettings: metadata.loadCodeRuleCustomerSearchSettings, // Required until actual metadata can be created from JSON for Breeze.
                dragHint: formEditortemplateMyCustomerItem,
                viewModel: itemsViewModel,
                columns: columns.concat(<any>{
                    title: "Edit",
                    command: [{
                        name: "edit", click: (e => {
                            e.preventDefault();

                            var formTemplate = dataView.grid.entityForElement(e.currentTarget);
                            var targetProperty = helpers.templateList.jumpToSearchProperty;
                            var urlToNavigateTo = helpers.editor.url + '/' + targetProperty + '/:templateId';
                            _app.history.navigateSilent(urlToNavigateTo.replace(':templateId', formTemplate[targetProperty]()))
                                .then(() => {
                                    return helpers.editor.ItemsViewModel;
                                })
                                .done();
                        })
                    }],
                    width: "80px",
                    groupable: false, filterable: false, sortable: false
                })
            }),
            stylesModule = new _app.Jigsaw.Theming.ContentStyleSheet(formEditortemplateStyles);

        //Fills entity with static data
        fn.fillEntityManager(entityManager, fn.defaultCount);

        export function barViewModel(sizeController: _app.Jigsaw.Layout.ViewbarSizeController) {
            return new _data.PanelBarEditViewModel(itemsViewModel, {
                panelBarViewModel: sizeController,
                wordExportUrl: 'export/wordExportFormTemplate',
                pdfExportUrl: 'export/pdfExportFormTemplate',
            });
        }

        export function addRibbonButton(ribbon: _app.Jigsaw.Ribbon.RibbonSet) {
            ribbon
                .tab("System")
                .group("Form Builder", 30)
                .add(new _app.Jigsaw.Ribbon.RibbonButton("Builder",
                    () => { _app.history.navigate(url); }, '', 'fa fa-puzzle-piece'));
        }
    }

    export module editor {
        export var url = "form-template",
            dataSource = helpers.templateList.dataSource,
            ItemsViewModel = new _data.DataItemsViewModel(dataSource, {
                jumpToSearchUri: 'api/northwind/nextFormTemplate',
                jumpToSearchProperty: 'Id',
                columns: ['FormName', 'FormSections'],
                savedSearchesGroup: 'Form Templates',
                queryFilter: (query, formTemplate) => {
                    return query.where('Id', breeze.FilterQueryOp.Equals, formTemplate.Id())
                }
            }),
            barView = _data.Templates.ViewBar(_.template(formEditortemplateControlEdit)),
            stylesModule = new _app.Jigsaw.Theming.ContentStyleSheet(formEditortemplateGeneralTemplatesStyles);

        export interface FormItem {
            fieldType: KnockoutObservable<string>;

            label?: KnockoutObservable<string>;

            addonText: KnockoutObservable<string>;

            placeholder?: KnockoutObservable<string>;

            order: KnockoutObservable<{}>;

            validatedOrder?: KnockoutComputed<{}>;

            size: KnockoutObservable<string>;

            validations?: KnockoutObservable<{}>

            maxLength?: KnockoutObservable<{}>;
            minLength?: KnockoutObservable<{}>;
            instructionsText?: KnockoutObservable<string>;
            defaultValue?: KnockoutObservable<string>;
            possibleFieldTypes?: KnockoutObservableArray<string>;
            possibleSizes?: KnockoutObservableArray<string>;
            requiredValues?: KnockoutObservableArray<boolean>;
        }

        //export class ContentViewModel extends _app.Common.ViewModelBase {
        export class ContentViewModel extends _data.DataEditViewModelBase {
            formSections: KnockoutObservableArray<FormItem>;
            formName: KnockoutObservable<string>;
            formId: KnockoutObservable<number>;
            newItem: KnockoutObservable<breeze.Entity>;
            orderedFormSections: KnockoutComputed<FormItem[]>;

            constructor() {
                var selectedItem = ko.guarded<breeze.Entity>();
                super(selectedItem, helpers.editor.dataSource);

                this.formName = ko.observable('');
                this.formId = ko.observable(0);
                this.formSections = ko.observableArray([]);
                this.orderedFormSections = ko.computed(() => this.formSections()
                    .sort((a, b): any => (a.order() - b.order())));
                this.item = selectedItem.guarded;
                this.newItem = ko.observable(null);
            }

            expandViewBar(currentItem) {
                var selectedItem = this.newItem()['FormSections']().filter(v => v.id() === currentItem.id()).shift();   
                helpers.editor.viewbarViewModel.item(selectedItem);
                app.viewLayoutModule.viewModel.expandViewbar();
            }

            navigateToFormList() {
                _app.history.navigate(helpers.templateList.url);
            }

            getSelectedItem(templateId: string) {
                return this.dataSource.data
                    .filter(v => v[helpers.templateList.jumpToSearchProperty]() === +templateId).shift();
            }

            getFormSections(templateId: string) {
                var formSections = this.getSelectedItem(templateId)['FormSections'];
            }

            mapFormItems() {
                this.formSections().map((v, i) => {
                    /** Used as a validator for the order field */
                    v.validatedOrder = ko.computed({
                        read: () => v.order(),
                        write: (newOrder) => {
                            var newOrderToSet = +newOrder; //Converting to number from string
                            var oldOrder = +v.order();
                            console.info(oldOrder, newOrderToSet);
                            debugger;
                            var isValid = newOrderToSet >= 0 && newOrderToSet <= this.formSections().length - 1;
                            if (newOrderToSet !== oldOrder && isValid) {

                                //Reorder the array
                                debugger;
                                var currentItem = this.formSections().splice(oldOrder, 1).shift(); //Removes the current item
                                this.formSections().forEach((w) => { console.info(w.fieldType()); });
                                console.info('------');
                                console.info('Length: ' + this.formSections().length);
                                debugger;
                                this.formSections().splice(newOrderToSet, 0, currentItem); //Inserts item into specified index
                                this.formSections().forEach((w) => { console.info(w.fieldType()); });
                                console.info('------');
                                console.info('Length: ' + this.formSections().length);
                                debugger;
                                //oldOrder = newOrder;

                                //Update order for all array items
                                this.formSections().forEach((w, i) => {
                                    w.order(i);
                                });
                            }
                        },
                        owner: this
                    });

                    return v;
                });
            }
        }

        //export class ViewbarViewModel extends _app.Common.ViewModelBase {
        export class ViewbarViewModel extends _data.DataEditViewModel {
            messageQueue: _app.Jigsaw.Messages.MessageQueue;
            options = {};
            isReadOnly = ko.observable(false);
            forceValidationErrors = ko.observable(false);
            //item: KnockoutObservable<any>;

            constructor() {
                super(helpers.templateList.itemsViewModel);
                this.item = ko.guarded(null);

                this.messageQueue = _app.Jigsaw.Messages.createMessageQueue(_app.Jigsaw.Messages.MessageQueueType.Small);
            }
            //The following methods are required if you don't inherit from _data.DataEditViewModel

            //wordExport() {
            //}

            //pdfExport() {
            //}

            //save() {
            //}

            //saveAndClose() {
            //}

            close() {
                return super.close().then(() => { app.viewLayoutModule.viewModel.collapseViewbar(); });
            }

            //showInPopupReadOnly() {
            //}

            //showInPopup() {
            //}

            //forceValidationErrors() {
            //}
        }

        export var contentViewModel = new ContentViewModel();
        export var viewbarViewModel = new ViewbarViewModel();
    }

    /** Custom KnockoutJS bindings */
    export function addFormEditingCustomKOBindings(): void {

        /** Sets the placeholder value */
        ko.bindingHandlers['placeholder'] = {
            init: (element, valueAccessor, allBindingsAccessor, viewModel) => {

                var underlyingObservable = valueAccessor();
                ko.applyBindingsToNode(element, { attr: { placeholder: underlyingObservable } }, viewModel);
            }
        };

        /** Makes a list sortable */
        ko.bindingHandlers['formSectionsSortableList'] = {
            init: (element, valueAccessor) => {
                var list = valueAccessor();
                var startIndex = -1;
                $(element)['sortable']({
                    start: (evt, ui) => {
                        startIndex = ui.item.index();
                    },
                    stop: (evt, ui) => {
                        var newIndex = ui.item.index();
                        if (startIndex > -1) {
                            var item = list().splice(startIndex, 1).shift();

                            list().splice(newIndex, 0, item);
                            list().forEach((v, i) => { v.order(i); });
                        }
                    },
                    //update: (evt, ui) => {
                    //    debugger;
                    //    //var item = ui.item.tmplItem().data;
                    //    //var position = ko.utils.arrayIndexOf(ui.item.parent().children(), ui.item[0]);
                    //    //if (position >= 0) {
                    //    //    list.remove(item);
                    //    //    list.splice(position, 0, item);
                    //    //}
                    //},
                    cursor: 'move',
                    //handle: '.form-drag-handle'
                });
            }
        };
    }
    /** Custom KnockoutJS extenders */
    export function addFormEditingCustomExtenders(): void {

        /** Checks for minimum allowed value */
        ko.extenders['minVal'] = (target, minVal) => {
            var result = ko.computed({
                read: target,
                write: function (newValue) {
                    var current = target();

                    if (newValue !== current && newValue >= minVal) {
                        target(newValue);
                    } else {
                        debugger;
                        target(target());
                        // New value matches current value, do nothing
                        // New value is invalid, do nothing
                    }
                }
            });

            result(target());

            return result;
        };

        /** Checks for minimum allowed value */
        ko.extenders['maxVal'] = (target, maxVal) => {
            var isFunction = _.isFunction(maxVal);
            var result = ko.computed({
                read: target,
                write: function (newValue) {
                    var current = target();
                    var maxAllowedValue = isFunction ? maxVal() : maxVal;

                    if (newValue !== current && newValue <= maxAllowedValue) {
                        target(newValue);
                    } else {
                        // New value matches current value, do nothing
                        // New value is invalid, do nothing
                    }
                }
            });

            result(target());

            return result;
        };
    }
}

export class TemplateList extends _data.BarDataModule {
    constructor() {
        super({
            url: helpers.templateList.url,
            itemsViewModel: helpers.templateList.itemsViewModel,
            barViewModel: helpers.templateList.barViewModel(app.viewLayoutModule.viewModel),
            myItemsModule: data.myItemsModule,
            coreModule: app.coreModule,
            breadcrumbTitle: 'Form Templates'
        });

        //Register dynamic sub-routes
        super.initialize();

        helpers.templateList.addRibbonButton(app.coreModule.ribbon);
        helpers.templateList.barView.withViewModel(this.barViewModel);
    }

    requiredModules(): _app.Modules.IModule[] {
        return super.requiredModules().concat(app.coreModule,
            app.viewLayoutModule, app.sidebarModule, data.myItemsModule,
            app.notificationsModule, helpers.templateList.stylesModule);
    }

    load(): Q.Promise<any> {
        app.coreModule.breadcrumb.next(this.breadcrumb);

        //Resets the model
        this.itemsViewModel.reset();

        return Q.all([
            app.viewLayoutModule.viewbar.show(helpers.templateList.barView),
            app.viewLayoutModule.content.show(helpers.templateList.dataView),
            app.viewLayoutModule.viewModel.collapseViewbar(),
        ]);
    }
}

export class Editor extends _app.Modules.ModuleBase {

    contentView: _app.Marionette.View;
    viewbarView: _app.Marionette.View;

    contentViewModel = helpers.editor.contentViewModel;
    viewbarViewModel = helpers.editor.viewbarViewModel;

    breadcrumb: _app.Common.Breadcrumb<_app.Jigsaw.CoreModuleBreadcrumbItem>;

    constructor() {
        super();

        this.contentView = new _app.Marionette.View({
            template: () => _.template(formEditortemplateTestFormEdit)({
                filterTemplate: function () {
                    return formEditortemplateQueryFilter;
                }
            }),  
            viewModel: this.contentViewModel
        });
        this.viewbarView = helpers.editor.barView.withViewModel(this.viewbarViewModel);
    }

    requiredModules(): _app.Modules.IModule[] {
        return super.requiredModules().concat(app.coreModule,
            app.viewLayoutModule, app.sidebarModule, data.myItemsModule,
            app.notificationsModule, helpers.editor.stylesModule);
    }

    load(): Q.Promise<any> {
        //app.coreModule.breadcrumb.next(this.breadcrumb);
        //var thingsToLoad = [
        //    app.viewLayoutModule.viewbar.show(this.viewbarView),
        //    app.viewLayoutModule.content.show(this.contentView),
        //    app.viewLayoutModule.viewModel.collapseViewbar()
        //];

        //thingsToLoad = thingsToLoad.concat(_app.Utils.requirePromise("scripts/smartadmin/libs/jquery-ui-1.10.3.min.js"));

        //return <any>Q.all(thingsToLoad);
        return _app.Utils.requirePromise("scripts/smartadmin/libs/jquery-ui-1.10.3.min.js").then(() => {
            Q.all([
                app.viewLayoutModule.viewbar.show(this.viewbarView),
                app.viewLayoutModule.content.show(this.contentView),
                app.viewLayoutModule.viewModel.collapseViewbar()
            ]);
        });
    }
}

export var templateListModule = new TemplateList();
export var editorModule = new Editor();

export function __init__() {
    helpers.addFormEditingCustomKOBindings();
    helpers.addFormEditingCustomExtenders();
    _app.history.register(helpers.templateList.url, () => _app.moduleManager.load(templateListModule));
    _app.history.register(helpers.editor.url, () => _app.moduleManager.load(editorModule));
    _app.history.register(helpers.editor.url + '/' + helpers.templateList.jumpToSearchProperty + '/:templateId', templateId => {
        //var item = editorModule.contentViewModel.dataSource.data.filter(function (v, i) { return v[helpers.templateList.jumpToSearchProperty]() == templateId; });
        //if (editorModule.contentViewModel.dataSource.data.length === 0) {
        //    fn.fillEntityManager(helpers.templateList.entityManager, fn.defaultCount);
        //}
        //editorModule.contentViewModel.formSections = item.unshift()['FormSections']();

        // Unsure how to handle this when the view is called directly
        return _app.moduleManager.load(editorModule).then(() => {

            var item = helpers.editor.contentViewModel.getSelectedItem(templateId),
                formSections = item['FormSections'](),
                formName = item['FormName'](),
                formId = item['Id']();

            editorModule.viewbarViewModel.item(null);
            editorModule.contentViewModel.formSections(formSections);
            editorModule.contentViewModel.formName(formName);
            editorModule.contentViewModel.formId(formId);
            helpers.editor.contentViewModel.mapFormItems();
            editorModule.contentViewModel.newItem(item);
        });
    });
}