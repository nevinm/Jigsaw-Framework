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
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", '../app', 'templates/data', '../../codeeffects/codeeffects'], function(require, exports, _app, templates, codeeffects) {
    if (codeeffects) {
    }

    (function (Server) {
        (function (EntitySetup) {
            function addValidationRules(entity) {
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
                            };
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
                            };
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
            function init(entity) {
                addValidationRules(entity);
            }
            EntitySetup.init = init;
        })(Server.EntitySetup || (Server.EntitySetup = {}));
        var EntitySetup = Server.EntitySetup;

        

        

        

        /**  */
        var DataSource = (function () {
            function DataSource(options) {
                this.data = [];
                this._queryLevels = [];
                this._offlineFilters = [];
                this.page = ko.guarded();
                this._refreshEvent = new _app.Common.Event();
                /** event occurs after a query has been performed */
                this._refreshedEvent = new _app.Common.Event();
                this._errorCallback = $.Callbacks();
                this.pending = ko.observableArray();
                this.options = _.defaults(options, {
                    cacheData: true,
                    pageSize: 10
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
                        var metadata = localStorage.getItem(this.offlineMetadataCacheKey());

                        // import the metadata before importing the entities, the metadata may be cached
                        // even if there're no entities yet, as it's determined per service address
                        this.manager.metadataStore.importMetadata(metadata);
                    }

                    // load previously cached data
                    var cachedData = localStorage.getItem(this.offlineCacheKey());
                    if (cachedData) {
                        this.manager.importEntities(cachedData);
                        this.updateNotificationsFromManager();
                    }
                }
            }
            Object.defineProperty(DataSource.prototype, "entityType", {
                get: function () {
                    return this.manager.metadataStore.getEntityType(this.typeName);
                },
                enumerable: true,
                configurable: true
            });

            DataSource.prototype.refreshed = function (handler) {
                return this._refreshedEvent.add(handler);
            };

            /** Notifies interested parties that the datasource needs to be refreshed, most likely
            because some of the queries in the query layers had changed */
            DataSource.prototype.refresh = function (handler) {
                if (handler) {
                    return this._refreshEvent.add(handler);
                } else {
                    this._refreshEvent.fire();
                    return null;
                }
            };

            /** refreshes the DataShource and returns a promise that is resolved after the operation completes */
            DataSource.prototype.update = function (mergeStrategy) {
                var defer = Q.defer(), disposable = this.refreshed(refreshedHandler);

                this.refresh();

                return defer.promise;

                function refreshedHandler() {
                    disposable.dispose();
                    defer.resolve(true);
                }
            };

            /** Extends the given breeze entity so the ko observable properties
            have validation metadata */
            DataSource.prototype.configureEntity = function () {
                var _this = this;
                var initializer = function (entity) {
                    _this.initializeEntity(entity);
                };

                this.manager.metadataStore.registerEntityTypeCtor(this.typeName, this.entityBuilder(), initializer);
            };

            /** returns a function that will be used as the type for the entities in the data source */
            DataSource.prototype.entityBuilder = function () {
                return function builder() {
                };
            };

            /** this method is executed once for each new entity arriving to the manager, should initialize it */
            DataSource.prototype.initializeEntity = function (entity) {
                EntitySetup.init(entity);
            };

            DataSource.prototype.createEntity = function (props) {
                var entity = this.manager.createEntity(this.typeName, props);

                // insert new element at the start of the array
                this.data.splice(0, 0, entity);
                return entity;
            };

            DataSource.prototype.offlineCacheKey = function () {
                return this.manager.serviceName + this.typeName;
            };

            /** cache key used to store the metadata */
            DataSource.prototype.offlineMetadataCacheKey = function () {
                return 'metadata: ' + this.manager.serviceName;
            };

            /** save the actual state of the manager in the application localStorage */
            DataSource.prototype.cacheData = function () {
                if (this.options.cacheData) {
                    // don't include the metadata in the exported string as it will be saved sepparatedly
                    localStorage.setItem(this.offlineCacheKey(), this.manager.exportEntities(null, false));
                }
            };

            DataSource.prototype.projectedQuery = function (level) {
                var endPoint = this.endPoint;

                _.each(this._queryLevels, function (queryLevel) {
                    endPoint = queryLevel(endPoint);
                });

                if (level) {
                    endPoint = level(endPoint);
                }

                endPoint = endPoint.toType(this.typeName);

                return endPoint;
            };

            DataSource.prototype.query = function (level) {
                var _this = this;
                var endPoint = this.projectedQuery(level);

                this.currentQuery = endPoint;

                return _app.ajax.connection.online().then(function (online) {
                    if (online) {
                        return _this.manager.executeQuery(endPoint).then(function (xhr) {
                            _this.data = xhr.results;
                            _this.inlineCount = xhr.inlineCount;

                            // store items on the cache after every query
                            _this.cacheData();

                            return xhr;
                        }).fail(function (e) {
                            if (_app.ajax.isOfflineError(e)) {
                                _app.ajax.connection.disconnect();
                                return _this.queryLocal(endPoint);
                            } else {
                                _this.data = [];
                                _this.inlineCount = 0;

                                // and notify interested partys of the error
                                _this._errorCallback.fire(e);

                                return {
                                    results: [],
                                    inlineCount: 0
                                };
                            }
                        }).finally(function () {
                            _this._refreshedEvent.fire();
                        });
                    } else {
                        return _this.queryLocal(endPoint);
                    }
                });
            };

            /** performs the given query in the local cache */
            DataSource.prototype.queryLocal = function (endPoint) {
                var takeCount = endPoint.takeCount, skipCount = endPoint.skipCount || 0, endPoint = endPoint.take(null).skip(null), offlineItems = this.manager.executeQueryLocally(endPoint);

                // apply offline filters
                _.each(this._offlineFilters, function (filter) {
                    return offlineItems = filter(offlineItems);
                });

                var inlineCount = offlineItems.length;

                if (takeCount) {
                    offlineItems = offlineItems.slice(skipCount, skipCount + takeCount);
                }

                this.data = offlineItems;

                return {
                    results: offlineItems,
                    inlineCount: inlineCount
                };
            };

            DataSource.prototype.onError = function (callback) {
                var _this = this;
                this._errorCallback.add(callback);

                return {
                    dispose: function () {
                        return _this._errorCallback.remove(callback);
                    }
                };
            };

            /** adds a new querylevel to the collection, it will be used to build the
            query before is sent to the server */
            DataSource.prototype.addQueryLevel = function (level, offlineFilter) {
                var _this = this;
                this._queryLevels.push(level);
                if (offlineFilter) {
                    this._offlineFilters.push(offlineFilter);
                }

                return {
                    dispose: function () {
                        _app.Utils.remove(_this._queryLevels, level);
                        if (offlineFilter) {
                            _app.Utils.remove(_this._offlineFilters, offlineFilter);
                        }
                    }
                };
            };

            DataSource.prototype.saveChanges = function (entities) {
                var _this = this;
                return _app.ajax.connection.online().then(function (online) {
                    if (online) {
                        entities = entities || _this.manager.getChanges();

                        return _this.manager.saveChanges(entities).then(function () {
                            _this.updateNotificationsFromManager();
                            _this.cacheData();
                        }).fail(function (error) {
                            // check if the request failed because the server is offline
                            // in which case just cache the data
                            if (_app.ajax.isOfflineError(error)) {
                                _app.ajax.connection.disconnect();
                                _this.updateNotificationsFromManager();
                                _this.cacheData();
                                return true;
                            } else {
                                // assume this is a server validation error and try resaving the entities without errors
                                if (error.entityErrors) {
                                    var entitiesWithErrors = _(error.entityErrors).map(function (serverError) {
                                        return serverError.entity;
                                    }), coolEntities = _.difference(entities, entitiesWithErrors);

                                    if (coolEntities.length) {
                                        // there're some entities that didn't returned any error from the server, try saving those
                                        return _this.saveChanges(coolEntities).fail(function (innerError) {
                                            if (innerError.entityErrors) {
                                                // if the cool entities also had some return both lists concatenated
                                                innerError.entityErrors = _.union(error.entityErrors, innerError);
                                            }
                                            return Q.reject(innerError);
                                        }).then(function () {
                                            return Q.reject(error);
                                        });
                                    }
                                }

                                // otherwise repeat the error
                                return Q.reject(error);
                            }
                        });
                    } else {
                        // application is offline
                        _this.updateNotificationsFromManager();
                        _this.cacheData();
                    }
                });
            };

            DataSource.prototype.rejectChanges = function () {
                this.manager.rejectChanges();
                this.pending.removeAll();
                this.cacheData();
            };

            /** syncronizes all changes with the server */
            DataSource.prototype.sync = function () {
                var _this = this;
                return this.saveChanges().then(function () {
                    // remove all pending notifications
                    _this.pending.removeAll();
                    return true;
                }).finally(function () {
                    return _this.updateCaches();
                }).fail(function () {
                    // catch all errors during sync and update the notifications
                    _this.updateNotificationsFromManager();
                    return true;
                }).then(function () {
                    return _this.refresh();
                });
            };

            DataSource.balanceArray = function (array, maxItems) {
                var numberOfSets = Math.ceil(array.length / maxItems), count = array.length / numberOfSets, result = [];

                for (var i = 0; i < numberOfSets; i++) {
                    result.push(array.slice(i * count, i < numberOfSets - 1 ? (i + 1) * count : array.length - 1));
                }

                return result;
            };

            /** performs a query against the server returning all entities in the cache,
            these get merged with any updated values */
            DataSource.prototype.updateCaches = function () {
                var _this = this;
                var entities = this.manager.getEntities(this.typeName), entitiesBalanced = DataSource.balanceArray(entities, 10), queries = _.map(entitiesBalanced, function (q) {
                    return breeze.EntityQuery.fromEntities(q);
                }), promises = _.map(queries, function (q) {
                    return _this.manager.executeQuery(q);
                });

                return Q.all(promises);
            };

            DataSource.prototype.updateNotificationsFromManager = function () {
                this.pending.removeAll();

                var entities = this.manager.getEntities(this.typeName), notifications = [];
                _.each(entities, function (entity) {
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
            };

            DataSource.prototype.status = function () {
                var unchanged = 0, added = 0, deleted = 0, modified = 0, detached = 0, entities = this.manager.getEntities();

                _.each(entities, function (entity) {
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
            };

            /** fetchs the metadata for the current manager if no metadata has been fetched and
            caches it after, if the cacheData option is setted. */
            DataSource.prototype.fetchMetadata = function () {
                var _this = this;
                if (!this.manager.metadataStore.hasMetadataFor(this.manager.serviceName)) {
                    // check if the metadata has been cached by other module
                    var cachedMetadata = localStorage.getItem(this.offlineMetadataCacheKey());
                    if (cachedMetadata) {
                        this.manager.metadataStore.importMetadata(cachedMetadata);
                        return Q(true);
                    } else {
                        return Metadata.ensureMetadataIsFetched(this.manager).then(function () {
                            // cache the metadata if the option is specified
                            if (_this.options.cacheData) {
                                localStorage.setItem(_this.offlineMetadataCacheKey(), _this.manager.metadataStore.exportMetadata());
                            }

                            return true;
                        });
                    }
                } else {
                    return Q(true);
                }
            };
            return DataSource;
        })();
        Server.DataSource = DataSource;

        /** This function came from the breeze source code, there is named breeze.EntityQuery._toUri,
        this is needed to replicate an OData request to a different endpoint on the server.
        Query options like filter, order by or expand can only be mapped if the entityType is specified. */
        function getQueryOptions(eq, entityType) {
            var queryOptions = {};

            var $skip = toSkipString();
            if ($skip)
                queryOptions['$skip'] = $skip;

            var $top = toTopString();
            if ($top)
                queryOptions['$top'] = $top;

            var $inlinecount = toInlineCountString();
            if ($inlinecount)
                queryOptions['$inlinecount'] = $inlinecount;

            if (entityType) {
                var $filter = toFilterString();
                if ($filter)
                    queryOptions['$filter'] = $filter;

                var $orderby = toOrderByString();
                if ($orderby)
                    queryOptions['$orderby'] = $orderby;

                var $expand = toExpandString();
                if ($expand)
                    queryOptions['$expand'] = $expand;

                var $select = toSelectString();
                if ($select)
                    queryOptions['$select'] = $select;
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
                if (!count)
                    return;
                return count.toString();
            }

            function toTopString() {
                var count = eq.takeCount;
                if (count === null)
                    return;
                return count.toString();
            }

            function toFilterString() {
                var clause = eq.wherePredicate;
                if (!clause)
                    return;
                clause.validate(entityType);
                return clause['toODataFragment'](entityType);
            }

            function toOrderByString() {
                var clause = eq['orderByClause'];
                if (!clause)
                    return;
                return clause['toODataFragment'](entityType);
            }

            function toSelectString() {
                var clause = eq['selectClause'];
                if (!clause)
                    return;
                clause.validate(entityType);
                return clause['toODataFragment'](entityType);
            }

            function toExpandString() {
                var clause = eq['expandClause'];
                if (!clause)
                    return;
                return clause['toODataFragment'](entityType);
            }
        }
        Server.getQueryOptions = getQueryOptions;

        /** fetches a breeze query directly from the server.
        Why not use another EntityManager?? Because an entityManager requires to fetch metadata
        for the entities that it will handle. For simpler cases, and Many types on the server with
        no client metadata this is a better option... like the Notifications use case. */
        function fetchQuery(service, query, entityType) {
            var serviceName = service + '/' + query.resourceName, options = getQueryOptions(query, entityType);
            return _app.ajax.get(serviceName, options).then(function (data) {
                return ({ results: data.Results, inlineCount: data.InlineCount });
            });
        }
        Server.fetchQuery = fetchQuery;

        var DataSourceBase = (function () {
            function DataSourceBase(options) {
                this.options = options;
                this.data = ko.observableArray();
                this.refreshEvent = new _app.Common.Event();
                /** event occurs after a query has been performed */
                this.refreshedEvent = new _app.Common.Event();
                this._queryLevels = [];
                this.options = _.defaults(options, {
                    endPoint: new breeze.EntityQuery()
                });
            }
            DataSourceBase.prototype.replaceData = function (newData) {
                _app.Utils.replaceObservable(this.data, newData);
            };

            DataSourceBase.prototype.addQueryLevel = function (level) {
                var _this = this;
                this._queryLevels.push(level);

                return {
                    dispose: function () {
                        _app.Utils.remove(_this._queryLevels, level);
                    }
                };
            };

            /** returns an EntityQuery resulting from applying all QueryLevels to the endPoint */
            DataSourceBase.prototype.processQueryLevels = function (level) {
                var endPoint = this.options.endPoint;

                _.each(this._queryLevels, function (queryLevel) {
                    endPoint = queryLevel(endPoint);
                });

                if (level) {
                    endPoint = level(endPoint);
                }

                return endPoint;
            };

            DataSourceBase.prototype.query = function (level) {
                throw new Error('abstract: not implemented');
            };

            DataSourceBase.prototype.refreshed = function (handler) {
                if (handler) {
                    return this.refreshedEvent.add(handler);
                } else {
                    this.refreshedEvent.fire();
                    return null;
                }
            };

            /** Notifies interested parties that the datasource needs to be refreshed, most likely
            because some of the queries in the query layers had changed */
            DataSourceBase.prototype.refresh = function (handler) {
                if (handler) {
                    return this.refreshEvent.add(handler);
                } else {
                    this.refreshEvent.fire();
                    return null;
                }
            };

            /** refreshes the DataShource and returns a promise that is resolved after the operation completes */
            DataSourceBase.prototype.update = function () {
                var defer = Q.defer(), disposable = this.refreshed(refreshedHandler);

                this.refresh();

                return defer.promise;

                function refreshedHandler() {
                    disposable.dispose();
                    defer.resolve(true);
                }
            };
            return DataSourceBase;
        })();
        Server.DataSourceBase = DataSourceBase;

        /** Similar to a DataSource but works with plain JS objects, is intended to be used
        in simple modules that doesn't require big modifications to the items returned by the queries.
        And also work with services without metadata.
        Although for complex notifications having Metadata is a good idea, but that might not exist.
        So until then the notifications will be handled as plain JS objects */
        var LightDataSource = (function (_super) {
            __extends(LightDataSource, _super);
            function LightDataSource(options) {
                _super.call(this, _.defaults(options, {
                    namingConvention: breeze.NamingConvention.camelCase
                }));
            }
            LightDataSource.prototype.query = function (level) {
                var _this = this;
                var query = this.processQueryLevels(level), options = getQueryOptions(query);

                return _app.ajax.connection.online().then(function (online) {
                    if (online) {
                        return fetchQuery(_this.options.serviceName, query);
                    } else {
                        return Q.reject('application offline');
                    }
                }).then(function (result) {
                    _this.inlineCount = result.inlineCount;
                    _this.replaceData(result.results);
                    return result;
                }).fail(function (e) {
                    _this.inlineCount = 0;
                    _this.replaceData([]);
                    return { results: [], inlineCount: 0 };
                }).finally(function () {
                    _this.refreshed();
                });
            };
            return LightDataSource;
        })(DataSourceBase);
        Server.LightDataSource = LightDataSource;

        function createManager(serviceName, metadata) {
            var dataService = new breeze.DataService({ serviceName: serviceName }), manager = new breeze.EntityManager({ dataService: dataService });

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
                    manager.metadataStore.importMetadata(customMetadata, true);
                }
            }

            return manager;
        }
        Server.createManager = createManager;

        (function (Metadata) {
            /** extracts any custom metadata received from the server. this metadata can be imported
            into a metadataStore by setting the allowMerge parameter to true */
            function extractCustomMetadata(metadata) {
                return {
                    structuralTypes: _(metadata.schema.entityType).filter(function (type) {
                        return _.any(type.property, function (p) {
                            return !!p.custom;
                        });
                    }).map(function (typeMetadata) {
                        var propertiesWithCustomMetadata = _(typeMetadata.property).filter(function (property) {
                            return !!property.custom;
                        });
                        return {
                            shortName: typeMetadata.name,
                            namespace: metadata.schema.namespace,
                            dataProperties: _.map(propertiesWithCustomMetadata, function (propertyMetadata) {
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
            Metadata.extractCustomMetadata = extractCustomMetadata;

            function ensureMetadataIsFetched(manager) {
                return manager.metadataStore.hasMetadataFor(manager.serviceName) ? Q(true) : manager.fetchMetadata().then(function (metadata) {
                    if (!metadata.schema)
                        return;

                    // for some reason breeze doesn't import any custom metadata
                    // when the query is fetched, that's why all custom metadata is
                    // extracted and injected into the metadataStore
                    // IMPORTANT!! this might NOT be necessary for future versions of breeze
                    var customMetadata = extractCustomMetadata(metadata);
                    manager.metadataStore.importMetadata(customMetadata, true);

                    return Q.delay(true, 0);
                });
            }
            Metadata.ensureMetadataIsFetched = ensureMetadataIsFetched;
        })(Server.Metadata || (Server.Metadata = {}));
        var Metadata = Server.Metadata;

        

        /** Contains general method, these are glue code between knockout and breeze. */
        (function (Kendo) {
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

            var BreezeTransport = (function () {
                function BreezeTransport(options) {
                    var _this = this;
                    this.options = options;
                    /** can be used to block read operations making the transport, to resolve the previous
                    retrieved results, this is used in conjunction with the BreezeDataSource.readLocal method */
                    this.localQuery = false;
                    this.propertyPaths = {};
                    this.keyPropertyNames = keyPropertyNames(options.dataSource.entityType);
                    this.dataSource = options.dataSource;

                    this.columns = options.columns || _.map(this.dataSource.entityType.dataProperties, function (property) {
                        return property.name;
                    });

                    // store property paths to retrieve the original paths when needed
                    _.each(this.columns, function (property) {
                        var field = normalizePropertyPath(property);
                        _this.propertyPaths[field] = property;
                    });
                }
                BreezeTransport.prototype.mapEntityToJs = function (entity) {
                    var result = {};
                    _.each(this.keyPropertyNames, include);
                    _.each(this.columns, include);

                    return result;

                    function include(property) {
                        var field = normalizePropertyPath(property);
                        result[field] = getPropertyValue(entity, property);
                    }
                };

                BreezeTransport.prototype.mapToJs = function (results) {
                    var _this = this;
                    return _.map(results, function (entity) {
                        return _this.mapEntityToJs(entity);
                    });
                };

                BreezeTransport.prototype.getEntityForModel = function (model) {
                    if (model) {
                        return Kendo.findItem(model, this.options.dataSource.data, this.keyPropertyNames);
                    } else {
                        return null;
                    }
                };

                BreezeTransport.prototype.read = function (options) {
                    var _this = this;
                    if (this.localQuery) {
                        var payload = {
                            data: this.mapToJs(this.options.dataSource.data),
                            total: this.options.dataSource.inlineCount
                        };

                        options.success(payload);
                        return true;
                    }

                    var modifyQuery = function (query) {
                        var orderVal = _this.options.defaultSort, sortOps = options.data.sort, filterOps = options.data.filter;

                        // apply Sorting
                        if (sortOps && sortOps.length > 0) {
                            orderVal = ''; // reset orderBy
                            for (var i = 0; i < sortOps.length; i++) {
                                if (i > 0) {
                                    orderVal += ",";
                                }
                                orderVal += _this.propertyPaths[sortOps[i].field] + " " + sortOps[i].dir;
                            }
                        }
                        if (orderVal) {
                            query = query.orderBy(orderVal);
                        }

                        // apply filtering
                        if (filterOps && filterOps.filters.length > 0) {
                            for (var x = 0; x < filterOps.filters.length; x++) {
                                query = query.where(_this.propertyPaths[filterOps.filters[x].field], mapOperator(filterOps.filters[x].operator), filterOps.filters[x].value);
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
                    };

                    this.options.dataSource.query(modifyQuery).then(function (xhr) {
                        var payload = {
                            data: _this.mapToJs(xhr.results),
                            total: xhr.inlineCount
                        };

                        options.success(payload); // notify the DataSource that the operation is complete

                        return true;
                    }).done();
                };

                BreezeTransport.prototype.create = function (options) {
                    //console.log('breeze transport CREATE', options);
                    var entity = this.options.dataSource.createEntity(options.data), payload = { data: this.mapEntityToJs(entity) };
                    options.success(payload);
                };

                BreezeTransport.prototype.update = function (options) {
                    //console.log('breeze transport UPDATE', options);
                    var originalElement = this.getEntityForModel(options.data);
                    if (originalElement) {
                        for (var property in options.data) {
                            if (originalElement[property] && ko.isObservable(originalElement[property]) && options.data[property] != null && options.data[property] != originalElement[property]()) {
                                // and set each property in the original object
                                originalElement[property](options.data[property]);
                            }
                        }
                    }
                    options.success(options);
                };

                BreezeTransport.prototype.destroy = function (options) {
                    //console.log('breeze transport DESTROY', options);
                    var originalElement = this.getEntityForModel(options.data);
                    if (originalElement) {
                        originalElement.entityAspect.setDeleted();
                    }
                    options.success(options);
                };
                return BreezeTransport;
            })();
            Kendo.BreezeTransport = BreezeTransport;

            /** serves as a gateway between Jigsaw's DataSource and KendoUI's DataSource */
            var BreezeDataSource = (function (_super) {
                __extends(BreezeDataSource, _super);
                function BreezeDataSource(options) {
                    var transportOptions = {
                        dataSource: options.dataSource,
                        defaultSort: options.defaultSort,
                        columns: options.columns
                    }, transport = new BreezeTransport(transportOptions), dataSourceOptions = _.defaults(options, {
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
                        total: "total"
                    });

                    _super.call(this, dataSourceOptions);

                    this.keyPropertyNames = Kendo.keyPropertyNames(options.dataSource.entityType);
                    this.transport = transport;

                    this.manager = options.dataSource.manager;
                }
                /** performs a read operation, but the transport will return the latest results
                that where retrieved */
                BreezeDataSource.prototype.readLocal = function () {
                    this.transport.localQuery = true;
                    this.read();
                    this.transport.localQuery = false;
                };

                BreezeDataSource.prototype.getModelForEntity = function (entity) {
                    return findItem(entity, this.data(), this.keyPropertyNames);
                };

                BreezeDataSource.prototype.getEntityForModel = function (model) {
                    return this.transport.getEntityForModel(model);
                };
                return BreezeDataSource;
            })(kendo.data.DataSource);
            Kendo.BreezeDataSource = BreezeDataSource;

            /** serves as a gateway between Jigsaw's LightDataSource and KendoUI's DataSource */
            var BreezeLightDataSource = (function (_super) {
                __extends(BreezeLightDataSource, _super);
                function BreezeLightDataSource(dataSource) {
                    _super.call(this, {
                        pageSize: 10,
                        serverPaging: true,
                        serverSorting: true,
                        serverFiltering: true,
                        serverGrouping: false,
                        schema: {
                            data: "data",
                            total: "total"
                        },
                        transport: {
                            read: function (options) {
                                var level = function (query) {
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

                                dataSource.query(level).then(function (xhr) {
                                    var payload = {
                                        data: xhr.results,
                                        total: xhr.inlineCount
                                    };
                                    options.success(payload); // notify the DataSource that the operation is complete
                                    return true;
                                }).done();
                            }
                        }
                    });
                    this.dataSource = dataSource;
                }
                return BreezeLightDataSource;
            })(kendo.data.DataSource);
            Kendo.BreezeLightDataSource = BreezeLightDataSource;

            function getLastPropertyName(propertyPath) {
                var index = propertyPath.lastIndexOf('.');
                if (index > 0) {
                    return propertyPath.substring(index + 1);
                } else {
                    return propertyPath;
                }
            }
            Kendo.getLastPropertyName = getLastPropertyName;

            /** returns the value of a property, tracking a property path */
            function getPropertyValue(entity, propertyPath) {
                if (!propertyPath) {
                    throw new Error('the property path must be specified to be able to retrieve its value from an entity');
                }

                var property = propertyPath.split('.', 1)[0], remainingPath = propertyPath.substring(property.length + 1), value = ko.unwrap(entity[property]);

                if (!remainingPath) {
                    return value;
                } else {
                    return getPropertyValue(value, remainingPath);
                }
            }
            Kendo.getPropertyValue = getPropertyValue;

            /** returns the type of a property, tracking a property path */
            function getPropertyInfo(entityType, propertyPath) {
            }
            Kendo.getPropertyInfo = getPropertyInfo;

            function typeString(type) {
                switch (type) {
                    case breeze.DataType.Binary:
                        return "string";
                    case breeze.DataType.Boolean:
                        return "boolean";
                    case breeze.DataType.Byte:
                        return "number";
                    case breeze.DataType.DateTime:
                        return "date";
                    case breeze.DataType.Decimal:
                        return "number";
                    case breeze.DataType.Double:
                        return "number";
                    case breeze.DataType.Guid:
                        return "string";
                    case breeze.DataType.Int16:
                        return "number";
                    case breeze.DataType.Int32:
                        return "number";
                    case breeze.DataType.Int64:
                        return "number";
                    case breeze.DataType.Single:
                        return "number";
                    case breeze.DataType.String:
                        return "string";
                }
            }
            Kendo.typeString = typeString;

            function propertyHasValidatorWithName(property, validatorName) {
                return _.any(property.validators, function (validator) {
                    return validator['name'] === validatorName;
                });
            }

            /** builds a validation object from the set of validators for the given property */
            function getKendoValidatorOptionsForProperty(property) {
                var validation = {};

                _.each(property.validators, function (validator, i) {
                    var validatorName = 'breezevalidator' + i;

                    function validate(input) {
                        var value = input.val(), error = validator.validate(value, { displayName: property.name });

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
            function getModel(entityType) {
                var fields = {};

                _.each(entityType.dataProperties, function (property) {
                    var type = Kendo.typeString(property.dataType);
                    if (type) {
                        fields[property.nameOnServer] = {
                            type: type,
                            validation: getKendoValidatorOptionsForProperty(property),
                            defaultValue: property.defaultValue
                        };
                    }
                });

                return {
                    id: keyPropertyNames(entityType)[0],
                    fields: fields
                };
            }
            Kendo.getModel = getModel;

            function normalizePropertyPath(propertyPath) {
                return propertyPath.replace(/\./g, '');
            }
            Kendo.normalizePropertyPath = normalizePropertyPath;

            function refreshWhenSave(dataSource, manager) {
                var key = manager.hasChangesChanged.subscribe(managerHasChangesChanged), previousValue = false;

                return {
                    dispose: function () {
                        manager.hasChangesChanged.unsubscribe(key);
                    }
                };

                function managerHasChangesChanged(e) {
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
            Kendo.refreshWhenSave = refreshWhenSave;

            /** creates an array with the column specification from a breeze IStructuralType */
            function getColumns(entityType, columns) {
                return _.map(columns, function (field) {
                    // only retrieve the columns passed as strings, if a column spec is passed
                    // just return it
                    if (!_.isString(field))
                        return field;

                    // check if the field includes the column template
                    // that is passed as FieldName: template string
                    var templateOptions = {}, kendoColumn, index = field.indexOf(":");
                    if (index >= 0) {
                        templateOptions = JSON.parse(field.substring(index + 1));
                        field = field.substring(0, index);
                    }

                    var property = entityType.getProperty(field);
                    if (property) {
                        var customMetadata = property['custom'], displayName = customMetadata && customMetadata['displayName'], columnField = normalizePropertyPath(field), columnTitle = displayName || getLastPropertyName(field);

                        kendoColumn = { field: columnField, title: columnTitle };
                    } else {
                        // The specified property may not be part of the metadata, as it might be a calculated
                        // property setted on the client side on the entity constructor
                        kendoColumn = {
                            field: field, groupable: false, filterable: false, sortable: false
                        };
                    }

                    _.defaults(kendoColumn, {
                        nameOnServer: field,
                        template: templateOptions.template && _.template(templateOptions.template)
                    }, templateOptions);

                    return kendoColumn;
                });
            }
            Kendo.getColumns = getColumns;

            /** returns a filtered list with the properties that are part of a key */
            function keyProperties(entityType) {
                return _(entityType.dataProperties).filter(function (property) {
                    return property.isPartOfKey;
                });
            }
            Kendo.keyProperties = keyProperties;

            /** returns the name of each one of the properties that are part of a key */
            function keyPropertyNames(entityType) {
                return _(keyProperties(entityType)).map(function (property) {
                    return property.nameOnServer;
                });
            }
            Kendo.keyPropertyNames = keyPropertyNames;

            /** given a raw version of aone of the items in the collection, this function returns
            the proper item in the collection. */
            function findItem(item, collection, properties) {
                return _(collection).find(function (entity) {
                    return _(properties).all(function (property) {
                        return ko.unwrap(item[property]) === ko.unwrap(entity[property]);
                    });
                });
            }
            Kendo.findItem = findItem;

            function bindPage(observable, pager) {
                // only change the page if the current item can be unselected from the observable
                return pager.pageObservable.guard(function () {
                    return observable.inject(null);
                });
            }
            Kendo.bindPage = bindPage;

            var KendoPager = (function (_super) {
                __extends(KendoPager, _super);
                /** when a page is changed it will trigger requests to the server to fetch that
                page's items. These requests are made through Kendo's UI DataSource, and is requested
                that a page changed event is cancelled without making any requests.
                For those reasons is better to have direct control over the GuardedObservable instance
                that represents the page, and decide here in this control when to make the request. */
                function KendoPager(element, pageObservable, options) {
                    var _this = this;
                    _super.call(this, element, options);
                    this.pageObservable = pageObservable;

                    this._disposable = pageObservable.prepare(function (page) {
                        var dataRefreshed = _app.Utils.waitForEvent(_this.dataSource, 'change');
                        _super.prototype.page.call(_this, page);
                        return dataRefreshed;
                    });
                }
                KendoPager.prototype.page = function (index) {
                    if (index != undefined) {
                        this.pageObservable(parseInt(index));
                    } else {
                        return _super.prototype.page.call(this, index);
                    }
                };

                KendoPager.prototype.destroy = function () {
                    _super.prototype.destroy.call(this);

                    this._disposable.dispose();
                };
                return KendoPager;
            })(kendo.ui.Pager);
            Kendo.KendoPager = KendoPager;

            ko.bindingHandlers['breezeKendoPager'] = {
                init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var value = valueAccessor();

                    if (value.dataSource instanceof LightDataSource) {
                        var dataSource = new BreezeLightDataSource(value.dataSource), pagerOptions = { dataSource: dataSource, buttonCount: 5 }, pager = new kendo.ui.Pager(element, pagerOptions), disposable = value.dataSource.refresh(function () {
                            return dataSource.read();
                        });

                        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                            disposable.dispose();
                            pager.destroy();
                        });
                    } else {
                        throw new Error('not supported for other datasources');
                    }

                    return { 'controlsDescendantBindings': true };
                }
            };
        })(Server.Kendo || (Server.Kendo = {}));
        var Kendo = Server.Kendo;
    })(exports.Server || (exports.Server = {}));
    var Server = exports.Server;

    (function (Knockout) {
        // configure KO validation plugin
        ko.validation.init({
            parseInputAttributes: true,
            errorsAsTitle: false,
            errorsAsTitleOnModified: false,
            decorateElement: true,
            insertMessages: false,
            writeInputAttributes: false
        });

        function displayName(propertyInfo) {
            return (propertyInfo.custom && propertyInfo.custom.displayName) || propertyInfo.name;
        }

        function description(propertyInfo) {
            return (propertyInfo.custom && propertyInfo.custom.description) || propertyInfo.description;
        }

        function getDisplayName(entityType, propertyName) {
            var propertyInfo = entityType.getProperty(propertyName);
            return propertyInfo ? displayName(propertyInfo) : propertyName;
        }

        ko.bindingHandlers['label'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var $element = $(element), value = ko.unwrap(valueAccessor()), propertyName = _.isString(valueAccessor()) ? value : $element.text(), entityType = viewModel.entityType, propertyInfo = entityType.getProperty(propertyName), label = displayName(propertyInfo);

                $element.text(label);

                if (_.any(propertyInfo.validators, function (validator) {
                    return validator.name === 'required';
                })) {
                    // for required fields add a star before the field so it get's marked
                    $(templates.RequiredStar()).insertAfter(element);
                }
            }
        };

        ko.bindingHandlers['field'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var $element = $(element), value = valueAccessor(), propertyName = value.property, entityType = viewModel.entityType, propertyInfo = entityType.getProperty(propertyName), isRequired = value.required || _.any(propertyInfo.validators, function (validator) {
                    return validator.name === 'required';
                }), readOnly = bindingContext[ErrorTrack.readOnlyTreeBindingInfo.contextKey] || false, readOnlyValue = (typeof readOnly === 'boolean') ? readOnly : readOnly(), template = (readOnlyValue) ? templates.FieldReadOnly : templates.Field;

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
        };

        (function (_ColumnChooser) {
            _ColumnChooser.COLUMNCHOOSER = 'column-chooser';

            var ColumnChooser = (function () {
                function ColumnChooser(name, field, grid) {
                    this.name = name;
                    this.field = field;
                    var column = _.find(grid.columns, function (c) {
                        return c.field === field;
                    }), isHidden = (typeof column.hidden === 'undefined') ? false : column.hidden;

                    this.visible = ko.observable(!isHidden);

                    this.visible.subscribe(function (x) {
                        if (x) {
                            grid.showColumn(field);
                        } else {
                            grid.hideColumn(field);
                        }
                    });
                }
                ColumnChooser.prototype.dispose = function () {
                };
                return ColumnChooser;
            })();
            _ColumnChooser.ColumnChooser = ColumnChooser;

            var GridColumnChooserViewModel = (function () {
                function GridColumnChooserViewModel(activeColumns, grid) {
                    this.columns = ko.observableArray();
                    this._trash = new _app.Common.Trash();
                    var columns = this.columns.filter(function (c) {
                        return c.visible();
                    }).map(function (c) {
                        return c.field;
                    }), subscription = columns.subscribe(function (active) {
                        // replace the active columns in the observable
                        _app.Utils.replaceObservable(activeColumns, active);
                    });

                    this._trash.recycle(subscription, columns);

                    grid && this.load(grid);
                }
                GridColumnChooserViewModel.prototype.load = function (grid) {
                    _app.Utils.replaceObservable(this.columns, _(grid.options.columns).map(function (x) {
                        return new ColumnChooser(x.title, x.field, grid);
                    }));
                };

                GridColumnChooserViewModel.prototype.removeAll = function () {
                    var items = this.columns.removeAll();
                    _.forEach(items, function (item) {
                        return item.dispose();
                    });
                };

                GridColumnChooserViewModel.prototype.dispose = function () {
                    this.removeAll();
                    this._trash.dispose();
                };
                return GridColumnChooserViewModel;
            })();
            _ColumnChooser.GridColumnChooserViewModel = GridColumnChooserViewModel;

            /** finds the closest grid and renders a column chooser for it */
            ko.bindingHandlers['gridColumnChooser'] = {
                init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var options = valueAccessor(), columnChooser = new GridColumnChooserViewModel(options.activeColumns);
                    _app.Knockout.renderTemplateAsync(element, templates.ColumnChooser(), columnChooser);

                    var subscription = options.gridObservable.subscribe(function (grid) {
                        if (grid) {
                            columnChooser.load(grid);
                        } else {
                            columnChooser.removeAll();
                        }
                    });

                    ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                        subscription.dispose();
                        columnChooser.dispose();
                    });

                    $(element).addClass('column-chooser');
                    return { controlsDescendantBindings: true };
                }
            };
        })(Knockout.ColumnChooser || (Knockout.ColumnChooser = {}));
        var ColumnChooser = Knockout.ColumnChooser;

        (function (Kendo) {
            /** Kendo Drag&Drop framework identifies the Dragable->Dropable relation by a string that
            is passed as the group option. The breezeKendo* bindings use this key as the default group
            for dragables and dropables */
            var DRAGGROUP = 'data-grid-row';

            function makeKendoGrid(element, options) {
                var entityType = options.dataSource.entityType, manager = options.dataSource.manager, dataSourceOptions = {
                    dataSource: options.dataSource,
                    defaultSort: options.defaultSort,
                    columns: _.chain(options.columns).map(function (c) {
                        return c.nameOnServer;
                    }).filter(function (x) {
                        return !!x;
                    }).value()
                }, dataSource = new Server.Kendo.BreezeDataSource(dataSourceOptions), gridOptions = {
                    dataSource: dataSource,
                    editable: options.inlineEditable,
                    columns: options.columns
                }, grid = new BreezeGrid(element, options.dataSource.page, gridOptions), refreshWhenSaveDisposable = Server.Kendo.refreshWhenSave(dataSource, manager), refreshDisposable = options.dataSource.refresh(function () {
                    return grid.dataSource.read();
                });

                if (options.selected) {
                    var selectedDisposable = _app.Knockout.bind({
                        from: options.selected,
                        to: grid.selectedItem,
                        forward: function (item) {
                            return item ? grid.dataSource.getModelForEntity(item) : null;
                        },
                        backward: function (item) {
                            return item ? grid.dataSource.getEntityForModel(item) : null;
                        }
                    }), pageDisposable = Server.Kendo.bindPage(options.selected, grid.pager), filtersDisposable = bindFilters(options.selected, grid);
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
                    dispose: function () {
                        _app.Common.bulkDispose(refreshDisposable, refreshDisposable, selectedDisposable, pageDisposable, filtersDisposable);

                        // destroy the grid
                        grid.destroy();
                        draggable && draggable.draggable() && draggable.draggable("destroy");
                    }
                };
            }
            Kendo.makeKendoGrid = makeKendoGrid;

            ko.bindingHandlers['breezeKendoGrid'] = {
                init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var $element = $(element), options = valueAccessor(), metadataPromise = Server.Metadata.ensureMetadataIsFetched(options.dataSource.manager);

                    $element.addClass('busy');

                    metadataPromise.then(function () {
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
                        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                            options.widget && options.widget(null);
                            builder.dispose();
                            delete builder;
                        });

                        $element.removeClass('busy');
                    }).done();

                    return { controlsDescendantBindings: true };
                }
            };

            var BreezeGrid = (function (_super) {
                __extends(BreezeGrid, _super);
                function BreezeGrid(element, pageObservable, opt) {
                    var _this = this;
                    var options = _.defaults(opt || {}, {
                        columnMenu: false,
                        selectable: "row",
                        scrollable: true,
                        sortable: true,
                        filterable: true,
                        pageable: false,
                        navigatable: true,
                        resizable: true,
                        reorderable: true,
                        groupable: false
                    });

                    if (options.editable) {
                        options.editable = { update: true, destroy: false };

                        // add columns with buttons at the end
                        options.columns = _.union(options.columns, [{
                                command: [
                                    { name: "Delete", click: (function (e) {
                                            return _this.deleteRowEvent(e);
                                        }), className: 'grid-button-delete' },
                                    { name: "Un-Delete", click: (function (e) {
                                            return _this.unDeleteRowEvent(e);
                                        }), className: 'grid-button-undelete' }
                                ], title: "&nbsp;", width: "100px"
                            }]);
                    }

                    _super.call(this, element, options);

                    this._trash = new _app.Common.Trash();

                    // create pager after the grid
                    var pagerOptions = { dataSource: options.dataSource, buttonCount: 5 }, pagerElement = $('<div>').insertAfter(element)[0];
                    this.pager = new Server.Kendo.KendoPager(pagerElement, pageObservable, pagerOptions);

                    this.deletedElements = [];

                    this._kendoReorderable = this.wrapper.data('kendoReorderable');

                    // set up selected item observable
                    this.setupSelectedItem();

                    this._trash.recycle(this.bindEvent('save', function (e) {
                        return _this.cellValueChanged(e.container, e.model);
                    }));

                    // thanks to: http://blogs.planetsoftware.com.au/paul/archive/2013/04/10/extending-kendo-grid-functionality-with-knockout.aspx
                    var columnStateKey = 'grid-columns: ' + this.dataSource.manager.dataService.serviceName;
                    this._trash.recycle(this.attachColumnStateSaving(columnStateKey));
                    this.loadColumnState(columnStateKey);
                }
                /** set ups the selectedItem observable so the grid selected item is synced with the observable value */
                BreezeGrid.prototype.setupSelectedItem = function () {
                    var _this = this;
                    this.selectedItem = ko.observable();

                    var ignoreSync = false, disposable = this.selectedItem.subscribe(function (model) {
                        if (ignoreSync)
                            return;

                        var data = _this.dataSource.data(), index = data.indexOf(model), element = _this.tbody.children().eq(index);

                        ignoreSync = true;
                        _this.select(element);
                        ignoreSync = false;
                    });

                    this.bind('change', function () {
                        if (ignoreSync)
                            return;

                        var gridSelected = _this.select(), rawItem = _this.dataItem(gridSelected);

                        ignoreSync = true;
                        _this.selectedItem(rawItem);
                        ignoreSync = false;
                    });

                    this._trash.recycle(disposable);
                };

                /** returns the corresponding model for the given row selector */
                BreezeGrid.prototype.modelForElement = function (element) {
                    var row = $(element).closest("tr");
                    return this.dataItem(row);
                };

                /** */
                BreezeGrid.prototype.entityForElement = function (element) {
                    var model = this.modelForElement(element);
                    return this.dataSource.getEntityForModel(model);
                };

                BreezeGrid.prototype.deleteRowEvent = function (e) {
                    e.preventDefault();

                    var row = $(e.currentTarget).closest("tr"), model = this.dataItem(row);

                    if (!_.contains(this.deletedElements, model)) {
                        this.deletedElements.push(model);
                        row.addClass('row-removed');
                    }
                    this.closeCell();
                };

                BreezeGrid.prototype.unDeleteRowEvent = function (e) {
                    e.preventDefault();

                    var row = $(e.currentTarget).closest("tr"), model = this.dataItem(row);

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
                };

                /** cancel editing on removed cells */
                BreezeGrid.prototype.editCell = function (cell) {
                    if (!cell.closest('tr').hasClass('row-removed')) {
                        _super.prototype.editCell.call(this, cell);
                    }
                };

                BreezeGrid.prototype.cellValueChanged = function (cell, model) {
                    var row = cell.closest('tr');
                    if (row && !model.isNew() && model.dirty) {
                        row.addClass('row-dirty');
                    }
                };

                BreezeGrid.prototype.destroy = function () {
                    this._trash.dispose();
                    this.unbind('change').unbind('save');

                    // for some reason when the grid binding is disposed all data associated to the element
                    // is lost, resulting in an error when the grid is destroyed.
                    this.options.reorderable = false;

                    _super.prototype.destroy.call(this);

                    // destroy the reorderable object
                    this._kendoReorderable.destroy();

                    this.pager.destroy();
                };

                BreezeGrid.prototype.sync = function () {
                    var _this = this;
                    // syncronize all elements to be deleted, the deleted elements can always be sent
                    // to the server. These elements are a special case and they can't be threated like
                    // updated or created elements, because once an element is removed from the DataSource
                    // then it get's removed from the grid, that's why the following is delayed until now
                    _.each(this.deletedElements, function (model) {
                        _this.dataSource.remove(model);
                    });
                    this.deletedElements = [];

                    var result = Q.defer();

                    function sync() {
                        result.resolve(true);
                    }
                    this.dataSource.one('sync', sync);
                    this.dataSource.sync();

                    return result.promise;
                };

                BreezeGrid.prototype.refresh = function () {
                    var _this = this;
                    _super.prototype.refresh.apply(this, arguments);

                    // this.deletedElements = [];
                    // check the status of the entities in case some entity has been deleted
                    var entities = this.dataSource.transport.dataSource.data, selectedEntity = this.dataSource.getEntityForModel(this.selectedItem()), property, col;
                    _.each(entities, function (entity, i) {
                        var model = _this.dataSource.getModelForEntity(entity), j = _this.dataSource.indexOf(model), row = $(_this.table).find('tr').eq(j);

                        if (entity.entityAspect.entityState.isDeleted() || (model && _.contains(_this.deletedElements, model))) {
                            if (model && !_.contains(_this.deletedElements, model)) {
                                _this.deletedElements.push(model);
                            }

                            row.addClass('row-removed');
                        } else if (entity.entityAspect.entityState.isModified() || (model && model.dirty)) {
                            row.addClass('row-dirty');

                            for (property in entity.entityAspect.originalValues) {
                                // find the column corresponding to the field and add the k-dirty mark
                                _this.markDirtyCell(property, i);
                            }
                        } else if (entity.entityAspect.entityState.isAdded() || (model && model.isNew())) {
                            row.addClass('row-added');

                            _.each(entity.entityType.dataProperties, function (property) {
                                if (entity[property.name] && ko.unwrap(entity[property.name]) != property.defaultValue) {
                                    _this.markDirtyCell(property.name, i);
                                }
                            });
                        }

                        // check if the current model is the one selected and mark it on the grid
                        if (selectedEntity === entity) {
                            row.addClass('k-state-selected');
                        }

                        var models = _this.dataSource.view();
                        _.each(models, function (model, i) {
                            if (model.isNew()) {
                                $(_this.table).find('tr').eq(i).addClass('row-added');
                            }
                        });
                    });
                };

                BreezeGrid.prototype.markDirtyCell = function (property, rowIndex) {
                    for (var j = 0; j < this.columns.length; j++) {
                        if (this.columns[j].field === property) {
                            $(this.table).find('tr').eq(rowIndex).find('td').eq(j).addClass('k-dirty-cell').prepend('<span class="k-dirty"/>');
                            break;
                        }
                    }
                };

                BreezeGrid.prototype.attachColumnStateSaving = function (columnStateKey) {
                    var _this = this;
                    var colFunc = function (key) {
                        var columns = _this.columns;
                        var columnState = [];

                        for (var col = 0, length = columns.length; col < length; col++) {
                            var column = _this.columns[col];
                            var commandName = (typeof column.command === 'undefined') ? null : column.command.name;
                            columnState.push({
                                field: column.field, hidden: column.hidden,
                                width: column.width, commandName: commandName
                            });
                        }

                        localStorage.setItem(key, JSON.stringify(columnState));
                    };

                    return _app.Common.mergeDisposables(this.bindEvent("columnHide", function (e) {
                        return colFunc(columnStateKey);
                    }), this.bindEvent("columnShow", function (e) {
                        return colFunc(columnStateKey);
                    }), this.bindEvent("columnReorder", function (e) {
                        return setTimeout(function () {
                            return colFunc(columnStateKey);
                        }, 100);
                    }), this.bindEvent("columnResize", function (e) {
                        return colFunc(columnStateKey);
                    }));
                };

                BreezeGrid.prototype.loadColumnState = function (columnStateKey) {
                    var colState = JSON.parse(localStorage.getItem(columnStateKey));

                    if (colState && colState.length > 0) {
                        var visibleIndex = -1;
                        for (var i = 0; i < colState.length; i++) {
                            var column = colState[i];

                            // 1. Set correct order first as visibility and width both depend on this.
                            var existingIndex = -1;

                            if (typeof column.field !== 'undefined') {
                                existingIndex = this.findFieldIndex(column.field);
                            } else if (typeof column.commandName !== 'undefined') {
                                existingIndex = this.findCommandIndex(column.commandName);
                            }

                            if (existingIndex > -1 && existingIndex != i) {
                                this.reorderColumn(i, this.columns[existingIndex]);
                            }

                            // 2. Set visibility state
                            var isHidden = (typeof column.hidden === 'undefined') ? false : column.hidden;

                            if (isHidden) {
                                this.hideColumn(i);
                            } else {
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
                };

                BreezeGrid.prototype.findFieldIndex = function (field) {
                    var existingIndex = -1;
                    for (var idx = 0; idx < this.columns.length; ++idx) {
                        if (this.columns[idx].field == field) {
                            existingIndex = idx;
                            break;
                        }
                    }
                    return existingIndex;
                };

                BreezeGrid.prototype.findCommandIndex = function (commandName) {
                    var existingIndex = -1;
                    for (var idx = 0; idx < this.columns.length; ++idx) {
                        if (typeof this.columns[idx].command !== 'undefined' && this.columns[idx].command['name'] == commandName) {
                            existingIndex = idx;
                            break;
                        }
                    }
                    return existingIndex;
                };

                BreezeGrid.prototype.bindEvent = function (event, handler) {
                    var _this = this;
                    this.bind(event, handler);

                    return {
                        dispose: function () {
                            return _this.unbind(event, handler);
                        }
                    };
                };
                return BreezeGrid;
            })(kendo.ui.Grid);
            Kendo.BreezeGrid = BreezeGrid;

            function removeTemplatesFromColumns(columns) {
                return _.map(columns, function (column) {
                    var index = column.indexOf(':');
                    return index >= 0 ? column.substring(0, index) : column;
                });
            }
            Kendo.removeTemplatesFromColumns = removeTemplatesFromColumns;

            function bindFilters(observable, grid) {
                var columns = grid.options.columns, filterable = grid.options.filterable;

                if (filterable && !grid.options.columnMenu) {
                    var filters = _.map($(grid['thead']).find("th:not(.k-hierarchy-cell,.k-group-cell)"), function (element, index) {
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
                    var disposables = _.map(filters, function (filter) {
                        return filter && filter.filterObservable.guard(function () {
                            return observable.inject(null);
                        });
                    });

                    return {
                        dispose: function () {
                            _.each(disposables, function (disposable) {
                                if (disposable) {
                                    disposable.dispose();
                                }
                            });

                            _.forEach(filters, function (filter) {
                                if (filter) {
                                    filter.destroy();
                                }
                            });
                        }
                    };
                }
            }
            Kendo.bindFilters = bindFilters;

            var KendoFilter = (function (_super) {
                __extends(KendoFilter, _super);
                function KendoFilter(element, options) {
                    var _this = this;
                    _super.call(this, element, options);
                    this.CLEARMARK = {};

                    this.filterObservable = ko.guarded();
                    this.filterObservable.guarded.subscribe(function (expression) {
                        if (expression === _this.CLEARMARK) {
                            _super.prototype.clear.call(_this);
                        } else {
                            _super.prototype.filter.call(_this, expression);
                        }
                    });
                }
                KendoFilter.prototype.filter = function (expression) {
                    this.filterObservable(expression);
                };

                KendoFilter.prototype.clear = function () {
                    this.filterObservable(this.CLEARMARK);
                };
                return KendoFilter;
            })(kendo.ui.FilterMenu);
            Kendo.KendoFilter = KendoFilter;
        })(Knockout.Kendo || (Knockout.Kendo = {}));
        var Kendo = Knockout.Kendo;

        (function (Tracks) {
            var TrackCollection = (function () {
                function TrackCollection() {
                    this._tracks = ko.observableArray();
                    this.tracks = this._tracks.filter(function (track) {
                        return !!ko.unwrap(track.message);
                    });
                }
                TrackCollection.prototype.register = function (message, navigate) {
                    var _this = this;
                    var track = {
                        message: message,
                        navigate: navigate
                    };

                    this._tracks.push(track);

                    return {
                        dispose: function () {
                            _this.remove(track);
                        }
                    };
                };

                /** adds a new track to the collection */
                TrackCollection.prototype.add = function (track) {
                    this._tracks.push(track);
                };

                /** removes a track from the collection */
                TrackCollection.prototype.remove = function (track) {
                    this._tracks.remove(track);
                };
                return TrackCollection;
            })();
            Tracks.TrackCollection = TrackCollection;

            /** all tracks registered on this collection are also added to a parent collection,
            the navigated handler is wrapped to be able to insert other handlers before and after
            the navigate is executed */
            var TuneledTrackCollection = (function (_super) {
                __extends(TuneledTrackCollection, _super);
                function TuneledTrackCollection(errorCollection, beforeNavigate, afterNavigate, tunnel) {
                    if (typeof tunnel === "undefined") { tunnel = ko.observable(true); }
                    _super.call(this);
                    this.errorCollection = errorCollection;
                    this.beforeNavigate = beforeNavigate;
                    this.afterNavigate = afterNavigate;
                    this.tunnel = tunnel;
                }
                TuneledTrackCollection.prototype.register = function (message, navigate) {
                    var _this = this;
                    // wrap the navigate handler so when it's executed a before/after handlers
                    // are also executed if they where specified
                    var wrappedMessage = ko.computed(function () {
                        return _this.tunnel() ? ko.unwrap(message) : null;
                    }), wrapedNavigate = function () {
                        if (_this.beforeNavigate) {
                            _this.beforeNavigate();
                        }

                        navigate();

                        if (_this.afterNavigate) {
                            _this.afterNavigate();
                        }
                    }, disposable1 = _super.prototype.register.call(this, message, navigate), disposable2 = this.errorCollection.register(wrappedMessage, wrapedNavigate);

                    // The handler get's registered in both collections, so both IDisposables should be disposed
                    return _app.Common.mergeDisposables(disposable1, disposable2, wrappedMessage);
                };
                return TuneledTrackCollection;
            })(TrackCollection);
            Tracks.TuneledTrackCollection = TuneledTrackCollection;

            /** the title is the string used on the summary header, it interpolate the number of errors
            using '{0}'. */
            function renderTrackSummary(element, trackCollection, options) {
                var $element = $(element);

                _app.Knockout.renderTemplateAsync(element, templates.TrackSummary(options), trackCollection);

                // trigger resize event on the target element every time the collection changes
                var disposable = trackCollection.tracks.subscribe(function () {
                    // and give some time so the DOM is updated
                    _app.Utils.async(function () {
                        return _app.Common.triggerResize($element);
                    });
                });

                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    disposable.dispose();
                });

                return { controlsDescendantBindings: true };
            }
            Tracks.renderTrackSummary = renderTrackSummary;
        })(Knockout.Tracks || (Knockout.Tracks = {}));
        var Tracks = Knockout.Tracks;

        /** this function is called when an item from the validation summary is clicked, usually set's
        the focus to the target element */
        function navigateToElement(element) {
            element.select();
            // $(element).focus();
        }

        /** Contains the binding handlers needed to manage the validation framework */
        (function (ErrorTrack) {
            ErrorTrack.JIGSAWERRORCOLLECTION = '$jigsawErrorCollection';

            /**  assigns an error collection to the context under
            the field '$jigsawErrorCollection', the binding is named 'markErrorCollection'.
            Note this binding control descendant bindings so it's recommended to be used alone
            without other bindings on it's target element. */
            ko.bindingHandlers['markErrorCollection'] = {
                init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var value = ko.unwrap(valueAccessor()), collection = new Tracks.TrackCollection(), options = {};

                    options[ErrorTrack.JIGSAWERRORCOLLECTION] = collection;

                    var context = bindingContext.extend(options);
                    ko.applyBindingsToDescendants(context, element);

                    if (value.hasAny) {
                        var disposable = collection.tracks.subscribe(function (tracks) {
                            value.hasAny(tracks.length > 0);
                        });

                        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                            disposable.dispose();
                        });
                    }

                    return { controlsDescendantBindings: true };
                },
                preprocess: _app.Knockout.extend.emptyBindingPreprocess
            };

            /** the $jigsawReadOnlyTree context variable added by thi *s bingins will make all
            child {value, checked} bindings to be editable only if this is true */
            ErrorTrack.readOnlyTreeBindingInfo = _app.Knockout.createContextMarkBinding('ReadOnlyTree');

            /** attach an observable to the binding context that can control wether the {value} bindings
            will show validation errors, independently of any other reason like detecting if the input
            element has been clicked. */
            ErrorTrack.forceValidationErrorsBindingInfo = _app.Knockout.createContextMarkBinding('ForceValidationErrors');

            /** takes an observable and registers it's error on the ErrorCollection available on
            the bindingContext (if any),  */
            ko.bindingHandlers['errorField'] = {
                init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var $element = $(element), observable = valueAccessor();

                    if (observable.error) {
                        var elementUnfocused = ko.observable(false), forceValidationErrorVisibility = bindingContext[ErrorTrack.forceValidationErrorsBindingInfo.contextKey], displayError = ko.computed(function () {
                            return forceValidationErrorVisibility ? elementUnfocused() || forceValidationErrorVisibility() : elementUnfocused();
                        }), markValidationError = ko.computed(function () {
                            return displayError() && !observable.isValid();
                        });

                        // if an ErrorCollection is available on the context, then register the error observable
                        if (bindingContext[ErrorTrack.JIGSAWERRORCOLLECTION]) {
                            var errorCollection = bindingContext[ErrorTrack.JIGSAWERRORCOLLECTION], errorObservable = ko.computed(function () {
                                return displayError() ? observable.error() : null;
                            }), disposable = errorCollection.register(errorObservable, function () {
                                return navigateToElement($element);
                            });
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

                        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                            _app.Common.bulkDispose(disposable, errorObservable, markValidationError, displayError);

                            $element.unbind('blur', elementUnfocusedHandler);
                        });
                    }
                }
            };

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
                    if (!initialReadOnly && bindingContext[ErrorTrack.readOnlyTreeBindingInfo.contextKey]) {
                        var isReadOnly = bindingContext[ErrorTrack.readOnlyTreeBindingInfo.contextKey];

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
                    var errorCollection = bindingContext[ErrorTrack.JIGSAWERRORCOLLECTION];
                    $(element).addClass('validation-summary');
                    return Tracks.renderTrackSummary(element, errorCollection, { title: "{0} validation errors" });
                },
                preprocess: _app.Knockout.extend.emptyBindingPreprocess
            };

            /** Wrap the default Kendo TabStrip binding to add a new option to add an error collection
            which tunnels all errors to an existing parent error collection.
            Creates a new error collection for each one of the tabs, and tunnels all errors to
            the parent collection, ensuring that when the parent collection wants to navigate to a
            given error  */
            ko.bindingHandlers['tabstripErrorTunnel'] = {
                init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var errorCollection = bindingContext[ErrorTrack.JIGSAWERRORCOLLECTION];

                    // make tabstrip binding async
                    _app.Utils.async(function () {
                        ko.applyBindings(viewModel, $(element).find('.nav-tabs')[0]);

                        $(element).find('.tab-content > div').each(function (index, tab) {
                            var collection = new Tracks.TuneledTrackCollection(errorCollection, function () {
                                return $(element).find('.nav-tabs > li:eq(' + index + ') a').tab('show');
                            }), options = {};
                            options[ErrorTrack.JIGSAWERRORCOLLECTION] = collection;
                            var tabContext = bindingContext.extend(options);

                            ko.applyBindingsToDescendants(tabContext, tab);
                        });
                    });

                    return { controlsDescendantBindings: true };
                }
            };

            /** takes any collection of items and adds each one of them as errors to the nearest error collection.
            This binding allows to have a collection of errors on the view-model (IErrorTrack) and show each one
            of them in the context ErrorCollection; and by consecuence in the validation summary. */
            ko.bindingHandlers['feedParentErrorCollection'] = {
                init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    // ex: feedParentErrorCollection: collection
                    var collection = valueAccessor(), errorCollection = bindingContext[ErrorTrack.JIGSAWERRORCOLLECTION], disposable = _app.Knockout.watchObservableArray(collection, function (item) {
                        return errorCollection.add(item);
                    }, function (item) {
                        return errorCollection.remove(item);
                    });

                    ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                        disposable.dispose();
                    });
                }
            };
        })(Knockout.ErrorTrack || (Knockout.ErrorTrack = {}));
        var ErrorTrack = Knockout.ErrorTrack;

        (function (Comparison) {
            Comparison.JIGSAWDIFFCOLLECTION = '$jigsawDiffCollection';
            Comparison.JIGSAWDIFFORIGINAL = '$jigsawDiffOriginal';

            /** this should be applied on the root element of the Viewbar, when the version and errors should be handled.
            This declares the following variables in the context:
            - a TrackCollection to store all validation errors
            - another TrackCollection to store all differences between the selected version and the original
            - the original field is referenced in the context */
            ko.bindingHandlers['markVersionPagerRoot'] = {
                init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var value = ko.unwrap(valueAccessor()), errorCollection = new Tracks.TrackCollection(), diffCollection = new Tracks.TrackCollection(), options = {};

                    options[ErrorTrack.JIGSAWERRORCOLLECTION] = errorCollection;
                    options[Comparison.JIGSAWDIFFCOLLECTION] = diffCollection;
                    options[Comparison.JIGSAWDIFFORIGINAL] = value.current;

                    var context = bindingContext.extend(options);
                    ko.applyBindingsToDescendants(context, element);

                    if (value.hasError) {
                        var disposable = errorCollection.tracks.subscribe(function (tracks) {
                            value.hasError(tracks.length > 0);
                        });

                        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                            disposable.dispose();
                        });
                    }

                    return { controlsDescendantBindings: true };
                },
                preprocess: _app.Knockout.extend.emptyBindingPreprocess
            };

            function focusElement(element) {
                _app.Utils.shake(element);
            }
            Comparison.focusElement = focusElement;

            ko.bindingHandlers['comparisonField'] = {
                init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var $element = $(element), diffCollection = bindingContext[Comparison.JIGSAWDIFFCOLLECTION], originalViewModel = bindingContext[Comparison.JIGSAWDIFFORIGINAL], entityType = viewModel.entityType;

                    if (diffCollection && originalViewModel() !== bindingContext.$data) {
                        var options = ko.unwrap(valueAccessor()), value = options.value, original = ko.unwrap(options.original());

                        if (original !== value) {
                            var label = getDisplayName(entityType, options.field), message = { field: label, original: original, value: value }, disposable = diffCollection.register(message, function () {
                                return focusElement($element);
                            });

                            $(element).html(Resig.diffString(original, value()));

                            $element.addClass('difference-field');
                        }

                        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                            disposable && disposable.dispose();
                        });
                    }
                },
                preprocess: function (value, name) {
                    // transforms comparisonField: foo -> comparisonField: { value: foo, original: function(){return $jigsawDiffOriginal().foo }, field: 'foo'}
                    // the same property needs to be evaluated for the current $data and for the original object
                    var func = "function(){ var original = " + Comparison.JIGSAWDIFFORIGINAL + "(); return !original?null:original." + value + ";}";

                    // marked on the bindingContext under the key $jigsawDiffOriginal
                    return "{value:" + value + ", original: " + func + ", field:'" + value + "'}";
                }
            };

            /** extended foreach binding to show differences with the original collection  */
            ko.bindingHandlers['dforeach'] = {
                init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var $element = $(element), diffCollection = bindingContext[Comparison.JIGSAWDIFFCOLLECTION], originalViewModel = bindingContext[Comparison.JIGSAWDIFFORIGINAL], options = valueAccessor(), value = options.value, entityType = viewModel.entityType;

                    if (diffCollection && originalViewModel() !== bindingContext.$data) {
                        var original = options.original();

                        if (original) {
                            var allItems = _.union(value(), original()), originalLength = original().length, differences = {
                                added: 0,
                                modified: 0,
                                unchanged: 0,
                                missing: 0
                            };

                            function afterRender(domElements, data) {
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
                                var field = getDisplayName(entityType, options.field), message = {
                                    field: field,
                                    original: original().length + ' [' + field.toUpperCase() + ']',
                                    value: differences.added + ' added, ' + differences.modified + ' modified, ' + differences.missing + ' missing'
                                }, disposable = diffCollection.register(message, function () {
                                    return focusElement($element);
                                });
                            }

                            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
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
            };

            ko.bindingHandlers['dvalue'] = {
                init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var diffCollection = bindingContext[Comparison.JIGSAWDIFFCOLLECTION], originalViewModel = bindingContext[Comparison.JIGSAWDIFFORIGINAL], options = valueAccessor(), value = options.value, entityType = viewModel.entityType;

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
            };

            /** intended to mark group of fields with differences, will create a new level on the DiffCollection
            and apply the class 'has-diff' to the target element if there's any error in the group of fields */
            ko.bindingHandlers['hasDiff'] = {
                init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var diffCollection = bindingContext[Comparison.JIGSAWDIFFCOLLECTION];

                    var tunelDiffCollection = new Tracks.TuneledTrackCollection(diffCollection, function () {
                    }), options = {};
                    options[Comparison.JIGSAWDIFFCOLLECTION] = tunelDiffCollection;
                    var context = bindingContext.extend(options);

                    ko.applyBindingsToDescendants(context, element);
                    var hasDiff = ko.computed(function () {
                        return tunelDiffCollection.tracks().length > 0;
                    });
                    ko.applyBindingsToNode(element, { css: { 'has-diff': hasDiff } }, bindingContext);

                    ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                        hasDiff.dispose();
                    });

                    return { controlsDescendantBindings: true };
                },
                preprocess: _app.Knockout.extend.emptyBindingPreprocess
            };

            ko.bindingHandlers['diffSummary'] = {
                init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var errorCollection = bindingContext[Comparison.JIGSAWDIFFCOLLECTION], $element = $(element).addClass('diff-summary'), context = bindingContext.createChildContext(errorCollection);

                    _app.Knockout.renderTemplateAsync(element, templates.comparison.DiffSummary(), context);

                    // trigger resize event on the target element every time the collection changes
                    var disposable = errorCollection.tracks.subscribe(function () {
                        // and give some time so the DOM is updated
                        _app.Utils.async(function () {
                            return _app.Common.triggerResize($element);
                        });
                    });

                    ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                        disposable.dispose();
                    });

                    return { controlsDescendantBindings: true };
                },
                preprocess: _app.Knockout.extend.emptyBindingPreprocess
            };

            function makeBindingCompareField(bindingName) {
                _app.Knockout.extend.bindingPreprocess(bindingName, function (value, _, addBindingCallback) {
                    addBindingCallback('comparisonField', value);
                });
            }
            makeBindingCompareField('value');

            ko.bindingHandlers['tabstrip'] = {
                init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var errorCollection = bindingContext[ErrorTrack.JIGSAWERRORCOLLECTION], diffCollection = bindingContext[Comparison.JIGSAWDIFFCOLLECTION];

                    // make tabstrip binding async
                    _app.Utils.async(function () {
                        ko.applyBindings(viewModel, $(element).find('.nav-tabs')[0]);

                        var $element = $(element), tabHeaders = $element.find('.nav-tabs').children('li');

                        $element.find('.tab-content > div').each(function (index, tab) {
                            var tunelErrorCollection = new Tracks.TuneledTrackCollection(errorCollection, function () {
                                return $(element).find('.nav-tabs > li:eq(' + index + ') a').tab('show');
                            }), tunelDiffCollection = new Tracks.TuneledTrackCollection(diffCollection, function () {
                                return $(element).find('.nav-tabs > li:eq(' + index + ') a').tab('show');
                            }), options = {};
                            options[ErrorTrack.JIGSAWERRORCOLLECTION] = tunelErrorCollection;
                            options[Comparison.JIGSAWDIFFCOLLECTION] = tunelDiffCollection;
                            var tabContext = bindingContext.extend(options);

                            ko.applyBindingsToDescendants(tabContext, tab);

                            // apply difference binding to tab headers
                            var tabHeader = tabHeaders.get(index);
                            var hasErrors = ko.computed(function () {
                                return tunelErrorCollection.tracks().length > 0;
                            }), hasDiff = ko.computed(function () {
                                return tunelDiffCollection.tracks().length > 0;
                            });
                            ko.applyBindingsToNode(tabHeader, { css: { 'has-errors': hasErrors, 'has-diff': hasDiff } }, bindingContext);

                            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                                hasDiff.dispose();
                                hasErrors.dispose();
                            });
                        });
                    });

                    return { controlsDescendantBindings: true };
                },
                preprocess: _app.Knockout.extend.emptyBindingPreprocess
            };

            /** taken from http://ejohn.org/projects/javascript-diff-algorithm/ */
            var Resig;
            (function (Resig) {
                function diffString(oldString, newString) {
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
                Resig.diffString = diffString;

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
                        if (n[i].text != null && n[i + 1].text == null && n[i].row + 1 < o.length && o[n[i].row + 1].text == null && n[i + 1] == o[n[i].row + 1]) {
                            n[i + 1] = { text: n[i + 1], row: n[i].row + 1 };
                            o[n[i].row + 1] = { text: o[n[i].row + 1], row: i + 1 };
                        }
                    }

                    for (var i = n.length - 1; i > 0; i--) {
                        if (n[i].text != null && n[i - 1].text == null && n[i].row > 0 && o[n[i].row - 1].text == null && n[i - 1] == o[n[i].row - 1]) {
                            n[i - 1] = { text: n[i - 1], row: n[i].row - 1 };
                            o[n[i].row - 1] = { text: o[n[i].row - 1], row: i - 1 };
                        }
                    }

                    return { o: o, n: n };
                }
            })(Resig || (Resig = {}));
        })(Knockout.Comparison || (Knockout.Comparison = {}));
        var Comparison = Knockout.Comparison;

        /** grant focus to the target element when the binding is initialized */
        ko.bindingHandlers['focus'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var isReadonly = bindingContext[ErrorTrack.readOnlyTreeBindingInfo.contextKey], time = valueAccessor();

                // only trigger the focus on the element if the tree isn't marked as read-only
                setTimeout(function () {
                    if (!ko.unwrap(isReadonly)) {
                        $(element).focus();
                    }
                }, time);
            }
        };
    })(exports.Knockout || (exports.Knockout = {}));
    var Knockout = exports.Knockout;

    (function (Searches) {
        

        var JumpToSearch = (function () {
            function JumpToSearch(service, targetProperty, viewModel) {
                this.service = service;
                this.targetProperty = targetProperty;
                this.viewModel = viewModel;
                this.searchTerm = ko.observable('');
            }
            JumpToSearch.prototype.jump = function (value, selectedIndex, forward, showMultipleResultsMessage) {
                var _this = this;
                if (typeof forward === "undefined") { forward = true; }
                if (typeof showMultipleResultsMessage === "undefined") { showMultipleResultsMessage = true; }
                var dataSource = this.viewModel.dataSource, query = dataSource.currentQuery.skip(null).take(null), searchTerm = value || this.searchTerm(), options = {
                    '[0].Key': this.targetProperty,
                    '[0].Value': searchTerm,
                    selectedIndex: selectedIndex || dataSource.currentQuery.skipCount + _.indexOf(dataSource.data, this.viewModel.selectedItem()),
                    forward: forward
                }, result = null;

                // OData query parameters
                _.extend(options, Server.getQueryOptions(query, dataSource.entityType));

                return _app.ajax.connection.online().then(function (online) {
                    if (online) {
                        return _app.ajax.get(_this.service, options).fail(function () {
                            return _this.jumpOffline(searchTerm);
                        });
                    } else {
                        return _this.jumpOffline(searchTerm);
                    }
                }).then(function (args) {
                    result = args;
                    var nextIndex = args.Index;

                    if (nextIndex >= 0) {
                        var pageSize = dataSource.currentQuery.takeCount, page = Math.floor(nextIndex / pageSize) + 1, itemIndexInPage = nextIndex - ((page - 1) * pageSize);

                        // check if it's a new page
                        if (_this.viewModel.dataSource.page() != page) {
                            return _this.viewModel.dataSource.page.inject(page).then(function () {
                                return itemIndexInPage;
                            });
                        } else {
                            // it's the same page
                            return itemIndexInPage;
                        }
                    } else {
                        // when no results are found for the given search term the server returns -1
                        // in this case the jump promise fails and a message is shown
                        _this.viewModel.messageQueue.clear().add({
                            title: "Search",
                            body: "No results found for " + _this.targetProperty + "'" + searchTerm + "'. Plase check and try again.",
                            level: 3 /* Info */
                        });
                        return Q.reject();
                    }
                }).then(function (index) {
                    // index is the index that should be selected in the page
                    var itemToSelect = _this.viewModel.dataSource.data[index];

                    return _this.viewModel.selectedItem.inject(itemToSelect).then(function () {
                        // add the multiple results found message
                        // instead of adding a new message everytime, check if a similar JumpTo message exist
                        if (showMultipleResultsMessage && (result.HasNext || result.HasPrevious)) {
                            // TODO check that there're actually multiple results
                            //var message = <JumpToMultipleResultsMessage>_.find(this.viewModel.messageQueue.messages(), m => m instanceof JumpToMultipleResultsMessage);
                            // if the message doesn't exist or targets a different search term, then replace that message
                            //if (!message || message.searchTerm != searchTerm) {
                            var message = new JumpToMultipleResultsMessage(_this, searchTerm);
                            message.canFindPrevious(result.HasPrevious);
                            message.canFindNext(result.HasNext);

                            _this.viewModel.messageQueue.clear().add(message);
                            //}
                        }
                    });
                }).then(function () {
                    return result;
                }).fail(function () {
                    return null;
                });
            };

            JumpToSearch.prototype.jumpOffline = function (value) {
                var dataSource = this.viewModel.dataSource, query = dataSource.currentQuery.skip(null).take(null), searchTerm = decodeURI(value), queryResult = dataSource.queryLocal(query), data = queryResult.results, inlineCount = queryResult.inlineCount, nextIndex = -1, value;

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
            };

            /** this method can be safetly called from Knockout event handlers in the views,
            if the method jump is used directly then the event handlers inject undesired parameters
            such as the event args */
            JumpToSearch.prototype.quickJump = function () {
                return this.jump();
            };

            Object.defineProperty(JumpToSearch.prototype, "isActive", {
                get: function () {
                    return !!this.service && !!this.targetProperty;
                },
                enumerable: true,
                configurable: true
            });
            return JumpToSearch;
        })();
        Searches.JumpToSearch = JumpToSearch;

        /** this is the viewmodel behind the JumpTo message, when multiple items are found */
        var JumpToMultipleResultsMessage = (function () {
            function JumpToMultipleResultsMessage(jumpToSearch, searchTerm) {
                this.jumpToSearch = jumpToSearch;
                this.searchTerm = searchTerm;
                this.canFindNext = ko.observable(true);
                this.canFindPrevious = ko.observable(true);
                this.title = 'Search';
                this.body = templates.JumpToMultipleResultsMessage({ targetProperty: jumpToSearch.targetProperty, searchTerm: searchTerm });
            }
            JumpToMultipleResultsMessage.prototype.findNext = function () {
                var _this = this;
                if (this.canFindNext()) {
                    return this.jumpToSearch.jump(this.searchTerm, null, true).then(function (args) {
                        _this.canFindNext(args.HasNext);
                        _this.canFindPrevious(args.HasPrevious);
                    });
                }
                return Q(true);
            };

            JumpToMultipleResultsMessage.prototype.findPrev = function () {
                var _this = this;
                if (this.canFindPrevious()) {
                    return this.jumpToSearch.jump(this.searchTerm, null, false).then(function (args) {
                        _this.canFindNext(args.HasNext);
                        _this.canFindPrevious(args.HasPrevious);
                    });
                }
                return Q(true);
            };
            return JumpToMultipleResultsMessage;
        })();

        // register the JumpToMultipleResultsMessage template
        //_app.Jigsaw.Messages.messageTemplateSelector.candidate(templates.JumpToMultipleResultsMessage(), x => x instanceof JumpToMultipleResultsMessage);
        (function (SearchType) {
            SearchType[SearchType["None"] = 0] = "None";
            SearchType[SearchType["Simple"] = 1] = "Simple";
            SearchType[SearchType["Advanced"] = 2] = "Advanced";
        })(Searches.SearchType || (Searches.SearchType = {}));
        var SearchType = Searches.SearchType;

        var SearchManager = (function () {
            function SearchManager(viewModel) {
                var _this = this;
                this.viewModel = viewModel;
                /** returns the value of the simple search query */
                this.simpleSearchQuery = ko.observable('');
                this.searchType = ko.observable(0 /* None */);
                /** returns wheter the advanced search panel is active or not */
                this.advancedPanelActive = ko.observable(false);
                /** get's a reference to the currently active search panel, this is setted by the webRule custom binding,
                specifically for this viewModel */
                this.searchWidget = ko.observable();
                this.showInputBox = function (text) {
                    return _app.Views.smartInput({ title: '', content: text });
                };
                this.savedSearches = new SavedSearchesCollection();
                viewModel.dataSource.addQueryLevel(function (query) {
                    return _this.queryLevel(query);
                }, function (entities) {
                    return _this.filterEntities(entities);
                });

                this.simpleSearchQuery.subscribe(function () {
                    if (_this.advancedPanelActive()) {
                        _this.advancedPanelActive(false);
                    }
                });
            }
            /** used to modify the query in the datasource, it adds the search parameters */
            SearchManager.prototype.queryLevel = function (query) {
                if (this.searchType() === 1 /* Simple */) {
                    return query.withParameters({
                        simpleSearch: this.simpleSearchQuery()
                    });
                } else if (this.searchType() === 2 /* Advanced */) {
                    return query.withParameters({
                        webRule: this.searchWidget().extract()
                    });
                } else {
                    return query;
                }
            };

            SearchManager.prototype.filterEntities = function (entities) {
                var _this = this;
                var simpleSearchProperty = this.viewModel.options && this.viewModel.options.simpleSearchProperty, searchTerm = this.simpleSearchQuery();

                if (!simpleSearchProperty || this.searchType() != 1 /* Simple */)
                    return entities;

                return _(entities).filter(function (entity) {
                    var value = entity[_this.viewModel.options.simpleSearchProperty]();
                    return _.isString(value) && value.indexOf(searchTerm) === 0;
                });
            };

            /** executed to perform the search */
            SearchManager.prototype.search = function () {
                this.viewModel.messageQueue.clear();

                if (this.advancedPanelActive()) {
                    // should make an advanced search
                    this.searchType(2 /* Advanced */);
                    this.simpleSearchQuery('');
                    this.advancedPanelActive(false);
                } else if (this.simpleSearchQuery() != '') {
                    // make a simple search
                    this.searchType(1 /* Simple */);
                }

                // refresh the data source so that the query is performed again
                return this.viewModel.dataSource.update();
            };

            SearchManager.prototype.saveAndSearch = function () {
                var _this = this;
                // request a name
                return this.showInputBox('Enter a name for the search').then(function (name) {
                    // TODO post the saved search to the server to notify that it got saved
                    var serializedRule = WebRuleUtils.serializeRule(_this.searchWidget()), search = new SavedSearch(name, serializedRule, _this.viewModel.options.savedSearchesGroup);
                    _this.savedSearches.add(search);

                    return _this.search();
                });
            };

            SearchManager.prototype.reset = function () {
                this.searchType(0 /* None */);
                this.simpleSearchQuery('');
                this.advancedPanelActive(false);

                if (this.searchWidget()) {
                    this.searchWidget().clear();
                }
            };

            SearchManager.prototype.clear = function () {
                this.reset();
                this.viewModel.dataSource.refresh();
            };
            return SearchManager;
        })();
        Searches.SearchManager = SearchManager;

        var SavedSearch = (function () {
            function SavedSearch(name, ruleData, group) {
                if (typeof group === "undefined") { group = ''; }
                this.name = name;
                this.ruleData = ruleData;
                this.group = group;
            }
            return SavedSearch;
        })();
        Searches.SavedSearch = SavedSearch;

        var SavedSearchesCollection = (function (_super) {
            __extends(SavedSearchesCollection, _super);
            function SavedSearchesCollection() {
                _super.apply(this, arguments);
                /** notifies interested partys  */
                this.loadSearchInteraction = new _app.Common.InteractionRequest();
            }
            SavedSearchesCollection.prototype.find = function (name) {
                return _(this.items()).find(function (search) {
                    return search.name === name;
                });
            };

            SavedSearchesCollection.prototype.load = function (search) {
                return this.loadSearchInteraction.request({ search: search, execute: false });
            };

            SavedSearchesCollection.prototype.loadAndExecute = function (search) {
                return this.loadSearchInteraction.request({ search: search, execute: true });
            };
            return SavedSearchesCollection;
        })(_app.Collection.SetCollection);
        Searches.SavedSearchesCollection = SavedSearchesCollection;

        var WebRuleUtils;
        (function (WebRuleUtils) {
            var ElementType;
            (function (ElementType) {
                ElementType[ElementType["Flow"] = 0] = "Flow";
                ElementType[ElementType["Field"] = 1] = "Field";
                ElementType[ElementType["Function"] = 2] = "Function";
                ElementType[ElementType["Operator"] = 3] = "Operator";
                ElementType[ElementType["Value"] = 4] = "Value";
                ElementType[ElementType["Clause"] = 6] = "Clause";
                ElementType[ElementType["Action"] = 7] = "Action";
                ElementType[ElementType["LeftParenthesis"] = 8] = "LeftParenthesis";
                ElementType[ElementType["RightParenthesis"] = 9] = "RightParenthesis";
                ElementType[ElementType["LeftBracket"] = 10] = "LeftBracket";
                ElementType[ElementType["RightBracket"] = 11] = "RightBracket";
                ElementType[ElementType["Calculation"] = 12] = "Calculation";
                ElementType[ElementType["Tab"] = 13] = "Tab";
                ElementType[ElementType["NewLine"] = 15] = "NewLine";
                ElementType[ElementType["HtmlTag"] = 16] = "HtmlTag";
            })(ElementType || (ElementType = {}));

            var CalculationType;
            (function (CalculationType) {
                CalculationType[CalculationType["Field"] = 0] = "Field";
                CalculationType[CalculationType["LeftParenthesis"] = 1] = "LeftParenthesis";
                CalculationType[CalculationType["RightParenthesis"] = 2] = "RightParenthesis";
                CalculationType[CalculationType["Multiplication"] = 3] = "Multiplication";
                CalculationType[CalculationType["Division"] = 4] = "Division";
                CalculationType[CalculationType["Addition"] = 6] = "Addition";
                CalculationType[CalculationType["Subtraction"] = 7] = "Subtraction";
                CalculationType[CalculationType["Number"] = 8] = "Number";
                CalculationType[CalculationType["None"] = 9] = "None";
            })(CalculationType || (CalculationType = {}));

            var FunctionType;
            (function (FunctionType) {
                FunctionType[FunctionType["Name"] = 0] = "Name";
                FunctionType[FunctionType["Param"] = 1] = "Param";
                FunctionType[FunctionType["Comma"] = 2] = "Comma";
                FunctionType[FunctionType["End"] = 3] = "End";
                FunctionType[FunctionType["None"] = 4] = "None";
            })(FunctionType || (FunctionType = {}));

            var InputType;
            (function (InputType) {
                InputType[InputType["Field"] = 0] = "Field";
                InputType[InputType["Input"] = 1] = "Input";
                InputType[InputType["None"] = 2] = "None";
            })(InputType || (InputType = {}));

            var OperatorType;
            (function (OperatorType) {
                OperatorType[OperatorType["String"] = 0] = "String";
                OperatorType[OperatorType["Numeric"] = 1] = "Numeric";
                OperatorType[OperatorType["Date"] = 2] = "Date";
                OperatorType[OperatorType["Time"] = 3] = "Time";
                OperatorType[OperatorType["Bool"] = 4] = "Bool";
                OperatorType[OperatorType["Enum"] = 6] = "Enum";
                OperatorType[OperatorType["None"] = 8] = "None";
            })(OperatorType || (OperatorType = {}));

            /** returns a string that can be used later to re-load the rule in the control,
            calling extract returns a string that must be sent to the server for processing
            to return this string.
            Maybe a similar function will be included in WebRule's code in future versions.
            For now this function is basically a rewrite of the (decompiled) C# code on the
            server.
            IMPORTANT: This function is EXTREMELY dependant on the current version of WebRule
            it might not be correct for future versions, always review when updating to newer
            versions */
            function serializeRule(widget) {
                var result = '', ruleDataString = widget.extract(), ruleData = JSON.parse(ruleDataString);

                result += "[";

                result += "{'g':" + (ruleData.Id ? "'" + ruleData.Id + "'" : "null") + ",";
                result += "'v':" + ruleData.IsLoadedRuleOfEvalType + ",";
                result += "'n':" + (ruleData.Name ? "'" + ruleData.Name + "'" : "null") + ",";
                result += "}";

                _.each(ruleData.Elements, function (element) {
                    result += ",";
                    result += "{";

                    switch (element.Type) {
                        case 0 /* Flow */:
                        case 6 /* Clause */:
                            nullField('n');
                            stringField('v', element.Value);
                            break;
                        case 1 /* Field */:
                            nullField('n');
                            stringField('v', element.Value);
                            numericField('l', element.IsRule ? 1 : 0);
                            numericField('d', element.NotFound ? 1 : 0);
                            numericField('o', element.Oper);
                            if (element.Oper === 6 /* Enum */) {
                                stringField('e', element.En);
                            }
                            break;
                        case 2 /* Function */:
                        case 7 /* Action */:
                            nullField('n');
                            numericField('f', element.FuncType);
                            numericField('d', element.NotFound ? 1 : 0);
                            switch (element.FuncType) {
                                case 0 /* Name */:
                                case 3 /* End */:
                                    stringField('v', element.Value);
                                    numericField('o', element.Oper);
                                    break;
                                case 1 /* Param */:
                                    stringField('v', element.Value);
                                    switch (element.InpType) {
                                        case 0 /* Field */:
                                            numericField('o', element.Oper);
                                            break;
                                        case 1 /* Input */:
                                            switch (element.Oper) {
                                                case 2 /* Date */:
                                                case 3 /* Time */:
                                                    stringField('r', element.Format);
                                                    break;
                                                case 6 /* Enum */:
                                                    stringField('e', element.En);
                                                    break;
                                            }
                                            break;
                                    }
                                    break;
                            }
                            break;
                        case 3 /* Operator */:
                            nullField('n');
                            stringField('v', element.Value);
                            numericField('o', element.Oper);
                            break;
                        case 4 /* Value */:
                            nullField('n');
                            stringField('v', element.Value);
                            numericField('i', element.InpType);
                            numericField('o', element.Oper);
                            break;
                        case 8 /* LeftParenthesis */:
                        case 9 /* RightParenthesis */:
                        case 10 /* LeftBracket */:
                        case 11 /* RightBracket */:
                            nullField('n');
                            break;
                        case 12 /* Calculation */:
                            nullField('n');
                            numericField('c', element.CalType);
                            switch (element.CalType) {
                                case 0 /* Field */:
                                case 8 /* Number */:
                                    stringField('v', element.Value);
                            }
                            break;
                    }
                    numericField('t', element.Type);
                    result += "}";
                });

                result += "]";

                return result;

                function nullField(field) {
                    result += "'" + field + "': null,";
                }

                function stringField(field, value) {
                    result += "'" + field + "':'" + value + "',";
                }

                function numericField(field, value) {
                    result += "'" + field + "':" + value + ",";
                }
            }
            WebRuleUtils.serializeRule = serializeRule;

            /** I made this because CodeEffects' Rules controls lacks of a dispose mechanism,
            this may not be needed for future versions. And this is my own version of the cleaning. */
            function destroyWebRule(widget) {
                // call this just in case,
                widget.dispose();

                removeHandlersFromNode(document);
                removeHandlersFromNode(window);

                // remove filter dialog that is leaved behind
                $('#ceR_filter-container').remove();

                function removeHandlersFromNode(node) {
                    var ceEvents = node['ceEvents'];
                    for (var event in ceEvents) {
                        _(ceEvents[event]).each(function (x) {
                            return node.removeEventListener(event, x.browserHandler);
                        });
                    }
                    node['ceEvents'] = null;
                }
            }
            WebRuleUtils.destroyWebRule = destroyWebRule;
        })(WebRuleUtils || (WebRuleUtils = {}));

        (function (Knockout) {
            ko.bindingHandlers['searchInput'] = {
                init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var options = valueAccessor(), cancelSearchElement = $("<span>").addClass("k-icon k-i-close search-input-close")[0], placeHolder = ko.computed(function () {
                        return options.type() === 2 /* Advanced */ ? '[Advanced Search]' : '';
                    }), searchActive = ko.computed(function () {
                        return options.type() != 0 /* None */;
                    }), cancelSearchElementVisible = ko.computed(function () {
                        return options.type() != 0 /* None */;
                    });

                    $(element).wrap("<span>").parent().append(cancelSearchElement);

                    ko.applyBindingsToNode(element, {
                        'value': options.query,
                        'pressEnter': options.search,
                        'attr': { 'placeholder': placeHolder },
                        'css': { 'search-active': searchActive }
                    }, viewModel);

                    ko.applyBindingsToNode(cancelSearchElement, { 'click': options.clear, 'visible': cancelSearchElementVisible }, viewModel);

                    ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                        _app.Common.bulkDispose(placeHolder, searchActive, cancelSearchElementVisible);
                    });

                    return { 'controlsDescendantBindings': true };
                }
            };

            /** used to store the settings for each webrule control, so when the application
            is running there's a single request for the webRule settings */
            var webRuleSettingsCache = {};

            function makeWebRule(element, options) {
                var id = id = element.attr('id');

                var widget = new $rule.Control([id, false, false, null]);

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
                        _app.ajax.connection.online().then(function (online) {
                            if (online) {
                                return _app.ajax.get(options.settingsUrl).then(function (data) {
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
                        }).done();
                    }
                } else {
                    throw new Error('either the settings or the settings URL must be specified for the webRule control');
                }

                return {
                    widget: widget,
                    dispose: function () {
                        try  {
                            WebRuleUtils.destroyWebRule(widget);
                        } catch (e) {
                            console.log('codeeffects dispose error captured:', e);
                        }
                    }
                };
            }
            Knockout.makeWebRule = makeWebRule;

            ko.bindingHandlers['webRule'] = {
                init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    // sometimes there's a bug here caused when the CodeEffect rule control is initialized
                    // before the target element is on the DOM, note that the Rule control receives the
                    // element's ID and searches for the target element using standard DOM api
                    var $element = $(element), value = ko.unwrap(valueAccessor()), id = $element.attr('id');

                    _app.Utils.async(function () {
                        var webRuleBuilder = makeWebRule($element, value);

                        value.widget(webRuleBuilder.widget);

                        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                            value.widget(null);
                            webRuleBuilder.dispose();
                        });
                    });

                    return { 'controlsDescendantBindings': true };
                }
            };
        })(Searches.Knockout || (Searches.Knockout = {}));
        var Knockout = Searches.Knockout;
    })(exports.Searches || (exports.Searches = {}));
    var Searches = exports.Searches;

    (function (Filters) {
        var QueryFilterManager = (function () {
            function QueryFilterManager(filter, dataSource) {
                var _this = this;
                this.filter = filter;
                this.dataSource = dataSource;
                this.parameters = ko.observableArray();
                dataSource.addQueryLevel(function (query) {
                    _.each(_this.parameters(), function (parameter) {
                        query = _this.filter(query, parameter);
                    });
                    return query;
                });
            }
            QueryFilterManager.prototype.updateFilter = function () {
                var params = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    params[_i] = arguments[_i + 0];
                }
                this.clear();
                this.parameters.push.apply(this.parameters, params);

                return this.dataSource.update();
            };

            QueryFilterManager.prototype.add = function (parameter) {
                this.parameters.push(parameter);
                return this.dataSource.update();
            };

            QueryFilterManager.prototype.remove = function (parameter) {
                this.parameters.remove(parameter);
                return this.dataSource.update();
            };

            QueryFilterManager.prototype.clear = function () {
                this.parameters.removeAll();
                return this.dataSource.update();
            };
            return QueryFilterManager;
        })();
        Filters.QueryFilterManager = QueryFilterManager;
    })(exports.Filters || (exports.Filters = {}));
    var Filters = exports.Filters;

    /** contains classes related to saving and retrieving metadata from the server */
    (function (Metadata) {
        var Manager = (function () {
            function Manager(item, builderUrl, metaUrl) {
            }
            return Manager;
        })();
        Metadata.Manager = Manager;
    })(exports.Metadata || (exports.Metadata = {}));
    var Metadata = exports.Metadata;

    (function (Wizzard) {
        var WizzardViewModel = (function (_super) {
            __extends(WizzardViewModel, _super);
            function WizzardViewModel(options) {
                var _this = this;
                _super.call(this);
                this.options = options;
                this.hasErrors = ko.observable(false);
                this.step = ko.observable(0);
                this.forceValidation = ko.observable(false);
                this.closeEvent = new _app.Common.Event();
                this.totalSteps = options.totalSteps;
                this.item = options.item || this.createDetachedEntity();

                this.canGoNext = ko.computed(function () {
                    return !_this.hasErrors() && _this.step() < _this.totalSteps;
                });
                this.canGoPrev = ko.computed(function () {
                    return !_this.hasErrors() && _this.step() > 0;
                });
                this.canFinish = ko.computed(function () {
                    return !_this.hasErrors() && _this.step() === _this.totalSteps;
                });
            }
            WizzardViewModel.prototype.dispose = function () {
                _app.Common.bulkDispose(this.canFinish, this.canGoNext, this.canGoPrev);
            };

            WizzardViewModel.prototype.createDetachedEntity = function () {
                var item = this.options.dataSource.createEntity();
                this.options.dataSource.manager.detachEntity(item);
                return item;
            };

            WizzardViewModel.prototype.moveTo = function (step) {
                this.forceValidation(true);
                if (!this.hasErrors() && step >= 0 && step <= this.totalSteps) {
                    this.forceValidation(false);
                    this.step(step);
                }
            };

            WizzardViewModel.prototype.navigate = function (step) {
                if (step < this.step()) {
                    this.moveTo(step);
                }
            };

            WizzardViewModel.prototype.nextStep = function () {
                this.moveTo(this.step() + 1);
            };

            WizzardViewModel.prototype.prevStep = function () {
                this.moveTo(this.step() - 1);
            };

            WizzardViewModel.prototype.save = function () {
                var _this = this;
                // ensure the item is attached to the manager before saving changes
                this.options.dataSource.manager.addEntity(this.item);
                return this.options.dataSource.saveChanges([this.item]).fail(function (e) {
                    _this.options.dataSource.manager.detachEntity(_this.item);
                    return Q.reject(e);
                });
            };

            WizzardViewModel.prototype.saveAndClose = function () {
                var _this = this;
                if (this.step() === this.totalSteps) {
                    return this.save().then(function () {
                        return _this.options.close();
                    });
                } else {
                    return Q.reject(new Error('wizzard is not on the last step'));
                }
            };

            WizzardViewModel.prototype.close = function () {
                var _this = this;
                return _app.Views.smartMessage({
                    title: '',
                    content: "Current item has changed, do you want to save changes?",
                    type: 0 /* Question */
                }).then(function (result) {
                    if (result === 0 /* Yes */) {
                        return _this.saveAndClose();
                    } else if (result === 1 /* No */) {
                        // just close the window, the entity is detached anyway
                        _this.options.close();
                    } else {
                        return Q.reject();
                    }
                });
            };

            WizzardViewModel.prototype.saveDraft = function () {
                if (!this.options.saveDraft)
                    throw new Error('save draft option must be specified');

                this.options.saveDraft(this.item);
                this.options.close();
            };
            return WizzardViewModel;
        })(_app.Common.ViewModelBase);
        Wizzard.WizzardViewModel = WizzardViewModel;

        /**  */
        var WizzardView = (function (_super) {
            __extends(WizzardView, _super);
            function WizzardView(options) {
                _super.call(this, options);
            }
            return WizzardView;
        })(_app.Marionette.View);
        Wizzard.WizzardView = WizzardView;

        ko.bindingHandlers['wizzardTabContent'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var $element = $(element), value = valueAccessor(), errorCollection = bindingContext[Knockout.ErrorTrack.JIGSAWERRORCOLLECTION], visible = ko.computed(function () {
                    return value.step() === value.index;
                }), collection = new Knockout.Tracks.TuneledTrackCollection(errorCollection, null, null, visible), tabContext = bindingContext.createChildContext(value.item), extendOptions = {};
                extendOptions[Knockout.ErrorTrack.JIGSAWERRORCOLLECTION] = collection;
                tabContext.extend(extendOptions);

                ko.applyBindingsToNode(element, {
                    visible: visible
                }, tabContext);

                $element.addClass('busy');
                var bindingsApplied = false, disposable = value.step.subscribe(function (step) {
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

                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    disposable.dispose();
                });

                return { 'controlsDescendantBindings': true };

                function applyBindings(timeout) {
                    if (typeof timeout === "undefined") { timeout = 500; }
                    bindingsApplied = true;
                    setTimeout(function () {
                        ko.applyBindingsToDescendants(tabContext, element);
                        $element.removeClass('busy');
                    }, timeout);
                }
            }
        };

        var WizzardDialogManager = (function () {
            function WizzardDialogManager(dataSource, wizzardViewBuilder, saveDraft) {
                this.dataSource = dataSource;
                this.wizzardViewBuilder = wizzardViewBuilder;
                this.saveDraft = saveDraft;
            }
            WizzardDialogManager.prototype.showDialog = function (item) {
                var view = this.wizzardViewBuilder(), viewModel = new WizzardViewModel({
                    item: item,
                    dataSource: this.dataSource,
                    close: closeWindow,
                    saveDraft: this.saveDraft,
                    totalSteps: view.options.totalSteps
                }), window = new _app.Views.WindowView(view.withViewModel(viewModel), { close: close, size: 2 /* LARGE */ });

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
            };
            return WizzardDialogManager;
        })();
        Wizzard.WizzardDialogManager = WizzardDialogManager;
    })(exports.Wizzard || (exports.Wizzard = {}));
    var Wizzard = exports.Wizzard;

    (function (Chooser) {
        var ChooserDialogItem = (function () {
            function ChooserDialogItem(column) {
                this.column = column;
                this.active = ko.observable(true);
            }
            return ChooserDialogItem;
        })();

        var ChooserDialogViewModel = (function (_super) {
            __extends(ChooserDialogViewModel, _super);
            function ChooserDialogViewModel(options) {
                _super.call(this);
                this.options = options;
                this.cancelled = false;
                /** returns true if the title headers should be included */
                this.includeHeaders = ko.observable(true);
                this.allPages = ko.observable(true);
                this.pageFrom = ko.observable(1);
                this.pageTo = ko.observable(1);

                this.columns = _.map(options.columns, function (col) {
                    return new ChooserDialogItem(col);
                });
            }
            ChooserDialogViewModel.prototype.getActiveColumns = function () {
                return {
                    includeHeaders: this.includeHeaders(),
                    allPages: this.allPages(),
                    pageFrom: this.pageFrom(),
                    pageTo: this.pageTo(),
                    columns: _.chain(this.columns).filter(function (col) {
                        return col.active();
                    }).map(function (col) {
                        return col.column;
                    }).value()
                };
            };

            ChooserDialogViewModel.prototype.close = function () {
                this.options.close();
            };

            ChooserDialogViewModel.prototype.accept = function () {
                this.cancelled = false;
                this.close();
            };

            ChooserDialogViewModel.prototype.cancel = function () {
                this.cancelled = true;
                this.close();
            };
            return ChooserDialogViewModel;
        })(_app.Common.ViewModelBase);
        Chooser.ChooserDialogViewModel = ChooserDialogViewModel;

        var ChooserDialogManager = (function () {
            function ChooserDialogManager(columns) {
                this.columns = columns;
                this._viewTemplate = templates.chooser.ChooserDialog({
                    columns: _.map(columns, function (col) {
                        return col.title;
                    })
                });
            }
            ChooserDialogManager.prototype.showDialog = function () {
                var _this = this;
                var viewModel = new ChooserDialogViewModel({ columns: this.columns, close: closeWindow }), view = new _app.Marionette.View({ template: function () {
                        return _this._viewTemplate;
                    }, viewModel: viewModel }), window = new _app.Views.WindowView(view, { close: close, resizable: false });

                return window.showDialog().then(function () {
                    return viewModel.cancelled ? null : viewModel.getActiveColumns();
                });

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
            };
            return ChooserDialogManager;
        })();
        Chooser.ChooserDialogManager = ChooserDialogManager;

        function showColumnsChooserDialog(columns) {
            var manager = new ChooserDialogManager(columns);
            return manager.showDialog();
        }
        Chooser.showColumnsChooserDialog = showColumnsChooserDialog;
    })(exports.Chooser || (exports.Chooser = {}));
    var Chooser = exports.Chooser;

    (function (Notifications) {
        var NotificationsDataSource = (function (_super) {
            __extends(NotificationsDataSource, _super);
            function NotificationsDataSource() {
                _super.apply(this, arguments);
            }
            /** overwrite the method to set the date on each notification, because the value received from
            the server is a string */
            NotificationsDataSource.prototype.replaceData = function (notifications) {
                _(notifications).each(function (notification) {
                    return notification.TimeStamp = new Date(notification.TimeStamp);
                });
                _super.prototype.replaceData.call(this, notifications);
            };
            return NotificationsDataSource;
        })(Server.LightDataSource);
        Notifications.NotificationsDataSource = NotificationsDataSource;

        var NotificationViewModel = (function (_super) {
            __extends(NotificationViewModel, _super);
            function NotificationViewModel(dataSource) {
                var _this = this;
                _super.call(this);
                this.dataSource = dataSource;
                /** returns true if the notifications are local */
                this.localScope = ko.observable(false);
                this.levelScope = ko.observable(0 /* Success */);

                dataSource.addQueryLevel(function (query) {
                    return _this.queryParameters(query);
                });

                this.items = dataSource.data;
            }
            /** adds parameters to the query to retrieve the correct notifications */
            NotificationViewModel.prototype.queryParameters = function (query) {
                return query.from(this.localScope() ? 'localNotifications' : 'globalNotifications').withParameters({
                    level: this.levelScope()
                });
            };
            return NotificationViewModel;
        })(_app.Common.ViewModelBase);
        Notifications.NotificationViewModel = NotificationViewModel;

        /** this module will handle all local/global notifications */
        var NotificationModule = (function (_super) {
            __extends(NotificationModule, _super);
            function NotificationModule(coreModule, ribbonPanelNotificationModule) {
                _super.call(this);
                this.coreModule = coreModule;
                this.ribbonPanelNotificationModule = ribbonPanelNotificationModule;
                this.stylesModule = new _app.Jigsaw.Theming.ContentStyleSheet(templates.notification.styles);
                this.dataStylesModule = new _app.Jigsaw.Theming.ContentStyleSheet(templates.styles);

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
            NotificationModule.prototype.requiredModules = function () {
                return [this.stylesModule, this.dataStylesModule, this.coreModule, this.ribbonPanelNotificationModule];
            };

            NotificationModule.prototype.load = function () {
                return this.coreModule.content.show(this.view);
            };

            NotificationModule.prototype.registerUris = function () {
                var _this = this;
                var uris = [
                    {
                        url: 'local-notifications',
                        level: 0 /* Success */,
                        local: true
                    },
                    {
                        url: 'local-notifications/success',
                        level: 0 /* Success */,
                        local: true
                    },
                    {
                        url: 'local-notifications/warning',
                        level: 1 /* Warning */,
                        local: true
                    },
                    {
                        url: 'local-notifications/error',
                        level: 2 /* Error */,
                        local: true
                    },
                    {
                        url: 'global-notifications',
                        level: 0 /* Success */,
                        local: false
                    },
                    {
                        url: 'global-notifications/success',
                        level: 0 /* Success */,
                        local: false
                    },
                    {
                        url: 'global-notifications/warning',
                        level: 1 /* Warning */,
                        local: false
                    },
                    {
                        url: 'global-notifications/error',
                        level: 2 /* Error */,
                        local: false
                    }
                ];

                _.each(uris, function (item) {
                    _app.history.register(item.url, function () {
                        _this.viewModel.levelScope(item.level);
                        _this.viewModel.localScope(item.local);

                        return _app.moduleManager.load(_this).then(function () {
                            return _this.viewModel.dataSource.update();
                        });
                    });
                });
            };

            NotificationModule.prototype.registerUriHandlers = function () {
                this.ribbonPanelNotificationModule.localNotificationsViewModel.showNotificationsEvent.add(function (level) {
                    switch (level) {
                        case 2 /* Error */:
                            _app.history.navigate('local-notifications/error');
                            break;
                        case 1 /* Warning */:
                            _app.history.navigate('local-notifications/warning');
                            break;
                        case 0 /* Success */:
                            _app.history.navigate('local-notifications/success');
                            break;
                        default:
                            throw new Error('out of range error');
                    }
                });

                this.ribbonPanelNotificationModule.globalNotificationsViewModel.showNotificationsEvent.add(function (level) {
                    switch (level) {
                        case 2 /* Error */:
                            _app.history.navigate('global-notifications/error');
                            break;
                        case 1 /* Warning */:
                            _app.history.navigate('global-notifications/warning');
                            break;
                        case 0 /* Success */:
                            _app.history.navigate('global-notifications/success');
                            break;
                        default:
                            throw new Error('out of range error');
                    }
                });
            };
            return NotificationModule;
        })(_app.Modules.ModuleBase);
        Notifications.NotificationModule = NotificationModule;
    })(exports.Notifications || (exports.Notifications = {}));
    var Notifications = exports.Notifications;

    (function (Sidebar) {
        (function (MyItems) {
            function entitiesPersistedArray(key, dataSource) {
                return _app.Knockout.persistedArray({
                    key: key,
                    parse: function (item) {
                        // return a new detached entity
                        var entity = dataSource.createEntity(item);
                        dataSource.manager.detachEntity(entity);
                        return entity;
                    },
                    stringify: function (item) {
                        // include all data properties
                        var includedColumns = _.map(dataSource.entityType.dataProperties, function (prop) {
                            return prop.name;
                        }), plainObject = {};

                        // copy all data properties
                        _.each(includedColumns, function (column) {
                            var propertyValue = ko.unwrap(item[column]);
                            if (propertyValue != null) {
                                plainObject[column] = propertyValue;
                            }
                        });
                        return plainObject;
                    }
                });
            }
            MyItems.entitiesPersistedArray = entitiesPersistedArray;

            var MyItemsCollection = (function (_super) {
                __extends(MyItemsCollection, _super);
                function MyItemsCollection(options) {
                    var _this = this;
                    _super.call(this);
                    this.options = options;
                    this.expanded = ko.observable(true);
                    this._drafts = ko.observable();

                    this.superItems = this.items;

                    // replace the super items computed observable to include the drafts array
                    this.items = ko.computed(function () {
                        return _this.drafts ? _.union(_this.superItems(), _this.drafts()) : _this.superItems();
                    });
                }
                Object.defineProperty(MyItemsCollection.prototype, "drafts", {
                    /** returns an observableArray that stores the drafts. The drafts are persisted on the user's localStorage
                    Note: the drafts can't be de-serialized until the metadata is fetched. */
                    get: function () {
                        return this._drafts();
                    },
                    enumerable: true,
                    configurable: true
                });

                /** this method must be called after the metadata for the target entity has been fetched from the server,
                so new drafts entities can be created. */
                MyItemsCollection.prototype.loadStoredDrafts = function () {
                    if (this.drafts || !this.options.dataSource) {
                        return;
                    }

                    this._drafts(entitiesPersistedArray('MyItemDraft.' + this.options.entityType, this.options.dataSource));
                };

                MyItemsCollection.prototype.add = function (item) {
                    if (!_.contains(this.items(), item)) {
                        this.superItems.push(item);
                    }
                    this.expanded(true);
                };

                MyItemsCollection.prototype.addDraft = function (item) {
                    if (!this.drafts)
                        throw new Error('this MyItems collection can not store drafts.');
                    if (!item.entityAspect.entityState.isDetached())
                        throw new Error('only detached entities can be saved as drafts');

                    if (!_.contains(this.drafts(), item)) {
                        this.drafts.push(item);
                    }
                    this.expanded(true);
                };

                MyItemsCollection.prototype.remove = function () {
                    var items = [];
                    for (var _i = 0; _i < (arguments.length - 0); _i++) {
                        items[_i] = arguments[_i + 0];
                    }
                    this.superItems.removeAll(items);
                    this.drafts.removeAll(items);
                };

                MyItemsCollection.prototype.belongsTo = function (item) {
                    return this.options.entityType === item.entityType.shortName;
                };

                MyItemsCollection.prototype.navigate = function (item) {
                    var _this = this;
                    return function () {
                        // if the item is a draft remove it from the list before executing it's navigate method
                        if (item.entityAspect.entityState.isDetached()) {
                            _this.drafts.remove(item);
                        }

                        _this.options.navigate(item);
                    };
                };

                MyItemsCollection.prototype.render = function (item) {
                    return this.options.render(item);
                };
                return MyItemsCollection;
            })(_app.Collection.SetCollection);
            MyItems.MyItemsCollection = MyItemsCollection;

            var MyItemsViewModel = (function (_super) {
                __extends(MyItemsViewModel, _super);
                function MyItemsViewModel() {
                    _super.apply(this, arguments);
                    this.sets = ko.observableArray();
                    this.messageQueue = new _app.Jigsaw.Messages.ExtraSmallBoxMessageQueue();
                }
                MyItemsViewModel.prototype.add = function (name, collection) {
                    // only add the collection if it isn't already present
                    if (!_(this.sets()).any(function (x) {
                        return x.collection == collection;
                    })) {
                        this.sets.push({ name: name, collection: collection });
                    }
                };

                /** adds a new element to the corresponding set, if a proper set exists */
                MyItemsViewModel.prototype.drop = function (data) {
                    var item = _(this.sets()).find(function (x) {
                        return x.collection.belongsTo(data);
                    });

                    if (item) {
                        // add item and show message after
                        item.collection.add(data);

                        // show message of item added succesfully
                        this.messageQueue.clear().add({
                            title: 'Success',
                            body: 'item added to my Items',
                            level: 2 /* Success */
                        });
                    } else {
                        this.messageQueue.clear().add({
                            title: 'Error',
                            body: "The dropped entity doesn't belong to any set",
                            level: 2 /* Success */
                        });
                    }
                };

                MyItemsViewModel.prototype.remove = function (data) {
                    var item = _(this.sets()).find(function (x) {
                        return _(x.collection.items()).contains(data);
                    });

                    if (item) {
                        item.collection.remove(data);
                        this.messageQueue.clear().add({
                            title: 'Success',
                            body: "Row removed from My Items successfully.",
                            level: 2 /* Success */
                        });
                    }
                };
                return MyItemsViewModel;
            })(_app.Common.ViewModelBase);
            MyItems.MyItemsViewModel = MyItemsViewModel;

            var MyItemsModule = (function (_super) {
                __extends(MyItemsModule, _super);
                function MyItemsModule(sidebarModule) {
                    _super.call(this);
                    this.sidebarModule = sidebarModule;
                    this.stylesModule = new _app.Jigsaw.Theming.ContentStyleSheet(templates.myitems.myItemsStyles);

                    this._myItemsViewModel = new MyItemsViewModel();
                    var view = new _app.Marionette.View({
                        template: templates.myitems.SidebarMyItems,
                        viewModel: this._myItemsViewModel
                    }), collapsedView = new _app.Marionette.View({
                        template: templates.myitems.SidebarMyItemsCollapsed,
                        viewModel: this._myItemsViewModel
                    });

                    sidebarModule.registerView(view, collapsedView);
                    sidebarModule.addSlave(this);
                }
                MyItemsModule.prototype.registerSet = function (title, collection) {
                    this._myItemsViewModel.add(title, collection);
                };

                MyItemsModule.prototype.requiredModules = function () {
                    return [this.sidebarModule, this.stylesModule];
                };
                return MyItemsModule;
            })(_app.Modules.ModuleWithSlavesBase);
            MyItems.MyItemsModule = MyItemsModule;

            /** This module should be used by other modules who want to register a MyItemsCollection,
            with the Sidebar, it will be added as an Slave of the MyItemsModule */
            var MyItemsCollectionModule = (function (_super) {
                __extends(MyItemsCollectionModule, _super);
                function MyItemsCollectionModule(options) {
                    var _this = this;
                    _super.call(this);
                    this.options = options;

                    this.ensureMetadataFetchedModule = options.ensureMetadataFetchedModule;
                    if (options.styles) {
                        this.stylesModule = new _app.Jigsaw.Theming.ContentStyleSheet(options.styles);
                    }

                    this.collection = new MyItemsCollection({
                        entityType: this.options.dataSource.typeName,
                        render: function () {
                            return new _app.Marionette.View({ template: _this.options.itemTemplate });
                        },
                        navigate: this.options.navigate,
                        dataSource: this.options.dataSource
                    });

                    this.options.myItemsModule.registerSet(new _app.Marionette.View({ template: this.options.itemTitleTemplate }), this.collection);
                    options.myItemsModule.addSlave(this);
                }
                MyItemsCollectionModule.prototype.requiredModules = function () {
                    if (this.stylesModule) {
                        return [this.ensureMetadataFetchedModule, this.stylesModule];
                    } else {
                        return [this.ensureMetadataFetchedModule];
                    }
                };

                MyItemsCollectionModule.prototype.load = function () {
                    // load stored drafts now that the metadata has been fetched
                    this.collection.loadStoredDrafts();

                    return _super.prototype.load.call(this);
                };
                return MyItemsCollectionModule;
            })(_app.Modules.ModuleWithSlavesBase);
            MyItems.MyItemsCollectionModule = MyItemsCollectionModule;
        })(Sidebar.MyItems || (Sidebar.MyItems = {}));
        var MyItems = Sidebar.MyItems;

        (function (MySearches) {
            var SavedSearchesMultiSet = (function (_super) {
                __extends(SavedSearchesMultiSet, _super);
                function SavedSearchesMultiSet() {
                    _super.apply(this, arguments);
                }
                SavedSearchesMultiSet.prototype.load = function (search) {
                    var part = this.findPartContaining(search);
                    if (part) {
                        return part.load(search);
                    }
                };

                SavedSearchesMultiSet.prototype.loadAndExecute = function (search) {
                    var part = this.findPartContaining(search);
                    if (part) {
                        return part.loadAndExecute(search);
                    }
                };
                return SavedSearchesMultiSet;
            })(_app.Collection.MultiSetCollection);
            MySearches.SavedSearchesMultiSet = SavedSearchesMultiSet;

            var SavedSearchesViewModel = (function (_super) {
                __extends(SavedSearchesViewModel, _super);
                function SavedSearchesViewModel() {
                    _super.apply(this, arguments);
                    this.storage = new SavedSearchesMultiSet();
                    this.messageQueue = new _app.Jigsaw.Messages.InlineMessageQueue();
                }
                return SavedSearchesViewModel;
            })(_app.Common.ViewModelBase);
            MySearches.SavedSearchesViewModel = SavedSearchesViewModel;

            var SavedSearchModule = (function (_super) {
                __extends(SavedSearchModule, _super);
                function SavedSearchModule(sidebarModule) {
                    _super.call(this);
                    this.sidebarModule = sidebarModule;
                    this._stylesModule = new _app.Jigsaw.Theming.ContentStyleSheet(templates.mysearches.mySearchesStyles);

                    this.viewModel = new SavedSearchesViewModel();
                    var view = new _app.Marionette.View({
                        template: templates.mysearches.SidebarMySearches,
                        viewModel: this.viewModel
                    }), collapsedView = new _app.Marionette.View({
                        template: templates.mysearches.SidebarMySearchesCollapsed,
                        viewModel: this.viewModel
                    });

                    sidebarModule.registerView(view, collapsedView);
                    sidebarModule.addSlave(this);
                }
                SavedSearchModule.prototype.registerCollection = function (collection) {
                    this.viewModel.storage.blendWith(collection);
                };

                SavedSearchModule.prototype.requiredModules = function () {
                    return [this.sidebarModule, this._stylesModule];
                };
                return SavedSearchModule;
            })(_app.Modules.ModuleBase);
            MySearches.SavedSearchModule = SavedSearchModule;
        })(Sidebar.MySearches || (Sidebar.MySearches = {}));
        var MySearches = Sidebar.MySearches;
    })(exports.Sidebar || (exports.Sidebar = {}));
    var Sidebar = exports.Sidebar;

    /** Contains precompiled templates */
    (function (Templates) {
        function ViewBar(templateFunction) {
            return new _app.Marionette.View({ template: composedTemplate });

            function composedTemplate(helpersParam) {
                var helpers = _.defaults(helpersParam || {}, { throttle: true });

                return Q(templateFunction(helpers)).then(function (template) {
                    return templates.ViewBar({ renderBody: template });
                });
            }
        }
        Templates.ViewBar = ViewBar;

        function ViewbarWithSummary(templateFunction) {
            return new _app.Marionette.View({ template: composedTemplate });

            function composedTemplate(helpersParam) {
                var helpers = _.defaults(helpersParam || {}, { throttle: true });

                return Q(templateFunction(helpers)).then(function (template) {
                    var summaryTabTemplate = SummaryTab(template), templateElement = $(template);

                    //templateElement.find('ul').append('<li data-bind="keyTipsKendoTab : { key : \'VM\' }" >Summary</li>');
                    templateElement.find('ul').append('<li><a data-toggle="tab" href="#tab-summary" data-bind="keyTipsGroup: { key : \'VM\', group : \'vb-summary\'}" >Summary</a ></li>');

                    //templateElement.find('ul').parent().append(summaryTabTemplate);
                    templateElement.find('ul').parent().children(".tab-content").append('<div id="tab-summary" class="tab-pane">' + summaryTabTemplate + '</div>');

                    var resultingTemplate = templateElement[0].outerHTML;

                    return templates.ViewBar({ renderBody: resultingTemplate });
                });
            }
        }
        Templates.ViewbarWithSummary = ViewbarWithSummary;

        /** extracts the tabs from a viewbar template and concatenates the content of each tab */
        function SummaryTab(template) {
            var tabs = WizzardView.extractTabs(template), summaryTabTemplate = templates.ViewBarSummaryTabContent({ tabs: tabs });
            return summaryTabTemplate;
        }
        Templates.SummaryTab = SummaryTab;

        function VersionPager(template) {
            return new _app.Marionette.View({ template: composeTemplate });

            function composeTemplate(helpers) {
                return templates.VersionPagerViewBar({
                    renderBody: template(helpers)
                });
            }
        }
        Templates.VersionPager = VersionPager;

        function PopupLayout(templateFunction) {
            return new _app.Marionette.View({ template: composeTemplate });

            function composeTemplate() {
                return Q(templateFunction({ throttle: false })).then(function (template) {
                    return templates.PopupLayout({ renderBody: template });
                });
            }
        }
        Templates.PopupLayout = PopupLayout;

        function WizzardView(viewbarTemplate, helpersParam) {
            var template = viewbarTemplate({ throttle: false }), tabs = WizzardView.extractTabs(template), helpers = _.defaults(helpersParam || {}, { tabs: tabs, title: '', classIdentifier: '' });

            return new Wizzard.WizzardView({
                template: function () {
                    return templates.Wizzard(helpers);
                },
                totalSteps: tabs.length
            });
        }
        Templates.WizzardView = WizzardView;

        (function (WizzardView) {
            function extractTabs(viewbarTemplate) {
                var html = $(viewbarTemplate), headers = html.find('ul > li'), content = html.find('.tab-pane'), length = Math.min(headers.length, content.length), result = new Array(length);

                for (var i = 0; i < length; i++) {
                    result[i] = {
                        header: headers.eq(i).html(),
                        content: content.eq(i).html()
                    };
                }

                return result;
            }
            WizzardView.extractTabs = extractTabs;
        })(Templates.WizzardView || (Templates.WizzardView = {}));
        var WizzardView = Templates.WizzardView;

        var DataItemsView = (function (_super) {
            __extends(DataItemsView, _super);
            function DataItemsView(options) {
                _super.call(this, options);
                this._domReadyTrash = new _app.Common.Trash();
            }
            Object.defineProperty(DataItemsView.prototype, "dataSource", {
                get: function () {
                    return this.options.viewModel.dataSource;
                },
                enumerable: true,
                configurable: true
            });

            DataItemsView.prototype.domReady = function () {
                _super.prototype.domReady.call(this);

                var gridElement = this.find('.k-grid')[0], grid = Knockout.Kendo.makeKendoGrid(gridElement, {
                    columns: Server.Kendo.getColumns(this.dataSource.entityType, this.options.columns || this.options.viewModel.options.columns),
                    dataSource: this.dataSource,
                    defaultSort: this.options.defaultSort || this.options.viewModel.options.columns[0],
                    dragHint: this.options.dragHint,
                    pageSize: 10,
                    selected: this.options.viewModel.selectedItem
                });

                if (this.options.columnChooser) {
                    var columnChooserElement = this.find('.' + Knockout.ColumnChooser.COLUMNCHOOSER), columnChooser = new Knockout.ColumnChooser.GridColumnChooserViewModel(this.options.viewModel.activeColumns, grid.widget), columnChooserView = new _app.Marionette.View({ viewModel: columnChooser, template: templates.ColumnChooser }), columnChooserRegion = _app.Marionette.renderViewIntoElement(columnChooserElement, columnChooserView);
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
            };

            DataItemsView.prototype.close = function () {
                _super.prototype.close.call(this);

                this.options.viewModel.searchManager.searchWidget(null);
                this._domReadyTrash.dispose();
                this.grid = null;
            };
            return DataItemsView;
        })(_app.Marionette.View);
        Templates.DataItemsView = DataItemsView;

        function DataItems(options) {
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
                template: function () {
                    return templates.DataItems(options);
                },
                viewModel: options.viewModel,
                columns: options.columns,
                dragHint: options.dragHint,
                defaultSort: options.defaultSort,
                advancedSearchSettings: options.advancedSearchSettings,
                advancedSearchSettingsUrl: options.advancedSearchSettingsUrl,
                columnChooser: options.columnChooser
            });
        }
        Templates.DataItems = DataItems;
    })(exports.Templates || (exports.Templates = {}));
    var Templates = exports.Templates;

    /** can be used as a dependency for a module that needs it's manager metadata before it's loaded */
    var EnsureMetadataFetchedModule = (function (_super) {
        __extends(EnsureMetadataFetchedModule, _super);
        function EnsureMetadataFetchedModule(dataSource) {
            _super.call(this);
            this.dataSource = dataSource;
        }
        EnsureMetadataFetchedModule.prototype.load = function () {
            return this.dataSource.fetchMetadata();
        };
        return EnsureMetadataFetchedModule;
    })(_app.Modules.ModuleBase);
    exports.EnsureMetadataFetchedModule = EnsureMetadataFetchedModule;

    var DataItemsViewModel = (function (_super) {
        __extends(DataItemsViewModel, _super);
        function DataItemsViewModel(dataSource, options) {
            var _this = this;
            _super.call(this);
            this.dataSource = dataSource;
            this.options = options;
            /** returns an array with the columns (fields) currently active in the view, this is used
            for the exports */
            this.activeColumns = ko.observableArray();
            /** contains the currently selected item */
            this.selectedItem = ko.guarded();
            /** event fired with an entity, when the selected item changes and a change in the
            URL is requested to point to the new state of the view model */
            this.requestNavigate = new _app.Common.InteractionRequest();
            /* function used to show a message box, can be replaced for testing purposes */
            this.showMessageBox = function (text, type) {
                return _app.Views.smartMessage({ title: '', content: text, type: type });
            };

            this.searchManager = new Searches.SearchManager(this);
            if (options && options.jumpToSearchUri && options.jumpToSearchProperty) {
                this.jumpToSearch = new Searches.JumpToSearch(options.jumpToSearchUri, options.jumpToSearchProperty, this);
            }

            this.dataSource.onError(function (e) {
                return _this.onDataSourceError(e);
            });
            this.dataSource.refreshed(function () {
                return _this.dataSourceRefreshed();
            });

            if (this.jumpToSearch) {
                this.selectedItem.guarded.subscribe(function (entity) {
                    if (entity) {
                        _this.requestNavigate.request(entity);
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
        DataItemsViewModel.prototype.dataSourceRefreshed = function () {
            if (this.dataSource.data.length === 0) {
                if (this.searchManager.searchType() === 1 /* Simple */) {
                    this.messageQueue.clear().add({
                        title: "Info",
                        body: "No results found for search term '" + this.searchManager.simpleSearchQuery() + "' please enter a new search term or cancel the search.",
                        level: 3 /* Info */
                    });
                } else if (this.searchManager.searchType() === 2 /* Advanced */) {
                    this.messageQueue.clear().add({
                        title: "Info",
                        body: "No results found for your advanced search. Please check your values or cancel the search.",
                        level: 3 /* Info */
                    });
                }
            }
        };

        /** this will be called when there's a server error on the datasource.
        this should notify the used through a message on the messageQueue */
        DataItemsViewModel.prototype.onDataSourceError = function (e) {
            try  {
                var details = JSON.parse(e.detail.ExceptionMessage);
                if (details.ClientInvalidData) {
                    this.searchManager.searchWidget().loadInvalids(details.ClientInvalidData);
                    this.messageQueue.add({
                        title: "Error",
                        body: "There's an error with the rules selected, check them.",
                        level: 0 /* Error */
                    });
                    return;
                }
            } catch (__) {
            }

            this.messageQueue.add({
                title: "Error",
                body: e.message,
                level: 0 /* Error */
            });
        };

        DataItemsViewModel.prototype.createEntity = function () {
            return this.dataSource.createEntity();
        };

        DataItemsViewModel.prototype.addNew = function () {
            var entity = this.createEntity();

            // mark the entity as selected, some other viewmodel should listen for this change
            // and only allow this item to be unselected when it has been added or removed.
            return this.selectedItem.inject(entity);
        };

        DataItemsViewModel.prototype.addNewWizzard = function () {
            return this.showWizzardDialog();
        };

        DataItemsViewModel.prototype.showWizzardDialog = function (entity) {
            // check that the wizzard dialog manager has been initialized
            if (!this.wizzardDialogManager) {
                return Q.reject(new Error('no viewbar template specified to build a wizzard'));
            }

            return this.wizzardDialogManager.showDialog(entity);
        };

        DataItemsViewModel.prototype.openWizzard = function (entityDraft) {
            var _this = this;
            // check that the wizzard dialog manager has been initialized
            if (!this.wizzardDialogManager) {
                return Q.reject(new Error('no viewbar template specified to build a wizzard'));
            }

            // unselect current item to avoid unsaved changes problems later
            return this.selectedItem.inject(null).then(function () {
                return _this.wizzardDialogManager.showDialog(entityDraft);
            });
        };

        DataItemsViewModel.prototype.filter = function (parameter) {
            return this.queryFilter.updateFilter(parameter);
        };

        /** this should be called when the containing module is re-loaded, to ensure
        all properties are set to it's original state */
        DataItemsViewModel.prototype.reset = function () {
            //this.selectedItem(null);
            this.searchManager.reset();
            if (this.queryFilter) {
                this.queryFilter.parameters.removeAll();
            }
        };

        /** triggers the excel export of the current view on the server if the excel export
        path was specified. */
        DataItemsViewModel.prototype.excelExport = function () {
            if (this.options && this.options.excelExportPath) {
                var query = this.dataSource.currentQuery.skip(null).take(null), searchOptions = Server.getQueryOptions(query, this.dataSource.entityType);

                searchOptions['columns'] = this.activeColumns();

                return _app.ajax.fileDownload(this.options.excelExportPath, searchOptions);
            }
        };

        DataItemsViewModel.prototype.excelPageExport = function () {
            if (this.options && this.options.excelExportPath) {
                var query = this.dataSource.currentQuery, searchOptions = Server.getQueryOptions(query, this.dataSource.entityType);

                searchOptions['columns'] = this.activeColumns();

                return _app.ajax.fileDownload(this.options.excelExportPath, searchOptions);
            }
        };

        DataItemsViewModel.prototype.excelChooseColumnsExport = function () {
            var _this = this;
            if (this.options && this.options.excelExportPath) {
                var columns = Server.Kendo.getColumns(this.dataSource.entityType, this.options.columns);

                return Chooser.showColumnsChooserDialog(columns).then(function (model) {
                    if (model) {
                        var query = _this.dataSource.currentQuery;

                        if (model.allPages) {
                            query = query.skip(null).take(null);
                        } else {
                            query = query.skip(_this.dataSource.options.pageSize * (model.pageFrom - 1)).take(_this.dataSource.options.pageSize * (model.pageTo - model.pageFrom + 1));
                        }

                        var searchOptions = Server.getQueryOptions(query, _this.dataSource.entityType);

                        searchOptions['columns'] = _.map(model.columns, function (col) {
                            return col.field;
                        });
                        searchOptions['includeHeaders'] = model.includeHeaders;

                        return _app.ajax.fileDownload(_this.options.excelExportPath, searchOptions);
                    }
                });
            }
        };
        return DataItemsViewModel;
    })(_app.Common.ViewModelBase);
    exports.DataItemsViewModel = DataItemsViewModel;

    /** represent the base viewmodel of the view responsable of displaying an observable stream */
    var DataEditViewModelBase = (function (_super) {
        __extends(DataEditViewModelBase, _super);
        function DataEditViewModelBase(selectedItem, dataSource, options) {
            var _this = this;
            _super.call(this);
            this.dataSource = dataSource;
            this.options = options;
            this.isReadOnly = ko.observable(false);
            this._itemHasChangedWhileSelected = false;
            /** when true validation errors sould be displayed on the screen */
            this.forceValidationErrors = ko.observable(false);
            /* function used to show a message box, can be replaced for testing purposes */
            this.showMessageBox = function (text) {
                return _app.Views.smartMessage({ title: '', content: text });
            };

            this.item = selectedItem.guarded;
            selectedItem.guard(function (_, silent) {
                if (typeof silent === "undefined") { silent = false; }
                return _this.promiseItemChange(silent);
            });

            // track only the changes made to an entity while it was selected, this will be usefull for offline
            var item = selectedItem.guarded(), subscription;
            selectedItem.guarded.subscribe(function (newItem) {
                // clean old item
                if (item) {
                    item.entityAspect.propertyChanged.unsubscribe(subscription);
                    _this._itemHasChangedWhileSelected = false;
                }

                if (newItem) {
                    // attach to new item
                    subscription = newItem.entityAspect.propertyChanged.subscribe(function () {
                        return _this.currentItemPropertyChanged();
                    });
                }

                item = newItem;
                _this.forceValidationErrors(false);
            });

            // Inline by default
            this.messageQueue = _app.Jigsaw.Messages.createMessageQueue(options && options.messageQueueType);
        }
        /** called when a property of the currently selected item is changed */
        DataEditViewModelBase.prototype.currentItemPropertyChanged = function () {
            this._itemHasChangedWhileSelected = true;
        };

        DataEditViewModelBase.prototype.save = function () {
            var _this = this;
            if (this.item().entityAspect.validateEntity()) {
                return this.dataSource.saveChanges().then(function () {
                    _this.messageQueue.add({
                        title: "Success",
                        body: "item saved successfully",
                        level: 2 /* Success */
                    });
                    _this._itemHasChangedWhileSelected = false;
                    return true;
                }).fail(function (e) {
                    _this.messageQueue.add({
                        title: "Error",
                        body: "process server error...",
                        level: 0 /* Error */
                    });
                    return Q.reject();
                });
            } else {
                // force the display of all validation errors
                this.forceValidationErrors(true);
                return Q.reject();
            }
        };

        DataEditViewModelBase.prototype.saveAndClose = function () {
            var _this = this;
            return this.save().then(function () {
                return _this.close();
            });
        };

        /** closes whathever is editing the current entity */
        DataEditViewModelBase.prototype.close = function () {
            return this.promiseItemChange();
            // overwrite in derived class to actually close the region
        };

        /** returns true if the currently selected item has been modified while it was selected,
        and the user should consider before changing the currently selected item */
        DataEditViewModelBase.prototype.itemHasBeenModifiedWhileSelected = function () {
            return this.item() && this.item().entityAspect.entityState.isAddedModifiedOrDeleted() && this._itemHasChangedWhileSelected;
        };

        /** returns a promise that is resolved if the current item can be changed,
        otherwise it should fail. Q(true) = YES, Q(false) = NO, Q.reject() = CANCEL */
        DataEditViewModelBase.prototype.promiseItemChange = function (silent) {
            var _this = this;
            if (typeof silent === "undefined") { silent = false; }
            if (this.itemHasBeenModifiedWhileSelected()) {
                if (!silent) {
                    return this.showMessageBox("Current item has changed, do you want to save changes?").then(function (result) {
                        if (result === 0 /* Yes */) {
                            return _this.save();
                        } else if (result === 1 /* No */) {
                            // reject changes and procceed with the change
                            _this.item().entityAspect.rejectChanges();
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
        };

        /** returns an object containing the key properties of the selected item, can be
        used to send as parameters to the server */
        DataEditViewModelBase.prototype.getKeyPropertyOptions = function () {
            var entity = this.item(), options = {};

            if (!entity) {
                throw new Error('Some item must be selected');
            }

            // pass key data properties as options to the server, to select the entity
            _.each(this.item().entityType.dataProperties, function (property) {
                if (property.isPartOfKey) {
                    options[property.name] = entity[property.name]();
                }
            });

            return options;
        };

        DataEditViewModelBase.prototype.wordExport = function () {
            if (!this.options.wordExportUrl) {
                throw new Error('Not supported, the word export server address has not been specified.');
            }

            return _app.ajax.fileDownload(this.options.wordExportUrl, this.getKeyPropertyOptions());
        };

        DataEditViewModelBase.prototype.pdfExport = function () {
            if (!this.options.pdfExportUrl) {
                throw new Error('Not supported, the pdf export server address has not been specified.');
            }

            return _app.ajax.fileDownload(this.options.pdfExportUrl, this.getKeyPropertyOptions());
        };
        return DataEditViewModelBase;
    })(_app.Common.ViewModelBase);
    exports.DataEditViewModelBase = DataEditViewModelBase;

    /** Base view model for the panel bar */
    var DataEditViewModel = (function (_super) {
        __extends(DataEditViewModel, _super);
        function DataEditViewModel(itemsViewModel, options) {
            var _this = this;
            _super.call(this, itemsViewModel.selectedItem, itemsViewModel.dataSource, options);

            this.item.subscribe(function (item) {
                if (item != null) {
                    // clear all messages when the selected item is changed
                    _this.messageQueue.clear();
                    _this.show().done();
                } else {
                    _this.close().done();
                }
            });

            if (options && options.readOnly) {
                this.isReadOnly(options.readOnly);
            }
        }
        DataEditViewModel.prototype.show = function () {
            // overwrite in derived class to show the region
            //throw new Error("not implemented");
            return Q(true);
        };

        DataEditViewModel.prototype.showInPopup = function () {
            return this.options.dataPopup.show(this.item(), this.dataSource);
        };

        DataEditViewModel.prototype.showInPopupReadOnly = function () {
            return this.options.dataPopup.show(this.item(), this.dataSource, { readOnly: true });
        };
        return DataEditViewModel;
    })(DataEditViewModelBase);
    exports.DataEditViewModel = DataEditViewModel;

    /** represents a viewmodel to edit an entity in a windows */
    var DataPopupViewModel = (function (_super) {
        __extends(DataPopupViewModel, _super);
        function DataPopupViewModel(entity, dataSource, window, options) {
            this.entity = entity;
            this.window = window;

            var selectedItem = ko.guarded();
            _super.call(this, selectedItem, dataSource, options);

            selectedItem(entity);
            this.customCommands = new _app.Jigsaw.Ribbon.MenuSet();
        }
        DataPopupViewModel.prototype.close = function () {
            var _this = this;
            return _super.prototype.close.call(this).then(function () {
                return _this.window.close();
            });
        };
        return DataPopupViewModel;
    })(DataEditViewModelBase);
    exports.DataPopupViewModel = DataPopupViewModel;

    /** given an entity and some options, this class shows a window */
    var DataPopupManager = (function () {
        function DataPopupManager(windowBuilder) {
            this.windowBuilder = windowBuilder;
        }
        DataPopupManager.prototype.show = function (entity, dataSource, options) {
            var window = this.windowBuilder(), viewModel = new DataPopupViewModel(entity, dataSource, window);

            if (options) {
                viewModel.isReadOnly(options.readOnly);
            }

            return window.showDialog();
        };
        return DataPopupManager;
    })();
    exports.DataPopupManager = DataPopupManager;

    /** represents an EditViewModel that is shown on a collapsable/expandable layout form */
    var PanelBarEditViewModel = (function (_super) {
        __extends(PanelBarEditViewModel, _super);
        function PanelBarEditViewModel(itemsViewModel, options) {
            _super.call(this, itemsViewModel, options);
        }
        PanelBarEditViewModel.prototype.close = function () {
            var _this = this;
            return _super.prototype.close.call(this).then(function () {
                return _this.options.panelBarViewModel.collapseViewbar();
            });
        };

        PanelBarEditViewModel.prototype.show = function () {
            return this.options.panelBarViewModel.expandViewbar();
        };
        return PanelBarEditViewModel;
    })(DataEditViewModel);
    exports.PanelBarEditViewModel = PanelBarEditViewModel;

    (function (VersionPager) {
        var DataSource = (function (_super) {
            __extends(DataSource, _super);
            function DataSource(options) {
                _super.call(this, options);
            }
            DataSource.prototype.configureEntity = function () {
                var _this = this;
                _super.prototype.configureEntity.call(this);

                // register initializer for the entity version type
                this.manager.metadataStore.registerEntityTypeCtor(this.options.versionedTypeName, null, function (x) {
                    return _this.initializeVersionedEntity(x);
                });

                this.manager.metadataStore.registerEntityTypeCtor(this.options.entityVersionTypeName, null, function (x) {
                    return _this.initializeEntityVersion(x);
                });
            };

            DataSource.prototype.entityBuilder = function () {
                return function versionTracker() {
                    //this.HasPending = false;
                };
            };

            DataSource.prototype.initializeEntity = function (entity) {
                _super.prototype.initializeEntity.call(this, entity);

                entity.HasPending = ko.computed(function () {
                    return entity.Pending().length > 0;
                });

                entity.CreatedBy = ko.computed(function () {
                    var hystorical = entity.Historical();
                    return (hystorical.length && _.last(hystorical).ModifiedBy()) || (entity.Current() && entity.Current().ModifiedBy());
                });
                entity.CreatedDate = ko.computed(function () {
                    var hystorical = entity.Historical();
                    return (hystorical.length && _.last(hystorical).ModifiedDate()) || (entity.Current() && entity.Current().ModifiedDate());
                });
            };

            DataSource.prototype.initializeEntityVersion = function (entity) {
                entity.ApprovedBy = ko.computed(function () {
                    return entity.Approval().length && _.last(entity.Approval()).ApprovedBy();
                });
                entity.ApprovedDate = ko.computed(function () {
                    return entity.Approval().length && _.last(entity.Approval()).ApprovedDate();
                });

                // returns PENDING if there's an approval workflow and the lasst approval hasn't been made
                entity.ApprovalWorkflow = ko.computed(function () {
                    return entity.Approval().length && !_.last(entity.Approval()).ApprovedDate() ? "Pending" : "Fully Approved";
                });
            };

            DataSource.prototype.initializeVersionedEntity = function (entity) {
                Server.EntitySetup.init(entity);
            };
            return DataSource;
        })(Server.DataSource);
        VersionPager.DataSource = DataSource;

        (function (VersionType) {
            VersionType[VersionType["Current"] = 0] = "Current";
            VersionType[VersionType["Pending"] = 1] = "Pending";
            VersionType[VersionType["Historical"] = 2] = "Historical";
        })(VersionPager.VersionType || (VersionPager.VersionType = {}));
        var VersionType = VersionPager.VersionType;

        var VersionTrackerManager = (function () {
            function VersionTrackerManager(options) {
                var _this = this;
                this.options = options;
                this._versionChangedWhileSelected = false;
                this.selectedVersion = ko.guarded();
                var tracker = options.tracker;
                this.tracker = tracker;

                // prevent the selected item from being selected if the current version can't be selected
                tracker.guard(function (tracker) {
                    return _this.selectedVersion.inject(tracker && tracker.Current());
                });

                this.selectedVersion.guard(function () {
                    return _this.canUnselectVersion();
                });

                this.versionType = ko.computed(function () {
                    var version = _this.selectedVersion.guarded();
                    if (!tracker() || (tracker().Current() === version)) {
                        return 0 /* Current */;
                    } else if (_.contains(tracker().Pending(), version)) {
                        return 1 /* Pending */;
                    } else {
                        return 2 /* Historical */;
                    }
                });

                var oldVersionEntity = null, subscription;
                this.selectedVersion.guarded.subscribe(function (newVersion) {
                    if (oldVersionEntity) {
                        oldVersionEntity.entityAspect.propertyChanged.unsubscribe(subscription);
                        _this._versionChangedWhileSelected = false;
                    }

                    oldVersionEntity = newVersion && newVersion.Entity();

                    if (oldVersionEntity) {
                        oldVersionEntity.entityAspect.propertyChanged.subscribe(function () {
                            return _this.selectedVersionPropertyChanged();
                        });
                    }
                });
            }
            VersionTrackerManager.prototype.selectPending = function (version) {
                this.selectedVersion(version);
            };

            VersionTrackerManager.prototype.selectHystorical = function (version) {
                this.selectedVersion(version);
            };

            VersionTrackerManager.prototype.selectCurrent = function () {
                this.selectedVersion(this.tracker().Current());
            };

            Object.defineProperty(VersionTrackerManager.prototype, "currentVersionSelected", {
                get: function () {
                    return this.tracker() && this.tracker().Current() === this.selectedVersion();
                },
                enumerable: true,
                configurable: true
            });

            VersionTrackerManager.prototype.selectedVersionPropertyChanged = function () {
                this._versionChangedWhileSelected = true;
            };

            VersionTrackerManager.prototype.selectedVersionHasBeenModifiedWhileSelected = function () {
                var version = this.selectedVersion.guarded();
                return version && version.Entity().entityAspect.entityState.isAddedModifiedOrDeleted() && this._versionChangedWhileSelected;
            };

            VersionTrackerManager.prototype.canUnselectVersion = function () {
                var _this = this;
                if (this.selectedVersionHasBeenModifiedWhileSelected()) {
                    return _app.Views.smartMessage({ title: '', content: "Current version has changed, do you want to save changes?" }).then(function (result) {
                        if (result === 0 /* Yes */) {
                            //return this.save();
                        } else if (result === 1 /* No */) {
                            // reject changes for current version
                            _this.selectedVersion.guarded().Entity().entityAspect.rejectChanges();
                            return Q(true);
                        } else {
                            // cancel the selection, make the observable fail by throwing an error
                            return Q.reject();
                        }
                    });
                }

                return Q(true);
            };

            VersionTrackerManager.prototype.versionAction = function (uri) {
                var _this = this;
                return _app.ajax.post(uri, {
                    trackerGuid: this.tracker().Guid(),
                    versionGuid: this.selectedVersion().Guid()
                }).then(function (raw) {
                    // updating the dataSource current view will update in turn the current entity
                    return _this.options.dataSource.update().then(function () {
                        // select the current version after the current VersionTracker has been updated
                        _this.selectCurrent();
                    });
                });
            };

            VersionTrackerManager.prototype.approve = function () {
                return this.versionAction(this.options.approveUri);
            };

            VersionTrackerManager.prototype.reject = function () {
                var versionToReject = this.selectedVersion();
                return this.versionAction(this.options.rejectUri).then(function () {
                    return versionToReject.entityAspect.setDetached();
                });
            };

            VersionTrackerManager.prototype.revert = function () {
                return this.versionAction(this.options.revertUri);
            };
            return VersionTrackerManager;
        })();
        VersionPager.VersionTrackerManager = VersionTrackerManager;

        /** extends DataEditViewModelBase with VersionPager related features */
        var VersionPagerEditViewModel = (function (_super) {
            __extends(VersionPagerEditViewModel, _super);
            function VersionPagerEditViewModel(itemsViewModel, options) {
                var _this = this;
                _super.call(this, itemsViewModel, options);

                this.trackerManager = new VersionTrackerManager({
                    tracker: itemsViewModel.selectedItem,
                    approveUri: options.approveUri,
                    rejectUri: options.rejectUri,
                    revertUri: options.revertUri,
                    dataSource: itemsViewModel.dataSource
                });
                this.selectedVersion = this.trackerManager.selectedVersion.guarded;

                this.currentEntity = ko.computed(function () {
                    return _this.trackerManager.tracker() && _this.trackerManager.tracker().Current().Entity();
                }).extend({ rateLimit: 1000 });

                this.selectedVersion.subscribe(function () {
                    _this.isReadOnly(!_this.trackerManager.currentVersionSelected);
                });
            }
            return VersionPagerEditViewModel;
        })(DataEditViewModel);
        VersionPager.VersionPagerEditViewModel = VersionPagerEditViewModel;

        /** helper variable to be used as the column spec for modules that want to
        show the hasPending column on their grid */
        VersionPager.hasPendingColumn = {
            title: " ",
            field: 'HasPending',
            nameOnServer: 'HasPending',
            width: "40px",
            template: templates.VersionPagerHasPendingColumn,
            groupable: false, filterable: false, sortable: false
        };

        /** represents an EditViewModel that is shown on a collapsable/expandable layout form */
        var VersionPagerPanelBarEditViewModel = (function (_super) {
            __extends(VersionPagerPanelBarEditViewModel, _super);
            function VersionPagerPanelBarEditViewModel(itemsViewModel, options) {
                _super.call(this, itemsViewModel, options);
            }
            VersionPagerPanelBarEditViewModel.prototype.close = function () {
                var _this = this;
                return _super.prototype.close.call(this).then(function () {
                    return _this.options.panelBarViewModel.collapseViewbar();
                });
            };

            VersionPagerPanelBarEditViewModel.prototype.show = function () {
                return this.options.panelBarViewModel.expandViewbar();
            };
            return VersionPagerPanelBarEditViewModel;
        })(VersionPagerEditViewModel);
        VersionPager.VersionPagerPanelBarEditViewModel = VersionPagerPanelBarEditViewModel;
    })(exports.VersionPager || (exports.VersionPager = {}));
    var VersionPager = exports.VersionPager;

    var DataModule = (function (_super) {
        __extends(DataModule, _super);
        function DataModule(options) {
            var _this = this;
            _super.call(this);
            this.options = options;
            this.styleModule = new _app.Jigsaw.Theming.ContentStyleSheet(templates.styles);
            this.codeeffectsStylesModule = new _app.Jigsaw.Theming.ContentStyleSheet(templates.codeeffects);
            this.url = options.url;
            this.itemsViewModel = options.itemsViewModel;
            this.barViewModel = options.barViewModel;

            this.itemsViewModel.requestNavigate.handle(function (entity) {
                if (!_app.moduleManager.isLoading) {
                    _this.navigate(entity, false).done();
                }
            });

            var searchManager = this.itemsViewModel.searchManager;
            if (searchManager) {
                // register loading handlers for the saved searches
                searchManager.savedSearches.loadSearchInteraction.handle(function (options) {
                    // 1. ensure the module is loaded
                    return _app.history.navigateSilent(_this.url).then(function () {
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
                var selectedItemTitle = ko.computed(function () {
                    var item = _this.itemsViewModel.selectedItem();
                    return item ? item[_this.itemsViewModel.jumpToSearch.targetProperty]() : '';
                }), selectedItemLink = ko.computed(function () {
                    return '#' + _this.itemLink(_this.itemsViewModel.selectedItem());
                });

                this.breadcrumb = new _app.Common.Breadcrumb({ text: options.breadcrumbTitle, href: '#' + this.url }, new _app.Common.Breadcrumb({ text: selectedItemTitle, href: selectedItemLink }));
            }
        }
        DataModule.prototype.canUnload = function () {
            if (this.options.barViewModel) {
                return this.options.barViewModel.promiseItemChange();
            } else {
                return Q(true);
            }
        };

        DataModule.prototype.requiredModules = function () {
            return _super.prototype.requiredModules.call(this).concat(this.styleModule, this.codeeffectsStylesModule);
        };

        DataModule.prototype.initialize = function () {
            var _this = this;
            // register module routes
            _app.history.register(this.url, function () {
                return _app.moduleManager.load(_this).then(function () {
                    return _this.itemsViewModel.selectedItem.inject(null);
                });
            });

            if (this.itemsViewModel.jumpToSearch && this.itemsViewModel.jumpToSearch.isActive) {
                _app.history.register(this.url + '/' + this.itemsViewModel.jumpToSearch.targetProperty + '/:value', function (value) {
                    return _app.moduleManager.load(_this).then(function () {
                        return _this.itemsViewModel.jumpToSearch.jump(value, -1, true, false);
                    });
                });
            }
        };

        DataModule.prototype.itemLink = function (entity) {
            return this.url + DataModule.itemLink(entity, this.itemsViewModel.jumpToSearch.targetProperty);
        };

        DataModule.itemLink = function (entity, targetProperty) {
            if (entity) {
                var propertyValue = ko.unwrap(entity[targetProperty]);
                return '/' + targetProperty + '/' + propertyValue;
            } else {
                return '';
            }
        };

        /** this can be used to make a quick jump to the entity selected, will be used on the sidebar */
        DataModule.prototype.navigate = function (entity, executeCallback) {
            if (typeof executeCallback === "undefined") { executeCallback = true; }
            return _app.history.navigateSilent(this.itemLink(entity), executeCallback);
        };
        return DataModule;
    })(_app.Modules.ModuleBase);
    exports.DataModule = DataModule;

    var BarDataModule = (function (_super) {
        __extends(BarDataModule, _super);
        function BarDataModule(options) {
            _super.call(this, options);
            this.wizzardStylesModule = new _app.Jigsaw.Theming.ContentStyleSheet(templates.wizzardStyles);

            this.barViewModel = options.barViewModel;

            // add styles for the wizzard window
            options.coreModule.addSlave(this.wizzardStylesModule);
        }
        /** executed when an element of the sidebar is clicked, this should be protected */
        BarDataModule.prototype.sidebarItemNavigate = function (item) {
            if (!item.entityAspect.entityState.isDetached()) {
                this.navigate(item).done();
            } else {
                this.options.itemsViewModel.showWizzardDialog(item).done();
                ;
            }
        };

        /** creates a new MyItemsCollection and register it on the MyItems module, the created set is returned. */
        BarDataModule.prototype.registerMyItemsSet = function (optionsParameter) {
            var _this = this;
            // Create a MyItemsCollection instance
            var myItems = new Sidebar.MyItems.MyItemsCollection({
                entityType: this.options.itemsViewModel.dataSource.typeName,
                render: function () {
                    return new _app.Marionette.View({ template: optionsParameter.itemTemplate });
                },
                navigate: function (item) {
                    if (!item.entityAspect.entityState.isDetached()) {
                        _this.navigate(item).done();
                    } else {
                        _this.options.itemsViewModel.showWizzardDialog(item).done();
                        ;
                    }
                },
                dataSource: this.options.itemsViewModel.dataSource
            }), itemTitleView = new _app.Marionette.View({ template: optionsParameter.itemTitleTemplate });

            this.options.myItemsModule.registerSet(itemTitleView, myItems);

            if (optionsParameter.styles) {
                /** these styles are applied to the customer items that are visible on the MyCustomers
                section in the sidebar. This stylesheet is loaded as a slave of the MyItems module. */
                var stylesModule = new _app.Jigsaw.Theming.ContentStyleSheet(optionsParameter.styles);

                // this styles enhaces my customers items and must be loaded if the sidebar is loaded
                this.options.myItemsModule.addSlave(stylesModule);
            }

            return myItems;
        };
        return BarDataModule;
    })(DataModule);
    exports.BarDataModule = BarDataModule;

    
});
