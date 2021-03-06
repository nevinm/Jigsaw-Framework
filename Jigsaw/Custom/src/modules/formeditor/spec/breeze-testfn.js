﻿/// <reference path="../../../definitions/breeze.d.ts" />
/// <reference path="../../../definitions/knockout.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", 'modules/data'], function(require, exports, _data) {
    /// <reference path="../../../definitions/knockout.d.ts" />
    exports.TAG = 'Tag';

    //1st step
    var dataService = new breeze.DataService({
        serviceName: "mockDataService",
        hasServerMetadata: false
    });
    exports.metadataStore = new breeze.MetadataStore({
        namingConvention: breeze.NamingConvention.camelCase
    });
    var queryOptions = new breeze.QueryOptions({
        fetchStrategy: breeze.FetchStrategy.FromLocalCache
    });

    // 2nd step
    exports.tagType = new breeze.EntityType({
        shortName: exports.TAG,
        namespace: "Sample.Entity",
        autoGeneratedKeyType: breeze.AutoGeneratedKeyType.Identity,
        defaultResourceName: exports.TAG
    });
    exports.tagType.addProperty(new breeze.DataProperty({
        name: "id",
        dataType: breeze.DataType.Int32,
        isNullable: false,
        isPartOfKey: true
    }));
    var nameProperty = new breeze.DataProperty({
        name: "name",
        dataType: breeze.DataType.String,
        isNullable: false,
        maxLength: 10,
        validators: [breeze.Validator.stringLength({ maxLength: 10, minLength: 0 })]
    });

    exports.tagType.addProperty(nameProperty);
    exports.metadataStore.addEntityType(exports.tagType);
    exports.metadataStore.registerEntityTypeCtor(exports.TAG, null);

    var MockEntityManager = (function (_super) {
        __extends(MockEntityManager, _super);
        function MockEntityManager() {
            _super.apply(this, arguments);
        }
        MockEntityManager.prototype.saveChanges = function (entities, saveOptions, callback, errorCallback) {
            var rows = entities || this.getChanges();
            _.each(rows, function (entity) {
                if (entity.entityAspect.validateEntity()) {
                    entity.entityAspect.setUnchanged();
                }
            });

            return Q({
                entities: rows,
                keyMappings: null,
                XHR: null
            });
        };
        return MockEntityManager;
    })(breeze.EntityManager);
    exports.MockEntityManager = MockEntityManager;

    function newEm(metadataStoreArgs) {
        return new MockEntityManager({
            dataService: dataService,
            metadataStore: exports.metadataStore,
            queryOptions: queryOptions
        });
    }
    exports.newEm = newEm;

    function createTag(id, name) {
        if (typeof id === "undefined") { id = 1; }
        if (typeof name === "undefined") { name = 'tag'; }
        var etType = exports.metadataStore.getEntityType(exports.TAG);
        var newTag = etType['createEntity']({ id: id, name: name });
        return newTag;
    }
    exports.createTag = createTag;

    function fillEm(em, count) {
        if (typeof count === "undefined") { count = 10; }
        for (var i = 0; i < count; i++) {
            em.createEntity(exports.TAG, { id: i, name: 'name' + i }, breeze.EntityState.Unchanged);
        }
    }
    exports.fillEm = fillEm;

    exports.EDITOR = 'FormTemplates';
    exports.FORM_ITEM = 'FormItem';

    exports.defaultCount = 10;

    exports.metadataStoreWithNoNamingConvention = new breeze.MetadataStore({
        namingConvention: breeze.NamingConvention.none
    });

    function newEntityManager(customDataService, metadataStoreArgs) {
        if (typeof customDataService === "undefined") { customDataService = dataService; }
        return new MockEntityManager({
            dataService: customDataService,
            metadataStore: exports.metadataStoreWithNoNamingConvention,
            queryOptions: queryOptions
        });
    }
    exports.newEntityManager = newEntityManager;

    function createEditor(id, formName) {
        if (typeof id === "undefined") { id = 1; }
        if (typeof formName === "undefined") { formName = 'form'; }
        var etType = exports.metadataStoreWithNoNamingConvention.getEntityType(exports.EDITOR);
        var newTag = etType['createEntity']({ Id: id, FormName: formName });
        return newTag;
    }
    exports.createEditor = createEditor;

    /*Could be used to replace form-spec.MockDataSource*/
    var MockCustomDataSource = (function (_super) {
        __extends(MockCustomDataSource, _super);
        function MockCustomDataSource(entityManager, querySource, cacheData) {
            if (typeof querySource === "undefined") { querySource = exports.TAG; }
            if (typeof cacheData === "undefined") { cacheData = false; }
            _super.call(this, {
                manager: entityManager,
                endPoint: breeze.EntityQuery.from(querySource),
                typeName: querySource,
                cacheData: cacheData
            });
        }
        return MockCustomDataSource;
    })(_data.Server.DataSource);
    exports.MockCustomDataSource = MockCustomDataSource;

    function fillEntityManager(em, count, entityType) {
        if (typeof count === "undefined") { count = exports.defaultCount; }
        if (typeof entityType === "undefined") { entityType = exports.EDITOR; }
        for (var i = 0; i < count; i++) {
            var editor = em.createEntity(entityType, { Id: (i + 1), FormName: 'formName' + i }, breeze.EntityState.Unchanged);
            editor['FormSections'](exports.fillWithFormItems(em, i, 5));
        }
    }
    exports.fillEntityManager = fillEntityManager;

    function fillWithFormItems(em, parentId, count) {
        if (typeof count === "undefined") { count = exports.defaultCount; }
        var formItems = [], currentTimestamp = Math.floor((new Date()).getTime() * Math.random()), insertedIds = [];
        formItems.push(em.createEntity(exports.FORM_ITEM, {
            id: (currentTimestamp + 1), fieldType: 'input', addonText: '@',
            label: 'Username', size: 'md', placeholder: 'Username', required: false, order: 0
        }, breeze.EntityState.Unchanged));
        formItems.push(em.createEntity(exports.FORM_ITEM, {
            id: (currentTimestamp + 2), fieldType: 'password', addonText: '@',
            label: 'Password', size: 'md', placeholder: 'Password', required: false, order: 1
        }, breeze.EntityState.Unchanged));
        formItems.push(em.createEntity(exports.FORM_ITEM, {
            id: (currentTimestamp + 3), fieldType: 'checkbox', addonText: '@',
            label: 'Stay Signed In', size: 'md', placeholder: '', required: false, order: 2
        }, breeze.EntityState.Unchanged));
        formItems.push(em.createEntity(exports.FORM_ITEM, {
            id: (currentTimestamp + 4), fieldType: 'button', addonText: '',
            label: 'Submit', size: 'md', placeholder: '', required: false, order: 3
        }, breeze.EntityState.Unchanged));
        return formItems;
    }
    exports.fillWithFormItems = fillWithFormItems;

    exports.editorType = new breeze.EntityType({
        shortName: exports.EDITOR,
        namespace: 'Form.Template',
        autoGeneratedKeyType: breeze.AutoGeneratedKeyType.Identity,
        defaultResourceName: exports.EDITOR
    });

    exports.editorType.addProperty(new breeze.DataProperty({
        name: "Id",
        dataType: breeze.DataType.Int32,
        isNullable: false,
        isPartOfKey: true
    }));
    exports.editorType.addProperty(new breeze.DataProperty({
        name: "FormName",
        dataType: breeze.DataType.String,
        isNullable: false,
        maxLength: 10,
        validators: [breeze.Validator.stringLength({ maxLength: 10, minLength: 0 })]
    }));
    exports.editorType.addProperty(new breeze.DataProperty({
        name: "FormTitle",
        dataType: breeze.DataType.String,
        isNullable: true,
        maxLength: 10,
        validators: [breeze.Validator.stringLength({ maxLength: 10, minLength: 0 })]
    }));
    exports.editorType.addProperty(new breeze.DataProperty({
        name: "FormDescription",
        dataType: breeze.DataType.String,
        isNullable: true,
        maxLength: 20,
        validators: [breeze.Validator.stringLength({ maxLength: 20, minLength: 0 })]
    }));
    exports.editorType.addProperty(new breeze.DataProperty({
        name: "Author",
        dataType: breeze.DataType.String,
        isNullable: false,
        maxLength: 10,
        validators: [breeze.Validator.stringLength({ maxLength: 10, minLength: 0 })]
    }));
    exports.editorType.addProperty(new breeze.DataProperty({
        name: "CreatedDate",
        dataType: breeze.DataType.DateTime,
        isNullable: false,
        maxLength: 60,
        validators: [breeze.Validator.date()]
    }));
    exports.editorType.addProperty(new breeze.DataProperty({
        name: "LastModified",
        dataType: breeze.DataType.DateTime,
        isNullable: false,
        maxLength: 60,
        validators: [breeze.Validator.date()]
    }));

    exports.formItemType = new breeze.EntityType({
        shortName: exports.FORM_ITEM,
        namespace: 'Form.Item',
        autoGeneratedKeyType: breeze.AutoGeneratedKeyType.Identity,
        defaultResourceName: exports.FORM_ITEM
    });

    exports.formItemType.addProperty(new breeze.DataProperty({
        name: "id",
        dataType: breeze.DataType.String,
        isNullable: false,
        isPartOfKey: true,
        maxLength: 10,
        validators: []
    }));
    exports.formItemType.addProperty(new breeze.DataProperty({
        name: "fieldType",
        dataType: breeze.DataType.String,
        isNullable: false,
        maxLength: 10,
        validators: []
    }));
    exports.formItemType.addProperty(new breeze.DataProperty({
        name: "addonText",
        dataType: breeze.DataType.String,
        isNullable: true,
        maxLength: 5,
        validators: []
    }));
    exports.formItemType.addProperty(new breeze.DataProperty({
        name: "placeholder",
        dataType: breeze.DataType.String,
        isNullable: true,
        maxLength: 15,
        validators: []
    }));
    exports.formItemType.addProperty(new breeze.DataProperty({
        name: "required",
        dataType: breeze.DataType.Boolean,
        isNullable: false,
        maxLength: 10,
        validators: []
    }));
    exports.formItemType.addProperty(new breeze.DataProperty({
        name: "label",
        dataType: breeze.DataType.String,
        isNullable: false,
        maxLength: 10,
        validators: []
    }));
    exports.formItemType.addProperty(new breeze.DataProperty({
        name: "size",
        dataType: breeze.DataType.String,
        isNullable: true,
        defaultValue: 'md',
        maxLength: 2,
        validators: []
    }));
    exports.formItemType.addProperty(new breeze.DataProperty({
        name: "order",
        dataType: breeze.DataType.Int16,
        isNullable: false,
        defaultValue: 1,
        maxLength: 2,
        validators: []
    }));
    exports.formItemType.addProperty(new breeze.DataProperty({
        name: "maxLength",
        dataType: breeze.DataType.Int16,
        isNullable: false,
        defaultValue: 10,
        maxLength: 2,
        validators: []
    }));
    exports.formItemType.addProperty(new breeze.DataProperty({
        name: "minLength",
        dataType: breeze.DataType.Int16,
        isNullable: false,
        defaultValue: 0,
        maxLength: 2,
        validators: []
    }));
    exports.formItemType.addProperty(new breeze.DataProperty({
        name: "defaultValue",
        dataType: breeze.DataType.String,
        isNullable: true,
        defaultValue: '',
        maxLength: 20,
        validators: []
    }));
    exports.formItemType.addProperty(new breeze.DataProperty({
        name: "instructionsText",
        dataType: breeze.DataType.String,
        isNullable: true,
        defaultValue: '',
        maxLength: 50,
        validators: []
    }));

    var editorConstructor = function () {
        this.FormSections = ko.observableArray([]);
    };

    var formItemConstructor = function () {
        this.possibleFieldTypes = ko.observableArray(["input", "password", "checkbox"]);
        this.possibleSizes = ko.observableArray(["md", "xs", "sm", "lg"]);
        this.requiredValues = ko.observableArray([true, false]);
    };

    exports.metadataStoreWithNoNamingConvention.addEntityType(exports.editorType);
    exports.metadataStoreWithNoNamingConvention.addEntityType(exports.formItemType);

    exports.metadataStoreWithNoNamingConvention.registerEntityTypeCtor(exports.EDITOR, editorConstructor);
    exports.metadataStoreWithNoNamingConvention.registerEntityTypeCtor(exports.FORM_ITEM, formItemConstructor);
});
