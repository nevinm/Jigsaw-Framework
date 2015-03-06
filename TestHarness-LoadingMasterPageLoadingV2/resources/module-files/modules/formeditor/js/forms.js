/// <reference path="form-editor.ts" />
/// <reference path="form-editor.ts" />
/** this module will contain the form builder modules, only a desktop version is needed */
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", 'app', 'app-desktop', 'templates/forms', 'modules/formeditor/js/form-editor'], function(require, exports, _app, app, templates, editor) {
    /** this module describes the types used to serialize a form into JSON */
    (function (Spec) {
        /** Fields Tyle, this should be in sync with the Server */
        (function (FormItemType) {
            FormItemType[FormItemType["GroupHeader"] = 1] = "GroupHeader";
            FormItemType[FormItemType["Text"] = 2] = "Text";
        })(Spec.FormItemType || (Spec.FormItemType = {}));
        var FormItemType = Spec.FormItemType;
    })(exports.Spec || (exports.Spec = {}));
    var Spec = exports.Spec;

    (function (Templates) {
        function MetaContent(options) {
            var tabTemplate = templates.builder.Tab();

            return templates.MetaContent({
                renderBody: tabTemplate
            });
        }
        Templates.MetaContent = MetaContent;

        function FieldWrapper(fieldTemplate) {
            return templates.builder.FieldBuilder({
                renderBody: fieldTemplate()
            });
        }
        Templates.FieldWrapper = FieldWrapper;
    })(exports.Templates || (exports.Templates = {}));
    var Templates = exports.Templates;

    /** contains types related to building a form */
    (function (Builder) {
        var CollectionViewModel = (function () {
            function CollectionViewModel() {
                this.items = ko.observableArray();
            }
            CollectionViewModel.prototype.add = function (item) {
                this.items.push(item);
            };

            CollectionViewModel.prototype.insert = function (item, index) {
                this.items.splice(index, 0, item);
            };

            CollectionViewModel.prototype.remove = function (item) {
                this.items.remove(item);
            };
            return CollectionViewModel;
        })();
        Builder.CollectionViewModel = CollectionViewModel;

        var TabBuilder = (function () {
            function TabBuilder() {
                var _this = this;
                this.label = ko.observable('');
                this._formItems = ko.observableArray();
                this.selected = ko.observable();
                // add the new fields buttons always at the end of the field stream
                var lastItem = new ItemAdder(this);
                this.items = ko.computed(function () {
                    var items = _this._formItems();
                    return _.union(items, [lastItem]);
                });
            }
            TabBuilder.prototype.serialize = function () {
                return {
                    items: _.map(this._formItems(), function (field) {
                        return field.serialize();
                    })
                };
            };

            TabBuilder.prototype.addField = function (item, index) {
                if (typeof index === "undefined") { index = -1; }
                if (index === -1) {
                    this._formItems.push(item);
                } else {
                    this._formItems.splice(index, 0, item);
                }
            };

            TabBuilder.prototype.addFieldAbove = function (item, mark) {
                var index = _.indexOf(this.items(), mark);
                if (index >= 0) {
                    this.addField(item, index);
                }
            };

            TabBuilder.prototype.removeField = function (item) {
                this._formItems.remove(item);
                if (this.selected() === item) {
                    this.selected(null);
                }
            };

            /** adds a field adder above the given item */
            TabBuilder.prototype.insertAdderAbove = function (item) {
                var index = _.indexOf(this.items(), item);
                if (index === 0 || (index > 0 && !(this.items()[index - 1] instanceof ItemAdder))) {
                    this.addFieldAbove(new ItemAdder(this), item);
                }
            };

            TabBuilder.prototype.reorderAbove = function (field, belowField) {
                // remove the field
                if (field !== belowField) {
                    this._formItems.remove(field);
                    this.addFieldAbove(field, belowField);
                }
            };

            TabBuilder.prototype.pushBottom = function (field) {
                this._formItems.remove(field);
                this.addField(field);
            };
            return TabBuilder;
        })();
        Builder.TabBuilder = TabBuilder;

        var FormItem = (function () {
            function FormItem() {
                this.hasProperties = false;
            }
            FormItem.prototype.serialize = function () {
                throw new Error('not implemented');
            };
            return FormItem;
        })();
        Builder.FormItem = FormItem;

        var GroupBreak = (function (_super) {
            __extends(GroupBreak, _super);
            function GroupBreak() {
                _super.apply(this, arguments);
                this.label = ko.observable('');
            }
            return GroupBreak;
        })(FormItem);
        Builder.GroupBreak = GroupBreak;

        var FormField = (function (_super) {
            __extends(FormField, _super);
            function FormField() {
                _super.apply(this, arguments);
                this.label = ko.observable('');
                this.required = ko.observable(false);
                this.hasProperties = true;
            }
            return FormField;
        })(FormItem);
        Builder.FormField = FormField;

        var ItemAdder = (function (_super) {
            __extends(ItemAdder, _super);
            function ItemAdder(tabBuilder) {
                _super.call(this);
                this.tabBuilder = tabBuilder;
            }
            ItemAdder.prototype.close = function () {
                this.tabBuilder.removeField(this);
                delete this;
            };

            ItemAdder.prototype.addTextField = function () {
                this.tabBuilder.addFieldAbove(new Fields.TextField(), this);
                this.close();
            };
            return ItemAdder;
        })(FormItem);
        Builder.ItemAdder = ItemAdder;

        /** this variable can be used to regster templates for the builder elements for new form items */
        var formItemTemplateSelector = _app.Knockout.makeForeachWithTemplateSelector('ItemAdder', templates.builder.ItemAdder());

        (function (Fields) {
            var TextField = (function (_super) {
                __extends(TextField, _super);
                function TextField() {
                    _super.apply(this, arguments);
                    this.placeholder = ko.observable('');
                }
                return TextField;
            })(FormField);
            Fields.TextField = TextField;

            var SelectableOption = (function () {
                function SelectableOption() {
                    this.value = ko.observable('');
                }
                return SelectableOption;
            })();
            Fields.SelectableOption = SelectableOption;

            var SelectableField = (function (_super) {
                __extends(SelectableField, _super);
                function SelectableField() {
                    _super.apply(this, arguments);
                    this.options = ko.observableArray();
                }
                return SelectableField;
            })(FormField);
            Fields.SelectableField = SelectableField;
        })(Builder.Fields || (Builder.Fields = {}));
        var Fields = Builder.Fields;

        /**  */
        var FormItemPropertiesViewModel = (function (_super) {
            __extends(FormItemPropertiesViewModel, _super);
            function FormItemPropertiesViewModel(item, panelbarViewModel) {
                _super.call(this);
                this.item = item;
                this.panelbarViewModel = panelbarViewModel;

                // collapse/expand the viewbar if there's some field selected
                item.subscribe(function (x) {
                    if (item() != null && item().hasProperties) {
                        panelbarViewModel.expandViewbar().done();
                    } else {
                        panelbarViewModel.collapseViewbar().done();
                    }
                });
            }
            return FormItemPropertiesViewModel;
        })(_app.Common.ViewModelBase);
        Builder.FormItemPropertiesViewModel = FormItemPropertiesViewModel;

        /** used to register new item template properties */
        var formItemPropertyTemplateSelector = new _app.Knockout.TemplateSelector();

        ko.bindingHandlers['formItemProperty'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var value = valueAccessor();

                ko.applyBindingsToNode(element, {
                    template: {
                        name: function (x) {
                            return formItemPropertyTemplateSelector.select(x);
                        },
                        data: value,
                        templateEngine: _app.Knockout.StringTemplateEngine
                    }
                }, viewModel);

                return { 'controlsDescendantBindings': true };
            }
        };

        /** each field type views should be registered with these templates */
        function registerFieldTemplates(fieldType, builderTemplate, propertyTemplate) {
            formItemTemplateSelector.candidate(builderTemplate, function (x) {
                return x instanceof fieldType;
            });
            formItemPropertyTemplateSelector.candidate(propertyTemplate, function (x) {
                return x instanceof fieldType;
            });
        }
        Builder.registerFieldTemplates = registerFieldTemplates;

        // register field templates for each field type
        registerFieldTemplates(Fields.TextField, Templates.FieldWrapper(templates.builder.TextFieldBuilder), templates.builder.TextFieldBuilderProperty());
    })(exports.Builder || (exports.Builder = {}));
    var Builder = exports.Builder;

    /** contains classes related to displaying forms, starting from their specs.
    The form is entirely built using underscore template engine for better performance.
    */
    (function (Display) {
        var FieldContext = (function () {
            function FieldContext() {
            }
            return FieldContext;
        })();
        Display.FieldContext = FieldContext;

        /** builds a META tab from the given specs and binds it's values to the passed object,
        metaTab: { spec: ..., value: {} } */
        ko.bindingHandlers['metaTab'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            }
        };

        /** builds a survey from the given specs and binds it's vlaues to the passed object */
        ko.bindingHandlers['metaSurvey'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            }
        };
    })(exports.Display || (exports.Display = {}));
    var Display = exports.Display;

    var MetaContentViewModel = (function (_super) {
        __extends(MetaContentViewModel, _super);
        function MetaContentViewModel() {
            _super.apply(this, arguments);
            this.tab = ko.observable(new Builder.TabBuilder());
        }
        MetaContentViewModel.prototype.save = function () {
        };

        MetaContentViewModel.prototype.cancel = function () {
        };
        return MetaContentViewModel;
    })(_app.Common.ViewModelBase);
    exports.MetaContentViewModel = MetaContentViewModel;

    var FieldShortcutsViewModel = (function (_super) {
        __extends(FieldShortcutsViewModel, _super);
        function FieldShortcutsViewModel(tab) {
            _super.call(this);
            this.tab = tab;
        }
        FieldShortcutsViewModel.prototype.textField = function () {
            this.tab().addField(new Builder.Fields.TextField());
        };
        return FieldShortcutsViewModel;
    })(_app.Common.ViewModelBase);
    exports.FieldShortcutsViewModel = FieldShortcutsViewModel;

    var MetaBuilderModule = (function (_super) {
        __extends(MetaBuilderModule, _super);
        function MetaBuilderModule(coreModule, viewLayoutModule) {
            var _this = this;
            _super.call(this);
            this.coreModule = coreModule;
            this.viewLayoutModule = viewLayoutModule;
            this.stylesModule = new _app.Jigsaw.Theming.ContentStyleSheet(templates.builder.styles);

            this.contentViewModel = new MetaContentViewModel();
            this.contentView = new _app.Marionette.View({
                template: Templates.MetaContent,
                viewModel: this.contentViewModel
            });

            var selected = ko.computed(function () {
                var tab = _this.contentViewModel.tab();
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
        MetaBuilderModule.prototype.requiredModules = function () {
            return [this.coreModule, this.viewLayoutModule, this.stylesModule];
        };

        MetaBuilderModule.prototype.load = function () {
            // when base modules are loaded show load this module
            return Q.all([
                this.viewLayoutModule.content.show(this.contentView),
                this.viewLayoutModule.viewbar.show(this.barView),
                this.viewLayoutModule.sidebar.show(this.sidebarView),
                this.viewLayoutModule.viewModel.collapseViewbar()
            ]);
        };
        return MetaBuilderModule;
    })(_app.Modules.ModuleBase);
    exports.MetaBuilderModule = MetaBuilderModule;

    exports.metaModule = new MetaBuilderModule(app.coreModule, app.viewLayoutModule);

    _app.history.register('meta', function () {
        return _app.moduleManager.load(exports.metaModule);
    });

    app.coreModule.ribbon.tab("System").group("Form Builder", 30).add(new _app.Jigsaw.Ribbon.RibbonButton("Meta", function () {
        _app.history.navigate("meta");
    }, '', 'fa fa-puzzle-piece'));

    // Runs only if is desktop
    if (!JigsawConfig.Mobile) {
        editor.__init__();
    }
});
