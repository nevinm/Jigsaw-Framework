/** Form editor module */
/// <amd-dependency path="text!modules/formeditor/templates/TemplateQueryFilter.html" />
/// <amd-dependency path="text!modules/formeditor/templates/ControlEdit.html" />
/// <amd-dependency path="text!modules/formeditor/templates/FormTemplateBasicEdit.html" />
/// <amd-dependency path="text!modules/formeditor/templates/TestFormEdit.html" />
/// <amd-dependency path="text!modules/formeditor/templates/MyCustomerItem.html" />
/// <amd-dependency path="text!modules/formeditor/assets/styles.css" />
/// <amd-dependency path='text!modules/formeditor/templates/MyCustomerItem.html' />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", 'modules/formeditor/spec/breeze-testfn', 'app', 'app-desktop', 'modules/data', 'modules/data-desktop', 'metadata/northwind', "text!modules/formeditor/templates/TemplateQueryFilter.html", "text!modules/formeditor/templates/ControlEdit.html", "text!modules/formeditor/templates/FormTemplateBasicEdit.html", "text!modules/formeditor/templates/TestFormEdit.html", "text!modules/formeditor/templates/MyCustomerItem.html", "text!modules/formeditor/assets/styles.css", "text!modules/formeditor/templates/MyCustomerItem.html"], function(require, exports, fn, _app, app, _data, data, metadata) {
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

    

    (function (helpers) {
        (function (templateList) {
            templateList.url = "form-builder", templateList.entityManager = fn.newEntityManager(), templateList.dataSource = new fn.MockCustomDataSource(templateList.entityManager, fn.EDITOR), templateList.columns = ['FormName', 'FormTitle', 'FormDescription', 'Author', 'CreatedDate', 'LastModified'], templateList.jumpToSearchProperty = 'Id', templateList.itemsViewModel = new _data.DataItemsViewModel(templateList.dataSource, {
                jumpToSearchUri: 'api/northwind/nextFormTemplate',
                jumpToSearchProperty: templateList.jumpToSearchProperty,
                excelExportPath: 'api/northwind/ExcelExportFormTemplates',
                columns: templateList.columns,
                savedSearchesGroup: 'Form Templates'
            }), templateList.barView = _data.Templates.ViewbarWithSummary(_.template(formEditortemplateFormTemplateBasicEdit)), templateList.dataView = _data.Templates.DataItems({
                title: "Form Templates",
                addNew: true,
                excelExport: false,
                //Commenting the following two lines breaks the design of the page :(
                advancedSearchSettingsUrl: 'api/northwind/LoadCodeRuleFormTemplateSearchSettings',
                advancedSearchSettings: metadata.loadCodeRuleCustomerSearchSettings,
                dragHint: formEditortemplateMyCustomerItem,
                viewModel: templateList.itemsViewModel,
                columns: templateList.columns.concat({
                    title: "Edit",
                    command: [{
                            name: "edit", click: (function (e) {
                                e.preventDefault();

                                var formTemplate = templateList.dataView.grid.entityForElement(e.currentTarget);
                                var targetProperty = helpers.templateList.jumpToSearchProperty;
                                var urlToNavigateTo = helpers.editor.url + '/' + targetProperty + '/:templateId';
                                _app.history.navigateSilent(urlToNavigateTo.replace(':templateId', formTemplate[targetProperty]())).then(function () {
                                    return helpers.editor.ItemsViewModel;
                                }).done();
                            })
                        }],
                    width: "80px",
                    groupable: false, filterable: false, sortable: false
                })
            }), templateList.stylesModule = new _app.Jigsaw.Theming.ContentStyleSheet(formEditortemplateStyles);

            //Fills entity with static data
            fn.fillEntityManager(templateList.entityManager, fn.defaultCount);

            function barViewModel(sizeController) {
                return new _data.PanelBarEditViewModel(templateList.itemsViewModel, {
                    panelBarViewModel: sizeController,
                    wordExportUrl: 'export/wordExportFormTemplate',
                    pdfExportUrl: 'export/pdfExportFormTemplate'
                });
            }
            templateList.barViewModel = barViewModel;

            function addRibbonButton(ribbon) {
                ribbon.tab("System").group("Form Builder", 30).add(new _app.Jigsaw.Ribbon.RibbonButton("Builder", function () {
                    _app.history.navigate(templateList.url);
                }, '', 'fa fa-puzzle-piece'));
            }
            templateList.addRibbonButton = addRibbonButton;
        })(helpers.templateList || (helpers.templateList = {}));
        var templateList = helpers.templateList;

        (function (editor) {
            editor.url = "form-template", editor.dataSource = helpers.templateList.dataSource, editor.ItemsViewModel = new _data.DataItemsViewModel(editor.dataSource, {
                jumpToSearchUri: 'api/northwind/nextFormTemplate',
                jumpToSearchProperty: 'Id',
                columns: ['FormName', 'FormSections'],
                savedSearchesGroup: 'Form Templates',
                queryFilter: function (query, formTemplate) {
                    return query.where('Id', breeze.FilterQueryOp.Equals, formTemplate.Id());
                }
            }), editor.barView = _data.Templates.ViewBar(_.template(formEditortemplateControlEdit)), editor.stylesModule = new _app.Jigsaw.Theming.ContentStyleSheet(formEditortemplateGeneralTemplatesStyles);

            //export class ContentViewModel extends _app.Common.ViewModelBase {
            var ContentViewModel = (function (_super) {
                __extends(ContentViewModel, _super);
                function ContentViewModel() {
                    var _this = this;
                    var selectedItem = ko.guarded();
                    _super.call(this, selectedItem, helpers.editor.dataSource);

                    this.formName = ko.observable('');
                    this.formId = ko.observable(0);
                    this.formSections = ko.observableArray([]);
                    this.orderedFormSections = ko.computed(function () {
                        return _this.formSections().sort(function (a, b) {
                            return (a.order() - b.order());
                        });
                    });
                    this.item = selectedItem.guarded;
                    this.newItem = ko.observable(null);
                }
                ContentViewModel.prototype.expandViewBar = function (currentItem) {
                    var selectedItem = this.newItem()['FormSections']().filter(function (v) {
                        return v.id() === currentItem.id();
                    }).shift();
                    helpers.editor.viewbarViewModel.item(selectedItem);
                    app.viewLayoutModule.viewModel.expandViewbar();
                };

                ContentViewModel.prototype.navigateToFormList = function () {
                    _app.history.navigate(helpers.templateList.url);
                };

                ContentViewModel.prototype.getSelectedItem = function (templateId) {
                    return this.dataSource.data.filter(function (v) {
                        return v[helpers.templateList.jumpToSearchProperty]() === +templateId;
                    }).shift();
                };

                ContentViewModel.prototype.getFormSections = function (templateId) {
                    var formSections = this.getSelectedItem(templateId)['FormSections'];
                };

                ContentViewModel.prototype.mapFormItems = function () {
                    var _this = this;
                    this.formSections().map(function (v, i) {
                        /** Used as a validator for the order field */
                        v.validatedOrder = ko.computed({
                            read: function () {
                                return v.order();
                            },
                            write: function (newOrder) {
                                var newOrderToSet = +newOrder;
                                var oldOrder = +v.order();
                                console.info(oldOrder, newOrderToSet);
                                debugger;
                                var isValid = newOrderToSet >= 0 && newOrderToSet <= _this.formSections().length - 1;
                                if (newOrderToSet !== oldOrder && isValid) {
                                    debugger;
                                    var currentItem = _this.formSections().splice(oldOrder, 1).shift();
                                    _this.formSections().forEach(function (w) {
                                        console.info(w.fieldType());
                                    });
                                    console.info('------');
                                    console.info('Length: ' + _this.formSections().length);
                                    debugger;
                                    _this.formSections().splice(newOrderToSet, 0, currentItem); //Inserts item into specified index
                                    _this.formSections().forEach(function (w) {
                                        console.info(w.fieldType());
                                    });
                                    console.info('------');
                                    console.info('Length: ' + _this.formSections().length);
                                    debugger;

                                    //oldOrder = newOrder;
                                    //Update order for all array items
                                    _this.formSections().forEach(function (w, i) {
                                        w.order(i);
                                    });
                                }
                            },
                            owner: _this
                        });

                        return v;
                    });
                };
                return ContentViewModel;
            })(_data.DataEditViewModelBase);
            editor.ContentViewModel = ContentViewModel;

            //export class ViewbarViewModel extends _app.Common.ViewModelBase {
            var ViewbarViewModel = (function (_super) {
                __extends(ViewbarViewModel, _super);
                //item: KnockoutObservable<any>;
                function ViewbarViewModel() {
                    _super.call(this, helpers.templateList.itemsViewModel);
                    this.options = {};
                    this.isReadOnly = ko.observable(false);
                    this.forceValidationErrors = ko.observable(false);
                    this.item = ko.guarded(null);

                    this.messageQueue = _app.Jigsaw.Messages.createMessageQueue(3 /* Small */);
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
                ViewbarViewModel.prototype.close = function () {
                    return _super.prototype.close.call(this).then(function () {
                        app.viewLayoutModule.viewModel.collapseViewbar();
                    });
                };
                return ViewbarViewModel;
            })(_data.DataEditViewModel);
            editor.ViewbarViewModel = ViewbarViewModel;

            editor.contentViewModel = new ContentViewModel();
            editor.viewbarViewModel = new ViewbarViewModel();
        })(helpers.editor || (helpers.editor = {}));
        var editor = helpers.editor;

        /** Custom KnockoutJS bindings */
        function addFormEditingCustomKOBindings() {
            /** Sets the placeholder value */
            ko.bindingHandlers['placeholder'] = {
                init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
                    var underlyingObservable = valueAccessor();
                    ko.applyBindingsToNode(element, { attr: { placeholder: underlyingObservable } }, viewModel);
                }
            };

            /** Makes a list sortable */
            ko.bindingHandlers['formSectionsSortableList'] = {
                init: function (element, valueAccessor) {
                    var list = valueAccessor();
                    var startIndex = -1;
                    $(element)['sortable']({
                        start: function (evt, ui) {
                            startIndex = ui.item.index();
                        },
                        stop: function (evt, ui) {
                            var newIndex = ui.item.index();
                            if (startIndex > -1) {
                                var item = list().splice(startIndex, 1).shift();

                                list().splice(newIndex, 0, item);
                                list().forEach(function (v, i) {
                                    v.order(i);
                                });
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
                        cursor: 'move'
                    });
                }
            };
        }
        helpers.addFormEditingCustomKOBindings = addFormEditingCustomKOBindings;

        /** Custom KnockoutJS extenders */
        function addFormEditingCustomExtenders() {
            /** Checks for minimum allowed value */
            ko.extenders['minVal'] = function (target, minVal) {
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
            ko.extenders['maxVal'] = function (target, maxVal) {
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
        helpers.addFormEditingCustomExtenders = addFormEditingCustomExtenders;
    })(exports.helpers || (exports.helpers = {}));
    var helpers = exports.helpers;

    var TemplateList = (function (_super) {
        __extends(TemplateList, _super);
        function TemplateList() {
            _super.call(this, {
                url: helpers.templateList.url,
                itemsViewModel: helpers.templateList.itemsViewModel,
                barViewModel: helpers.templateList.barViewModel(app.viewLayoutModule.viewModel),
                myItemsModule: data.myItemsModule,
                coreModule: app.coreModule,
                breadcrumbTitle: 'Form Templates'
            });

            //Register dynamic sub-routes
            _super.prototype.initialize.call(this);

            helpers.templateList.addRibbonButton(app.coreModule.ribbon);
            helpers.templateList.barView.withViewModel(this.barViewModel);
        }
        TemplateList.prototype.requiredModules = function () {
            return _super.prototype.requiredModules.call(this).concat(app.coreModule, app.viewLayoutModule, app.sidebarModule, data.myItemsModule, app.notificationsModule, helpers.templateList.stylesModule);
        };

        TemplateList.prototype.load = function () {
            app.coreModule.breadcrumb.next(this.breadcrumb);

            //Resets the model
            this.itemsViewModel.reset();

            return Q.all([
                app.viewLayoutModule.viewbar.show(helpers.templateList.barView),
                app.viewLayoutModule.content.show(helpers.templateList.dataView),
                app.viewLayoutModule.viewModel.collapseViewbar()
            ]);
        };
        return TemplateList;
    })(_data.BarDataModule);
    exports.TemplateList = TemplateList;

    var Editor = (function (_super) {
        __extends(Editor, _super);
        function Editor() {
            _super.call(this);
            this.contentViewModel = helpers.editor.contentViewModel;
            this.viewbarViewModel = helpers.editor.viewbarViewModel;

            this.contentView = new _app.Marionette.View({
                template: function () {
                    return _.template(formEditortemplateTestFormEdit)({
                        filterTemplate: function () {
                            return formEditortemplateQueryFilter;
                        }
                    });
                },
                viewModel: this.contentViewModel
            });
            this.viewbarView = helpers.editor.barView.withViewModel(this.viewbarViewModel);
        }
        Editor.prototype.requiredModules = function () {
            return _super.prototype.requiredModules.call(this).concat(app.coreModule, app.viewLayoutModule, app.sidebarModule, data.myItemsModule, app.notificationsModule, helpers.editor.stylesModule);
        };

        Editor.prototype.load = function () {
            //app.coreModule.breadcrumb.next(this.breadcrumb);
            //var thingsToLoad = [
            //    app.viewLayoutModule.viewbar.show(this.viewbarView),
            //    app.viewLayoutModule.content.show(this.contentView),
            //    app.viewLayoutModule.viewModel.collapseViewbar()
            //];
            var _this = this;
            //thingsToLoad = thingsToLoad.concat(_app.Utils.requirePromise("scripts/smartadmin/libs/jquery-ui-1.10.3.min.js"));
            //return <any>Q.all(thingsToLoad);
            return _app.Utils.requirePromise("scripts/smartadmin/libs/jquery-ui-1.10.3.min.js").then(function () {
                Q.all([
                    app.viewLayoutModule.viewbar.show(_this.viewbarView),
                    app.viewLayoutModule.content.show(_this.contentView),
                    app.viewLayoutModule.viewModel.collapseViewbar()
                ]);
            });
        };
        return Editor;
    })(_app.Modules.ModuleBase);
    exports.Editor = Editor;

    exports.templateListModule = new TemplateList();
    exports.editorModule = new Editor();

    function __init__() {
        helpers.addFormEditingCustomKOBindings();
        helpers.addFormEditingCustomExtenders();
        _app.history.register(helpers.templateList.url, function () {
            return _app.moduleManager.load(exports.templateListModule);
        });
        _app.history.register(helpers.editor.url, function () {
            return _app.moduleManager.load(exports.editorModule);
        });
        _app.history.register(helpers.editor.url + '/' + helpers.templateList.jumpToSearchProperty + '/:templateId', function (templateId) {
            //var item = editorModule.contentViewModel.dataSource.data.filter(function (v, i) { return v[helpers.templateList.jumpToSearchProperty]() == templateId; });
            //if (editorModule.contentViewModel.dataSource.data.length === 0) {
            //    fn.fillEntityManager(helpers.templateList.entityManager, fn.defaultCount);
            //}
            //editorModule.contentViewModel.formSections = item.unshift()['FormSections']();
            // Unsure how to handle this when the view is called directly
            return _app.moduleManager.load(exports.editorModule).then(function () {
                var item = helpers.editor.contentViewModel.getSelectedItem(templateId), formSections = item['FormSections'](), formName = item['FormName'](), formId = item['Id']();

                exports.editorModule.viewbarViewModel.item(null);
                exports.editorModule.contentViewModel.formSections(formSections);
                exports.editorModule.contentViewModel.formName(formName);
                exports.editorModule.contentViewModel.formId(formId);
                helpers.editor.contentViewModel.mapFormItems();
                exports.editorModule.contentViewModel.newItem(item);
            });
        });
    }
    exports.__init__ = __init__;
});
