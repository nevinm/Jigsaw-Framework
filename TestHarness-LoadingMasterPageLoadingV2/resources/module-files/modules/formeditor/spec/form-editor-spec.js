/// <reference path="../../../spec/lib/jasmine.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", 'spec/mother', 'modules/formeditor/spec/breeze-testfn', 'app-desktop', 'modules/data', 'modules/formeditor/js/form-editor'], function(require, exports, mother, fn, app, _data, editor) {
    var qwait = mother.Qwait;

    var MockDataSource = (function (_super) {
        __extends(MockDataSource, _super);
        function MockDataSource(entityManager) {
            _super.call(this, {
                manager: entityManager,
                endPoint: breeze.EntityQuery.from(fn.TAG),
                typeName: fn.TAG,
                cacheData: false
            });
        }
        return MockDataSource;
    })(_data.Server.DataSource);
    exports.MockDataSource = MockDataSource;

    describe('form-editor', function () {
        /*Get random numbers in range*/
        var randomNumber = function (minNumber, maxNumber) {
            return Math.floor(Math.random() * (maxNumber - minNumber) + minNumber);
        };

        describe('editor.helpers.templateList', function () {
            var entityManager = fn.newEntityManager(), dataSource = new fn.MockCustomDataSource(entityManager, fn.EDITOR), templateListHelper = editor.helpers.templateList, expectedColumns = ['FormName', 'FormTitle', 'FormDescription', 'Author', 'CreatedDate', 'LastModified'], expectedColumnsLength = expectedColumns.length, barViewModel = templateListHelper.barViewModel(app.viewLayoutModule.viewModel), dataItems = new _data.DataItemsViewModel(dataSource), viewPanel = new _data.DataEditViewModel(dataItems), defaultCount = fn.defaultCount, expectedColumnsCheckFunc = function (v, i) {
                it('should have column #' + (i + 1) + ' as ' + expectedColumns[i], function () {
                    expect(v).toBe(expectedColumns[i]);
                });
            };

            fn.fillEntityManager(entityManager, defaultCount);

            describe('async data fetch', function () {
                beforeEach(function () {
                    mother.Qwait(dataSource.query());
                });

                /** Resets the data before the next test */
                afterEach(function () {
                    dataSource.data.length = 0;
                });

                it('should have data greater than 0', function () {
                    runs(function () {
                        expect(dataSource.data.length).toBeGreaterThan(0);
                    });
                });

                expectedColumns.forEach(function (v) {
                    it('should have ' + v + ' defined', function () {
                        runs(function () {
                            expect(dataSource.data[randomNumber(0, dataSource.data.length)][v]).toBeDefined();
                        });
                    });
                });

                describe('dataItems', function () {
                    it('should have same length data as dataSource', function () {
                        expect(dataItems.dataSource.data.length).toBe(dataSource.data.length);
                    });

                    it('should add new item to data', function () {
                        qwait(dataItems.addNew());

                        runs(function () {
                            expect(dataItems.dataSource.data.length).toBe(defaultCount + 1);
                        });
                    });
                });

                describe('viewPanel', function () {
                    it('should have same length data as dataItems', function () {
                        expect(viewPanel.dataSource.data.length).toBe(dataItems.dataSource.data.length);
                    });

                    it('should have same length data as dataSource', function () {
                        expect(viewPanel.dataSource.data.length).toBe(dataSource.data.length);
                    });

                    describe('adding new item', function () {
                        it('should update dataItems properly', function () {
                            qwait(dataItems.addNew());

                            runs(function () {
                                expect(viewPanel.dataSource.data.length).toBe(defaultCount + 2);
                                expect(viewPanel.item().entityAspect.entityState).toBe(breeze.EntityState.Added);
                            });
                        });
                    });
                });
            });

            it('should have "form-builder" as url', function () {
                expect(templateListHelper.url).toBe('form-builder');
            });

            it('should have jumpToSearchProperty as "Id"', function () {
                expect(templateListHelper.jumpToSearchProperty).toBe('Id');
            });

            describe('columns', function () {
                var columns = templateListHelper.columns;

                it('should have ' + expectedColumnsLength + ' items', function () {
                    expect(columns.length).toBe(expectedColumnsLength);
                });

                columns.forEach(expectedColumnsCheckFunc);
            });

            describe('itemsViewModel', function () {
                it('should be defined', function () {
                    expect(templateListHelper.itemsViewModel).toBeDefined();
                });

                it('should have "api/northwind/nextFormTemplate" as jumpToSearch', function () {
                    expect(templateListHelper.itemsViewModel.jumpToSearch.service).toBe('api/northwind/nextFormTemplate');
                });

                it('should have itemsViewModel.jumpToSearch.targetProperty to equal templateListHelper.jumpToSearchProperty', function () {
                    expect(templateListHelper.itemsViewModel.jumpToSearch.targetProperty).toBe(templateListHelper.jumpToSearchProperty);
                });
            });

            describe('dataView', function () {
                var columns = templateListHelper.dataView.options.columns;

                it('should be defined', function () {
                    expect(templateListHelper.dataView).toBeDefined();
                });

                xit('should have "Form Templates" as title', function () {
                    expect(templateListHelper.dataView.options.template).toBe('Form Templates');
                });

                it('should have "api/northwind/LoadCodeRuleFormTemplateSearchSettings" as advanced search settings url', function () {
                    expect(templateListHelper.dataView.options.advancedSearchSettingsUrl).toBe('api/northwind/LoadCodeRuleFormTemplateSearchSettings');
                });

                it('should have expect "api/northwind/ExcelExportFormTemplates" as the excel export path', function () {
                    expect(templateListHelper.dataView.options.viewModel.options.excelExportPath).toBe('api/northwind/ExcelExportFormTemplates');
                });

                it('should have atleast ' + expectedColumnsLength + ' columns', function () {
                    expect(columns.length).toBeGreaterThan(expectedColumnsLength);
                });

                columns.forEach(function (v, i) {
                    if (i !== (expectedColumnsLength)) {
                        expectedColumnsCheckFunc(v, i);
                    } else {
                        describe((expectedColumnsLength + 1) + 'th column', function () {
                            it('should be an object', function () {
                                expect(typeof v).toBe('object');
                            });

                            it('should have title as "Edit"', function () {
                                expect(v.title).toBeDefined();
                                expect(v.title).toBe('Edit');
                            });
                        });
                    }
                });
            });

            describe('barViewModel', function () {
                it('should be defined', function () {
                    expect(barViewModel).toBeDefined();
                });

                it('should have wordExportUrl as "export/wordExportFormTemplate"', function () {
                    expect(barViewModel.options.wordExportUrl).toBe('export/wordExportFormTemplate');
                });

                it('should have pdfExportUrl as "export/pdfExportFormTemplate"', function () {
                    expect(barViewModel.options.pdfExportUrl).toBe('export/pdfExportFormTemplate');
                });
            });
        });

        describe('editor.TemplateList', function () {
            it('should be defined', function () {
                expect(editor.TemplateList).toBeDefined();
            });
        });

        describe('editor.templateListModule', function () {
            var templateListModule = editor.templateListModule;

            it('should be a new instance of editor.TemplateList', function () {
                expect(templateListModule instanceof editor.TemplateList).toBeTruthy();
            });

            it('should have url equal to value in northwind-helper', function () {
                expect(templateListModule.url).toBe(editor.helpers.templateList.url);
            });

            describe('barViewModel', function () {
                describe('dataSource', function () {
                    it('should have typeName as "FormTemplates"', function () {
                        expect(templateListModule.barViewModel.dataSource.typeName).toBe('FormTemplates');
                    });
                });
            });

            describe('breadcrumb', function () {
                it('should have text as "Form Templates"', function () {
                    expect(templateListModule.breadcrumb.data.text).toBe('Form Templates');
                });

                it('should have link as "#form-builder"', function () {
                    expect(templateListModule.breadcrumb.data.href).toBe('#form-builder');
                });
            });
        });

        describe('editor.helpers.editor', function () {
            var editorHelper = editor.helpers.editor;

            it('should have url as "form-template"', function () {
                expect(editorHelper.url).toBe('form-template');
            });

            xit('should have datasource typename as "Template"', function () {
                expect(editorHelper.dataSource.typeName).toBe('Template');
            });

            xdescribe('itemsViewModel', function () {
            });
        });

        describe('editor.EditorViewModel', function () {
            it('should be defined', function () {
                expect(editor.helpers.editor.ContentViewModel).toBeDefined();
            });

            var editorViewModel = new editor.helpers.editor.ContentViewModel();

            describe('form', function () {
                var formSections = editorViewModel.formSections;

                it('should be defined', function () {
                    expect(formSections).toBeDefined();
                });

                it('should be an empty array', function () {
                    expect(formSections()).toEqual([]);
                    expect(formSections().length).toBe(0);
                });

                it('should allow addition of new sections', function () {
                    formSections().push({
                        fieldType: ko.observable('input'), addonText: ko.observable('!'), label: ko.observable('Input Field'),
                        size: ko.observable('sm'), placeholder: ko.observable('Name'), order: ko.observable(0)
                    });

                    expect(formSections().length).toBe(1);

                    formSections().length = 0;
                });

                describe('section', function () {
                    beforeEach(function () {
                        //formSections().push({
                        //    label: 'Section 1',
                        //    children: ko.observableArray()
                        //});
                    });

                    it('should have push and pop as defined', function () {
                        expect(formSections().push).toBeDefined();
                        expect(formSections().pop).toBeDefined();
                    });

                    describe('formItem', function () {
                        beforeEach(function () {
                            formSections().push({
                                fieldType: ko.observable('input'), addonText: ko.observable('!'), label: ko.observable('Input Field'),
                                size: ko.observable('sm'), placeholder: ko.observable('Name'), order: ko.observable(0)
                            });

                            formSections().push({
                                fieldType: ko.observable('input'), addonText: ko.observable('!'), label: ko.observable('Input Field'),
                                size: ko.observable('sm'), placeholder: ko.observable('Name'), order: ko.observable(1)
                            });
                        });

                        afterEach(function () {
                            // Reset formSections
                            formSections().length = 0;
                        });

                        it('should be 2', function () {
                            expect(formSections().length).toBe(2);
                        });

                        it('should all be input', function () {
                            expect(formSections().filter(function (v) {
                                return v.fieldType() === 'input';
                            }).length).toBe(2);
                        });

                        it('changes should persist', function () {
                            formSections()[0].addonText('abc');
                            formSections()[1].addonText('cde');

                            expect(formSections()[0].addonText()).toEqual('abc');
                            expect(formSections()[1].addonText()).toEqual('cde');

                            formSections()[0].addonText('ghi');
                            formSections()[1].addonText('efg');

                            expect(formSections()[0].addonText()).toEqual('ghi');
                            expect(formSections()[1].addonText()).toEqual('efg');
                        });

                        it('should allow reordering', function () {
                            //formSections()[0].in
                        });
                    });
                });
            });
        });

        describe('editor.Editor', function () {
            var editorModule = editor.editorModule;

            it('should be defined', function () {
                expect(editorModule).toBeDefined();
            });
        });

        describe('editor.editorModule', function () {
            var editorModule = editor.editorModule;

            it('should be a new instance of editor.Editor', function () {
                expect(editorModule instanceof editor.Editor).toBeTruthy();
            });
            /** it('should have url equal to value in northwind-helper', () => {
            expect(editorModule.url).toBe(editor.helpers.editor.url);
            }); */
        });
        //describe('helpers.addFormEditingCustomExtenders', () => {
        //    //var viewModel = function () { this.placeholder= };
        //    var data;
        //    beforeEach(() => {
        //        editor.helpers.addFormEditingCustomKOBindings();
        //        data = ko.observable(1).extend({ minVal: 1 });
        //    });
        //    describe('minVal', () => {
        //        it('should have the initialized value', () => {
        //            expect(data()).toBe(1);
        //        });
        //        it('should have the set value', () => {
        //            data(2);
        //            expect(data()).toBe(2);
        //        });
        //        it('should allow a minimum value of 1', () => {
        //            data(0);
        //            expect(data()).toBe(1);
        //            data(3);
        //            expect(data()).toBe(3);
        //        });
        //    });
        //});
    });
});
