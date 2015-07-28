/// <reference path="lib/jasmine.d.ts" />

import mother = require('./mother');
import fn = require('./breeze-testfn');
import _app = require('../app');
import app = require('../app-desktop');
import _data = require('../modules/data');
import data = require('../modules/data-desktop');
import editor = require('../modules/form-editor');

import dataSpec = require('./data-spec');

var qwait = mother.Qwait;

export class MockDataSource extends _data.Server.DataSource {
    constructor(entityManager) {
        super({
            manager: entityManager,
            endPoint: breeze.EntityQuery.from(fn.TAG),
            typeName: fn.TAG,
            cacheData: false
        });
    }
}

describe('form-editor', () => {
    /*Get random numbers in range*/
    var randomNumber = (minNumber: number, maxNumber: number) => {
        return Math.floor(Math.random() * (maxNumber - minNumber) + minNumber);
    };

    describe('editor.helpers.templateList', () => {
        var entityManager = fn.newEntityManager(),
            dataSource = new fn.MockCustomDataSource(entityManager, fn.EDITOR),
            templateListHelper = editor.helpers.templateList,
            expectedColumns = ['FormName', 'FormTitle', 'FormDescription', 'Author', 'CreatedDate', 'LastModified'],
            expectedColumnsLength = expectedColumns.length,
            barViewModel = templateListHelper.barViewModel(app.viewLayoutModule.viewModel),
            dataItems = new _data.DataItemsViewModel(dataSource),
            viewPanel = new _data.DataEditViewModel(dataItems),
            defaultCount = fn.defaultCount,
            expectedColumnsCheckFunc = (v, i) => {
                it('should have column #' + (i + 1) + ' as ' + expectedColumns[i], () => {
                    expect(v).toBe(expectedColumns[i]);
                });
            };

        fn.fillEntityManager(entityManager, defaultCount);

        describe('async data fetch', () => {

            beforeEach(() => {
                mother.Qwait(dataSource.query());
            });
            /** Resets the data before the next test */
            afterEach(() => {
                dataSource.data.length = 0;
            });

            it('should have data greater than 0', () => {
                runs(() => {
                    expect(dataSource.data.length).toBeGreaterThan(0);
                });
            });

            expectedColumns.forEach((v) => {
                it('should have ' + v + ' defined', () => {
                    runs(() => {
                        expect(dataSource.data[randomNumber(0, dataSource.data.length)][v]).toBeDefined();
                    });
                });
            });

             describe('dataItems', () => {

                 it('should have same length data as dataSource', () => {
                     expect(dataItems.dataSource.data.length).toBe(dataSource.data.length);
                 });

                 it('should add new item to data', () => {
                     qwait(dataItems.addNew());

                     runs(() => {
                         expect(dataItems.dataSource.data.length).toBe(defaultCount + 1);
                     });
                 });

             });

             describe('viewPanel', () => {

                 it('should have same length data as dataItems', () => {
                     expect(viewPanel.dataSource.data.length).toBe(dataItems.dataSource.data.length);
                 });

                 it('should have same length data as dataSource', () => {
                     expect(viewPanel.dataSource.data.length).toBe(dataSource.data.length);
                 });

                 describe('adding new item', () => {

                     it('should update dataItems properly', () => {
                         qwait(dataItems.addNew());

                         runs(() => {
                             expect(viewPanel.dataSource.data.length).toBe(defaultCount + 2);
                             expect(viewPanel.item().entityAspect.entityState).toBe(breeze.EntityState.Added);
                         });
                     });

                 });

             });
            
        });

         it('should have "form-builder" as url', () => {
             expect(templateListHelper.url).toBe('form-builder');
         });

         it('should have jumpToSearchProperty as "Id"', () => {
             expect(templateListHelper.jumpToSearchProperty).toBe('Id');
         });

         describe('columns', () => {
             var columns = templateListHelper.columns;

             it('should have ' + expectedColumnsLength + ' items', () => {
                 expect(columns.length).toBe(expectedColumnsLength);
             });

             columns.forEach( expectedColumnsCheckFunc );
         });

         describe('itemsViewModel', () => {

             it('should be defined', () => {
                 expect(templateListHelper.itemsViewModel).toBeDefined()
             });

             it('should have "api/northwind/nextFormTemplate" as jumpToSearch', () => {
                 expect(templateListHelper.itemsViewModel.jumpToSearch.service).toBe('api/northwind/nextFormTemplate');
             });

             it('should have itemsViewModel.jumpToSearch.targetProperty to equal templateListHelper.jumpToSearchProperty', () => {
                 expect(templateListHelper.itemsViewModel.jumpToSearch.targetProperty).toBe(templateListHelper.jumpToSearchProperty);
             });

         });

         describe('dataView', () => {
            
             var columns = templateListHelper.dataView.options.columns;

             it('should be defined', () => {
                 expect(templateListHelper.dataView).toBeDefined()
             });

             xit('should have "Form Templates" as title', () => {
                 expect(templateListHelper.dataView.options.template).toBe('Form Templates');
             });

             it('should have "api/northwind/LoadCodeRuleFormTemplateSearchSettings" as advanced search settings url', () => {
                 expect(templateListHelper.dataView.options.advancedSearchSettingsUrl).toBe('api/northwind/LoadCodeRuleFormTemplateSearchSettings');
             });

             it('should have expect "api/northwind/ExcelExportFormTemplates" as the excel export path', () => {
                 expect(templateListHelper.dataView.options.viewModel.options.excelExportPath).toBe('api/northwind/ExcelExportFormTemplates');
             });

             it('should have atleast ' + expectedColumnsLength + ' columns', () => {
                 expect(columns.length).toBeGreaterThan(expectedColumnsLength);
             });

             columns.forEach(function (v, i) {

                 if (i !== (expectedColumnsLength)) {

                     expectedColumnsCheckFunc(v, i);

                 } else {

                     describe((expectedColumnsLength + 1) + 'th column', () => {

                         it('should be an object', () => {
                             expect(typeof v).toBe('object');
                         });

                         it('should have title as "Edit"', () => {
                             expect(v.title).toBeDefined();
                             expect(v.title).toBe('Edit');
                         });

                     });
                 }

             });
         });

         describe('barViewModel', () => {

             it('should be defined', () => {
                 expect(barViewModel).toBeDefined()
             });

             it('should have wordExportUrl as "export/wordExportFormTemplate"', () => {
                 expect(barViewModel.options.wordExportUrl).toBe('export/wordExportFormTemplate');
             });

             it('should have pdfExportUrl as "export/pdfExportFormTemplate"', () => {
                 expect(barViewModel.options.pdfExportUrl).toBe('export/pdfExportFormTemplate');
             });

         });

    });

     describe('editor.TemplateList', () => {

         it('should be defined', () => {
             expect(editor.TemplateList).toBeDefined();
         });

     });

     describe('editor.templateListModule', () => {

         var templateListModule = editor.templateListModule;
        
         it('should be a new instance of editor.TemplateList', () => {
             expect(templateListModule instanceof editor.TemplateList).toBeTruthy();
         });

         it('should have url equal to value in northwind-helper', () => {
             expect(templateListModule.url).toBe(editor.helpers.templateList.url);
         });

         describe('barViewModel', () => {

             describe('dataSource', () => {

                 it('should have typeName as "FormTemplates"', () => {
                     expect(templateListModule.barViewModel.dataSource.typeName).toBe('FormTemplates');
                 });

             });
            
         });

         describe('breadcrumb', () => {

             it('should have text as "Form Templates"', () => {
                 expect(templateListModule.breadcrumb.data.text).toBe('Form Templates');
             });

             it('should have link as "#form-builder"', () => {
                 expect(templateListModule.breadcrumb.data.href).toBe('#form-builder');
             });

         });

     });

     describe('editor.helpers.editor', () => {
         var editorHelper = editor.helpers.editor;

         it('should have url as "form-template"', () => {
             expect(editorHelper.url).toBe('form-template');
         });

         xit('should have datasource typename as "Template"', () => {
             expect(editorHelper.dataSource.typeName).toBe('Template');
         });

         xdescribe('itemsViewModel', () => {

         });

     });

     describe('editor.EditorViewModel', () => {

         it('should be defined', () => {
             expect(editor.helpers.editor.ContentViewModel).toBeDefined();
         });

         var editorViewModel = new editor.helpers.editor.ContentViewModel();

         describe('form', () => {

             var formSections = editorViewModel.formSections;

             it('should be defined', () => {
                 expect(formSections).toBeDefined();
             });

             it('should be an empty array', () => {
                 expect(formSections()).toEqual([]);
                 expect(formSections().length).toBe(0);
             });

             it('should allow addition of new sections', () => {
                 formSections().push({
                     fieldType: ko.observable('input'), addonText: ko.observable('!'), label: ko.observable('Input Field'),
                     size: ko.observable('sm'), placeholder: ko.observable('Name'), order: ko.observable(0)
                 });

                 expect(formSections().length).toBe(1);

                 formSections().length = 0;
             });

             describe('section', () => {

                 beforeEach(() => {

                     //formSections().push({
                     //    label: 'Section 1',
                     //    children: ko.observableArray()
                     //});

                 });

                 it('should have push and pop as defined', () => {
                     expect(formSections().push).toBeDefined();
                     expect(formSections().pop).toBeDefined();
                 });

                 describe('formItem', () => {

                     beforeEach(() => {

                         formSections().push({
                             fieldType: ko.observable('input'), addonText: ko.observable('!'), label: ko.observable('Input Field'),
                             size: ko.observable('sm'), placeholder: ko.observable('Name'), order: ko.observable(0)
                         });

                         formSections().push({
                             fieldType: ko.observable('input'), addonText: ko.observable('!'), label: ko.observable('Input Field'),
                             size: ko.observable('sm'), placeholder: ko.observable('Name'), order: ko.observable(1)
                         });

                     });

                     afterEach(() => {
                         // Reset formSections
                         formSections().length = 0;
                     });

                     it('should be 2', () => {
                         expect(formSections().length).toBe(2);
                     });

                     it('should all be input', () => {
                         expect(formSections().filter(v => {
                             return v.fieldType() === 'input';
                         }).length).toBe(2);
                     });

                     it('changes should persist', () => {
                         formSections()[0].addonText('abc');
                         formSections()[1].addonText('cde');

                         expect(formSections()[0].addonText()).toEqual('abc');
                         expect(formSections()[1].addonText()).toEqual('cde');

                         formSections()[0].addonText('ghi');
                         formSections()[1].addonText('efg');

                         expect(formSections()[0].addonText()).toEqual('ghi');
                         expect(formSections()[1].addonText()).toEqual('efg');
                     });

                     it('should allow reordering', () => {
                         //formSections()[0].in
                     });

                 });

             });

         });

     });

     describe('editor.Editor', () => {

         var editorModule = editor.editorModule;

         it('should be defined', () => {
             expect(editorModule).toBeDefined();
         });

     });

     describe('editor.editorModule', () => {

         var editorModule = editor.editorModule;

         it('should be a new instance of editor.Editor', () => {
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