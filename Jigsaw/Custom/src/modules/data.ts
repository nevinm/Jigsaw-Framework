/// <reference path="../definitions/_definitions.d.ts" />
/// <reference path="../definitions/webrule.d.ts" />
/// <reference path="../definitions/jquery.d.ts" />
/// <reference path="../definitions/jqueryui.d.ts" />
/// <reference path="../definitions/kendo.web.d.ts" />
/// <reference path="../definitions/Q.d.ts" />
/// <reference path="../definitions/underscore.d.ts" />
/// <reference path="../definitions/knockout.d.ts" />
/// <reference path="../definitions/knockout.validation.d.ts" />
/// <reference path="../definitions/knockout.mapping.d.ts" />
/// <reference path="../definitions/knockout.projections.d.ts" />
/// <reference path="../definitions/breeze.d.ts" />

// this file will contains all common classes needed to use the data modules

import _app = require('../app');
import $ui = require('jquery-ui');

import templates = require('templates/data');

// codeeffects imported files, real paths for this modules are configured in the entry_point
import codeeffects = require('../../codeeffects/codeeffects'); if (codeeffects) { }

export module Server  {

    export module EntitySetup {

        function addValidationRules(entity: breeze.Entity) {
            var entityType = entity.entityType;

            if (entityType) {
                for (var i = 0; i < entityType.dataProperties.length; i++) {
                    var property = entityType.dataProperties[i];
                    var propertyName = property.name;
                    var propertyObject = entity[propertyName];

                    var validators = [];
                    for (var u = 0; u < property.validators.length; u++) {
                        var validator = property.validators[u];
                        var nValidator = {
                            propertyName: propertyName,
                            validator: function (val, other) {
                                var error = this.innerValidator.validate(val, { displayName: this.propertyName });
                                this.message = error ? error.errorMessage : "";
                                return error === null;
                            },
                            message: "",
                            innerValidator: validator
                        }
                        validators.push(nValidator);
                    }

                    propertyObject.extend({
                        validation: validators
                    });
                }

                for (var i = 0; i < entityType.foreignKeyProperties.length; i++) {
                    var property = entityType.foreignKeyProperties[i];
                    var propertyName = property.name;
                    var propertyObject = entity[propertyName];

                    var validators = [];
                    for (var u = 0; u < property.validators.length; u++) {
                        var validator = property.validators[u];
                        var nValidator = {
                            propertyName: propertyName,
                            validator: function (val, other) {
                                var error = this.innerValidator.validate(val, { displayName: this.propertyName });
                                this.message = error ? error.errorMessage : "";
                                return error === null;
                            },
                            message: "",
                            innerValidator: validator
                        }
                        validators.push(nValidator);
                    }
                    propertyObject.extend({
                        validation: validators
                    });
                }
            }
        }

        /** all breeze entities need to be configured to work with Jigsaw. For example to make all observable
        properties validatable with the ko.validation plugin */
        export function init(entity: breeze.Entity) {
            addValidationRules(entity);
        }
    }

    export interface QueryLevel {
        (query: breeze.EntityQuery): breeze.EntityQuery;
    }

    /** equivalent to a query level, but is intended to be executed offline */
    export interface QueryLevelFilter {
        (entities: breeze.Entity[]): breeze.Entity[];
    }

    export interface DataSourceOptions {
        manager: breeze.EntityManager;
        endPoint: breeze.EntityQuery;
        typeName: string;

        cacheData?: boolean;
        pageSize?: number;
    }

    /** type returned by the Datasource.query method */
    export interface IDataSourceQueryResults {
        results: breeze.Entity[];
        inlineCount: number;
    }

    /** returns the number of entities with each state in the DataSource */
    export interface DataSourceSummary {
        modified: number;
        unchanged: number;
        added: number;
        deleted: number;
        detached: number;
    }

    /**  */
    export class DataSource implements _app.Jigsaw.Sync.ISynchronizable { 
        manager: breeze.EntityManager;
        endPoint: breeze.EntityQuery;
        typeName: string;

        data: breeze.Entity[] = [];
        inlineCount: number;
        currentQuery: breeze.EntityQuery;
        options: DataSourceOptions;
        private _queryLevels: QueryLevel[] = [];
        private _offlineFilters: QueryLevelFilter[] = [];

        page = ko.guarded<number>();

        private _refreshEvent = new _app.Common.Event();

        /** event occurs after a query has been performed */
        private _refreshedEvent = new _app.Common.Event();

        private _errorCallback = $.Callbacks();

        pending = ko.observableArray<_app.Jigsaw.Sync.IPendingChange>();

        constructor(options: DataSourceOptions) {
            this.options = _.defaults(options, {
                cacheData: true,
                pageSize: 10,
            });

            this.manager = options.manager;
            this.endPoint = options.endPoint;
            this.typeName = options.typeName;

            this.currentQuery = this.endPoint;
            if (this.typeName) {
                this.configureEntity();
            }

            if (this.options.cacheData) {
                if (!this.manager.metadataStore.hasMetadataFor(this.manager.serviceName)) {
                    var metadata: string = localStorage.getItem(this.offlineMetadataCacheKey());
                    // import the metadata before importing the entities, the metadata may be cached
                    // even if there're no entities yet, as it's determined per service address
                    this.manager.metadataStore.importMetadata(metadata);
                }

                // load previously cached data
                var cachedData: string = localStorage.getItem(this.offlineCacheKey());
                if (cachedData) {
                    this.manager.importEntities(cachedData);
                    this.updateNotificationsFromManager();
                }
            }
        }

        get entityType(): breeze.EntityType {
            return <any>this.manager.metadataStore.getEntityType(this.typeName);
        }

        refreshed(handler: () => void) {
            return this._refreshedEvent.add(handler);
        }

        /** Notifies interested parties that the datasource needs to be refreshed, most likely
        because some of the queries in the query layers had changed */
        refresh(handler?: ()=>void): _app.Common.IDisposable {
            if (handler) {
                return this._refreshEvent.add(handler);
            } else {
                this._refreshEvent.fire();
                return null;
            }
        }

        /** refreshes the DataShource and returns a promise that is resolved after the operation completes */
        update(mergeStrategy?: breeze.MergeStrategy) {
            var defer = Q.defer(),
                disposable = this.refreshed(refreshedHandler);

            this.refresh();
            
            return defer.promise;

            function refreshedHandler() {
                disposable.dispose();
                defer.resolve(true);
            }
        }

        /** Extends the given breeze entity so the ko observable properties
        have validation metadata */
        configureEntity() {
            var initializer = (entity: breeze.Entity) => {
                this.initializeEntity(entity);
            }
            
            this.manager.metadataStore.registerEntityTypeCtor(this.typeName, this.entityBuilder(), initializer);
        }

        /** returns a function that will be used as the type for the entities in the data source */
        entityBuilder() {
            return function builder() { }
        }

        /** this method is executed once for each new entity arriving to the manager, should initialize it */
        initializeEntity(entity: breeze.Entity) {
            EntitySetup.init(entity);
        }

        createEntity(props?) {
            var entity = this.manager.createEntity(this.typeName, props);
            // insert new element at the start of the array
            this.data.splice(0, 0, entity);
            return entity;
        }

        private offlineCacheKey() {
            return this.manager.serviceName + this.typeName;
        }

        /** cache key used to store the metadata */
        private offlineMetadataCacheKey() {
            return 'metadata: ' + this.manager.serviceName;
        }

        /** save the actual state of the manager in the application localStorage */
        cacheData() {
            if (this.options.cacheData) {
                // don't include the metadata in the exported string as it will be saved sepparatedly
                localStorage.setItem(this.offlineCacheKey(), this.manager.exportEntities(null, false));
            }
        }

        private projectedQuery(level?: QueryLevel) {
            var endPoint = this.endPoint;

            _.each(this._queryLevels, queryLevel => {
                endPoint = queryLevel(endPoint);
            });

            if (level) {
                endPoint = level(endPoint);
            }

            endPoint = endPoint
                .toType(this.typeName);

            return endPoint;
        }

        query(level?: QueryLevel) : Q.Promise<IDataSourceQueryResults> {
            
            var endPoint = this.projectedQuery(level);

            this.currentQuery = endPoint;

            return _app.ajax.connection.online()
                .then((online): any => {

                    if (online) {
                        return this.manager.executeQuery(endPoint)
                            .then(xhr => {
                                this.data = xhr.results;
                                this.inlineCount = xhr.inlineCount;

                                // store items on the cache after every query
                                this.cacheData();

                                return xhr;
                            })
                            .fail(e => {
                                if (_app.ajax.isOfflineError(e)) {
                                    _app.ajax.connection.disconnect();
                                    return this.queryLocal(endPoint);
                                } else {
                                    this.data = [];
                                    this.inlineCount = 0;

                                    // and notify interested partys of the error
                                    this._errorCallback.fire(e);

                                    return {
                                        results: [],
                                        inlineCount: 0
                                    };
                                }
                            })
                            .finally(() => {
                                this._refreshedEvent.fire();
                            });
                    } else {
                        return this.queryLocal(endPoint);
                    }
                });
        }

        /** performs the given query in the local cache */
        queryLocal(endPoint: breeze.EntityQuery): IDataSourceQueryResults {
            var takeCount = endPoint.takeCount,
                skipCount = endPoint.skipCount || 0,
                endPoint = endPoint.take(null).skip(null),
                offlineItems = this.manager.executeQueryLocally(endPoint);
            
            // apply offline filters
            _.each(this._offlineFilters, filter => offlineItems = filter(offlineItems));

            var inlineCount = offlineItems.length;

            if (takeCount) {
                offlineItems = offlineItems.slice(skipCount, skipCount + takeCount);
            }

            this.data = offlineItems;

            return {
                results: offlineItems,
                inlineCount: inlineCount // keep the same inlineCount??
            };
        }

        onError(callback: (e:any)=>void): _app.Common.IDisposable {
            this._errorCallback.add(callback);

            return {
                dispose: () => this._errorCallback.remove(callback)
            };
        }

        /** adds a new querylevel to the collection, it will be used to build the 
        query before is sent to the server */
        addQueryLevel(level: QueryLevel, offlineFilter?: QueryLevelFilter): _app.Common.IDisposable {
            this._queryLevels.push(level);
            if (offlineFilter) {
                this._offlineFilters.push(offlineFilter);
            }

            return {
                dispose: () => {
                    _app.Utils.remove(this._queryLevels, level);
                    if (offlineFilter) {
                        _app.Utils.remove(this._offlineFilters, offlineFilter);
                    }
                }
            };
        }

        saveChanges(entities?: breeze.Entity[]): Q.Promise<any> {
            return <any>_app.ajax.connection.online()
                .then(online => {
                    if (online) {
                        entities = entities || this.manager.getChanges();

                        return this.manager.saveChanges(entities)
                            .then(() => {
                                this.updateNotificationsFromManager();
                                this.cacheData();
                            })
                            .fail((error):any => {
                                // check if the request failed because the server is offline
                                // in which case just cache the data
                                if (_app.ajax.isOfflineError(error)) {
                                    _app.ajax.connection.disconnect();
                                    this.updateNotificationsFromManager();
                                    this.cacheData();
                                    return true; // ignore the error
                                } else {
                                    // assume this is a server validation error and try resaving the entities without errors
                                    if (error.entityErrors) {
                                        var entitiesWithErrors = _(error.entityErrors).map(serverError => serverError.entity),
                                            coolEntities = _.difference(entities, entitiesWithErrors);

                                        if (coolEntities.length) {
                                            // there're some entities that didn't returned any error from the server, try saving those
                                            return this.saveChanges(coolEntities)
                                                .fail(innerError => {
                                                    if (innerError.entityErrors) {
                                                        // if the cool entities also had some return both lists concatenated
                                                        innerError.entityErrors = _.union(error.entityErrors, innerError);
                                                    }
                                                    return Q.reject(innerError);
                                                })
                                                .then(() => Q.reject(error));
                                        }

                                    }

                                    // otherwise repeat the error
                                    return Q.reject(error);
                                }
                            });
                    } else {
                        // application is offline
                        this.updateNotificationsFromManager();
                        this.cacheData();
                    }
                });
        }

        rejectChanges() {
            this.manager.rejectChanges();
            this.pending.removeAll();
            this.cacheData();
        }

        /** syncronizes all changes with the server */
        sync(): Q.Promise<any> {
            return this.saveChanges()
                .then(() => {
                    // remove all pending notifications
                    this.pending.removeAll();
                    return true;
                })
                .finally(() => this.updateCaches())
                .fail(() => {
                    // catch all errors during sync and update the notifications
                    this.updateNotificationsFromManager();
                    return true;
                })
                .then(() => this.refresh());
        }

        private static balanceArray<T>(array: T[], maxItems: number): T[][] {
            var numberOfSets = Math.ceil(array.length / maxItems),
                count = array.length / numberOfSets,
                result: T[][] = [];

            for (var i = 0; i < numberOfSets; i++) {
                result.push(array.slice(i * count, i < numberOfSets - 1 ? (i+1)* count : array.length -1));
            }

            return result;
        }

        /** performs a query against the server returning all entities in the cache,
        these get merged with any updated values */
        private updateCaches() {
            var entities = this.manager.getEntities(this.typeName),
                entitiesBalanced = DataSource.balanceArray(entities, 10),
                queries = _.map(entitiesBalanced, q=> breeze.EntityQuery.fromEntities(q)),
                promises = _.map(queries, q=> this.manager.executeQuery(q));

            return Q.all(promises);
        }

        private updateNotificationsFromManager() {
            this.pending.removeAll();

            var entities = this.manager.getEntities(this.typeName),
                notifications = []; // store notifications
            _.each(entities, entity=> {
                if (entity.entityAspect.entityState.isAdded()) {
                    notifications.push({ title: 'entity added' });
                } else if (entity.entityAspect.entityState.isModified()) {
                    notifications.push({ title: 'entity modified' });
                } else if (entity.entityAspect.entityState.isDeleted()) {
                    notifications.push({ title: 'entity deleted' });
                }
            });

            // make a single update operation to improve performance
            this.pending.push.apply(this.pending, notifications);
        }

        status(): DataSourceSummary {
            var unchanged = 0,
                added = 0,
                deleted = 0,
                modified = 0,
                detached = 0,
                entities = this.manager.getEntities();

            _.each(entities, entity => {
                if (entity.entityAspect.entityState.isAdded()) {
                    added = added + 1;
                } else if (entity.entityAspect.entityState.isModified()) {
                    modified = modified + 1;
                } else if (entity.entityAspect.entityState.isDeleted()) {
                    deleted = deleted + 1;
                } else if (entity.entityAspect.entityState.isUnchanged()) {
                    unchanged = unchanged + 1;
                } else if (entity.entityAspect.entityState.isDetached()) {
                    detached = detached + 1;
                }
            });

            return {
                added: added,
                deleted: deleted,
                unchanged: unchanged,
                modified: modified,
                detached: detached
            };
        }

        /** fetchs the metadata for the current manager if no metadata has been fetched and
        caches it after, if the cacheData option is setted. */
        fetchMetadata() {
            if (!this.manager.metadataStore.hasMetadataFor(this.manager.serviceName)) {
                // check if the metadata has been cached by other module
                var cachedMetadata = localStorage.getItem(this.offlineMetadataCacheKey());
                if (cachedMetadata) {
                    this.manager.metadataStore.importMetadata(cachedMetadata);
                    return Q(true);
                } else {
                    return Metadata.ensureMetadataIsFetched(this.manager)
                        .then(() => {
                            // cache the metadata if the option is specified
                            if (this.options.cacheData) {
                                localStorage.setItem(this.offlineMetadataCacheKey(), this.manager.metadataStore.exportMetadata());
                            }

                            return true;
                        });
                }
            } else {
                return Q(true);
            }
        }

    }

    /** This function came from the breeze source code, there is named breeze.EntityQuery._toUri,
    this is needed to replicate an OData request to a different endpoint on the server.
    Query options like filter, order by or expand can only be mapped if the entityType is specified. */
    export function getQueryOptions(eq: breeze.EntityQuery, entityType?) {

        var queryOptions = {};

        var $skip = toSkipString();
        if ($skip) queryOptions['$skip'] = $skip;

        var $top = toTopString();
        if ($top) queryOptions['$top'] = $top;

        var $inlinecount = toInlineCountString();
        if ($inlinecount) queryOptions['$inlinecount'] = $inlinecount;

        if (entityType) {
            var $filter = toFilterString();
            if ($filter) queryOptions['$filter'] = $filter;

            var $orderby = toOrderByString();
            if ($orderby) queryOptions['$orderby'] = $orderby;

            var $expand = toExpandString();
            if ($expand) queryOptions['$expand'] = $expand;

            var $select = toSelectString();
            if ($select) queryOptions['$select'] = $select;
        }

        queryOptions = _.extend(queryOptions, eq.parameters);

        // remove undefined fields from the result object, they throw exceptions if
        // sent empty to the server
        return queryOptions;

        function toInlineCountString() {
            return eq['inlineCountEnabled'] ? "allpages" : "none";
        }

        function toSkipString() {
            var count = eq.skipCount;
            if (!count) return;
            return count.toString();
        }

        function toTopString() {
            var count = eq.takeCount;
            if (count === null) return;
            return count.toString();
        }


        function toFilterString() {
            var clause = eq.wherePredicate;
            if (!clause) return;
            clause.validate(entityType);
            return clause['toODataFragment'](entityType);
        }

        function toOrderByString() {
            var clause = eq['orderByClause'];
            if (!clause) return;
            return clause['toODataFragment'](entityType);
        }

        function toSelectString() {
            var clause = eq['selectClause'];
            if (!clause) return;
            clause.validate(entityType);
            return clause['toODataFragment'](entityType);
        }

        function toExpandString() {
            var clause = eq['expandClause'];
            if (!clause) return;
            return clause['toODataFragment'](entityType);
        }

    }

    /** fetches a breeze query directly from the server.
    Why not use another EntityManager?? Because an entityManager requires to fetch metadata
    for the entities that it will handle. For simpler cases, and Many types on the server with
    no client metadata this is a better option... like the Notifications use case. */
    export function fetchQuery(service: string, query: breeze.EntityQuery, entityType?) {
        var serviceName = service + '/' + query.resourceName,
            options = getQueryOptions(query, entityType);
        return _app.ajax.get(serviceName, options)
            .then(data => ({ results: data.Results, inlineCount: data.InlineCount }));
    }

    export interface DataSourceBaseOptions {
        serviceName: string;
        defaultSort: string;

        endPoint?: breeze.EntityQuery;
        pageSize?: number;
    }

    export class DataSourceBase {
        data = ko.observableArray<any>();
        inlineCount: number;

        private refreshEvent = new _app.Common.Event();

        /** event occurs after a query has been performed */
        private refreshedEvent = new _app.Common.Event();

        constructor(public options: DataSourceBaseOptions) {
            this.options = _.defaults(options, {
                endPoint: new breeze.EntityQuery()
            });
        }

        private _queryLevels: QueryLevel[] = [];

        replaceData(newData: any[]) {
            _app.Utils.replaceObservable(this.data, newData);
        }

        addQueryLevel(level: QueryLevel): _app.Common.IDisposable {
            this._queryLevels.push(level);

            return {
                dispose: () => {
                    _app.Utils.remove(this._queryLevels, level);
                }
            };
        }

        /** returns an EntityQuery resulting from applying all QueryLevels to the endPoint */
        processQueryLevels(level?: QueryLevel) {
            var endPoint = this.options.endPoint;

            _.each(this._queryLevels, queryLevel => {
                endPoint = queryLevel(endPoint);
            });

            if (level) {
                endPoint = level(endPoint);
            }

            return endPoint;
        }

        query(level?: QueryLevel): Q.Promise<any> {
            throw new Error('abstract: not implemented');
        }

        refreshed(handler?: () => void) {
            if (handler) {
                return this.refreshedEvent.add(handler);
            } else {
                this.refreshedEvent.fire();
                return null;
            }
        }

        /** Notifies interested parties that the datasource needs to be refreshed, most likely
        because some of the queries in the query layers had changed */
        refresh(handler?: () => void): _app.Common.IDisposable {
            if (handler) {
                return this.refreshEvent.add(handler);
            } else {
                this.refreshEvent.fire();
                return null;
            }
        }

        /** refreshes the DataShource and returns a promise that is resolved after the operation completes */
        update() {
            var defer = Q.defer(),
                disposable = this.refreshed(refreshedHandler);

            this.refresh();

            return defer.promise;

            function refreshedHandler() {
                disposable.dispose();
                defer.resolve(true);
            }
        }
    }

    export interface LigthDataSourceOptions extends DataSourceBaseOptions {
        namingConvention?: breeze.NamingConvention; // defaults to camel case convention, used by default in Jigsaw
    }

    /** Similar to a DataSource but works with plain JS objects, is intended to be used
    in simple modules that doesn't require big modifications to the items returned by the queries.
    And also work with services without metadata. 
    Although for complex notifications having Metadata is a good idea, but that might not exist.
    So until then the notifications will be handled as plain JS objects */
    export class LightDataSource extends DataSourceBase {
        options: LigthDataSourceOptions;

        constructor(options: LigthDataSourceOptions) {
            super(_.defaults(options, {
                namingConvention: breeze.NamingConvention.camelCase
            }));

        }

        query(level?: QueryLevel): Q.Promise<any> {
            var query = this.processQueryLevels(level),
                options = getQueryOptions(query);
            
            return _app.ajax.connection.online()
                .then(online => {
                    if (online) {
                        return <any>fetchQuery(this.options.serviceName, query);
                    } else {
                        return Q.reject('application offline');
                    }
                })
                .then(result => {
                    this.inlineCount = result.inlineCount;
                    this.replaceData(result.results);
                    return result;
                })
                .fail(e => {
                    this.inlineCount = 0;
                    this.replaceData([]);
                    return { results: [], inlineCount: 0 };
                })
                .finally(() => {
                    this.refreshed();
                });
        }
    }

    export function createManager(serviceName: string, metadata?: string) {
        var dataService = new breeze.DataService({ serviceName: serviceName }),
            manager = new breeze.EntityManager({ dataService: dataService });

        if (metadata) {
            var parsedMetadata = JSON.parse(metadata);
            // import the json metadata into the current metadataStore and add the corresponding
            // dataService so the manager knows it has metadata for this service
            manager.metadataStore.importMetadata(parsedMetadata);
            manager.metadataStore.addDataService(dataService);

            if (parsedMetadata['schema']) {
                // for some reason breeze doesn't import any custom metadata
                // when the query is fetched, that's why all custom metadata is 
                // extracted and injected into the metadataStore AGAIN
                // IMPORTANT!! this might NOT be necessary for future versions of breeze
                var customMetadata = Metadata.extractCustomMetadata(parsedMetadata);
                manager.metadataStore.importMetadata(<any>customMetadata, true);
            }
        }

        return manager;
    }

    export module Metadata {
        /** extracts any custom metadata received from the server. this metadata can be imported
        into a metadataStore by setting the allowMerge parameter to true */
        export function extractCustomMetadata(metadata) {
            return {
                structuralTypes: _(metadata.schema.entityType)
                    .filter(type => _.any<any>(type.property, p => !!p.custom))
                    .map(typeMetadata => {
                        var propertiesWithCustomMetadata = _(typeMetadata.property).filter(property => !!property.custom);
                        return {
                            shortName: typeMetadata.name,
                            namespace: metadata.schema.namespace,
                            dataProperties: _.map(propertiesWithCustomMetadata, propertyMetadata => {
                                return {
                                    name: propertyMetadata.name,
                                    description: propertyMetadata.description,
                                    custom: propertyMetadata.custom
                                };
                            })
                        };
                    })
            };
        }

        export function ensureMetadataIsFetched(manager: breeze.EntityManager): Q.Promise<boolean> {
            return manager.metadataStore.hasMetadataFor(manager.serviceName)
                ? Q(true)
                : <any>manager.fetchMetadata()
                    .then(metadata => {
                        if (!metadata.schema) return;
                        // for some reason breeze doesn't import any custom metadata
                        // when the query is fetched, that's why all custom metadata is 
                        // extracted and injected into the metadataStore
                        // IMPORTANT!! this might NOT be necessary for future versions of breeze
                        var customMetadata = extractCustomMetadata(metadata);
                        manager.metadataStore.importMetadata(<any>customMetadata, true);

                        return Q.delay(true, 0);
                    });
        }
    }

    /** describes a column information */
    export interface ColumnSpec {
        field: string;
        title: string;

        /** contains an identifier of the corresponding breeze property path */
        nameOnServer: string;
    }

    /** Contains general method, these are glue code between knockout and breeze. */
    export module Kendo {

        // helper to map kendo operators (from grid filter dropdown) to breeze operators
        function mapOperator(kendoOperator) {
            var kendoToBreeze = {
                'eq': 'eq',
                'neq': 'ne',
                'lt': 'lt',
                'lte': 'le',
                'gt': 'gt',
                'gte': 'ge',
                'startswith': 'startswith',
                'endswith': 'endswith',
                'contains': 'substringof'
            };
            return kendoToBreeze[kendoOperator];
        }

        export interface BreezeTransportOptions {
            dataSource: DataSource;
            defaultSort: string;
            columns?: string[];
        }

        export class BreezeTransport {
            keyPropertyNames: string[];
            dataSource: DataSource;

            /** can be used to block read operations making the transport, to resolve the previous
            retrieved results, this is used in conjunction with the BreezeDataSource.readLocal method */
            localQuery = false;

            columns: string[];
            propertyPaths = {};

            constructor(public options: BreezeTransportOptions) {
                this.keyPropertyNames = keyPropertyNames(options.dataSource.entityType);
                this.dataSource = options.dataSource;

                this.columns = options.columns || _.map(this.dataSource.entityType.dataProperties, property => property.name);
                // store property paths to retrieve the original paths when needed
                _.each(this.columns, property => {
                    var field = normalizePropertyPath(property);
                    this.propertyPaths[field] = property;
                });
            }

            mapEntityToJs(entity: breeze.Entity) {
                var result = {};
                _.each(this.keyPropertyNames, include);
                _.each(this.columns, include);

                return result;

                function include(property: string) {
                    var field = normalizePropertyPath(property);
                    result[field] = getPropertyValue(entity, property); 
                }
            }

            mapToJs(results: breeze.Entity[]) {
                return _.map(results, entity => this.mapEntityToJs(entity));
            }

            getEntityForModel(model: kendo.data.Model) {
                if (model) {
                    return Kendo.findItem(model, this.options.dataSource.data, this.keyPropertyNames);
                } else {
                    return null;
                }
            }

            read(options) {

                if (this.localQuery) {
                    var payload = {
                        data: this.mapToJs(this.options.dataSource.data),
                        total: this.options.dataSource.inlineCount
                    };

                    options.success(payload);
                    return true;
                }

                var modifyQuery = query => {
                    var orderVal = this.options.defaultSort,
                        sortOps = options.data.sort,
                        filterOps = options.data.filter;

                    // apply Sorting
                    if (sortOps && sortOps.length > 0) {
                        orderVal = ''; // reset orderBy
                        for (var i = 0; i < sortOps.length; i++) {
                            if (i > 0) {
                                orderVal += ",";
                            }
                            orderVal += this.propertyPaths[sortOps[i].field] + " " + sortOps[i].dir;
                        }
                    }
                    if (orderVal) {
                        query = query.orderBy(orderVal);
                    }

                    // apply filtering
                    if (filterOps && filterOps.filters.length > 0) {
                        for (var x = 0; x < filterOps.filters.length; x++) {
                            query = query.where(
                                this.propertyPaths[filterOps.filters[x].field],
                                mapOperator(filterOps.filters[x].operator),
                                filterOps.filters[x].value);
                        }
                    }

                    // apply Paging
                    if (options.data.skip) {
                        query = query.skip(options.data.skip);
                    }
                    if (options.data.take) {
                        query = query.take(options.data.take);
                    }

                    // apply Total Count
                    query = query.inlineCount(true);

                    return query;
                }

            this.options.dataSource.query(modifyQuery)
                    .then(xhr => {
                        var payload = {
                            data: this.mapToJs(xhr.results),
                            total: xhr.inlineCount
                        };

                        options.success(payload); // notify the DataSource that the operation is complete

                        return true;
                    })
                    .done();
            }

            create(options) {
                //console.log('breeze transport CREATE', options);
                var entity = this.options.dataSource.createEntity(options.data),
                    payload = { data: this.mapEntityToJs(entity) };
                options.success(payload);
            }

            update(options) {
                //console.log('breeze transport UPDATE', options);
                var originalElement = this.getEntityForModel(options.data);
                if (originalElement) {
                    for (var property in options.data) {
                        if (originalElement[property] && ko.isObservable(originalElement[property])
                            && options.data[property] != null
                            && options.data[property] != originalElement[property]()) {
                            // and set each property in the original object
                            originalElement[property](options.data[property]);
                        }
                    }
                }
                options.success(options);
            }

            destroy(options) {
                //console.log('breeze transport DESTROY', options);
                var originalElement = this.getEntityForModel(options.data);
                if (originalElement) {
                    originalElement.entityAspect.setDeleted();
                }
                options.success(options);
            }
        }

        export interface BreezeDataSourceOptions extends kendo.data.DataSourceOptions {
            dataSource: DataSource;
            defaultSort: string;
            columns?: string[];
        }

        /** serves as a gateway between Jigsaw's DataSource and KendoUI's DataSource */
        export class BreezeDataSource extends kendo.data.DataSource {
            keyPropertyNames: string[];
            transport: BreezeTransport;

            manager: breeze.EntityManager;

            constructor(options: BreezeDataSourceOptions) {

                var transportOptions: BreezeTransportOptions = {
                        dataSource: options.dataSource,
                        defaultSort: options.defaultSort,
                        columns: options.columns
                    },
                    transport = new BreezeTransport(transportOptions),
                    dataSourceOptions: BreezeDataSourceOptions = _.defaults(options, {
                        transport: transport,
                        pageSize: options.dataSource.options.pageSize,
                        serverPaging: true,
                        serverSorting: true,
                        serverFiltering: true,
                        serverGrouping: false,
                        schema: {
                            model: getModel(options.dataSource.entityType)
                        }
                    });

                dataSourceOptions.schema = _.defaults(options.schema || {}, {
                    data: "data",
                    total: "total",
                });

                super(dataSourceOptions);

                this.keyPropertyNames = Kendo.keyPropertyNames(options.dataSource.entityType);
                this.transport = transport;

                this.manager = options.dataSource.manager;
            }

            /** performs a read operation, but the transport will return the latest results 
            that where retrieved */
            readLocal() {
                this.transport.localQuery = true;
                this.read();
                this.transport.localQuery = false;
            }

            getModelForEntity(entity: breeze.Entity): kendo.data.Model {
                return <any>findItem(entity, <any>this.data(), this.keyPropertyNames);
            }

            getEntityForModel(model: kendo.data.Model): breeze.Entity {
                return this.transport.getEntityForModel(model);
            }
        }

        /** serves as a gateway between Jigsaw's LightDataSource and KendoUI's DataSource */
        export class BreezeLightDataSource extends kendo.data.DataSource {
            constructor(public dataSource: LightDataSource) {
                super({
                    pageSize: 10, // use a more generic page size
                    serverPaging: true,
                    serverSorting: true,
                    serverFiltering: true,
                    serverGrouping: false,
                    schema: {
                        data: "data",
                        total: "total"
                    },
                    transport: {
                        read: options => {
                            var level = (query: breeze.EntityQuery) => {
                                query = query.orderBy(dataSource.options.defaultSort);
                                if (options.data.skip) {
                                    query = query.skip(options.data.skip);
                                }
                                if (options.data.take) {
                                    query = query.take(options.data.take);
                                }
                                query = query.inlineCount(true);

                                return query;
                            };

                            dataSource.query(level)
                                .then(xhr => {
                                    var payload = {
                                        data: xhr.results,
                                        total: xhr.inlineCount
                                    };
                                    options.success(payload); // notify the DataSource that the operation is complete
                                    return true;
                                })
                                .done();
                        }
                    }
                });

            }
        }

        export function getLastPropertyName(propertyPath: string) {
            var index = propertyPath.lastIndexOf('.');
            if (index > 0) {
                return propertyPath.substring(index + 1);
            } else {
                return propertyPath;
            }
        }

        /** returns the value of a property, tracking a property path */
        export function getPropertyValue(entity, propertyPath: string) {
            if (!propertyPath) {
                throw new Error('the property path must be specified to be able to retrieve its value from an entity');
            }

            var property = propertyPath.split('.', 1)[0],
                remainingPath = propertyPath.substring(property.length + 1),
                value = ko.unwrap(entity[property]);

            if (!remainingPath) {
                return value;
            } else {
                return getPropertyValue(value, remainingPath);
            }
        }

        /** returns the type of a property, tracking a property path */
        export function getPropertyInfo(entityType: breeze.EntityType, propertyPath: string) {

        }

        export function typeString(type: breeze.DataTypeSymbol) {
            // `"string"`, `"number"`, `"boolean"`, `"date`"
            switch (type) {
                case breeze.DataType.Binary: return "string";
                case breeze.DataType.Boolean: return "boolean";
                case breeze.DataType.Byte: return "number";
                case breeze.DataType.DateTime: return "date";
                case breeze.DataType.Decimal: return "number";
                case breeze.DataType.Double: return "number";
                case breeze.DataType.Guid: return "string";
                case breeze.DataType.Int16: return "number";
                case breeze.DataType.Int32: return "number";
                case breeze.DataType.Int64: return "number";
                case breeze.DataType.Single: return "number";
                case breeze.DataType.String: return "string";

            }
        }

        function propertyHasValidatorWithName(property: breeze.DataProperty, validatorName: string) {
            return _.any(property.validators, validator => validator['name'] === validatorName);
        }

        /** builds a validation object from the set of validators for the given property */
        function getKendoValidatorOptionsForProperty(property: breeze.DataProperty) {
            var validation = {};

            _.each(property.validators, (validator, i) => {
                var validatorName = 'breezevalidator' + i;

                function validate(input) {
                    var value = input.val(),
                        error = validator.validate(value, { displayName: property.name });

                    if (error) {
                        $(input).attr('data-' + validatorName + '-msg', error.errorMessage);
                    }

                    return error === null;
                }

                validation[validatorName] = validate;
            });

            return validation;
        }

        /** returns a kendo Model from a breeze's IStructuralType */
        export function getModel(entityType: breeze.IStructuralType): any {
            var fields = {};

            _.each(entityType.dataProperties, property=> {
                var type = Kendo.typeString(property.dataType);
                if (type) {
                    fields[property.nameOnServer] = {
                        type: type,
                        validation: getKendoValidatorOptionsForProperty(property),
                        defaultValue: property.defaultValue
                    }
                }
            });

            return {
                id: keyPropertyNames(entityType)[0],
                fields: fields
            };
        }

        export function normalizePropertyPath(propertyPath: string) {
            return propertyPath.replace(/\./g, '');
        }

        export function refreshWhenSave(dataSource: kendo.data.DataSource, manager: breeze.EntityManager): _app.Common.IDisposable {

            var key = manager.hasChangesChanged.subscribe(managerHasChangesChanged),
                previousValue = false;

            return {
                dispose: () => { manager.hasChangesChanged.unsubscribe(key); }
            };

            function managerHasChangesChanged(e: breeze.HasChangesChangedEventArgs) {
                // when has changes goes from false -> true, means that a save operation has been performed
                // in which case the grid data must be refreshed
                if (previousValue && !e.hasChanges) {
                    // force a new read operation
                    dataSource.read();

                    //  if a new element is added then a request to the server must be made
                    // to determine if the added element belongs to the current page (being displayed
                    // on the grid. 

                }

                previousValue = e.hasChanges;
            }
        }

        interface ColumnTemplateSpec {
            width?: string;
            template?: string;
        }

        /** creates an array with the column specification from a breeze IStructuralType */
        export function getColumns(entityType: breeze.EntityType, columns: any[]): ColumnSpec[] {
            return _.map(columns, field => {
                // only retrieve the columns passed as strings, if a column spec is passed
                // just return it
                if (!_.isString(field)) return field;

                // check if the field includes the column template
                // that is passed as FieldName: template string
                var templateOptions: ColumnTemplateSpec = {},
                    kendoColumn: ColumnSpec,
                    index = field.indexOf(":");
                if (index >= 0) {
                    templateOptions = JSON.parse(field.substring(index+1));
                    field = field.substring(0, index);
                }

                var property = entityType.getProperty(field);
                if (property) {
                    var customMetadata = property['custom'],
                        displayName = customMetadata && customMetadata['displayName'],
                        columnField = normalizePropertyPath(field),
                        columnTitle = displayName || getLastPropertyName(field);

                    kendoColumn = <any>{ field: columnField, title: columnTitle };
                } else {
                    // The specified property may not be part of the metadata, as it might be a calculated
                    // property setted on the client side on the entity constructor
                    kendoColumn = <any>{
                        field: field, groupable: false, filterable: false, sortable: false
                    };
                }

                _.defaults(kendoColumn, {
                    nameOnServer: field,
                    template: templateOptions.template && _.template(templateOptions.template),
                }, templateOptions);

                return kendoColumn;
            });
        }

        /** returns a filtered list with the properties that are part of a key */
        export function keyProperties(entityType: breeze.IStructuralType) {
            return _(entityType.dataProperties).filter(property=> property.isPartOfKey);
        }

        /** returns the name of each one of the properties that are part of a key */
        export function keyPropertyNames(entityType: breeze.IStructuralType) {
            return _(keyProperties(entityType)).map(property=> property.nameOnServer);
        }

        /** given a raw version of aone of the items in the collection, this function returns
        the proper item in the collection. */
        export function findItem<T, U>(item: T, collection: U[], properties: string[]): U {
            return _(collection)
                .find(entity => _(properties).all(property =>
                    ko.unwrap(item[property]) === ko.unwrap(entity[property])));
        }

        export function bindPage(observable: GuardedObservable<any>, pager: KendoPager) {
            // only change the page if the current item can be unselected from the observable
            return pager.pageObservable.guard(() => observable.inject(null));
        }

        export class KendoPager extends kendo.ui.Pager {
            private _disposable: _app.Common.IDisposable;

            /** when a page is changed it will trigger requests to the server to fetch that 
            page's items. These requests are made through Kendo's UI DataSource, and is requested
            that a page changed event is cancelled without making any requests. 
            For those reasons is better to have direct control over the GuardedObservable instance
            that represents the page, and decide here in this control when to make the request. */
            constructor(element, public pageObservable: GuardedObservable<any>, options) {
                super(element, options);

                this._disposable =  pageObservable.prepare((page?) => {
                    var dataRefreshed = _app.Utils.waitForEvent(this.dataSource, 'change');
                    super.page(page);
                    return dataRefreshed;
                });
            }

            page(index?: string) {
                if (index != undefined) {
                    this.pageObservable(parseInt(index));
                } else {
                    return super.page(index);
                }
                
            }

            destroy() {
                super.destroy();

                this._disposable.dispose();
            }
        }

        interface BreezeKendoPagerBindingOptions {
            dataSource: DataSourceBase;
            defaultSort: string;

            /** defaults to 10 */
            pageSize?: number;
        }

        ko.bindingHandlers['breezeKendoPager'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var value: BreezeKendoPagerBindingOptions = valueAccessor();

                if (value.dataSource instanceof LightDataSource) {

                    var dataSource = new BreezeLightDataSource(<LightDataSource>value.dataSource),
                        pagerOptions: kendo.ui.PagerOptions = { dataSource: dataSource, buttonCount: 5 },
                        pager = new kendo.ui.Pager(element, pagerOptions),
                        disposable = value.dataSource.refresh(() => dataSource.read());

                    ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                        disposable.dispose();
                        pager.destroy();
                    });

                } else {
                    throw new Error('not supported for other datasources');
                }

                return { 'controlsDescendantBindings': true };

            }
        }

    }
}

export module Knockout {

    // configure KO validation plugin
    ko.validation.init({
        parseInputAttributes: true,
        errorsAsTitle: false,
        errorsAsTitleOnModified: false, // don't show labels with erors, they are handled with CSS labels
        decorateElement: true,
        insertMessages: false, //!!! don't insert messages because they will be inserted automatically with a custom string template
        writeInputAttributes: false, // this doesn't work because all rules are custom from breeze validators
    });

    function displayName(propertyInfo): string {
        return (propertyInfo.custom && propertyInfo.custom.displayName) || propertyInfo.name;
    }

    function description(propertyInfo): string {
        return (propertyInfo.custom && propertyInfo.custom.description) || propertyInfo.description;
    }

    function getDisplayName(entityType: breeze.EntityType, propertyName: string) {
        var propertyInfo: any = entityType.getProperty(propertyName);
        return propertyInfo ? displayName(propertyInfo) : propertyName;
    }

    ko.bindingHandlers['label'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var $element = $(element),
                value = ko.unwrap(valueAccessor()),
                propertyName: string = _.isString(valueAccessor()) ? value : $element.text(),
                entityType: breeze.EntityType = viewModel.entityType,
                propertyInfo = entityType.getProperty(propertyName),
                label = displayName(propertyInfo);

            $element.text(label);

            if (_.any(propertyInfo.validators, (validator: breeze.Validator) => validator.name === 'required')) {
                // for required fields add a star before the field so it get's marked
                $(templates.RequiredStar()).insertAfter(element);
            }
        }
    }

    interface FieldOptions {
        property: string;

        label?: string;
        description?: string;
        required?: boolean;
        focus?: number;
    }

    ko.bindingHandlers['field'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var $element = $(element),
                value: FieldOptions = valueAccessor(),
                propertyName: string = value.property,
                entityType: breeze.EntityType = viewModel.entityType,
                propertyInfo = entityType.getProperty(propertyName),
                isRequired = value.required || _.any(propertyInfo.validators, (validator: breeze.Validator) => validator.name === 'required'),
                readOnly = bindingContext[ErrorTrack.readOnlyTreeBindingInfo.contextKey] || false,
                readOnlyValue = (typeof readOnly === 'boolean') ? readOnly : readOnly(),
                template = (readOnlyValue) ? templates.FieldReadOnly : templates.Field;
            
            _app.Knockout.renderTemplateAsync(element, template({
                property: propertyName,
                label: value.label || displayName(propertyInfo),
                description: value.description || description(propertyInfo),
                required: isRequired,
                validatable: ko.validation.utils.isValidatable(bindingContext.$data[propertyName])
            }), bindingContext);

            return { controlsDescendantBindings: true };
        },
        preprocess: function (value, name) {
            if (value.indexOf('{') < 0) {
                // pass the property name as a string
                return "{ property: '" + value + "' }";
            } else {
                return value;
            }
        }
    }

    export module ColumnChooser {

        export var COLUMNCHOOSER = 'column-chooser';

        export class ColumnChooser implements _app.Common.IDisposable {
            visible: KnockoutObservable<boolean>;

            constructor(public name: string, public field: string, grid: kendo.ui.Grid) {
                var column = _.find<kendo.ui.GridColumn>(grid.columns, c => c.field === field),
                    isHidden = (typeof column.hidden === 'undefined') ? false : column.hidden;

                this.visible = ko.observable(!isHidden);

                this.visible.subscribe(x => {
                    if (x) {
                        grid.showColumn(field);
                    } else {
                        grid.hideColumn(field);
                    }
                });
            }

            dispose() {

            }
        }

        export class GridColumnChooserViewModel implements IDisposable {
            columns = ko.observableArray<ColumnChooser>();
            private _trash = new _app.Common.Trash();

            constructor(activeColumns: KnockoutObservableArray<string>, grid?) {
                var columns = this.columns
                    .filter((c: ColumnChooser) => c.visible())
                    .map(c=> c.field),
                    subscription = columns.subscribe(active => {
                        // replace the active columns in the observable
                        _app.Utils.replaceObservable(activeColumns, active);
                    });

                this._trash.recycle(subscription, <any>columns);

                grid && this.load(grid);
            }

            load(grid) {
                _app.Utils.replaceObservable(this.columns, _(grid.options.columns).map(x=> new ColumnChooser(x.title, x.field, grid)));
            }

            removeAll() {
                var items = this.columns.removeAll();
                _.forEach(items, item => item.dispose());
            }

            dispose() {
                this.removeAll();
                this._trash.dispose();
            }
        }

        interface GridColumnChooserOptions {
            gridObservable: KnockoutObservable<kendo.ui.Grid>;
            activeColumns: KnockoutObservableArray<string>;
        }

        /** finds the closest grid and renders a column chooser for it */
        ko.bindingHandlers['gridColumnChooser'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var options: GridColumnChooserOptions = valueAccessor(),
                    columnChooser = new GridColumnChooserViewModel(options.activeColumns);
                _app.Knockout.renderTemplateAsync(element, templates.ColumnChooser(), columnChooser);

                var subscription = options.gridObservable.subscribe(grid => {
                    if (grid) {
                        columnChooser.load(grid);
                    } else {
                        columnChooser.removeAll();
                    }
                });

                ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                    subscription.dispose();
                    columnChooser.dispose();
                });

                $(element).addClass('column-chooser');
                return { controlsDescendantBindings: true };
            }
        }
    }

    export module Kendo {

        /** Kendo Drag&Drop framework identifies the Dragable->Dropable relation by a string that
        is passed as the group option. The breezeKendo* bindings use this key as the default group 
        for dragables and dropables */
        var DRAGGROUP = 'data-grid-row';

        export interface KendoGridOptions {
            dataSource: Server.DataSource;
            defaultSort: string;
            /** specify the column names that should be used on the grid */
            columns: Server.ColumnSpec[];
            selected?: KnockoutObservable<any>;

            /** defaults to 10 */
            pageSize?: number;

            inlineEditable?: boolean; // false

            /** constains the template used to render the item when dragged */
            dragHint: string;
        }

        export interface BreezeGridBuilder extends _app.Common.IDisposable {
            widget: BreezeGrid;
        }

        export function makeKendoGrid(element, options: KendoGridOptions): BreezeGridBuilder {
            var entityType = options.dataSource.entityType,
                manager = options.dataSource.manager,
                dataSourceOptions: Server.Kendo.BreezeDataSourceOptions = {
                    dataSource: options.dataSource,
                    defaultSort: options.defaultSort,
                    columns: _.chain(options.columns).map(c => c.nameOnServer).filter(x=> !!x).value(),
                },
                dataSource = new Server.Kendo.BreezeDataSource(dataSourceOptions),
                gridOptions: kendo.ui.GridOptions = {
                    dataSource: dataSource,
                    editable: options.inlineEditable,
                    columns: options.columns
                },
                grid = new BreezeGrid(element, options.dataSource.page, gridOptions),
                refreshWhenSaveDisposable = Server.Kendo.refreshWhenSave(dataSource, manager),
                refreshDisposable = options.dataSource.refresh(() => grid.dataSource.read()) // refresh the grid when the datasource is marked as dirty
            ;

            if (options.selected) {
                var selectedDisposable = _app.Knockout.bind<breeze.Entity, any>({
                    from: options.selected,
                    to: grid.selectedItem,
                    forward: (item) => item ? grid.dataSource.getModelForEntity(item) : null,
                    backward: item => item ? grid.dataSource.getEntityForModel(item) : null
                }),
                    pageDisposable = Server.Kendo.bindPage(<any>options.selected, grid.pager),
                    filtersDisposable = bindFilters(<any>options.selected, grid);
            }

            if (options.dragHint) {
                // set up row drag, only the selected row is dragable - the reason for this is that
                // we need an observable with the 
                var draggable = _app.DragDrop.makeDraggable(grid.element[0], {
                    data: options.selected,
                    group: DRAGGROUP,
                    filter: "tbody > tr.k-state-selected > td:not(.k-edit-cell)",
                    wrap: true,
                    hint: options.dragHint
                });
            }

        return {
                widget: grid,
                dispose: () => {
                    _app.Common.bulkDispose(refreshDisposable, refreshDisposable,
                        selectedDisposable, pageDisposable, filtersDisposable);

                    // destroy the grid
                    grid.destroy();
                    draggable && draggable.draggable() && draggable.draggable("destroy");
                }
            }

    }

        interface BreezeKendoGridOptions {
            dataSource: Server.DataSource;
            defaultSort: string;

            /** defaults to 10 */
            pageSize?: number;
            selected?: KnockoutObservable<any>;

            /** specify the column names that should be used on the grid */
            columns: string[];

            inlineEditable?: boolean; // false

            /** constains the template used to render the item when dragged */
            dragHint: string;

            widget?: KnockoutObservable<kendo.ui.Grid>;
        }

        ko.bindingHandlers['breezeKendoGrid'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var $element = $(element),
                    options = <BreezeKendoGridOptions>valueAccessor(),
                    metadataPromise = Server.Metadata.ensureMetadataIsFetched(options.dataSource.manager);

                $element.addClass('busy');

                metadataPromise // the metadata can only be requested once for each service
                    .then(() => {

                        var builder = makeKendoGrid(element, {
                            dataSource: options.dataSource,
                            defaultSort: options.defaultSort,
                            columns: Server.Kendo.getColumns(options.dataSource.entityType, options.columns),
                            selected: options.selected,
                            pageSize: options.pageSize,
                            inlineEditable: options.inlineEditable,
                            dragHint: options.dragHint
                        });

                        if (options.widget) {
                            options.widget(builder.widget);
                        }

                        // perform cleaning operations when the node is disposed
                        ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                            options.widget && options.widget(null);
                            builder.dispose();
                            delete builder;
                        });

                        $element.removeClass('busy');
                    })
                    .done();

                return { controlsDescendantBindings: true };
            }
        };


        export class BreezeGrid extends kendo.ui.Grid {
            pager: Server.Kendo.KendoPager;
            dataSource: Server.Kendo.BreezeDataSource;
            deletedElements: kendo.data.Model[];

            selectedItem: KnockoutObservable<kendo.data.Model>;

            private _kendoReorderable: kendo.ui.Widget;
            private _trash: _app.Common.Trash;

            constructor(element, pageObservable: GuardedObservable<any>, opt?: kendo.ui.GridOptions) {
                var options = _.defaults(opt || {}, {
                    columnMenu: false, // show a menu on the columns
                    selectable: "row",
                    scrollable: true,
                    sortable: true,
                    filterable: true,
                    pageable: false, // *
                    navigatable: true,
                    resizable: true,
                    reorderable: true, // should be TRUE to reorder columns but throws an error when the grid is destroyed
                    groupable: false, // apparently breeze doesn't support grouping
                });

                if (options.editable) {
                    options.editable = { update: true, destroy: false };
                    // add columns with buttons at the end
                    options.columns = _.union(options.columns, [{
                        command: [
                            { name: "Delete", click: (e => this.deleteRowEvent(e)), className: 'grid-button-delete' },
                            { name: "Un-Delete", click: (e => this.unDeleteRowEvent(e)), className: 'grid-button-undelete' }
                        ], title: "&nbsp;", width: "100px"
                    }]);
                }

                super(element, options);

                this._trash = new _app.Common.Trash();

                // create pager after the grid
                var pagerOptions: kendo.ui.PagerOptions = { dataSource: options.dataSource, buttonCount: 5 },
                    pagerElement = $('<div>').insertAfter(element)[0];
                this.pager = new Server.Kendo.KendoPager(pagerElement, pageObservable, pagerOptions);

                this.deletedElements = [];

                this._kendoReorderable = this.wrapper.data('kendoReorderable');

                // set up selected item observable
                this.setupSelectedItem();

                this._trash.recycle(this.bindEvent('save', e => this.cellValueChanged(e.container, e.model)));

                // thanks to: http://blogs.planetsoftware.com.au/paul/archive/2013/04/10/extending-kendo-grid-functionality-with-knockout.aspx
                var columnStateKey = 'grid-columns: ' + this.dataSource.manager.dataService.serviceName;
                this._trash.recycle(this.attachColumnStateSaving(columnStateKey));
                this.loadColumnState(columnStateKey);

            }

            /** set ups the selectedItem observable so the grid selected item is synced with the observable value */
            private setupSelectedItem() {
                this.selectedItem = ko.observable<kendo.data.Model>();

                var ignoreSync = false,
                    disposable = this.selectedItem.subscribe((model) => {
                        if (ignoreSync) return;

                        var data = this.dataSource.data(),
                            index = data.indexOf(model),
                            element = this.tbody.children().eq(index);

                        ignoreSync = true;
                        this.select(element);
                        ignoreSync = false;
                    });

                this.bind('change', () => {
                    if (ignoreSync) return;

                    var gridSelected = this.select(),
                        rawItem = this.dataItem(gridSelected);

                    ignoreSync = true;
                    this.selectedItem(<any>rawItem);
                    ignoreSync = false;
                });

                this._trash.recycle(disposable);
            }

            /** returns the corresponding model for the given row selector */
            modelForElement(element) {
                var row = $(element).closest("tr");
                return <kendo.data.Model>this.dataItem(row);
            }

            /** */
            entityForElement(element) {
                var model = this.modelForElement(element);
                return this.dataSource.getEntityForModel(model);
            }

            private deleteRowEvent(e) {
                e.preventDefault();

                var row = $(e.currentTarget).closest("tr"),
                    model = <kendo.data.Model>this.dataItem(row);

                if (!_.contains(this.deletedElements, model)) {
                    this.deletedElements.push(model);
                    row.addClass('row-removed');
                }
                this.closeCell();
            }

            private unDeleteRowEvent(e) {
                e.preventDefault();

                var row = $(e.currentTarget).closest("tr"),
                    model = <kendo.data.Model>this.dataItem(row);

                if (_.contains(this.deletedElements, model)) {
                    _app.Utils.remove(this.deletedElements, model);
                    row.removeClass('row-removed');

                    // mark the entity as undeleted
                    var entity = this.dataSource.getEntityForModel(model);
                    if (entity) {
                        if (row.hasClass('row-added')) {
                            entity.entityAspect.entityState = breeze.EntityState.Added;
                        } else if (row.hasClass('row-dirty')) {
                            entity.entityAspect.setModified();
                        } else {
                            entity.entityAspect.setUnchanged();
                        }
                    }
                }
            }

            /** cancel editing on removed cells */
            editCell(cell: JQuery): void {
                if (!cell.closest('tr').hasClass('row-removed')) {
                    super.editCell(cell);
                }
            }

            private cellValueChanged(cell: JQuery, model: kendo.data.Model) {
                var row = cell.closest('tr');
                if (row && !model.isNew() && model.dirty) {
                    row.addClass('row-dirty');
                }
            }

            destroy() {
                this._trash.dispose();
                this.unbind('change').unbind('save');

                // for some reason when the grid binding is disposed all data associated to the element
                // is lost, resulting in an error when the grid is destroyed.
                this.options.reorderable = false;

                super.destroy();
                // destroy the reorderable object
                this._kendoReorderable.destroy();

                this.pager.destroy();
            }

            sync() {
                // syncronize all elements to be deleted, the deleted elements can always be sent
                // to the server. These elements are a special case and they can't be threated like
                // updated or created elements, because once an element is removed from the DataSource
                // then it get's removed from the grid, that's why the following is delayed until now
                _.each(this.deletedElements, model => {
                    this.dataSource.remove(model);
                });
                this.deletedElements = [];

                var result = Q.defer<boolean>();

                function sync() { result.resolve(true); }
                this.dataSource.one('sync', sync);
                this.dataSource.sync();

                return result.promise;
            }

            refresh() {
                super.refresh.apply(this, arguments);

                // this.deletedElements = [];
                // check the status of the entities in case some entity has been deleted
                var entities = this.dataSource.transport.dataSource.data,
                    selectedEntity = this.dataSource.getEntityForModel(this.selectedItem()),
                    property, col;
                _.each(entities, (entity, i) => {
                    var model = this.dataSource.getModelForEntity(entity),
                        j = this.dataSource.indexOf(model),
                        row = $(this.table).find('tr').eq(j);

                    if (entity.entityAspect.entityState.isDeleted() || (model && _.contains(this.deletedElements, model))) {
                        if (model && !_.contains(this.deletedElements, model)) {
                            this.deletedElements.push(model);
                        }

                        row.addClass('row-removed');

                    } else if (entity.entityAspect.entityState.isModified() || (model && model.dirty)) {
                        row.addClass('row-dirty');

                        for (property in entity.entityAspect.originalValues) {
                            // find the column corresponding to the field and add the k-dirty mark 
                            this.markDirtyCell(property, i);
                        }
                    } else if (entity.entityAspect.entityState.isAdded() || (model && model.isNew())) {
                        row.addClass('row-added');

                        _.each(entity.entityType.dataProperties, property => {
                            if (entity[property.name] && ko.unwrap(entity[property.name]) != property.defaultValue) {
                                this.markDirtyCell(property.name, i);
                            }
                        });
                    }

                    // check if the current model is the one selected and mark it on the grid
                    if (selectedEntity === entity) {
                        row.addClass('k-state-selected');
                    }

                    var models: kendo.data.Model[] = <any>this.dataSource.view();
                    _.each(models, (model, i) => {
                        if (model.isNew()) {
                            $(this.table).find('tr').eq(i).addClass('row-added');
                        }
                    });
                });
            }

            private markDirtyCell(property: string, rowIndex: number) {
                for (var j = 0; j < this.columns.length; j++) {
                    if (this.columns[j].field === property) {
                        $(this.table).find('tr').eq(rowIndex)
                            .find('td').eq(j).addClass('k-dirty-cell')
                            .prepend('<span class="k-dirty"/>');
                        break;
                    }
                }
            }

            private attachColumnStateSaving(columnStateKey: string): _app.Common.IDisposable {
                var colFunc = (key: string) => {
                    var columns = this.columns;
                    var columnState = [];
                    
                    for (var col = 0, length = columns.length; col < length; col++) {
                        var column = <any>this.columns[col];   // Get column
                        var commandName = (typeof column.command === 'undefined') ? null : column.command.name;
                        columnState.push({
                            field: column.field, hidden: column.hidden,
                            width: column.width, commandName: commandName
                        });
                    }

                    localStorage.setItem(key, JSON.stringify(columnState));
                };

                return _app.Common.mergeDisposables(
                    this.bindEvent("columnHide", (e) => colFunc(columnStateKey)),
                    this.bindEvent("columnShow", (e) => colFunc(columnStateKey)),
                    this.bindEvent("columnReorder", (e) => setTimeout(() => colFunc(columnStateKey), 100)),
                    this.bindEvent("columnResize", (e) => colFunc(columnStateKey))
                );
            }

            private loadColumnState(columnStateKey: string): void {
                var colState = JSON.parse(localStorage.getItem(columnStateKey));

                if (colState && colState.length > 0) {
                    var visibleIndex = -1;
                    for (var i = 0; i < colState.length; i++) {
                        var column = colState[i];

                        // 1. Set correct order first as visibility and width both depend on this.                                     
                        var existingIndex = -1;

                        if (typeof column.field !== 'undefined') {
                            existingIndex = this.findFieldIndex(column.field);
                        }
                        else if (typeof column.commandName !== 'undefined') {
                            existingIndex = this.findCommandIndex(column.commandName);
                        }
                        
                        if (existingIndex > -1 && existingIndex != i) // Different index
                        {   // Need to reorder
                            this.reorderColumn(i, this.columns[existingIndex]);
                        }

                        // 2. Set visibility state
                        var isHidden = (typeof column.hidden === 'undefined') ? false : column.hidden;

                        if (isHidden) {
                            this.hideColumn(i);
                        }
                        else {
                            this.showColumn(i);
                            ++visibleIndex;
                        }

                        // 3. Set width
                        var width = (typeof column.width === 'undefined') ? null : column.width;

                        if (width != null) {
                            this.columns[i].width = width; // This sets value, whilst rest redraws
                            this.thead.prev().find('col:eq(' + visibleIndex + ')').width(width);
                            this.table.find('>colgroup col:eq(' + visibleIndex + ')').width(width);
                        }
                    }
                }
            }

            private findFieldIndex(field: string): number {
                var existingIndex = -1;
                for (var idx = 0; idx < this.columns.length; ++idx) {
                    if (this.columns[idx].field == field) {
                        existingIndex = idx;
                        break;
                    }
                }
                return existingIndex;
            }

            private findCommandIndex(commandName: string): number {
                var existingIndex = -1;
                for (var idx = 0; idx < this.columns.length; ++idx) {
                    if (typeof this.columns[idx].command !== 'undefined'
                        && this.columns[idx].command['name'] == commandName) {
                        existingIndex = idx;
                        break;
                    }
                }
                return existingIndex;
            }

            bindEvent(event: string, handler: Function): _app.Common.IDisposable {
                this.bind(event, handler);

                return {
                    dispose: () => this.unbind(event, handler)
                }
            }
        }

        export function removeTemplatesFromColumns(columns: string[]): string[] {
            return _.map(columns, column => {
                var index = column.indexOf(':');
                return index >= 0 ? column.substring(0, index) : column;
            });
        }

        export function bindFilters(observable: GuardedObservable<any>, grid: kendo.ui.Grid): _app.Common.IDisposable {
            var columns = grid.options.columns,
                filterable = grid.options.filterable;

            if (filterable && !grid.options.columnMenu) {
                var filters = _.map($(grid['thead']).find("th:not(.k-hierarchy-cell,.k-group-cell)"), (element, index) => {
                    if (columns[index].filterable !== false && !columns[index].command && columns[index].field) {
                        var filterMenu = $(element).data("kendoFilterMenu");
                        if (filterMenu) {
                            filterMenu.destroy();
                        }

                        return new KendoFilter(element, {
                            dataSource: grid.dataSource,
                            values: columns[index].values
                        });
                    }
                });

                // to be able to set a filter the selected observable must should allow being changed
                var disposables = _.map(filters, filter => filter && filter.filterObservable.guard(() => observable.inject(null)));

                return {
                    dispose: () => {
                        _.each(disposables, disposable => {
                            if (disposable) {
                                disposable.dispose();
                            }
                        });

                        _.forEach(filters, filter => {
                            if (filter) {
                                filter.destroy();
                            }
                        });
                    }
                };
            }
        }

        export class KendoFilter extends kendo.ui.FilterMenu {
            private CLEARMARK = {};
            filterObservable: GuardedObservable<any>;

            constructor(element: Element, options) {
                super(element, options);

                this.filterObservable = ko.guarded();
                this.filterObservable.guarded.subscribe(expression => {
                    if (expression === this.CLEARMARK) {
                        super.clear();
                    } else {
                        super.filter(expression);
                    }
                });
            }

            filter(expression) {
                this.filterObservable(expression);
            }

            clear() {
                this.filterObservable(this.CLEARMARK);
            }

        }

    }

    export module Tracks {

        export interface ITrack {
            message: any;
            navigate(): void;
        }

        export interface ITrackCollection {
            register(message: any, navigate: () => void): _app.Common.IDisposable;
        }

        export class TrackCollection implements ITrackCollection {
            private _tracks = ko.observableArray<ITrack>();
            tracks: KnockoutObservableArray<ITrack>;

            constructor() {
                this.tracks = this._tracks.filter(track=> !!ko.unwrap(track.message));
            }

            register(message: any, navigate: () => void): _app.Common.IDisposable {
                var track = {
                    message: message,
                    navigate: navigate
                }

                this._tracks.push(track);

                return {
                    dispose: () => { this.remove(track); }
                }
            }

            /** adds a new track to the collection */
            add(track: ITrack) {
                this._tracks.push(track);
            }

            /** removes a track from the collection */
            remove(track: ITrack) {
                this._tracks.remove(track);
            }
        }

        /** all tracks registered on this collection are also added to a parent collection,
        the navigated handler is wrapped to be able to insert other handlers before and after
        the navigate is executed */
        export class TuneledTrackCollection extends TrackCollection {
            constructor(public errorCollection: TrackCollection,
            private beforeNavigate?: () => void, private afterNavigate?: () => void,
            public tunnel = ko.observable(true)) {
                super();
            }

            register(message: any, navigate: () => void): _app.Common.IDisposable {
                // wrap the navigate handler so when it's executed a before/after handlers
                // are also executed if they where specified
                var wrappedMessage = ko.computed(() => this.tunnel() ? ko.unwrap(message) : null),
                    wrapedNavigate = () => {
                        if (this.beforeNavigate) {
                            this.beforeNavigate();
                        }

                        navigate();

                        if (this.afterNavigate) {
                            this.afterNavigate();
                        }
                    },
                    disposable1 = super.register(message, navigate),
                    disposable2 = this.errorCollection.register(<any>wrappedMessage, wrapedNavigate);

                // The handler get's registered in both collections, so both IDisposables should be disposed
                return _app.Common.mergeDisposables(disposable1, disposable2, wrappedMessage);
            }
        }

        export interface TrackSummaryTemplateOptions {
            title: string;
            collapsed?: boolean;
        }

        /** the title is the string used on the summary header, it interpolate the number of errors
        using '{0}'. */
        export function renderTrackSummary(element: Element, trackCollection: TrackCollection, options: TrackSummaryTemplateOptions) {
            var $element = $(element);

            _app.Knockout.renderTemplateAsync(element, templates.TrackSummary(options), trackCollection);
            
            // trigger resize event on the target element every time the collection changes
            var disposable = trackCollection.tracks.subscribe(() => {
                // and give some time so the DOM is updated
                _app.Utils.async(() => _app.Common.triggerResize($element));
            });

            ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                disposable.dispose();
            });

            return { controlsDescendantBindings: true };
        }

    }

    /** this function is called when an item from the validation summary is clicked, usually set's 
    the focus to the target element */
    function navigateToElement(element: JQuery) {
        element.select();
        // $(element).focus();
    }

    /** Contains the binding handlers needed to manage the validation framework */
    export module ErrorTrack {

        export var JIGSAWERRORCOLLECTION = '$jigsawErrorCollection';

        /**  assigns an error collection to the context under
        the field '$jigsawErrorCollection', the binding is named 'markErrorCollection'.
        Note this binding control descendant bindings so it's recommended to be used alone
        without other bindings on it's target element. */
        ko.bindingHandlers['markErrorCollection'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var value: IMarkErrorCollectionBindingOptions = ko.unwrap(valueAccessor()),
                    collection = new Tracks.TrackCollection(),
                    options = {};

                options[JIGSAWERRORCOLLECTION] = collection;

                var context = bindingContext.extend(options);
                ko.applyBindingsToDescendants(context, element);

                if (value.hasAny) {
                    var disposable = collection.tracks.subscribe(tracks => {
                        value.hasAny(tracks.length > 0);
                    });

                    ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                        disposable.dispose();
                    });
                }

                return { controlsDescendantBindings: true };
            },
            preprocess: _app.Knockout.extend.emptyBindingPreprocess
        }

        interface IMarkErrorCollectionBindingOptions {
            /** sets this flag if there's any error in the collection */
            hasAny?: KnockoutObservable<boolean>;
        }


        /** the $jigsawReadOnlyTree context variable added by thi *s bingins will make all
        child {value, checked} bindings to be editable only if this is true */
        export var readOnlyTreeBindingInfo = _app.Knockout.createContextMarkBinding('ReadOnlyTree');

        /** attach an observable to the binding context that can control wether the {value} bindings
        will show validation errors, independently of any other reason like detecting if the input
        element has been clicked. */
        export var forceValidationErrorsBindingInfo = _app.Knockout.createContextMarkBinding('ForceValidationErrors');

        /** takes an observable and registers it's error on the ErrorCollection available on
        the bindingContext (if any),  */
        ko.bindingHandlers['errorField'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var $element = $(element),
                    observable = valueAccessor();

                if (observable.error) {
                    var elementUnfocused = ko.observable(false),
                        forceValidationErrorVisibility: () => boolean = bindingContext[forceValidationErrorsBindingInfo.contextKey],
                        displayError = ko.computed(() => forceValidationErrorVisibility
                            ? elementUnfocused() || forceValidationErrorVisibility()
                            : elementUnfocused()),
                        markValidationError = ko.computed(() => displayError() && !observable.isValid());

                    // if an ErrorCollection is available on the context, then register the error observable
                    if (bindingContext[JIGSAWERRORCOLLECTION]) {
                        var errorCollection: Tracks.TrackCollection = bindingContext[JIGSAWERRORCOLLECTION],
                            errorObservable = ko.computed(() => displayError() ? observable.error() : null),
                            disposable = errorCollection.register(errorObservable, () => navigateToElement($element));
                    }

                    function elementUnfocusedHandler() {
                        elementUnfocused(true);
                    }
                    $element.blur(elementUnfocused);

                    // apply a validation-error class to the element when the observable isn't valid
                    ko.applyBindingsToNode(element, {
                        css: {
                            'validation-error': markValidationError
                        }
                    }, viewModel);

                    ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                        _app.Common.bulkDispose(disposable, errorObservable, markValidationError, displayError);

                        $element.unbind('blur', elementUnfocusedHandler);
                    });
                }
            }
        }

        /** modify given binding so all validation errors get registered on the closer error collection */
        function makeBindingHandlerReportError(bindingName) {
            _app.Knockout.extend.bindingInit(bindingName, function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                ko.applyBindingsToNode(element, { errorField: valueAccessor() }, bindingContext);
            });
        }
        makeBindingHandlerReportError('value');
        makeBindingHandlerReportError('checked');

        /** rewrites the given node so if the tree is marked as readOnly the element will be 
        rewritten into a <span> element with the value as it's text */
        function makeBindingHandlerReadOnlyAware(handlerName) {
            _app.Knockout.extend.bindingInit(handlerName, function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var initialReadOnly = $(element).attr('readonly');

                // don't modify the element's readonly state if the element is already readonly
                if (!initialReadOnly && bindingContext[readOnlyTreeBindingInfo.contextKey]) {
                    var isReadOnly = bindingContext[readOnlyTreeBindingInfo.contextKey];

                    ko.applyBindingsToNode(element, {
                        attr: { readonly: isReadOnly }
                    }, viewModel);
                }
            });
        }
        makeBindingHandlerReadOnlyAware('value');
        makeBindingHandlerReadOnlyAware('checked');

        ko.bindingHandlers['validationSummary'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var errorCollection: Tracks.TrackCollection = bindingContext[JIGSAWERRORCOLLECTION];
                $(element).addClass('validation-summary');
                return Tracks.renderTrackSummary(element, errorCollection, { title: "{0} validation errors" });
            },
            preprocess: _app.Knockout.extend.emptyBindingPreprocess
        }

        /** Wrap the default Kendo TabStrip binding to add a new option to add an error collection
        which tunnels all errors to an existing parent error collection. 
        Creates a new error collection for each one of the tabs, and tunnels all errors to
        the parent collection, ensuring that when the parent collection wants to navigate to a 
        given error  */
        ko.bindingHandlers['tabstripErrorTunnel'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var errorCollection = bindingContext[JIGSAWERRORCOLLECTION]
                ;

                // make tabstrip binding async
                _app.Utils.async(() => {

                    ko.applyBindings(viewModel, $(element).find('.nav-tabs')[0]);

                    $(element).find('.tab-content > div').each((index, tab) => {
                        var collection = new Tracks.TuneledTrackCollection(errorCollection, () => $(element).find('.nav-tabs > li:eq(' + index + ') a').tab('show')),
                            options = {};
                        options[JIGSAWERRORCOLLECTION] = collection;
                        var tabContext = bindingContext.extend(options);

                        ko.applyBindingsToDescendants(tabContext, tab);
                    });

                });

                return { controlsDescendantBindings: true };
            }
        }

        /** takes any collection of items and adds each one of them as errors to the nearest error collection.
        This binding allows to have a collection of errors on the view-model (IErrorTrack) and show each one 
        of them in the context ErrorCollection; and by consecuence in the validation summary. */
        ko.bindingHandlers['feedParentErrorCollection'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                // ex: feedParentErrorCollection: collection
                var collection: KnockoutObservableArray<Tracks.ITrack> = valueAccessor(),
                    errorCollection: Tracks.TrackCollection = bindingContext[JIGSAWERRORCOLLECTION],
                    disposable = _app.Knockout.watchObservableArray(collection, item => errorCollection.add(item), item => errorCollection.remove(item));

                ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                    disposable.dispose();
                });
            }
        }
    }


    export module Comparison {

        export var JIGSAWDIFFCOLLECTION = '$jigsawDiffCollection';
        export var JIGSAWDIFFORIGINAL = '$jigsawDiffOriginal';

        /** this should be applied on the root element of the Viewbar, when the version and errors should be handled.
        This declares the following variables in the context:
            - a TrackCollection to store all validation errors
            - another TrackCollection to store all differences between the selected version and the original
            - the original field is referenced in the context */
        ko.bindingHandlers['markVersionPagerRoot'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var value: IMarkVersionPagerRootBindingOptions = ko.unwrap(valueAccessor()),
                    errorCollection = new Tracks.TrackCollection(),
                    diffCollection = new Tracks.TrackCollection(),
                    options = {};

                options[ErrorTrack.JIGSAWERRORCOLLECTION] = errorCollection;
                options[JIGSAWDIFFCOLLECTION] = diffCollection;
                options[JIGSAWDIFFORIGINAL] = value.current;

                var context = bindingContext.extend(options);
                ko.applyBindingsToDescendants(context, element);

                if (value.hasError) {
                    var disposable = errorCollection.tracks.subscribe(tracks => {
                        value.hasError(tracks.length > 0);
                    });

                    ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                        disposable.dispose();
                    });
                }

                return { controlsDescendantBindings: true };
            },
            preprocess: _app.Knockout.extend.emptyBindingPreprocess
        }

        interface IMarkVersionPagerRootBindingOptions {
            current: KnockoutObservable<any>;

            /** sets this flag if there's any error in the collection */
            hasError?: KnockoutObservable<boolean>;
        }

        export function focusElement(element: JQuery) {
            _app.Utils.shake(element);
        }

        ko.bindingHandlers['comparisonField'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var $element = $(element),
                    diffCollection: Tracks.TrackCollection = bindingContext[JIGSAWDIFFCOLLECTION],
                    originalViewModel = bindingContext[JIGSAWDIFFORIGINAL],
                    entityType: breeze.EntityType = viewModel.entityType;

                if (diffCollection && originalViewModel() !== bindingContext.$data) {
                    var options: ComparisonFieldBindingOptions<KnockoutObservable<any>> = ko.unwrap(valueAccessor()),
                        value = options.value,
                        original = ko.unwrap(options.original());

                    if (original !== value) {
                        var label = getDisplayName(entityType, options.field),
                            message = { field: label, original: original, value: value },
                            disposable = diffCollection.register(message, () => focusElement($element));

                        $(element).html(Resig.diffString(original, value()));

                        $element.addClass('difference-field');
                    }

                    ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                        disposable && disposable.dispose();
                    });
                }
            },
            preprocess: function (value, name) {
                // transforms comparisonField: foo -> comparisonField: { value: foo, original: function(){return $jigsawDiffOriginal().foo }, field: 'foo'}
                // the same property needs to be evaluated for the current $data and for the original object
                var func = "function(){ var original = " + JIGSAWDIFFORIGINAL + "(); return !original?null:original." + value + ";}";

                // marked on the bindingContext under the key $jigsawDiffOriginal
                return "{value:" + value + ", original: " + func + ", field:'" + value +  "'}"; 
            }
        }

        /** extended foreach binding to show differences with the original collection  */
        ko.bindingHandlers['dforeach'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var $element = $(element),
                    diffCollection: Tracks.TrackCollection = bindingContext[JIGSAWDIFFCOLLECTION],
                    originalViewModel = bindingContext[JIGSAWDIFFORIGINAL],
                    options: ComparisonFieldBindingOptions<KnockoutObservableArray<any>> = valueAccessor(),
                    value = options.value,
                    entityType: breeze.EntityType = viewModel.entityType;

                if (diffCollection && originalViewModel() !== bindingContext.$data) {
                    var original = options.original();

                    if (original) {
                        var allItems = _.union(value(), original()),
                            originalLength = original().length,
                            differences = {
                                added: 0,
                                modified: 0,
                                unchanged: 0,
                                missing: 0
                            };

                        function afterRender(domElements: Element[], data) {
                            if (_.contains(original(), data)) {
                                if (!_.contains(value(), data)) {
                                    $(domElements).addClass('diff-item diff-item-missing');
                                    differences.missing = differences.missing + 1;
                                } else {
                                    differences.unchanged = differences.unchanged + 1;
                                }
                            } else {
                                $(domElements).addClass('diff-item diff-item-added');
                                differences.added = differences.added + 1;
                            }
                        }

                        // delegate to the foreach binding, unwrap the value of the original array as we know it's readonly
                        // for the version pager. The afterRender method will be executed one time per node/data, so it can also
                        // be used to count the differences between the arrays, saving some time
                        ko.applyBindingsToNode(element, { foreach: { data: allItems, afterRender: afterRender } }, bindingContext);

                        //differences.missing = originalLength - differences.unchanged - differences.modified;

                        if (differences.added || differences.modified || differences.missing) {
                            var field = getDisplayName(entityType, options.field),
                                message = {
                                    field: field,
                                    original: original().length + ' [' + field.toUpperCase() + ']',
                                    value: differences.added + ' added, ' + differences.modified + ' modified, ' + differences.missing + ' missing'
                                },
                                disposable = diffCollection.register(message, () => focusElement($element));
                        }

                        ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                            disposable && disposable.dispose();
                        });
                    }

                } else {
                    // fall back to original foreach binding
                    ko.applyBindingsToNode(element, { foreach: { data: value } }, bindingContext);
                }

                return { controlsDescendantBindings: true };
            },
            preprocess: ko.bindingHandlers['comparisonField'].preprocess
        }

        ko.bindingHandlers['dvalue'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var diffCollection: Tracks.TrackCollection = bindingContext[JIGSAWDIFFCOLLECTION],
                    originalViewModel = bindingContext[JIGSAWDIFFORIGINAL],
                    options: ComparisonFieldBindingOptions<KnockoutObservable<any>> = valueAccessor(),
                    value = options.value,
                    entityType: breeze.EntityType = viewModel.entityType;

                if (diffCollection && originalViewModel() !== bindingContext.$data) {
                    // display the field as a readonly element
                    var span = $('<span>').insertBefore(element)[0];
                    $(element).remove(); // remove the original element
                    ko.applyBindingsToNode(span, {
                        comparisonField: options
                    }, bindingContext);
                } else {
                    // fall back to original value binding
                    ko.applyBindingsToNode(element, {
                        value: value
                    }, bindingContext);
                }

                return { controlsDescendantBindings: true };
            },
            preprocess: ko.bindingHandlers['comparisonField'].preprocess
        }

        /** intended to mark group of fields with differences, will create a new level on the DiffCollection
        and apply the class 'has-diff' to the target element if there's any error in the group of fields */
        ko.bindingHandlers['hasDiff'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var diffCollection = bindingContext[JIGSAWDIFFCOLLECTION];

                var tunelDiffCollection = new Tracks.TuneledTrackCollection(diffCollection, () => { }),
                    options = {};
                options[JIGSAWDIFFCOLLECTION] = tunelDiffCollection;
                var context = bindingContext.extend(options);

                ko.applyBindingsToDescendants(context, element);
                var hasDiff = ko.computed(() => tunelDiffCollection.tracks().length > 0);
                ko.applyBindingsToNode(element, { css: { 'has-diff': hasDiff } }, bindingContext);

                ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                    hasDiff.dispose();
                });

                return { controlsDescendantBindings: true };
            },
            preprocess: _app.Knockout.extend.emptyBindingPreprocess
        }
        
        interface ComparisonFieldBindingOptions<T> {
            original: () => T;
            value: T;
            field: string;
        }

        ko.bindingHandlers['diffSummary'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var errorCollection: Tracks.TrackCollection = bindingContext[JIGSAWDIFFCOLLECTION],
                    $element = $(element).addClass('diff-summary'),
                    context = bindingContext.createChildContext(errorCollection);

                _app.Knockout.renderTemplateAsync(element, templates.comparison.DiffSummary(), context);

                // trigger resize event on the target element every time the collection changes
                var disposable = errorCollection.tracks.subscribe(() => {
                    // and give some time so the DOM is updated
                    _app.Utils.async(() => _app.Common.triggerResize($element));
                });

                ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                    disposable.dispose();
                });

                return { controlsDescendantBindings: true };
            },
            preprocess: _app.Knockout.extend.emptyBindingPreprocess
        }

        function makeBindingCompareField(bindingName: string) {
            _app.Knockout.extend.bindingPreprocess(bindingName, function (value, _, addBindingCallback) {
                addBindingCallback('comparisonField', value);
            });
        }
        makeBindingCompareField('value');

        ko.bindingHandlers['tabstrip'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var errorCollection = bindingContext[ErrorTrack.JIGSAWERRORCOLLECTION],
                    diffCollection = bindingContext[JIGSAWDIFFCOLLECTION]
                ;

                // make tabstrip binding async
                _app.Utils.async(() => {
                    ko.applyBindings(viewModel, $(element).find('.nav-tabs')[0]);
     
                    var $element = $(element),
                        tabHeaders = $element.find('.nav-tabs').children('li');

                    $element.find('.tab-content > div').each((index, tab) => {
                        var tunelErrorCollection = new Tracks.TuneledTrackCollection(errorCollection, () => $(element).find('.nav-tabs > li:eq(' + index + ') a').tab('show')),
                            tunelDiffCollection = new Tracks.TuneledTrackCollection(diffCollection, () => $(element).find('.nav-tabs > li:eq(' + index + ') a').tab('show')),
                            options = {};
                        options[ErrorTrack.JIGSAWERRORCOLLECTION] = tunelErrorCollection;
                        options[JIGSAWDIFFCOLLECTION] = tunelDiffCollection;
                        var tabContext = bindingContext.extend(options);

                        ko.applyBindingsToDescendants(tabContext, tab);

                        // apply difference binding to tab headers
                        var tabHeader = tabHeaders.get(index);
                        var hasErrors = ko.computed(() => tunelErrorCollection.tracks().length > 0),
                            hasDiff = ko.computed(() => tunelDiffCollection.tracks().length > 0);
                        ko.applyBindingsToNode(tabHeader, { css: { 'has-errors': hasErrors, 'has-diff': hasDiff } }, bindingContext); 

                        ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                            hasDiff.dispose();
                            hasErrors.dispose();
                        });
                    });

                });

                return { controlsDescendantBindings: true };
            },
            preprocess: _app.Knockout.extend.emptyBindingPreprocess
        }

        /** taken from http://ejohn.org/projects/javascript-diff-algorithm/ */
        module Resig {

            export function diffString(oldString: string, newString: any) {
                oldString = oldString.replace(/\s+$/, '');
                newString = newString.replace(/\s+$/, '');

                var out = diff(oldString == "" ? [] : oldString.split(/\s+/), newString == "" ? [] : newString.split(/\s+/));
                var str = "";

                var oSpace = oldString.match(/\s+/g);
                if (oSpace == null) {
                    oSpace = ["\n"];
                } else {
                    oSpace.push("\n");
                }

                var nSpace = newString.match(/\s+/g);
                if (nSpace == null) {
                    nSpace = ["\n"];
                } else {
                    nSpace.push("\n");
                }

                if (out.n.length == 0) {
                    for (var i = 0; i < out.o.length; i++) {
                        str += '<del>' + _.escape(out.o[i]) + oSpace[i] + "</del>";
                    }
                } else {
                    if (out.n[0].text == null) {
                        for (newString = 0; newString < out.o.length && out.o[newString].text == null; newString++) {
                            str += '<del>' + _.escape(out.o[newString]) + oSpace[newString] + "</del>";
                        }
                    }

                    for (var i = 0; i < out.n.length; i++) {
                        if (out.n[i].text == null) {
                            str += '<ins>' + _.escape(out.n[i]) + nSpace[i] + "</ins>";
                        } else {
                            var pre = "";

                            for (newString = out.n[i].row + 1; newString < out.o.length && out.o[newString].text == null; newString++) {
                                pre += '<del>' + _.escape(out.o[newString]) + oSpace[newString] + "</del>";
                            }
                            str += " " + out.n[i].text + nSpace[i] + pre;
                        }
                    }
                }

                return str;
            }

            function diff(o, n) {
                var ns = new Object();
                var os = new Object();

                for (var i = 0; i < n.length; i++) {
                    if (ns[n[i]] == null)
                        ns[n[i]] = { rows: new Array(), o: null };
                    ns[n[i]].rows.push(i);
                }

                for (var i = 0; i < o.length; i++) {
                    if (os[o[i]] == null)
                        os[o[i]] = { rows: new Array(), n: null };
                    os[o[i]].rows.push(i);
                }

                for (var i in ns) {
                    if (ns[i].rows.length == 1 && typeof (os[i]) != "undefined" && os[i].rows.length == 1) {
                        n[ns[i].rows[0]] = { text: n[ns[i].rows[0]], row: os[i].rows[0] };
                        o[os[i].rows[0]] = { text: o[os[i].rows[0]], row: ns[i].rows[0] };
                    }
                }

                for (var i = 0; i < n.length - 1; i++) {
                    if (n[i].text != null && n[i + 1].text == null && n[i].row + 1 < o.length && o[n[i].row + 1].text == null &&
                        n[i + 1] == o[n[i].row + 1]) {
                        n[i + 1] = { text: n[i + 1], row: n[i].row + 1 };
                        o[n[i].row + 1] = { text: o[n[i].row + 1], row: i + 1 };
                    }
                }

                for (var i = n.length - 1; i > 0; i--) {
                    if (n[i].text != null && n[i - 1].text == null && n[i].row > 0 && o[n[i].row - 1].text == null &&
                        n[i - 1] == o[n[i].row - 1]) {
                        n[i - 1] = { text: n[i - 1], row: n[i].row - 1 };
                        o[n[i].row - 1] = { text: o[n[i].row - 1], row: i - 1 };
                    }
                }

                return { o: o, n: n };
            }
        }
    }

    /** grant focus to the target element when the binding is initialized */
    ko.bindingHandlers['focus'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var isReadonly = bindingContext[ErrorTrack.readOnlyTreeBindingInfo.contextKey],
                time = valueAccessor();

            // only trigger the focus on the element if the tree isn't marked as read-only
            setTimeout(() => {
                if (!ko.unwrap(isReadonly)) {
                    $(element).focus();
                }
            }, time);
        }
    }
}

export module Searches {

    /** data returned by a JumpTO endpoint must be of this type */
    export interface JumpToSearchArgs {
        Index: number;
        HasPrevious: boolean;
        HasNext: boolean;
    }

    export class JumpToSearch {

        constructor(public service: string, public targetProperty: string, private viewModel:DataItemsViewModel) {

        }

        searchTerm = ko.observable('');

        jump(value?: string, selectedIndex?: number, forward = true, showMultipleResultsMessage=true): Q.Promise<JumpToSearchArgs> {
            var dataSource = this.viewModel.dataSource,
                query = dataSource.currentQuery.skip(null).take(null), // remove pagination from query
                searchTerm = value || this.searchTerm(),
                options = {
                    '[0].Key': this.targetProperty,
                    '[0].Value': searchTerm,
                    selectedIndex: selectedIndex || dataSource.currentQuery.skipCount + _.indexOf(dataSource.data, this.viewModel.selectedItem()),
                    forward: forward
                },
                result: JumpToSearchArgs = null; // temp variable to be returned by promise
            // OData query parameters
            _.extend(options, Server.getQueryOptions(query, dataSource.entityType));

            return _app.ajax.connection.online()
                .then(online => {
                    if (online) {
                        return <any>_app.ajax.get(this.service, options)
                            .fail(() => <any>this.jumpOffline(searchTerm));
                    } else {
                        return <any>this.jumpOffline(searchTerm);
                    }
                })
                .then((args: JumpToSearchArgs) => {
                    result = args;
                    var nextIndex = args.Index;

                    if (nextIndex >= 0) {
                        var pageSize = dataSource.currentQuery.takeCount,
                            page = Math.floor(nextIndex / pageSize) + 1,
                            itemIndexInPage = nextIndex - ((page - 1) * pageSize);

                        // check if it's a new page
                        if (this.viewModel.dataSource.page() != page) {
                            return <any>this.viewModel.dataSource.page.inject(page) // pages are numerated from 1 to ...
                                .then(() => itemIndexInPage);
                        } else {
                            // it's the same page
                            return itemIndexInPage;
                        }
                    } else {
                        // when no results are found for the given search term the server returns -1
                        // in this case the jump promise fails and a message is shown
                        this.viewModel.messageQueue.clear().add({
                            title: "Search",
                            body: "No results found for " + this.targetProperty + "'" + searchTerm + "'. Plase check and try again.",
                            level: _app.Jigsaw.Messages.MessageLevel.Info
                        });
                        return Q.reject();
                    }
                })
                .then((index: number) => {
                    // index is the index that should be selected in the page
                    var itemToSelect = this.viewModel.dataSource.data[index];

                    return this.viewModel.selectedItem.inject(itemToSelect)
                        .then(() => {
                            // add the multiple results found message
                            // instead of adding a new message everytime, check if a similar JumpTo message exist
                            if (showMultipleResultsMessage && (result.HasNext || result.HasPrevious)) {
                                // TODO check that there're actually multiple results
                                //var message = <JumpToMultipleResultsMessage>_.find(this.viewModel.messageQueue.messages(), m => m instanceof JumpToMultipleResultsMessage);
                                // if the message doesn't exist or targets a different search term, then replace that message
                                //if (!message || message.searchTerm != searchTerm) {
                                    var message = new JumpToMultipleResultsMessage(this, searchTerm);
                                    message.canFindPrevious(result.HasPrevious);
                                    message.canFindNext(result.HasNext);

                                    this.viewModel.messageQueue.clear().add(message);
                                //}
                            }
                        });
                })
                .then(() => result) // return the arguments
                .fail(() => null);
        }

        private jumpOffline(value: string): Q.Promise<JumpToSearchArgs> {
            var dataSource = this.viewModel.dataSource,
                query = dataSource.currentQuery.skip(null).take(null), // remove pagination from query
                searchTerm = decodeURI(value),
                queryResult = dataSource.queryLocal(query),
                data = queryResult.results,
                inlineCount = queryResult.inlineCount,
                nextIndex = -1,
                value: string;

            for (var i = 0; i < data.length; i++) {
                value = data[i][this.targetProperty]();
                if (_.isString(value) && value.indexOf(searchTerm) === 0) {
                    nextIndex = i;
                    break;
                }
            }

            return Q({
                        Index: nextIndex,
                        HasNext: false,
                        HasPrevious: false
                    });

        }

        /** this method can be safetly called from Knockout event handlers in the views,
        if the method jump is used directly then the event handlers inject undesired parameters
        such as the event args */
        quickJump() {
            return this.jump();
        }

        get isActive() { return !!this.service && !!this.targetProperty; }

    }

    /** this is the viewmodel behind the JumpTo message, when multiple items are found */
    class JumpToMultipleResultsMessage implements _app.Jigsaw.Messages.Message {
        canFindNext = ko.observable(true);
        canFindPrevious = ko.observable(true);
        title = 'Search';
        body: string;

        constructor(public jumpToSearch: JumpToSearch, public searchTerm: string) {
            this.body = templates.JumpToMultipleResultsMessage({ targetProperty: jumpToSearch.targetProperty, searchTerm: searchTerm });
        }

        findNext(): Q.Promise<any> {
            if (this.canFindNext()) {
                return this.jumpToSearch.jump(this.searchTerm, null, true)
                    .then(args => {
                        this.canFindNext(args.HasNext);
                        this.canFindPrevious(args.HasPrevious);
                    });
            }
            return Q(true);
        }

        findPrev(): Q.Promise<any> {
            if (this.canFindPrevious()) {
                return this.jumpToSearch.jump(this.searchTerm, null, false)
                    .then(args => {
                        this.canFindNext(args.HasNext);
                        this.canFindPrevious(args.HasPrevious);
                    });
            }
            return Q(true);
        }
    }
    // register the JumpToMultipleResultsMessage template
    //_app.Jigsaw.Messages.messageTemplateSelector.candidate(templates.JumpToMultipleResultsMessage(), x => x instanceof JumpToMultipleResultsMessage);

    export enum SearchType { None=0, Simple=1, Advanced=2 }

    export class SearchManager {
        /** returns the value of the simple search query */
        simpleSearchQuery = ko.observable('');

        searchType = ko.observable(SearchType.None);

        /** returns wheter the advanced search panel is active or not */
        advancedPanelActive = ko.observable(false);
        /** get's a reference to the currently active search panel, this is setted by the webRule custom binding,
        specifically for this viewModel */
        searchWidget = ko.observable<WebRule>();

        showInputBox = (text: string) => _app.Views.smartInput({ title: '', content: text });
        savedSearches = new SavedSearchesCollection();

        constructor(private viewModel: DataItemsViewModel) {

            viewModel.dataSource.addQueryLevel(query => this.queryLevel(query), entities=>this.filterEntities(entities));

            this.simpleSearchQuery.subscribe(() => {
                if (this.advancedPanelActive()) {
                    this.advancedPanelActive(false);
                }
            });

        }

        /** used to modify the query in the datasource, it adds the search parameters */
        private queryLevel(query: breeze.EntityQuery) {
            if (this.searchType() === SearchType.Simple) {
                return query.withParameters({
                    simpleSearch: this.simpleSearchQuery()
                });
            } else if (this.searchType() === SearchType.Advanced) {
                return query.withParameters({
                    webRule: this.searchWidget().extract()
                });
            } else {
                return query;
            }
        }

        private filterEntities(entities: breeze.Entity[]): breeze.Entity[] {
            var simpleSearchProperty = this.viewModel.options && this.viewModel.options.simpleSearchProperty,
                searchTerm = this.simpleSearchQuery();

            if (!simpleSearchProperty || this.searchType() != SearchType.Simple) return entities;

            return _(entities).filter(entity => {
                var value = <string>entity[this.viewModel.options.simpleSearchProperty]();
                return _.isString(value) && value.indexOf(searchTerm) === 0;
            });
        }

        /** executed to perform the search */
        search() {
            this.viewModel.messageQueue.clear();

            if (this.advancedPanelActive()) {
                // should make an advanced search
                this.searchType(SearchType.Advanced);
                this.simpleSearchQuery('');
                this.advancedPanelActive(false);
            } else if (this.simpleSearchQuery() != '') {
                // make a simple search
                this.searchType(SearchType.Simple);
            }

            // refresh the data source so that the query is performed again
            return this.viewModel.dataSource.update();
        }

        saveAndSearch() {
            // request a name
            return this.showInputBox('Enter a name for the search')
                .then(name => {
                    // TODO post the saved search to the server to notify that it got saved
                    var serializedRule = WebRuleUtils.serializeRule(this.searchWidget()),
                        search = new SavedSearch(name, serializedRule, this.viewModel.options.savedSearchesGroup);
                    this.savedSearches.add(search);

                    return this.search();
                });
        }

        reset() {
            this.searchType(SearchType.None);
            this.simpleSearchQuery('');
            this.advancedPanelActive(false);

            if (this.searchWidget()) {
                this.searchWidget().clear();
            }
        }

        clear() {
            this.reset();
            this.viewModel.dataSource.refresh();
        }

    }

    export class SavedSearch {
        constructor(public name: string, public ruleData: string, public group: string = '') {
        }
    }

    export interface LoadSearchInteractionOptions {
        search: SavedSearch;
        execute: boolean;
    }

    export class SavedSearchesCollection extends _app.Collection.SetCollection<SavedSearch> {

        /** notifies interested partys  */
        loadSearchInteraction = new _app.Common.InteractionRequest<LoadSearchInteractionOptions, Q.Promise<any>>();

        find(name: string) {
            return _(this.items()).find(search => search.name === name);
        }

        load(search: SavedSearch) {
            return this.loadSearchInteraction.request({ search: search, execute: false });
        }

        loadAndExecute(search: SavedSearch) {
            return this.loadSearchInteraction.request({ search: search, execute: true });
        }

    }

    module WebRuleUtils {

        enum ElementType {
            Flow = 0,
            Field = 1,
            Function = 2,
            Operator = 3,
            Value = 4,
            Clause = 6,
            Action = 7,
            LeftParenthesis = 8,
            RightParenthesis = 9,
            LeftBracket = 10,
            RightBracket = 11,
            Calculation = 12,
            Tab = 13,
            NewLine = 15,
            HtmlTag = 16,
        }

        enum CalculationType {
            Field = 0,
            LeftParenthesis = 1,
            RightParenthesis = 2,
            Multiplication = 3,
            Division = 4,
            Addition = 6,
            Subtraction = 7,
            Number = 8,
            None = 9,
        }

        enum FunctionType {
            Name,
            Param,
            Comma,
            End,
            None,
        }

        enum InputType {
            Field,
            Input,
            None,
        }

        enum OperatorType {
            String = 0,
            Numeric = 1,
            Date = 2,
            Time = 3,
            Bool = 4,
            Enum = 6,
            None = 8,
        }

        interface RuleElement {
            Name: string;
            Value: string;
            Type: ElementType;
            CalType?: CalculationType;
            FuncType?: FunctionType;
            InpType?: InputType;
            Oper?: OperatorType;
            Min?: number;
            Max?: number;
            Dec?: boolean;
            IsDs?: boolean;
            Cal?: boolean;
            En?: string;
            Format?: string;
            IsRule?: boolean;
            IsInstance?: boolean;
            IsOrganicParenthesis?: boolean;
            NotFound?: boolean;
            Token?: string;
        }

        interface RuleData {
            Id: string;
            IsLoadedRuleOfEvalType: boolean;
            Name: string;
            SkipNameValidation: boolean;

            Elements: RuleElement[];
        }

        /** returns a string that can be used later to re-load the rule in the control,
        calling extract returns a string that must be sent to the server for processing 
        to return this string. 
        Maybe a similar function will be included in WebRule's code in future versions.
        For now this function is basically a rewrite of the (decompiled) C# code on the 
        server. 
        IMPORTANT: This function is EXTREMELY dependant on the current version of WebRule
        it might not be correct for future versions, always review when updating to newer 
        versions */
        export function serializeRule(widget: WebRule): string {
            var result = '',
                ruleDataString = widget.extract(),
                ruleData: RuleData = JSON.parse(ruleDataString);

            result += "[";

            result += "{'g':" + (ruleData.Id ? "'" + ruleData.Id + "'" : "null") + ",";
            result += "'v':" + ruleData.IsLoadedRuleOfEvalType + ",";
            result += "'n':" + (ruleData.Name? "'" + ruleData.Name + "'": "null") + ",";
            result += "}";

            _.each(ruleData.Elements, element => {
                result += ",";
                result += "{";
                // in C# this is element.ToString();
                switch (element.Type) {
                    case ElementType.Flow:
                    case ElementType.Clause:
                        nullField('n');
                        stringField('v', element.Value);
                        break;
                    case ElementType.Field:
                        nullField('n');
                        stringField('v', element.Value);
                        numericField('l', element.IsRule ? 1 : 0);
                        numericField('d', element.NotFound ? 1 : 0);
                        numericField('o', element.Oper);
                        if (element.Oper === OperatorType.Enum) {
                            stringField('e', element.En);
                        }
                        break;
                    case ElementType.Function:
                    case ElementType.Action:
                        nullField('n');
                        numericField('f', element.FuncType);
                        numericField('d', element.NotFound ? 1 : 0);
                        switch (element.FuncType) {
                            case FunctionType.Name:
                            case FunctionType.End:
                                stringField('v', element.Value);
                                numericField('o', element.Oper);
                                break;
                            case FunctionType.Param:
                                stringField('v', element.Value);
                                switch (element.InpType) {
                                    case InputType.Field:
                                        numericField('o', element.Oper);
                                        break;
                                    case InputType.Input:
                                        switch (element.Oper) {
                                            case OperatorType.Date:
                                            case OperatorType.Time:
                                                stringField('r', element.Format);
                                                break;
                                            case OperatorType.Enum:
                                                stringField('e', element.En);
                                                break;
                                        }
                                        break;
                                }
                                break;
                        }
                        break;
                    case ElementType.Operator:
                        nullField('n');
                        stringField('v', element.Value);
                        numericField('o', element.Oper);
                        break;
                    case ElementType.Value:
                        nullField('n');
                        stringField('v', element.Value);
                        numericField('i', element.InpType);
                        numericField('o', element.Oper);
                        break;
                    case ElementType.LeftParenthesis:
                    case ElementType.RightParenthesis:
                    case ElementType.LeftBracket:
                    case ElementType.RightBracket:
                        nullField('n');
                        break;
                    case ElementType.Calculation:
                        nullField('n');
                        numericField('c', element.CalType);
                        switch (element.CalType) {
                            case CalculationType.Field:
                            case CalculationType.Number:
                                stringField('v', element.Value);
                        }
                        break;
                }
                numericField('t', element.Type);
                result += "}";
            });

            result += "]";

            return result;


            function nullField(field: string) {
                result += "'" + field + "': null,";
            }

            function stringField(field: string, value) {
                result += "'" + field + "':'" + value + "',";
            }

            function numericField(field: string, value: number) {
                result += "'" + field + "':" + value + ",";
            }
        }

        /** I made this because CodeEffects' Rules controls lacks of a dispose mechanism,
        this may not be needed for future versions. And this is my own version of the cleaning. */
        export function destroyWebRule(widget: WebRule) {
            // call this just in case, 
            widget.dispose();

            removeHandlersFromNode(document);
            removeHandlersFromNode(window);

            // remove filter dialog that is leaved behind
            $('#ceR_filter-container').remove();

            function removeHandlersFromNode(node: EventTarget) {
                var ceEvents = node['ceEvents'];
                for (var event in ceEvents) {
                    _(ceEvents[event]).each(x => node.removeEventListener(event, x.browserHandler));
                }
                node['ceEvents'] = null;
            }
        }


    }


    export module Knockout {

        interface SearchInputOptions {
            type: KnockoutObservable<SearchType>;
            query: KnockoutObservable<string>;
            search: any;
            clear: any;
        }

        ko.bindingHandlers['searchInput'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var options: SearchInputOptions = valueAccessor(),
                    cancelSearchElement = $("<span>").addClass("k-icon k-i-close search-input-close")[0],
                    placeHolder = ko.computed(() => options.type() === SearchType.Advanced ? '[Advanced Search]' : ''),
                    searchActive = ko.computed(() => options.type() != SearchType.None),
                    cancelSearchElementVisible = ko.computed(() => options.type() != SearchType.None);

                $(element).wrap("<span>").parent().append(cancelSearchElement);

                ko.applyBindingsToNode(element, {
                    'value': options.query,
                    'pressEnter': options.search,
                    'attr': { 'placeholder': placeHolder },
                    'css': { 'search-active': searchActive }
                }, viewModel);

                ko.applyBindingsToNode(cancelSearchElement, { 'click': options.clear, 'visible': cancelSearchElementVisible }, viewModel);

                ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                    _app.Common.bulkDispose(placeHolder, searchActive, cancelSearchElementVisible);
                });

                return { 'controlsDescendantBindings': true };
            }
        }

        
        /** used to store the settings for each webrule control, so when the application
        is running there's a single request for the webRule settings */
        var webRuleSettingsCache = {};

        export interface WebRuleBuilderOptions {
            settingsUrl?: string;
            settings?: string;
        }

        export function makeWebRule(element: JQuery, options: WebRuleBuilderOptions) {
            var id = id = element.attr('id');

            var widget: WebRule = new $rule.Control([id, false, false, null]);

            function loadSettings(data) {
                widget.loadSettings(data);
            }

            if (options.settings) {
                loadSettings(options.settings);
            } else if (options.settingsUrl) {
                var cacheKey = 'webRuleSettings: ' + options.settingsUrl;

                // check if the settings have been cached on a previos request
                if (webRuleSettingsCache[options.settingsUrl]) {
                    loadSettings(webRuleSettingsCache[options.settingsUrl]);
                } else {
                    _app.ajax.connection.online()
                        .then(online => {
                            if (online) {
                                return _app.ajax.get(options.settingsUrl)
                                    .then(data => {
                                        loadSettings(data);
                                        webRuleSettingsCache[options.settingsUrl] = data;
                                        localStorage.setItem(cacheKey, data);
                                    });
                            } else {
                                var data = localStorage.getItem(cacheKey);
                                if (data) {
                                    loadSettings(data);
                                }
                            }
                        })
                        .done();
                }

            } else {
                throw new Error('either the settings or the settings URL must be specified for the webRule control');
            }

            return {
                widget: widget,
                dispose: () => {
                    try {
                        WebRuleUtils.destroyWebRule(widget);
                    } catch (e) {
                        console.log('codeeffects dispose error captured:', e);
                    }
                }
            }
        }

        interface WebRuleBindingOptions  extends WebRuleBuilderOptions{
            widget: KnockoutObservable<any>;
            
        }

        ko.bindingHandlers['webRule'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                // sometimes there's a bug here caused when the CodeEffect rule control is initialized
                // before the target element is on the DOM, note that the Rule control receives the
                // element's ID and searches for the target element using standard DOM api
                var $element = $(element),
                    value: WebRuleBindingOptions = ko.unwrap(valueAccessor()),
                    id = $element.attr('id');

                _app.Utils.async(() => {
                    var webRuleBuilder = makeWebRule($element, value);

                    value.widget(webRuleBuilder.widget);

                    ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                        value.widget(null);
                        webRuleBuilder.dispose();
                    });
                });

                return { 'controlsDescendantBindings': true };
            }
        }




    }

}

export module Filters {

    export interface QueryFilter {
        (query: breeze.EntityQuery, parameter: any): breeze.EntityQuery;
    }

    export class QueryFilterManager {

        parameters = ko.observableArray();

        constructor(private filter: QueryFilter, public dataSource: Server.DataSource) {

            dataSource.addQueryLevel(query => {
                _.each(this.parameters(), parameter => {
                    query = this.filter(query, parameter);
                });
                return query;
            });

        }

        updateFilter(...params: any[]) {
            this.clear();
            this.parameters.push.apply(this.parameters, params);

            return this.dataSource.update();
        }

        add(parameter) {
            this.parameters.push(parameter);
            return this.dataSource.update();
        }

        remove(parameter) {
            this.parameters.remove(parameter);
            return this.dataSource.update();

        }

        clear() {
            this.parameters.removeAll();
            return this.dataSource.update();
        }

    }
}

/** contains classes related to saving and retrieving metadata from the server */
export module Metadata {

    export class Manager {
        constructor(item: KnockoutComputed<breeze.Entity>, builderUrl: string, metaUrl: string) {

        }
    }
}

export module Wizzard {

    export interface WizzardViewModelOptions {
        item?: breeze.Entity;
        dataSource: Server.DataSource;
        totalSteps: number;

        close: () => void;
        saveDraft?(item: breeze.Entity): void;
    }

    export class WizzardViewModel extends _app.Common.ViewModelBase implements _app.Common.IDisposable {
        hasErrors = ko.observable(false);
        step = ko.observable(0);
        totalSteps: number;
        forceValidation = ko.observable(false);
        item: breeze.Entity;

        canGoNext: KnockoutComputed<boolean>;
        canGoPrev: KnockoutComputed<boolean>;
        canFinish: KnockoutComputed<boolean>;

        closeEvent = new _app.Common.Event();

        constructor(public options: WizzardViewModelOptions) {
            super();
            this.totalSteps = options.totalSteps;
            this.item = options.item || this.createDetachedEntity();

            this.canGoNext = ko.computed(() => !this.hasErrors() && this.step() < this.totalSteps);
            this.canGoPrev = ko.computed(() => !this.hasErrors() && this.step() > 0);
            this.canFinish = ko.computed(() => !this.hasErrors() && this.step() === this.totalSteps);
        }

        dispose() {
            _app.Common.bulkDispose(this.canFinish, this.canGoNext, this.canGoPrev);
        }

        private createDetachedEntity() {
            var item = this.options.dataSource.createEntity();
            this.options.dataSource.manager.detachEntity(item);
            return item;
        }

        private moveTo(step: number) {
            this.forceValidation(true);
            if (!this.hasErrors() && step >= 0 && step <= this.totalSteps) {
                this.forceValidation(false);
                this.step(step);
            }
        }

        navigate(step: number) {
            if (step < this.step()) {
                this.moveTo(step);
            }
        }
        
        nextStep() {
            this.moveTo(this.step() + 1);
        }

        prevStep() {
            this.moveTo(this.step() - 1);
        }

        private save(): Q.Promise<any> {
            // ensure the item is attached to the manager before saving changes
            this.options.dataSource.manager.addEntity(this.item);
            return this.options.dataSource.saveChanges([this.item])
                .fail(e => {
                    this.options.dataSource.manager.detachEntity(this.item);
                    return Q.reject(e);
                });
        }

        saveAndClose() {
            if (this.step() === this.totalSteps) {
                return this.save()
                    .then(() => this.options.close());
            } else {
                return Q.reject(new Error('wizzard is not on the last step'));
            }
        }

        close() {
            return _app.Views.smartMessage({
                    title: '',
                    content: "Current item has changed, do you want to save changes?",
                    type: _app.Views.MessageBoxType.Question
                })
                .then(result => {
                    if (result === _app.Views.MessageBoxResult.Yes) {
                        return this.saveAndClose();
                    } else if (result === _app.Views.MessageBoxResult.No) {
                        // just close the window, the entity is detached anyway
                        this.options.close();
                    } else {
                        return Q.reject();
                    }
                });
        }

        saveDraft() {
            if (!this.options.saveDraft) throw new Error('save draft option must be specified');

            this.options.saveDraft(this.item);
            this.options.close();
        }

    }

    export interface WizzardViewOptions extends _app.Marionette.ViewOptions {
        viewModel?: WizzardViewModel;
        totalSteps: number;
    }

    /**  */
    export class WizzardView extends _app.Marionette.View {
        options: WizzardViewOptions;

        constructor(options: WizzardViewOptions) {
            super(options);
        }
    }

    interface WizzardTabContentBindingOptions {
        /** returns the tab index */
        index: number;
        /** returns the current wizzard step */
        step: KnockoutObservable<number>;
        /** this will be the context of the tab */
        item: any;
    }

    ko.bindingHandlers['wizzardTabContent'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var $element = $(element),
                value: WizzardTabContentBindingOptions = valueAccessor(),
                errorCollection = bindingContext[Knockout.ErrorTrack.JIGSAWERRORCOLLECTION],
                visible = ko.computed(() => value.step() === value.index),
                collection = new Knockout.Tracks.TuneledTrackCollection(errorCollection, null, null, <any>visible),
                tabContext: KnockoutBindingContext = bindingContext.createChildContext(value.item),
                extendOptions = {};
            extendOptions[Knockout.ErrorTrack.JIGSAWERRORCOLLECTION] = collection;
            tabContext.extend(extendOptions);

            ko.applyBindingsToNode(element, {
                visible: visible
            }, tabContext);

            $element.addClass('busy');
            var bindingsApplied = false,
                disposable = value.step.subscribe(step => {
                    // apply bindings when the step is first visited
                    if (step === value.index && !bindingsApplied) {
                        applyBindings(500);
                    }
                });
            // check if this tab is the current step, and apply bindings
            // this binding will be applied when the window is being opened, so the timeout is higher
            if (value.step() === value.index) {
                applyBindings(1000);
            }

            ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                disposable.dispose();
            });

            return { 'controlsDescendantBindings': true };

            function applyBindings(timeout = 500) {
                bindingsApplied = true;
                setTimeout(() => {
                    ko.applyBindingsToDescendants(tabContext, element);
                    $element.removeClass('busy');
                }, timeout);
            }
        }
    }

    export class WizzardDialogManager {
        
        constructor(public dataSource: Server.DataSource, public wizzardViewBuilder: () => WizzardView, private saveDraft?) {

        }

        showDialog(item?: breeze.Entity) {
            var view = this.wizzardViewBuilder(),
                viewModel = new WizzardViewModel({
                    item: item,
                    dataSource: this.dataSource,
                    close: closeWindow,
                    saveDraft: this.saveDraft,
                    totalSteps: view.options.totalSteps
                }),
                window = new _app.Views.WindowView(view.withViewModel(viewModel), { close: close, size : _app.Views.WindowSize.LARGE });
            
            return window.showDialog();

            function closeWindow() {
                window.close();
                viewModel.dispose();

                delete window;
                delete viewModel;
                delete view;
            }

            function close() {
                viewModel.close();
            }
        }
    }

}

export module Chooser {

    class ChooserDialogItem {
        active = ko.observable(true);

        constructor(public column: Server.ColumnSpec) { }
    }

    export interface ChooserDialogViewModelOptions {
        columns: Server.ColumnSpec[];
        close: () => void;
    }

    export class ChooserDialogViewModel extends _app.Common.ViewModelBase {
        private columns: ChooserDialogItem[];
        cancelled = false;
        /** returns true if the title headers should be included */
        includeHeaders = ko.observable(true);

        allPages = ko.observable(true);
        pageFrom = ko.observable(1);
        pageTo = ko.observable(1);

        constructor(public options:ChooserDialogViewModelOptions) {
            super();

            this.columns = _.map(options.columns, col => new ChooserDialogItem(col));
        }

        getActiveColumns() {

            return {
                includeHeaders: this.includeHeaders(),
                allPages: this.allPages(),
                pageFrom: this.pageFrom(),
                pageTo: this.pageTo(),
                columns: _.chain(this.columns)
                    .filter(col => col.active())
                    .map(col => col.column)
                    .value()
            };
        }

        close() {
            
            this.options.close();
        }

        accept() {
            this.cancelled = false;
            this.close();
        }

        cancel() {
            this.cancelled = true;
            this.close();
        }
    }

    export class ChooserDialogManager {
        private _viewTemplate: string;

        constructor(public columns: Server.ColumnSpec[]) {
            this._viewTemplate = templates.chooser.ChooserDialog({
                columns: _.map(columns, col => col.title)
            });
        }

        showDialog() {
            var viewModel = new ChooserDialogViewModel({ columns: this.columns, close: closeWindow }),
                view = new _app.Marionette.View({ template: () => this._viewTemplate, viewModel: viewModel }),
                window = new _app.Views.WindowView(view, { close: close, resizable: false } );
            
            return window.showDialog()
                .then(() =>viewModel.cancelled? null: viewModel.getActiveColumns());

            function closeWindow() {
                window.close();

                delete window;
                delete viewModel;
                delete view;
            }
            
            function close() {
                viewModel.cancelled = true;
                viewModel.close();
            }
        }

    }

    export function showColumnsChooserDialog(columns: Server.ColumnSpec[]) {
        var manager = new ChooserDialogManager(columns);
        return manager.showDialog();
    }

}

export module Notifications {

    export class NotificationsDataSource extends Server.LightDataSource {
        /** overwrite the method to set the date on each notification, because the value received from
        the server is a string */
        replaceData(notifications: _app.Jigsaw.Notifications.INotificationBase[]) {
            _(notifications).each(notification => notification.TimeStamp = new Date(<any>notification.TimeStamp));
            super.replaceData(notifications);
        }
    }

    export interface IEntityDataNotification extends _app.Jigsaw.Notifications.INotificationBase {
        Entity;
    }

    export class NotificationViewModel extends _app.Common.ViewModelBase {
        /** returns true if the notifications are local */
        localScope = ko.observable(false);
        levelScope = ko.observable(_app.Jigsaw.Notifications.NotificationLevel.Success);

        items: KnockoutObservableArray<breeze.Entity>;

        constructor(public dataSource: Server.LightDataSource) {
            super();

            dataSource.addQueryLevel(query => this.queryParameters(query));

            this.items = dataSource.data;
        }

        /** adds parameters to the query to retrieve the correct notifications */
        private queryParameters(query: breeze.EntityQuery) {
            return query.from(this.localScope()?'localNotifications': 'globalNotifications')
                .withParameters({
                    level: this.levelScope()
                });
        }


    }

    /** this module will handle all local/global notifications */
    export class NotificationModule extends _app.Modules.ModuleBase {
        view: _app.Marionette.View;
        viewModel: NotificationViewModel;
        private stylesModule = new _app.Jigsaw.Theming.ContentStyleSheet(templates.notification.styles);
        private dataStylesModule = new _app.Jigsaw.Theming.ContentStyleSheet(templates.styles);

        constructor(public coreModule: _app.Jigsaw.CoreModuleBase, public ribbonPanelNotificationModule: _app.Jigsaw.Notifications.NotificationsModule) {
            super();

            var dataSource = new NotificationsDataSource({
                serviceName: "api/notification",
                defaultSort: "TimeStamp"
            });
            this.viewModel = new NotificationViewModel(dataSource);
            this.view = new _app.Marionette.View({
                template: templates.notification.NotificationContent,
                viewModel: this.viewModel
            });

            this.registerUris();
            this.registerUriHandlers();
        }

        requiredModules(): _app.Modules.IModule[] {
            return [this.stylesModule, this.dataStylesModule, this.coreModule, this.ribbonPanelNotificationModule];
        }

        load() {
            return this.coreModule.content.show(this.view);
        }

        private registerUris() {
            var uris = [
                {
                    url: 'local-notifications',
                    level: _app.Jigsaw.Notifications.NotificationLevel.Success,
                    local: true
                },
                {
                    url: 'local-notifications/success',
                    level: _app.Jigsaw.Notifications.NotificationLevel.Success,
                    local: true
                },
                {
                    url: 'local-notifications/warning',
                    level: _app.Jigsaw.Notifications.NotificationLevel.Warning,
                    local: true
                },
                {
                    url: 'local-notifications/error',
                    level: _app.Jigsaw.Notifications.NotificationLevel.Error,
                    local: true
                },
                {
                    url: 'global-notifications',
                    level: _app.Jigsaw.Notifications.NotificationLevel.Success,
                    local: false
                },
                {
                    url: 'global-notifications/success',
                    level: _app.Jigsaw.Notifications.NotificationLevel.Success,
                    local: false
                },
                {
                    url: 'global-notifications/warning',
                    level: _app.Jigsaw.Notifications.NotificationLevel.Warning,
                    local: false
                },
                {
                    url: 'global-notifications/error',
                    level: _app.Jigsaw.Notifications.NotificationLevel.Error,
                    local: false
                }
            ];

            _.each(uris, item => {
                _app.history.register(item.url, () => {
                    this.viewModel.levelScope(item.level);
                    this.viewModel.localScope(item.local);

                    return _app.moduleManager.load(this)
                        .then(() => this.viewModel.dataSource.update());
                });
            });

        }

        private registerUriHandlers() {
            this.ribbonPanelNotificationModule.localNotificationsViewModel.showNotificationsEvent.add(
                (level: _app.Jigsaw.Notifications.NotificationLevel) => {
                    switch (level) {
                        case _app.Jigsaw.Notifications.NotificationLevel.Error:
                            _app.history.navigate('local-notifications/error');
                            break;
                        case _app.Jigsaw.Notifications.NotificationLevel.Warning:
                            _app.history.navigate('local-notifications/warning');
                            break;
                        case _app.Jigsaw.Notifications.NotificationLevel.Success:
                            _app.history.navigate('local-notifications/success');
                            break;
                        default: 
                            throw new Error('out of range error');
                    }
                });

            this.ribbonPanelNotificationModule.globalNotificationsViewModel.showNotificationsEvent.add(
                (level: _app.Jigsaw.Notifications.NotificationLevel) => {
                    switch (level) {
                        case _app.Jigsaw.Notifications.NotificationLevel.Error:
                            _app.history.navigate('global-notifications/error');
                            break;
                        case _app.Jigsaw.Notifications.NotificationLevel.Warning:
                            _app.history.navigate('global-notifications/warning');
                            break;
                        case _app.Jigsaw.Notifications.NotificationLevel.Success:
                            _app.history.navigate('global-notifications/success');
                            break;
                        default:
                            throw new Error('out of range error');
                    }
                });
        }
    }
}

export module Sidebar {

    export module MyItems {

        export interface IMyItemsCollection<T> extends _app.Collection.IKoSetCollection<T> {
            expanded: KnockoutObservable<boolean>;

            /** returns a view that can be used to render the given item */
            render(item: T): _app.Marionette.View;

            /** given an item it returns the function that should be called to navigate to the desired item */
            navigate(item: T): () => void;
        }

        export interface IMyItemsCollectionOptions {
            entityType: string;
            render: _app.Marionette.IRenderer<breeze.Entity>;
            navigate: (item) => void;

            /** specify if the collection should also store draft of entties, those are
            detached entities that are persisted on the localStorage */
            dataSource?: Server.DataSource;
        }

        export function entitiesPersistedArray(key: string, dataSource: Server.DataSource) {
            return _app.Knockout.persistedArray<breeze.Entity>({
                key: key,
                parse: item => {
                    // return a new detached entity
                    var entity = dataSource.createEntity(item);
                    dataSource.manager.detachEntity(entity);
                    return entity;
                },
                stringify: (item: breeze.Entity) => {
                    // include all data properties
                    var includedColumns = _.map(dataSource.entityType.dataProperties, prop => prop.name),
                        plainObject = {};
                    // copy all data properties
                    _.each(includedColumns, column => {
                        var propertyValue = ko.unwrap(item[column]);
                        if (propertyValue != null) {
                            plainObject[column] = propertyValue;
                        }
                    });
                    return plainObject;
                }
            });
        }

        export class MyItemsCollection extends _app.Collection.SetCollection<breeze.Entity> implements IMyItemsCollection<breeze.Entity> {
            expanded = ko.observable(true);
            private _drafts = ko.observable<KnockoutObservableArray<breeze.Entity>>();
            superItems: KnockoutObservableArray<breeze.Entity>;

            constructor(public options: IMyItemsCollectionOptions) {
                super();

                this.superItems = this.items;
                // replace the super items computed observable to include the drafts array
                this.items = <any>ko.computed(() => this.drafts ? _.union(this.superItems(), this.drafts()) : this.superItems());
            }

            /** returns an observableArray that stores the drafts. The drafts are persisted on the user's localStorage
            Note: the drafts can't be de-serialized until the metadata is fetched. */
            get drafts() { return this._drafts(); }

            /** this method must be called after the metadata for the target entity has been fetched from the server,
            so new drafts entities can be created. */
            loadStoredDrafts() {
                if (this.drafts || !this.options.dataSource) {
                    return; // the drafts have already been loaded
                }

                this._drafts(entitiesPersistedArray('MyItemDraft.' + this.options.entityType, this.options.dataSource));
            }

            add(item: breeze.Entity) {
                if (!_.contains(this.items(), item)) {
                    this.superItems.push(item);
                }
                this.expanded(true);
            }

            addDraft(item: breeze.Entity) {
                if (!this.drafts) throw new Error('this MyItems collection can not store drafts.');
                if (!item.entityAspect.entityState.isDetached()) throw new Error('only detached entities can be saved as drafts');

                if (!_.contains(this.drafts(), item)) {
                    this.drafts.push(item);
                }
                this.expanded(true);
            }

            remove(...items: breeze.Entity[]): void {
                this.superItems.removeAll(items);
                this.drafts.removeAll(items);
            }

            belongsTo(item: breeze.Entity) {
                return this.options.entityType === item.entityType.shortName;
            }

            navigate(item: breeze.Entity) {
                return () => {
                    // if the item is a draft remove it from the list before executing it's navigate method
                    if (item.entityAspect.entityState.isDetached()) {
                        this.drafts.remove(item);
                    }

                    this.options.navigate(item);
                };
            }

            render(item: breeze.Entity) {
                return this.options.render(item);
            }
        }

        export interface IMyItemsViewModelSet {
            name: _app.Marionette.View;
            collection: IMyItemsCollection<any>
        }

        export class MyItemsViewModel extends _app.Common.ViewModelBase {

            sets = ko.observableArray<IMyItemsViewModelSet>();

            messageQueue = new _app.Jigsaw.Messages.ExtraSmallBoxMessageQueue();

            add(name: _app.Marionette.View, collection: IMyItemsCollection<any>) {
                // only add the collection if it isn't already present
                if (!_(this.sets()).any(x => x.collection == collection)) {
                    this.sets.push({ name: name, collection: collection });
                }
            }

            /** adds a new element to the corresponding set, if a proper set exists */
            drop(data) {
                var item = _(this.sets()).find(x => x.collection.belongsTo(data));

                if (item) {
                    // add item and show message after
                    item.collection.add(data);

                    // show message of item added succesfully
                    this.messageQueue.clear().add({
                        title: 'Success',
                        body: 'item added to my Items',
                        level: _app.Jigsaw.Messages.MessageLevel.Success
                    });
                } else {
                    this.messageQueue.clear().add({
                        title: 'Error',
                        body: "The dropped entity doesn't belong to any set",
                        level: _app.Jigsaw.Messages.MessageLevel.Success
                    });
                }
            }

            remove(data) {
                var item = _(this.sets()).find(x => _(x.collection.items()).contains(data));

                if (item) {
                    item.collection.remove(data);
                    this.messageQueue.clear().add({
                        title: 'Success',
                        body: "Row removed from My Items successfully.",
                        level: _app.Jigsaw.Messages.MessageLevel.Success
                    });
                }
            }
        }

        export class MyItemsModule extends _app.Modules.ModuleWithSlavesBase {

            private _myItemsViewModel: MyItemsViewModel;
            private stylesModule = new _app.Jigsaw.Theming.ContentStyleSheet(templates.myitems.myItemsStyles);

            constructor(private sidebarModule: _app.Jigsaw.Sidebar.SidebarModule) {
                super();

                this._myItemsViewModel = new MyItemsViewModel();
                var view = new _app.Marionette.View({
                    template: templates.myitems.SidebarMyItems,
                    viewModel: this._myItemsViewModel
                }),
                    collapsedView = new _app.Marionette.View({
                        template: templates.myitems.SidebarMyItemsCollapsed,
                        viewModel: this._myItemsViewModel
                    });

                sidebarModule.registerView(view, collapsedView);
                sidebarModule.addSlave(this);
            }

            registerSet(title: _app.Marionette.View, collection: IMyItemsCollection<any>) {
                this._myItemsViewModel.add(title, collection);
            }

            requiredModules(): _app.Modules.IModule[] {
                return [this.sidebarModule, this.stylesModule];
            }
        }

        export interface MyItemsCollectionModuleOptions {
            dataSource: Server.DataSource;
            itemTitleTemplate: _app.Marionette.TemplateFunction;
            itemTemplate: _app.Marionette.TemplateFunction;
            navigate(item: breeze.Entity): void;
            myItemsModule: MyItemsModule;
            ensureMetadataFetchedModule: EnsureMetadataFetchedModule;

            styles?: string;
        }

        /** This module should be used by other modules who want to register a MyItemsCollection,
        with the Sidebar, it will be added as an Slave of the MyItemsModule */
        export class MyItemsCollectionModule extends _app.Modules.ModuleWithSlavesBase {
            collection: MyItemsCollection;
            ensureMetadataFetchedModule: EnsureMetadataFetchedModule;
            stylesModule: _app.Jigsaw.Theming.ContentStyleSheet;

            constructor(public options: MyItemsCollectionModuleOptions) {
                super();

                this.ensureMetadataFetchedModule = options.ensureMetadataFetchedModule;
                if (options.styles) {
                    this.stylesModule = new _app.Jigsaw.Theming.ContentStyleSheet(options.styles);
                }

                this.collection = new MyItemsCollection({
                    entityType: this.options.dataSource.typeName,
                    render: () => new _app.Marionette.View({ template: this.options.itemTemplate }),
                    navigate: this.options.navigate,
                    dataSource: this.options.dataSource
                });

                this.options.myItemsModule.registerSet(new _app.Marionette.View({ template: this.options.itemTitleTemplate }), this.collection);
                options.myItemsModule.addSlave(this);
            }

            requiredModules(): _app.Modules.IModule[] {
                if (this.stylesModule) {
                    return [this.ensureMetadataFetchedModule, this.stylesModule];
                } else {
                    return [this.ensureMetadataFetchedModule];
                }
            }

            load() {
                // load stored drafts now that the metadata has been fetched
                this.collection.loadStoredDrafts();

                return super.load();
            }
        }
    }

    export module MySearches {

        export class SavedSearchesMultiSet extends _app.Collection.MultiSetCollection<Searches.SavedSearch> {

            load(search: Searches.SavedSearch) {
                var part: Searches.SavedSearchesCollection = <any>this.findPartContaining(search);
                if (part) {
                    return part.load(search);
                }
            }

            loadAndExecute(search: Searches.SavedSearch) {
                var part: Searches.SavedSearchesCollection = <Searches.SavedSearchesCollection>this.findPartContaining(search);
                if (part) {
                    return part.loadAndExecute(search);
                }
            }

        }

        export class SavedSearchesViewModel extends _app.Common.ViewModelBase {

            storage = new SavedSearchesMultiSet();

            messageQueue = new _app.Jigsaw.Messages.InlineMessageQueue();

        }

        export class SavedSearchModule extends _app.Modules.ModuleBase {

            viewModel: SavedSearchesViewModel;
            private _stylesModule = new _app.Jigsaw.Theming.ContentStyleSheet(templates.mysearches.mySearchesStyles);

            constructor(private sidebarModule: _app.Jigsaw.Sidebar.SidebarModule) {
                super();

                this.viewModel = new SavedSearchesViewModel();
                var view = new _app.Marionette.View({
                    template: templates.mysearches.SidebarMySearches,
                    viewModel: this.viewModel
                }),
                    collapsedView = new _app.Marionette.View({
                        template: templates.mysearches.SidebarMySearchesCollapsed,
                        viewModel: this.viewModel
                    });

                sidebarModule.registerView(view, collapsedView);
                sidebarModule.addSlave(this);
            }

            registerCollection(collection: Searches.SavedSearchesCollection) {
                this.viewModel.storage.blendWith(collection);
            }

            requiredModules(): _app.Modules.IModule[] {
                return [this.sidebarModule, this._stylesModule];
            }

        }

    }

}



/** Contains precompiled templates */
export module Templates {

    export function ViewBar(templateFunction: _app.Marionette.TemplateFunction): _app.Marionette.View {
        return new _app.Marionette.View({ template: composedTemplate });

        function composedTemplate(helpersParam?) {
            var helpers = _.defaults(helpersParam || {}, { throttle: true });

            return Q(templateFunction(helpers))
                .then(template=> templates.ViewBar({ renderBody: template }));
        }
    }

    export function ViewbarWithSummary(templateFunction: _app.Marionette.TemplateFunction): _app.Marionette.View {
        return new _app.Marionette.View({ template: composedTemplate });

        function composedTemplate(helpersParam) {
            var helpers = _.defaults(helpersParam || {}, { throttle: true });

            return Q(templateFunction(helpers))
                .then(template => {
                    var summaryTabTemplate = SummaryTab(template),
                        templateElement = $(template);
                    
                    //templateElement.find('ul').append('<li data-bind="keyTipsKendoTab : { key : \'VM\' }" >Summary</li>');
                    templateElement.find('ul').append('<li><a data-toggle="tab" href="#tab-summary" data-bind="keyTipsGroup: { key : \'VM\', group : \'vb-summary\'}" >Summary</a ></li>');
					//templateElement.find('ul').parent().append(summaryTabTemplate);
                    templateElement.find('ul').parent().children(".tab-content").append( '<div id="tab-summary" class="tab-pane">' + summaryTabTemplate + '</div>');

                    var resultingTemplate = templateElement[0].outerHTML;

                    return templates.ViewBar({ renderBody: resultingTemplate });
                });
        }
    }

    /** extracts the tabs from a viewbar template and concatenates the content of each tab */
    export function SummaryTab(template: string) {
        var tabs = WizzardView.extractTabs(template),
            summaryTabTemplate = templates.ViewBarSummaryTabContent({ tabs: tabs });
        return summaryTabTemplate;
    }


    
    export function VersionPager(template: _app.Marionette.TemplateFunction) {
        return new _app.Marionette.View({ template: composeTemplate });

        function composeTemplate(helpers?) {
            return templates.VersionPagerViewBar({
                renderBody: template(helpers)
            });
        }
    }

    export function PopupLayout(templateFunction: _app.Marionette.TemplateFunction): _app.Marionette.View {
        return new _app.Marionette.View({ template: composeTemplate });

        function composeTemplate() {
            return Q(templateFunction({ throttle: false }))
                .then(template => templates.PopupLayout({ renderBody: template }));
        }
    }

    export function WizzardView(viewbarTemplate: _app.Marionette.TemplateFunction, helpersParam?: WizzardView.WizzardViewOptions) {
        var template = viewbarTemplate({ throttle: false }),
            tabs = WizzardView.extractTabs(template),
            helpers = _.defaults(helpersParam || {}, { tabs: tabs, title: '', classIdentifier: '' });

        return new Wizzard.WizzardView({
            template: () => templates.Wizzard(helpers),
            totalSteps: tabs.length
        });
    }

    export module WizzardView {
        export interface WizzardViewOptions {
            title: string;
            classIdentifier?: string; 
        }

        export function extractTabs(viewbarTemplate: string) {

            var html = $(viewbarTemplate),
                headers = html.find('ul > li'),
                content = html.find('.tab-pane'),
                length = Math.min(headers.length, content.length),
                result = new Array(length);

            for (var i = 0; i < length; i++) {
                result[i] = {
                    header: headers.eq(i).html(),
                    content: content.eq(i).html()
                };
            }
            
            return result;
        }
    }

    export interface DataItemsViewOptions extends _app.Marionette.ViewOptions {
        viewModel: DataItemsViewModel;
        columns?: any[];
        defaultSort?: string;
        dragHint: string;

        advancedSearchSettingsUrl?: string;
        advancedSearchSettings?: string;

        columnChooser?: boolean;
    }

    export class DataItemsView extends _app.Marionette.View {
        options: DataItemsViewOptions;

        private _domReadyTrash = new _app.Common.Trash();
        grid: Knockout.Kendo.BreezeGrid;

        constructor(options: DataItemsViewOptions) {
            super(options);
        }

        private get dataSource() { return this.options.viewModel.dataSource; }

        domReady() {
            super.domReady();

            var gridElement = this.find('.k-grid')[0],
                grid = Knockout.Kendo.makeKendoGrid(gridElement, {
                    columns: Server.Kendo.getColumns(this.dataSource.entityType, this.options.columns || this.options.viewModel.options.columns),
                    dataSource: this.dataSource,
                    defaultSort: this.options.defaultSort || this.options.viewModel.options.columns[0],
                    dragHint: this.options.dragHint,
                    pageSize: 10,
                    selected: this.options.viewModel.selectedItem
                });

            if (this.options.columnChooser) {
                var columnChooserElement = this.find('.' + Knockout.ColumnChooser.COLUMNCHOOSER),
                    columnChooser = new Knockout.ColumnChooser.GridColumnChooserViewModel(this.options.viewModel.activeColumns, grid.widget),
                    columnChooserView = new _app.Marionette.View({ viewModel: columnChooser, template: templates.ColumnChooser }),
                    columnChooserRegion = _app.Marionette.renderViewIntoElement(columnChooserElement, columnChooserView);
            }

            if (this.options.advancedSearchSettings || this.options.advancedSearchSettingsUrl) {
                var webRuleBuilder = Searches.Knockout.makeWebRule(this.find('#filter-container'), {
                    settings: this.options.advancedSearchSettings,
                    settingsUrl: this.options.advancedSearchSettingsUrl
                });

                this.options.viewModel.searchManager.searchWidget(webRuleBuilder.widget);
            }

            this.grid = grid.widget;
            this._domReadyTrash.recycle(grid, columnChooser, columnChooserRegion, webRuleBuilder);
        }

        close() {
            super.close();

            this.options.viewModel.searchManager.searchWidget(null);
            this._domReadyTrash.dispose();
            this.grid = null;
        }
    }

    export interface DataItemsTemplateOptions {
        title: string;

        addNew?: boolean; // false
        excelExport?: boolean; // true

        jumpTo?: boolean;
        advancedSearchSettingsUrl?: string;
        advancedSearchSettings?: string;

        /** defaults to the first column */
        defaultSort?: string;
        /** specifies the template to drag grid elements */
        dragHint?: string;
        viewModel: DataItemsViewModel;
        columns?: any[];

        filterTemplate?: string;

        columnChooser?: boolean;
    }

    export function DataItems(options: DataItemsTemplateOptions): DataItemsView {
        _.defaults(options, {
            addNew: false,
            excelExport: false,
            jumpTo: true,
            advancedSearchSettingsUrl: '',
            advancedSearchSettings: '',
            dragHint: '',
            columnChooser: true
        });

        return new DataItemsView({
            template: () => templates.DataItems(options),
            viewModel: options.viewModel,
            columns: options.columns,
            dragHint: options.dragHint,
            defaultSort: options.defaultSort,
            advancedSearchSettings: options.advancedSearchSettings,
            advancedSearchSettingsUrl: options.advancedSearchSettingsUrl,
            columnChooser: options.columnChooser
        });
    }
}

/** can be used as a dependency for a module that needs it's manager metadata before it's loaded */
export class EnsureMetadataFetchedModule extends _app.Modules.ModuleBase {
    constructor(private dataSource: Server.DataSource) {
        super();
    }
    
    load() {
        return this.dataSource.fetchMetadata();
    }

}

export interface IDataItemsViewModelOptions {
    jumpToSearchUri?: string;
    jumpToSearchProperty?: string;

    excelExportPath?: string;
    /** field names for the columns availables for export */
    columns?: string[];

    simpleSearchProperty?: string;

    savedSearchesGroup?: string;

    wizzardViewBuilder?: () => Wizzard.WizzardView;
    wizzardSaveDraft?: (item: breeze.Entity) => void;

    queryFilter?: Filters.QueryFilter;

    messageQueueType?: _app.Jigsaw.Messages.MessageQueueType;
}

export class DataItemsViewModel extends _app.Common.ViewModelBase {

    messageQueue: _app.Jigsaw.Messages.MessageQueue;

    /** returns an array with the columns (fields) currently active in the view, this is used 
    for the exports */
    activeColumns = ko.observableArray<string>();

    /** contains the currently selected item */
    selectedItem = ko.guarded<breeze.Entity>();

    jumpToSearch: Searches.JumpToSearch;
    searchManager: Searches.SearchManager;

    /** event fired with an entity, when the selected item changes and a change in the 
    URL is requested to point to the new state of the view model */
    requestNavigate = new _app.Common.InteractionRequest <breeze.Entity, void>();

    /* function used to show a message box, can be replaced for testing purposes */
    showMessageBox = (text, type?) => _app.Views.smartMessage({ title: '', content: text, type: type });

    wizzardDialogManager: Wizzard.WizzardDialogManager;

    queryFilter: Filters.QueryFilterManager;

    constructor(public dataSource: Server.DataSource, public options?: IDataItemsViewModelOptions) {
        super();

        this.searchManager = new Searches.SearchManager(this);
        if (options && options.jumpToSearchUri && options.jumpToSearchProperty) {
            this.jumpToSearch = new Searches.JumpToSearch(options.jumpToSearchUri, options.jumpToSearchProperty, this);
        }

        this.dataSource.onError(e => this.onDataSourceError(e));
        this.dataSource.refreshed(() => this.dataSourceRefreshed());

        if (this.jumpToSearch) {
            this.selectedItem.guarded.subscribe(entity => {
                if (entity) {
                    this.requestNavigate.request(entity);
                }
            });
        }

        if (options && options.wizzardViewBuilder) {
            this.wizzardDialogManager = new Wizzard.WizzardDialogManager(dataSource, options.wizzardViewBuilder, options.wizzardSaveDraft);
        }

        if (options && options.queryFilter) {
            this.queryFilter = new Filters.QueryFilterManager(options.queryFilter, this.dataSource);
        }

        //this.messageQueue = _app.Jigsaw.Messages.createMessageQueue(
        //     (options && options.messageQueueType) || _app.Jigsaw.Messages.MessageQueueType.Small);

        this.messageQueue = new _app.Jigsaw.Messages.SmallBoxPrevNextMessageQueue();
    }

    private dataSourceRefreshed() {
        if (this.dataSource.data.length === 0) {
            if (this.searchManager.searchType() === Searches.SearchType.Simple) {
                this.messageQueue.clear().add({
                    title: "Info",
                    body: "No results found for search term '" + this.searchManager.simpleSearchQuery() + "' please enter a new search term or cancel the search.",
                    level: _app.Jigsaw.Messages.MessageLevel.Info
                });
            } else if (this.searchManager.searchType() === Searches.SearchType.Advanced) {
                this.messageQueue.clear().add({
                    title: "Info",
                    body: "No results found for your advanced search. Please check your values or cancel the search.",
                    level: _app.Jigsaw.Messages.MessageLevel.Info
                });
            }

        }
    }

    /** this will be called when there's a server error on the datasource. 
    this should notify the used through a message on the messageQueue */
    private onDataSourceError(e) {
        // check if the error is on the rules 
        try {
            var details = JSON.parse(e.detail.ExceptionMessage);
            if (details.ClientInvalidData) {
                this.searchManager.searchWidget().loadInvalids(details.ClientInvalidData);
                this.messageQueue.add({
                    title: "Error",
                    body: "There's an error with the rules selected, check them.",
                    level: _app.Jigsaw.Messages.MessageLevel.Error
                });
                return;
            }
        } catch (__) {

        }

        this.messageQueue.add({
            title: "Error",
            body: e.message,
            level: _app.Jigsaw.Messages.MessageLevel.Error
        });
    }

    createEntity(): breeze.Entity {
        return this.dataSource.createEntity();
    }

    addNew() {
        var entity = this.createEntity();

        // mark the entity as selected, some other viewmodel should listen for this change
        // and only allow this item to be unselected when it has been added or removed.
        return this.selectedItem.inject(entity);
    }

    addNewWizzard() {
        return this.showWizzardDialog();
    }

    showWizzardDialog(entity?: breeze.Entity) {
        // check that the wizzard dialog manager has been initialized
        if (!this.wizzardDialogManager) {
            return Q.reject(new Error('no viewbar template specified to build a wizzard'));
        }
        
        return this.wizzardDialogManager.showDialog(entity);
    }

    openWizzard(entityDraft: breeze.Entity) {
        // check that the wizzard dialog manager has been initialized
        if (!this.wizzardDialogManager) {
            return Q.reject(new Error('no viewbar template specified to build a wizzard'));
        }

        // unselect current item to avoid unsaved changes problems later
        return this.selectedItem.inject(null)
            .then(() => this.wizzardDialogManager.showDialog(entityDraft));
    }

    filter(parameter) {
        return this.queryFilter.updateFilter(parameter);
    }

    /** this should be called when the containing module is re-loaded, to ensure 
    all properties are set to it's original state */
    reset() {
        //this.selectedItem(null);
        this.searchManager.reset();
        if (this.queryFilter) {
            this.queryFilter.parameters.removeAll();
        }
    }

    /** triggers the excel export of the current view on the server if the excel export
    path was specified. */
    excelExport() {
        if (this.options && this.options.excelExportPath) {
            var query = this.dataSource.currentQuery.skip(null).take(null),
                searchOptions = Server.getQueryOptions(query, this.dataSource.entityType);

            searchOptions['columns'] = this.activeColumns();

            return _app.ajax.fileDownload(this.options.excelExportPath, searchOptions);
        }
    }

    excelPageExport() {
        if (this.options && this.options.excelExportPath) {
            var query = this.dataSource.currentQuery,
                searchOptions = Server.getQueryOptions(query, this.dataSource.entityType);
            
            searchOptions['columns'] = this.activeColumns();

            return _app.ajax.fileDownload(this.options.excelExportPath, searchOptions);
        }
    }

    excelChooseColumnsExport() {
        if (this.options && this.options.excelExportPath) {
            var columns = Server.Kendo.getColumns(this.dataSource.entityType, this.options.columns);

            return Chooser.showColumnsChooserDialog(columns)
                .then(model => {
                    if (model) {
                        var query = this.dataSource.currentQuery;

                        if (model.allPages) {
                            query = query.skip(null).take(null);
                        } else {
                            query = query
                                .skip(this.dataSource.options.pageSize * (model.pageFrom-1))
                                .take(this.dataSource.options.pageSize * (model.pageTo - model.pageFrom + 1));
                        }

                        var searchOptions = Server.getQueryOptions(query, this.dataSource.entityType);

                        searchOptions['columns'] = _.map(model.columns, col => col.field);
                        searchOptions['includeHeaders'] = model.includeHeaders;

                        return _app.ajax.fileDownload(this.options.excelExportPath, searchOptions);
                    }
                });

        }
    }
}

export interface IDataPopupOptions {
    readOnly?: boolean;
}

export interface IDataPopup {
    show(entity: breeze.Entity, dataSource: Server.DataSource, options?: IDataPopupOptions): Q.Promise<any>;
}

export interface DataEditViewModelBaseOptions {
    /** should reference to a service that when called returns the spec for the forms
    to display the metadata, and upon post updates that metadata  */
    metaBuilderUrl?: string;

    /** returns a reference to a service that when called returns the associated metadata
    for the passed entity, also upon post updates the object metadata. */
    metaUrl?: string;

    wordExportUrl?: string;
    pdfExportUrl?: string;

    messageQueueType?: _app.Jigsaw.Messages.MessageQueueType;
}

/** represent the base viewmodel of the view responsable of displaying an observable stream */
export class DataEditViewModelBase extends _app.Common.ViewModelBase {
    item: KnockoutComputed<breeze.Entity>;
    messageQueue: _app.Jigsaw.Messages.MessageQueue;

    isReadOnly = ko.observable(false);
    private _itemHasChangedWhileSelected = false;

    /** when true validation errors sould be displayed on the screen */
    forceValidationErrors = ko.observable(false);
    /* function used to show a message box, can be replaced for testing purposes */
    showMessageBox = text => _app.Views.smartMessage({ title: '', content: text });

    constructor(selectedItem: GuardedObservable<breeze.Entity>, public dataSource: Server.DataSource,
    public options?: DataEditViewModelBaseOptions) {
        super();

        this.item = selectedItem.guarded;
        selectedItem.guard((_?, silent=false) => this.promiseItemChange(silent));

        // track only the changes made to an entity while it was selected, this will be usefull for offline
        var item = selectedItem.guarded(),
            subscription: number;
        selectedItem.guarded.subscribe(newItem => {
            // clean old item
            if (item) {
                item.entityAspect.propertyChanged.unsubscribe(subscription);
                this._itemHasChangedWhileSelected = false;
            }

            if (newItem) {
                // attach to new item
                subscription = newItem.entityAspect.propertyChanged.subscribe(() => this.currentItemPropertyChanged());
            }

            item = newItem;
            this.forceValidationErrors(false);
        });

        // Inline by default
        this.messageQueue = _app.Jigsaw.Messages.createMessageQueue(options && options.messageQueueType);
    }

    /** called when a property of the currently selected item is changed */
    currentItemPropertyChanged () {
        this._itemHasChangedWhileSelected = true;
    }

    save(): Q.Promise<any> {
        if (this.item().entityAspect.validateEntity()) {
            return <any>this.dataSource.saveChanges()
                .then(() => {
                    this.messageQueue.add({
                        title: "Success",
                        body: "item saved successfully",
                        level: _app.Jigsaw.Messages.MessageLevel.Success
                    });
                    this._itemHasChangedWhileSelected = false;
                    return true;
                })
                .fail((e) => {
                    this.messageQueue.add({
                        title: "Error",
                        body: "process server error...",
                        level: _app.Jigsaw.Messages.MessageLevel.Error
                    });
                    return Q.reject();
                });
        } else {
            // force the display of all validation errors
            this.forceValidationErrors(true);
            return Q.reject();
        }
    }

    saveAndClose(): Q.Promise<any> {
        return this.save().then(() => this.close());
    }

    /** closes whathever is editing the current entity */
    close(): Q.Promise<any> {
        return this.promiseItemChange();
        // overwrite in derived class to actually close the region
    }

    /** returns true if the currently selected item has been modified while it was selected,
    and the user should consider before changing the currently selected item */
    private itemHasBeenModifiedWhileSelected() {
        return this.item() && this.item().entityAspect.entityState.isAddedModifiedOrDeleted() && this._itemHasChangedWhileSelected;
    }

    /** returns a promise that is resolved if the current item can be changed,
    otherwise it should fail. Q(true) = YES, Q(false) = NO, Q.reject() = CANCEL */
    promiseItemChange(silent=false): Q.Promise<any> {
        if (this.itemHasBeenModifiedWhileSelected()) {
            if (!silent) {
                return this.showMessageBox("Current item has changed, do you want to save changes?")
                    .then(result => {
                        if (result === _app.Views.MessageBoxResult.Yes) {
                            return this.save();
                        } else if (result === _app.Views.MessageBoxResult.No) {
                            // reject changes and procceed with the change
                            this.item().entityAspect.rejectChanges();
                            return Q(true);
                        } else {
                            // cancel the selection, make the observable fail by throwing an error
                            return Q.reject();
                        }
                    });

            } else {
                return Q.reject();
            }
        }

        return Q(true);
    }

    /** returns an object containing the key properties of the selected item, can be 
    used to send as parameters to the server */
    private getKeyPropertyOptions() {
        var entity = this.item(),
            options = {};

        if (!entity) {
            throw new Error('Some item must be selected');
        }

        // pass key data properties as options to the server, to select the entity
        _.each(this.item().entityType.dataProperties, property => {
            if (property.isPartOfKey) {
                options[property.name] = entity[property.name]();
            }
        });

        return options;
    }

    wordExport() {
        if (!this.options.wordExportUrl) {
            throw new Error('Not supported, the word export server address has not been specified.');
        }

        return _app.ajax.fileDownload(this.options.wordExportUrl, this.getKeyPropertyOptions());
    }

    pdfExport() {
        if (!this.options.pdfExportUrl) {
            throw new Error('Not supported, the pdf export server address has not been specified.');
        }

        return _app.ajax.fileDownload(this.options.pdfExportUrl, this.getKeyPropertyOptions());
    }
}

export interface IDataEditViewModelOptions extends DataEditViewModelBaseOptions {
    dataPopup?: IDataPopup;

    /** set's the initial value of the read only */
    readOnly?: boolean;
}

/** Base view model for the panel bar */
export class DataEditViewModel extends DataEditViewModelBase {
    options: IDataEditViewModelOptions;

    constructor(itemsViewModel: DataItemsViewModel, options?: IDataEditViewModelOptions) {
        super(itemsViewModel.selectedItem, itemsViewModel.dataSource, options);

        this.item.subscribe(item => {
            if (item != null) {
                // clear all messages when the selected item is changed
                this.messageQueue.clear();
                this.show().done();
            } else {
                this.close().done();
            }
        });

        if (options && options.readOnly) {
            this.isReadOnly(options.readOnly);
        }
    }

    show(): Q.Promise<any> {
        // overwrite in derived class to show the region
        //throw new Error("not implemented");
        return Q(true);
    }

    showInPopup() {
        return this.options.dataPopup.show(this.item(), this.dataSource);
    }

    showInPopupReadOnly() {
        return this.options.dataPopup.show(this.item(), this.dataSource, { readOnly: true });
    }
}

/** represents a viewmodel to edit an entity in a windows */
export class DataPopupViewModel extends DataEditViewModelBase {
    entity: breeze.Entity;
    window: _app.Views.WindowView;

    customCommands: _app.Jigsaw.Ribbon.MenuSet;

    constructor(entity: breeze.Entity, dataSource: Server.DataSource, window: _app.Views.WindowView, options?: DataEditViewModelBaseOptions) {
        this.entity = entity;
        this.window = window;

        var selectedItem = ko.guarded<breeze.Entity>();
        super(selectedItem, dataSource, options);

        selectedItem(entity);
        this.customCommands = new _app.Jigsaw.Ribbon.MenuSet();
    }

    close() {
        return super.close()
            .then(() => this.window.close());
    }
}

/** given an entity and some options, this class shows a window */
export class DataPopupManager implements IDataPopup {

    constructor(private windowBuilder: () => _app.Views.WindowView) {

    }

    show(entity: breeze.Entity, dataSource: Server.DataSource, options?: IDataPopupOptions) {
        var window = this.windowBuilder(),
            viewModel = new DataPopupViewModel(entity, dataSource, window);

        if (options) {
            viewModel.isReadOnly(options.readOnly);
        }

        return window.showDialog();
    }
}


export interface IPanelBarEditViewModelOptions extends IDataEditViewModelOptions {
    panelBarViewModel: _app.Jigsaw.Layout.ViewbarSizeController;
}

/** represents an EditViewModel that is shown on a collapsable/expandable layout form */
export class PanelBarEditViewModel extends DataEditViewModel {
    options: IPanelBarEditViewModelOptions;

    constructor(itemsViewModel: DataItemsViewModel, options: IPanelBarEditViewModelOptions) {
        super(itemsViewModel, options);
    }

    close() {
        return super.close().then(() => this.options.panelBarViewModel.collapseViewbar());
    }

    show() {
        return this.options.panelBarViewModel.expandViewbar();
    }
}


export module VersionPager {

    export interface EntityApproval {
        ApprovedBy: KnockoutObservable<string>;
        ApprovedDate: KnockoutObservable<Date>;
    }

    export interface EntityVersion extends breeze.Entity {
        Guid: KnockoutObservable<string>;

        Entity: KnockoutObservable<breeze.Entity>;

        ModifiedBy: KnockoutObservable<string>;
        ModifiedDate: KnockoutObservable<Date>;

        Audit: KnockoutObservable<string>;
        Approval: KnockoutObservableArray<EntityApproval>;

        /** returns the last person that approved the entity, this property is assigned on the client side */
        ApprovedBy: KnockoutObservable<string>;

        /** returns the last date when the entity was approved, this property is assigned on the client side */
        ApprovedDate: KnockoutObservable<Date>;

        /** */
        ApprovalWorkflow: KnockoutComputed<string>;
    }

    export interface EntityVersionTracker extends breeze.Entity {
        Guid: KnockoutObservable<string>;

        Current: KnockoutObservable<EntityVersion>;
        Pending: KnockoutObservableArray<EntityVersion>;
        Historical: KnockoutObservableArray<EntityVersion>;

        /** unmapped property assigned on the client side, returns true if there's any pending version */
        HasPending: KnockoutComputed<boolean>;

        CreatedBy: KnockoutComputed<string>;
        CreatedDate: KnockoutComputed<Date>;
    }

    export interface DataSourceOptions extends Server.DataSourceOptions {
        /** contains the name of the type being versioned */
        versionedTypeName: string;

        /** contains the name of the entity version type name associated */
        entityVersionTypeName: string;
    }

    export class DataSource extends Server.DataSource {
        options: DataSourceOptions;

        constructor(options: DataSourceOptions) {
            super(options);
        }

        configureEntity() {
            super.configureEntity();
            
            // register initializer for the entity version type
            this.manager.metadataStore.registerEntityTypeCtor(this.options.versionedTypeName, null, x=> this.initializeVersionedEntity(x));

            this.manager.metadataStore.registerEntityTypeCtor(this.options.entityVersionTypeName, null, x => this.initializeEntityVersion(<any>x));
        }

        entityBuilder() {
            return function versionTracker() {
                //this.HasPending = false;
            };
        }

        initializeEntity(entity: EntityVersionTracker) {
            super.initializeEntity(entity);
            
            entity.HasPending = ko.computed(() => entity.Pending().length > 0);

            entity.CreatedBy = ko.computed(() => {
                var hystorical = entity.Historical();
                return (hystorical.length && _.last(hystorical).ModifiedBy()) || (entity.Current() && entity.Current().ModifiedBy());
            });
            entity.CreatedDate = ko.computed(() => {
                var hystorical = entity.Historical();
                return (hystorical.length && _.last(hystorical).ModifiedDate()) || (entity.Current() && entity.Current().ModifiedDate());
            });

        }

        initializeEntityVersion(entity: EntityVersion) {
            entity.ApprovedBy = ko.computed(() => entity.Approval().length && _.last(entity.Approval()).ApprovedBy());
            entity.ApprovedDate = ko.computed(() => entity.Approval().length && _.last(entity.Approval()).ApprovedDate());

            // returns PENDING if there's an approval workflow and the lasst approval hasn't been made
            entity.ApprovalWorkflow = ko.computed(() => entity.Approval().length && !_.last(entity.Approval()).ApprovedDate()
                ? "Pending" : "Fully Approved");
        }

        initializeVersionedEntity(entity: breeze.Entity) {
            Server.EntitySetup.init(entity);
        }
    }

    export enum VersionType {
        Current, Pending, Historical
    }

    export interface VersionTrackerManagerOptions {
        tracker: GuardedObservable<EntityVersionTracker>;

        approveUri: string;
        rejectUri: string;
        revertUri: string;

        dataSource: Server.DataSource;
    }

    export class VersionTrackerManager {
        private _versionChangedWhileSelected = false;
        selectedVersion = ko.guarded<EntityVersion>();
        versionType: KnockoutComputed<VersionType>;
        tracker: GuardedObservable<EntityVersionTracker>;

        constructor(public options: VersionTrackerManagerOptions) {
            var tracker = options.tracker;
            this.tracker = tracker;
            // prevent the selected item from being selected if the current version can't be selected
            tracker.guard((tracker?: EntityVersionTracker) => this.selectedVersion.inject(tracker && tracker.Current()));

            this.selectedVersion.guard(() => this.canUnselectVersion());

            this.versionType = ko.computed(() => {
                var version = this.selectedVersion.guarded();
                if (!tracker() || (tracker().Current() === version)) {
                    return VersionType.Current;
                } else if (_.contains(tracker().Pending(), version)) {
                    return VersionType.Pending;
                } else {
                    return VersionType.Historical;
                }
            });

            var oldVersionEntity: breeze.Entity = null,
                subscription;
            this.selectedVersion.guarded.subscribe(newVersion => {
                if (oldVersionEntity) {
                    oldVersionEntity.entityAspect.propertyChanged.unsubscribe(subscription);
                    this._versionChangedWhileSelected = false;
                }

                oldVersionEntity = newVersion && newVersion.Entity();

                if (oldVersionEntity) {
                    oldVersionEntity.entityAspect.propertyChanged.subscribe(() => this.selectedVersionPropertyChanged());
                }
            });
        }

        selectPending(version: EntityVersion) {
            this.selectedVersion(version);
        }

        selectHystorical(version: EntityVersion) {
            this.selectedVersion(version);
        }

        selectCurrent() {
            this.selectedVersion(this.tracker().Current());
        }

        get currentVersionSelected() {
            return this.tracker() && this.tracker().Current() === this.selectedVersion();
        }

        private selectedVersionPropertyChanged() {
            this._versionChangedWhileSelected = true;
        }

        private selectedVersionHasBeenModifiedWhileSelected() {
            var version = this.selectedVersion.guarded();
            return version && version.Entity().entityAspect.entityState.isAddedModifiedOrDeleted()
                && this._versionChangedWhileSelected;
        }

        private canUnselectVersion(): Q.Promise<any> {
            if (this.selectedVersionHasBeenModifiedWhileSelected()) {
                return _app.Views.smartMessage({ title: '', content: "Current version has changed, do you want to save changes?" })
                    .then(result => {
                        if (result === _app.Views.MessageBoxResult.Yes) {
                            //return this.save();
                        } else if (result === _app.Views.MessageBoxResult.No) {
                            // reject changes for current version
                            this.selectedVersion.guarded().Entity().entityAspect.rejectChanges();
                            return Q(true);
                        } else {
                            // cancel the selection, make the observable fail by throwing an error
                            return Q.reject();
                        }
                    });
            }

            return Q(true);
        }

        private versionAction(uri: string) {
            return _app.ajax.post(uri, {
                    trackerGuid: this.tracker().Guid(),
                    versionGuid: this.selectedVersion().Guid()
                })
                .then(raw => {
                    // updating the dataSource current view will update in turn the current entity
                    return this.options.dataSource.update()
                        .then(() => {
                            // select the current version after the current VersionTracker has been updated
                            this.selectCurrent();
                        });
                });
        }

        approve() {
            return this.versionAction(this.options.approveUri);
        }

        reject() {
            var versionToReject = this.selectedVersion();
            return this.versionAction(this.options.rejectUri)
                .then(() => versionToReject.entityAspect.setDetached());
        }

        revert() {
            return this.versionAction(this.options.revertUri);
        }

    }

    export interface VersionPagerEditViewModelOptions extends IDataEditViewModelOptions {
        approveUri: string;
        rejectUri: string;
        revertUri: string;
    }

    /** extends DataEditViewModelBase with VersionPager related features */
    export class VersionPagerEditViewModel extends DataEditViewModel {
        item: KnockoutComputed<EntityVersionTracker>;
        selectedVersion: KnockoutComputed<EntityVersion>;
        currentEntity: KnockoutComputed<breeze.Entity>;
        trackerManager: VersionTrackerManager;

        constructor(itemsViewModel: DataItemsViewModel, options: VersionPagerEditViewModelOptions) {
            super(itemsViewModel, options);

            this.trackerManager = new VersionTrackerManager({
                tracker: < any > itemsViewModel.selectedItem,
                approveUri: options.approveUri,
                rejectUri: options.rejectUri,
                revertUri: options.revertUri,
                dataSource: itemsViewModel.dataSource
            });
            this.selectedVersion = this.trackerManager.selectedVersion.guarded;

            this.currentEntity = ko.computed(() => this.trackerManager.tracker() && this.trackerManager.tracker().Current().Entity())
                .extend({ rateLimit: 1000 });

            this.selectedVersion.subscribe(() => {
                this.isReadOnly(!this.trackerManager.currentVersionSelected);
            });
        }
    }

    /** helper variable to be used as the column spec for modules that want to
    show the hasPending column on their grid */
    export var hasPendingColumn = {
        title: " ",
        field: 'HasPending',
        nameOnServer: 'HasPending',
        width: "40px",
        template: templates.VersionPagerHasPendingColumn,
        groupable: false, filterable: false, sortable: false
    };


    export interface VersionPagerPanelBarEditViewModelOptions extends VersionPagerEditViewModelOptions {
        panelBarViewModel: _app.Jigsaw.Layout.ViewbarSizeController;
    }

    /** represents an EditViewModel that is shown on a collapsable/expandable layout form */
    export class VersionPagerPanelBarEditViewModel extends VersionPagerEditViewModel {
        options: VersionPagerPanelBarEditViewModelOptions;

        constructor(itemsViewModel: DataItemsViewModel, options: VersionPagerPanelBarEditViewModelOptions) {
            super(itemsViewModel, options);
        }

        close() {
            return super.close().then(() => this.options.panelBarViewModel.collapseViewbar());
        }

        show() {
            return this.options.panelBarViewModel.expandViewbar();
        }
    }

}

export interface DataModuleOptions {
    url: string;
    itemsViewModel: DataItemsViewModel;

    barViewModel?: DataEditViewModel;

    /** returns the title of the breadcrumb group associated with this module */
    breadcrumbTitle?: string;
}

export class DataModule extends _app.Modules.ModuleBase {
    url: string;
    itemsViewModel: DataItemsViewModel;
    barViewModel: DataEditViewModel;

    breadcrumb: _app.Common.Breadcrumb<_app.Jigsaw.CoreModuleBreadcrumbItem>;

    private styleModule = new _app.Jigsaw.Theming.ContentStyleSheet(templates.styles);
    private codeeffectsStylesModule = new _app.Jigsaw.Theming.ContentStyleSheet(templates.codeeffects);

    constructor(public options: DataModuleOptions) {
        super();
        this.url = options.url;
        this.itemsViewModel = options.itemsViewModel;
        this.barViewModel = options.barViewModel;

        this.itemsViewModel.requestNavigate.handle(entity => {
            if (!_app.moduleManager.isLoading) {
                this.navigate(entity, false).done();
            }
        });

        var searchManager = this.itemsViewModel.searchManager;
        if (searchManager) {
            // register loading handlers for the saved searches
            searchManager.savedSearches.loadSearchInteraction.handle((options) => {
                // 1. ensure the module is loaded
                return _app.history.navigateSilent(this.url)
                    .then(() => {
                        searchManager.advancedPanelActive(true);
                        // 2. load the ruleData in the panel
                        searchManager.searchWidget().loadRule(options.search.ruleData);

                        if (options.execute) {
                            // 3. if required execute the search
                            return searchManager.search();
                        }
                    });
            });
        }

        if (options.breadcrumbTitle) {
            var selectedItemTitle = ko.computed(() => {
                    var item = this.itemsViewModel.selectedItem();
                    return item ? item[this.itemsViewModel.jumpToSearch.targetProperty]() : '';
                }),
                selectedItemLink = ko.computed(() => '#' + this.itemLink(this.itemsViewModel.selectedItem()));

            this.breadcrumb = new _app.Common.Breadcrumb<any>({ text: options.breadcrumbTitle, href: '#' + this.url },
                new _app.Common.Breadcrumb({ text: selectedItemTitle, href: selectedItemLink }))
        }
    }

    canUnload(): Q.Promise<boolean> {
        if (this.options.barViewModel) {
            return this.options.barViewModel.promiseItemChange();
        } else {
            return Q(true);
        }
    }

    requiredModules() {
        return super.requiredModules().concat(this.styleModule, this.codeeffectsStylesModule);
    }

    initialize() {
        // register module routes
        _app.history.register(this.url,
            () => _app.moduleManager.load(this)
                .then(() => this.itemsViewModel.selectedItem.inject(null)));

        if (this.itemsViewModel.jumpToSearch && this.itemsViewModel.jumpToSearch.isActive) {
            _app.history.register(this.url + '/' + this.itemsViewModel.jumpToSearch.targetProperty + '/:value', value => {
                return _app.moduleManager.load(this)
                    .then(() => this.itemsViewModel.jumpToSearch.jump(value, -1, true, false));
            });
        }

    }

    itemLink(entity: breeze.Entity) {
        return this.url + DataModule.itemLink(entity, this.itemsViewModel.jumpToSearch.targetProperty)
    }

    static itemLink(entity: breeze.Entity, targetProperty: string) {
        if (entity) {
            var propertyValue = ko.unwrap(entity[targetProperty]);
            return '/' + targetProperty + '/' + propertyValue;
        } else {
            return '';
        }
    }

    /** this can be used to make a quick jump to the entity selected, will be used on the sidebar */
    navigate(entity: breeze.Entity, executeCallback = true) {
        return _app.history.navigateSilent(this.itemLink(entity), executeCallback);
    }
}


export interface BarDataModuleOptions extends DataModuleOptions {
    coreModule: _app.Jigsaw.CoreModuleBase;
    myItemsModule: Sidebar.MyItems.MyItemsModule;
    barViewModel: DataEditViewModel;
}
export class BarDataModule extends DataModule {
    options: BarDataModuleOptions;
    myItemsCollection: Sidebar.MyItems.MyItemsCollection;

    barViewModel: DataEditViewModel; 

    private wizzardStylesModule = new _app.Jigsaw.Theming.ContentStyleSheet(templates.wizzardStyles);

    constructor(options: BarDataModuleOptions) {
        super(options);

        this.barViewModel = options.barViewModel;

        // add styles for the wizzard window
        options.coreModule.addSlave(this.wizzardStylesModule);
    }

    /** executed when an element of the sidebar is clicked, this should be protected */
    sidebarItemNavigate(item: breeze.Entity) {
        if (!item.entityAspect.entityState.isDetached()) {
            this.navigate(item).done();
        } else {
            this.options.itemsViewModel.showWizzardDialog(item).done();;
        }
    }

    /** creates a new MyItemsCollection and register it on the MyItems module, the created set is returned. */
    registerMyItemsSet(optionsParameter: RegisterMyItemsSetOptions) {
        // Create a MyItemsCollection instance
        var myItems = new Sidebar.MyItems.MyItemsCollection({
                entityType: this.options.itemsViewModel.dataSource.typeName,
                render: () => new _app.Marionette.View({ template: optionsParameter.itemTemplate }),
                navigate: (item: breeze.Entity) => {
                    if (!item.entityAspect.entityState.isDetached()) {
                        this.navigate(item).done();
                    } else {
                        this.options.itemsViewModel.showWizzardDialog(item).done();;
                    }
                },
                dataSource: this.options.itemsViewModel.dataSource
            }),
            itemTitleView = new _app.Marionette.View({ template: optionsParameter.itemTitleTemplate });

        this.options.myItemsModule.registerSet(itemTitleView, myItems);

        if (optionsParameter.styles) {
            /** these styles are applied to the customer items that are visible on the MyCustomers
            section in the sidebar. This stylesheet is loaded as a slave of the MyItems module. */
            var stylesModule = new _app.Jigsaw.Theming.ContentStyleSheet(optionsParameter.styles);
            // this styles enhaces my customers items and must be loaded if the sidebar is loaded
            this.options.myItemsModule.addSlave(stylesModule);
        }

        return myItems;
    }

}

/** options for the method DesktopDataModule.registerMyItemsSet() */
export interface RegisterMyItemsSetOptions {
    itemTitleTemplate: _app.Marionette.TemplateFunction;
    itemTemplate: _app.Marionette.TemplateFunction;
    styles?: string;
}

