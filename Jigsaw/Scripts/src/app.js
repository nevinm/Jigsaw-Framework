/// <reference path="definitions/_definitions.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", 'templates/app', 'modules/core/global-error-catching'], function(require, exports, templates, GlobalErrorCatching) {
    /** returns a promise that is resolved when the animation finishes */
    $.fn.deferredAnimate = function (properties, duration, queue) {
        if (typeof queue === "undefined") { queue = false; }
        var result = Q.defer();

        this.stop(false, true).animate(properties, {
            duration: duration,
            complete: function () {
                return result.resolve(true);
            },
            queue: queue
        });

        return result.promise;
    };

    $(document).on('click', 'a[href="#"]', function (e) {
        return e.preventDefault();
    });

    /* Module : Ajax */
    /** low level functions to control network */
    (function (ajax) {
        function retrieveFromServer(func) {
            return Q(func()).fail(function (e) {
                // if the server is offline desconnect the application
                if (isOfflineError(e)) {
                    connection.disconnect();
                }

                return Q.reject(e);
            });
        }

        function get(url, data) {
            return retrieveFromServer(function () {
                return $.get(url, data);
            });
        }
        ajax.get = get;

        function post(url, data) {
            // WebApi doesn't support native jquery parameter encode on the server,
            // thanks to http://weblog.west-wind.com/posts/2012/May/08/Passing-multiple-POST-parameters-to-Web-API-Controller-Methods
            return retrieveFromServer(function () {
                return $.ajax({
                    url: url,
                    type: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(data)
                });
            });
        }
        ajax.post = post;

        function fileDownload(url, data) {
            // for now uses the jquery fileDownload plugin
            return Q($.fileDownload(url, { data: data })).fail(function (e) {
                // if the server is offline desconnect the application
                if (isOfflineError(e)) {
                    connection.disconnect();
                }

                return Q.reject(e);
            });
        }
        ajax.fileDownload = fileDownload;

        /** returns tru if the given error was returned from a request where the server
        was offline */
        function isOfflineError(error) {
            return error.status === 0 || error.status === 404;
        }
        ajax.isOfflineError = isOfflineError;

        /* Module : Ajax.Connection */
        (function (connection) {
            /** when true the application will act as offline, even if the server is available */
            connection.forceOffline = ko.observable(false);

            /** This class can be used to track throught it's single instance if the application is online or not */
            var disconected = ko.observable(false);
            var _reconectingPromise = null;

            connection.isOnline = ko.computed(function () {
                return !connection.forceOffline() && !disconected();
            });

            function online(ping) {
                if (typeof ping === "undefined") { ping = false; }
                if (connection.forceOffline()) {
                    return Q(false);
                } else if (!disconected()) {
                    return Q(true);
                } else if (this._reconectingPromise) {
                    return _reconectingPromise;
                } else if (ping) {
                    return reconnect();
                } else {
                    return Q(false);
                }
            }
            connection.online = online;

            function disconnect() {
                disconected(true);
                signalR.ping.stop();
            }
            connection.disconnect = disconnect;

            function reconnect() {
                if (!_reconectingPromise) {
                    _reconectingPromise = Q($.get('ping.js')).then(function () {
                        disconected(false);
                        return true;
                    }).fail(function () {
                        disconected(true);
                        signalR.ping.stop();
                        return false;
                    }).finally(function () {
                        return _reconectingPromise = null;
                    });
                }

                return _reconectingPromise;
            }
            connection.reconnect = reconnect;

            /* add some additional code to detect when the application goes offline using SignalR,
            also tries to reconnect every 1min */
            var signalR;
            (function (signalR) {
                signalR.ping = $.connection('ping');

                signalR.ping.disconnected(function () {
                    disconected(true);

                    setTimeout(function () {
                        _reconectingPromise = Q(signalR.ping.start()).then(function () {
                            disconected(false);
                            return true;
                        }).fail(function () {
                            disconected(true);
                            return false;
                        }).finally(function () {
                            return _reconectingPromise = null;
                        });
                    }, 60000); // try to reconnect in one minute
                }).start();
            })(signalR || (signalR = {}));
        })(ajax.connection || (ajax.connection = {}));
        var connection = ajax.connection;
    })(exports.ajax || (exports.ajax = {}));
    var ajax = exports.ajax;

    /* Module : Common */
    (function (Common) {
        var KeyValuePair = (function () {
            function KeyValuePair(key, value) {
                this.key = key;
                this.value = value;
            }
            return KeyValuePair;
        })();

        var Dict = (function () {
            function Dict() {
                this._storage = [];
            }
            Dict.prototype.contains = function (key) {
                return _.some(this._storage, function (pair) {
                    return pair.key === key;
                });
            };

            Dict.prototype.add = function (key, value) {
                if (this.contains(key)) {
                    throw new Error('the key is already present on the dictionary');
                } else {
                    this._storage.push(new KeyValuePair(key, value));
                }
            };

            Dict.prototype.remove = function (key) {
                var pair = _.find(this._storage, function (pair) {
                    return pair.key === key;
                });
                Utils.remove(this._storage, pair);
            };

            Dict.prototype.get = function (key) {
                var pair = _.find(this._storage, function (pair) {
                    return pair.key === key;
                });
                return pair && pair.value;
            };

            Dict.prototype.keys = function () {
                return _.map(this._storage, function (pair) {
                    return pair.key;
                });
            };

            Dict.prototype.values = function () {
                return _.map(this._storage, function (pair) {
                    return pair.value;
                });
            };
            return Dict;
        })();
        Common.Dict = Dict;

        /** represents a disposable collection that gets disposed later */
        var Trash = (function () {
            function Trash() {
                this._trash = [];
            }
            Trash.prototype.recycle = function () {
                var items = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    items[_i] = arguments[_i + 0];
                }
                this._trash.push.apply(this._trash, items);
            };

            Trash.prototype.dispose = function () {
                _.each(this._trash, function (item) {
                    return item && item.dispose();
                });

                // prepare the trash for a new recycle cycle
                this._trash = [];
            };
            return Trash;
        })();
        Common.Trash = Trash;

        function bulkDispose() {
            var disposables = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                disposables[_i] = arguments[_i + 0];
            }
            _.each(disposables, function (disposable) {
                return disposable && disposable.dispose();
            });
        }
        Common.bulkDispose = bulkDispose;

        function mergeDisposables() {
            var disposables = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                disposables[_i] = arguments[_i + 0];
            }
            return {
                dispose: function () {
                    return _.each(disposables, function (disposable) {
                        return disposable.dispose();
                    });
                }
            };
        }
        Common.mergeDisposables = mergeDisposables;

        /** syncronizes some promises such as that only one of them is executing at a given time */
        var PromiseQueue = (function () {
            function PromiseQueue() {
                this._executing = false;
                this._queue = [];
            }
            PromiseQueue.prototype.enqueue = function (promise) {
                var _this = this;
                var result = Q.defer();

                if (this._executing) {
                    this._queue.push(function () {
                        return promise().then(function (x) {
                            result.resolve(x);
                            return x;
                        }).fail(function (x) {
                            result.reject(x);

                            // catch the exception so it continues executing after this promise
                            return x;
                        });
                    });
                } else {
                    this._executing = true;
                    promise().then(function (x) {
                        result.resolve(x);
                        return _this.continueQueue();
                    }).fail(function (x) {
                        result.reject(x);
                        return _this.continueQueue();
                    }).done();
                }

                return result.promise;
            };

            PromiseQueue.prototype.continueQueue = function () {
                var _this = this;
                var next = this._queue.pop();
                if (next) {
                    return next().then(function () {
                        return _this.continueQueue();
                    }).fail(function () {
                        return _this.continueQueue();
                    });
                } else {
                    this._executing = false;
                    return Q(true);
                }
            };
            return PromiseQueue;
        })();
        Common.PromiseQueue = PromiseQueue;

        /** Base class for all viewModels, handles attaching/detaching THIS knockout viewModel
        every time the view is rendered/closed */
        var ViewModelBase = (function () {
            function ViewModelBase() {
                this._activeViews = 0;
            }
            return ViewModelBase;
        })();
        Common.ViewModelBase = ViewModelBase;

        var ReadyRemoteSource = (function () {
            function ReadyRemoteSource(value) {
                this.value = value;
                this.isReady = true;
            }
            ReadyRemoteSource.prototype.refresh = function () {
                return Q(this.value);
            };

            ReadyRemoteSource.prototype.download = function () {
                return Q(this.value);
            };
            return ReadyRemoteSource;
        })();
        Common.ReadyRemoteSource = ReadyRemoteSource;

        var PromiseRemoteSource = (function () {
            function PromiseRemoteSource() {
                this._downloadPromise = null;
                this._value = null;
                this._isReady = false;
            }
            PromiseRemoteSource.prototype.refresh = function () {
                if (this.isReady) {
                    // if the template has been resolved, delete that value and schedule a new download
                    this._downloadPromise = null;
                }

                return this.download();
            };

            PromiseRemoteSource.prototype.download = function () {
                var _this = this;
                if (!this._downloadPromise) {
                    this._downloadPromise = this.getPromise().then(function (value) {
                        _this._value = value;
                        _this._isReady = true;
                    });
                }

                return this._downloadPromise;
            };

            /** to be overwritten on derived classes */
            PromiseRemoteSource.prototype.getPromise = function () {
                throw new Error('not implemented');
            };

            Object.defineProperty(PromiseRemoteSource.prototype, "isReady", {
                get: function () {
                    return this._isReady;
                },
                enumerable: true,
                configurable: true
            });

            Object.defineProperty(PromiseRemoteSource.prototype, "value", {
                get: function () {
                    return this._value;
                },
                enumerable: true,
                configurable: true
            });
            return PromiseRemoteSource;
        })();
        Common.PromiseRemoteSource = PromiseRemoteSource;

        /** this class handles the downloading of a remote resource */
        var RemoteResource = (function (_super) {
            __extends(RemoteResource, _super);
            function RemoteResource(url, options) {
                _super.call(this);
                this.url = url;
                this.options = options;
            }
            RemoteResource.prototype.getPromise = function () {
                return ajax.get(this.url, this.options);
            };
            return RemoteResource;
        })(PromiseRemoteSource);
        Common.RemoteResource = RemoteResource;

        var ComposeRemoteSource = (function () {
            function ComposeRemoteSource(source, modifier) {
                this.source = source;
                this.modifier = modifier;
            }
            ComposeRemoteSource.prototype.refresh = function () {
                var _this = this;
                return this.source.refresh().then(function () {
                    return _this.value;
                });
            };

            ComposeRemoteSource.prototype.download = function () {
                var _this = this;
                return this.source.download().then(function () {
                    return _this.value;
                });
            };

            Object.defineProperty(ComposeRemoteSource.prototype, "isReady", {
                get: function () {
                    return this.source.isReady;
                },
                enumerable: true,
                configurable: true
            });

            Object.defineProperty(ComposeRemoteSource.prototype, "value", {
                get: function () {
                    return this.modifier(this.source.value);
                },
                enumerable: true,
                configurable: true
            });
            return ComposeRemoteSource;
        })();
        Common.ComposeRemoteSource = ComposeRemoteSource;

        var Event = (function () {
            function Event() {
                this.callback = $.Callbacks();
            }
            Event.prototype.add = function (handler) {
                var _this = this;
                this.callback.add(handler);

                return {
                    dispose: function () {
                        return _this.callback.remove(handler);
                    }
                };
            };

            Event.prototype.fire = function () {
                var args = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    args[_i] = arguments[_i + 0];
                }
                this.callback.fire.apply(this.callback, args);
            };
            return Event;
        })();
        Common.Event = Event;

        /** name for the resize event, formely named 'resize' but enters in conflict with an event named
        the same way */
        Common.RESIZE = 'resize-event';

        Common.resizeEvent = $.Event(Common.RESIZE);

        function triggerResize(element) {
            element.trigger(Common.resizeEvent);
        }
        Common.triggerResize = triggerResize;

        var DelayedCallbacks = (function () {
            function DelayedCallbacks() {
                this._handlers = [];
            }
            DelayedCallbacks.prototype.add = function (handler) {
                var _this = this;
                this._handlers.push(handler);

                return {
                    dispose: function () {
                        return Utils.remove(_this._handlers, handler);
                    }
                };
            };

            DelayedCallbacks.prototype.fire = function () {
                var args = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    args[_i] = arguments[_i + 0];
                }
                var promises = _.map(this._handlers, function (handler) {
                    return handler.apply(null, args);
                });
                return Q.all(promises);
            };
            return DelayedCallbacks;
        })();
        Common.DelayedCallbacks = DelayedCallbacks;

        var PromiseGateway = (function () {
            function PromiseGateway(getValue) {
                this.getValue = getValue;
                this._storage = new Dict();
            }
            PromiseGateway.prototype.resolve = function (key) {
                var _this = this;
                if (this._storage.contains(key)) {
                    return this._storage.get(key);
                } else {
                    var promise = this.getValue(key).then(function (x) {
                        _this._storage.remove(key);
                        return x;
                    });
                    this._storage.add(key, promise);
                    return promise;
                }
            };
            return PromiseGateway;
        })();
        Common.PromiseGateway = PromiseGateway;

        /** inspired by PRISM interaction requests, to help comunicating loosely coupled components */
        var InteractionRequest = (function () {
            function InteractionRequest() {
            }
            InteractionRequest.prototype.request = function (data) {
                if (!this._handler) {
                    throw new Error('a handler has not been specified for this InteracionRequest');
                }

                return this._handler(data);
            };

            InteractionRequest.prototype.handle = function (handler) {
                if (this._handler) {
                    throw new Error('a handler has already been specified for this InteractionRequest');
                }

                this._handler = handler;
            };
            return InteractionRequest;
        })();
        Common.InteractionRequest = InteractionRequest;

        var PrioritySet = (function () {
            function PrioritySet() {
                var _this = this;
                this._storage = ko.observableArray();
                this.items = this._storage.map(function (x) {
                    return x.item;
                }).filter(function (x) {
                    return _this.filterItems(x);
                });
            }
            PrioritySet.prototype.filterItems = function (x) {
                return true;
            };

            Object.defineProperty(PrioritySet.prototype, "length", {
                get: function () {
                    return this._storage().length;
                },
                enumerable: true,
                configurable: true
            });

            PrioritySet.prototype.add = function (item, priority) {
                var _this = this;
                if (typeof priority === "undefined") { priority = 0; }
                // adds a new item to the storage array, but considering it's priority
                // so it maintains the array ordered by priority
                var storage = this._storage(), storageItem = { item: item, priority: priority };

                for (var i = 0; i < this.length; i++) {
                    if (priority < storage[i].priority) {
                        this._storage.splice(i, 0, storageItem);
                        return { dispose: function () {
                                return _this._storage.remove(storageItem);
                            } };
                    }
                }

                // else insert the item at the end of the array
                this._storage.push(storageItem);
                return { dispose: function () {
                        return _this._storage.remove(storageItem);
                    } };
            };

            PrioritySet.prototype.addAll = function (items, priority) {
                var _this = this;
                if (typeof priority === "undefined") { priority = 0; }
                var disposables = _.map(items, function (x) {
                    return _this.add(x, priority);
                });
                return mergeDisposables.apply(null, disposables);
            };
            return PrioritySet;
        })();
        Common.PrioritySet = PrioritySet;

        var Breadcrumb = (function () {
            function Breadcrumb(data, next) {
                this.data = data;
                this.next = ko.observable();
                if (next) {
                    this.next(next);
                }
            }
            /** returns all the elements from the breadcrumb */
            Breadcrumb.prototype.enumerate = function () {
                var _this = this;
                return ko.computed(function () {
                    var result = [_this.data], next = _this.next();

                    while (next) {
                        result.push(next.data);
                        next = next.next();
                    }

                    return result;
                });
            };
            return Breadcrumb;
        })();
        Common.Breadcrumb = Breadcrumb;
    })(exports.Common || (exports.Common = {}));
    var Common = exports.Common;

    /* Module : Knockout */
    (function (Knockout) {
        /** triggers the resize event on the target element when the observable value is changed */
        ko.bindingHandlers['resizeWhen'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var value = valueAccessor(), subscription = value.subscribe(function () {
                    return Common.triggerResize($(element));
                });

                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    subscription.dispose();
                });
            }
        };

        ko.bindingHandlers['eventWhen'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var value = valueAccessor(), subscription = value.fire.subscribe(function () {
                    return $(element).trigger(value.event);
                });

                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    subscription.dispose();
                });
            }
        };

        /** default text binding, returns the text in the inside of the element if the target binding
        has no value. */
        ko.bindingHandlers['dtext'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var value = valueAccessor(), defaultText = $(element).html(), computed = ko.computed(function () {
                    return value() || defaultText;
                });

                ko.applyBindingsToNode(element, { text: computed }, bindingContext);

                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    computed.dispose();
                });
            }
        };

        /** executes an action when enter is pressed */
        ko.bindingHandlers['pressEnter'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var func = ko.unwrap(valueAccessor());
                $(element).keydown(function (e) {
                    if (e.keyCode === 13) {
                        $(element).change(); // triggeer change event so knockout can pick up changes, if any
                        func.call(viewModel, e);
                    }
                });
            }
        };

        /** knockout binding to help with debuging */
        ko.bindingHandlers['debug'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                console.log('knockout binding: ', element, valueAccessor());

                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    console.log('disposed binding: ', element, valueAccessor());
                });
            }
        };

        var Door = (function () {
            function Door() {
                this.guardians = [];
                this._isOpen = false;
            }
            Door.prototype.add = function (guardian) {
                var _this = this;
                this.guardians.push(guardian);

                return {
                    dispose: function () {
                        return Utils.remove(_this.guardians, guardian);
                    }
                };
            };

            /** returns a promise that checks if ALL guardians accept the passed key, in
            which case the promise is resolved. Otherwise fails.
            Note: Only one key can be tested at a single time, and an error is thrown otherwise. */
            Door.prototype.open = function (key, silent) {
                var _this = this;
                if (typeof silent === "undefined") { silent = false; }
                if (!this._isOpen) {
                    var promises = _.map(this.guardians, function (guardian) {
                        return guardian(key, silent);
                    });

                    this._isOpen = true;
                    this._lastKey = key;
                    this._lastPromise = Q.all(promises).then(function () {
                        return Q(key);
                    }).fail(function () {
                        return Q.reject(key);
                    }).finally(function () {
                        return _this._isOpen = false;
                    });

                    return this._lastPromise;
                } else if (key === this._lastKey) {
                    return this._lastPromise;
                } else {
                    return Q.reject(new Error('the door can only handle one item at a time.'));
                }
            };
            return Door;
        })();
        Knockout.Door = Door;

        /**
        guarded observable, contains a list of promises that are used to filter a .guarded
        observable if all promises are resolved
        */
        ko['guarded'] = function (initialValue) {
            var NOPASSING = {}, passing = ko.observable(NOPASSING), guarded = ko.observable(initialValue), guardedReadOnly = ko.computed(function () {
                return guarded();
            }), door = new Door(), prepare = new Door(), outsider = ko.computed({
                read: function () {
                    return passing() !== NOPASSING ? passing() : guarded();
                },
                write: inject
            }), disposeBase = outsider.dispose;

            function inject(value, silent) {
                if (typeof silent === "undefined") { silent = false; }
                passing(value);

                return door.open(value, silent).then(function () {
                    return prepare.open(value);
                }).then(function (key) {
                    if (key === passing()) {
                        guarded(key);
                        passing(NOPASSING);
                    }
                    return key;
                }).fail(function (key) {
                    if (key === passing()) {
                        passing(NOPASSING);
                    }
                    return Q.reject(key);
                });
            }

            // the guarded observable is read-only
            outsider['guarded'] = guardedReadOnly;
            outsider['guard'] = function (guardian) {
                return door.add(guardian);
            };
            outsider['prepare'] = function (guardian) {
                return prepare.add(guardian);
            };
            outsider['inject'] = inject;
            outsider['dispose'] = function () {
                // dispose logic
                guardedReadOnly.dispose();
                delete outsider['guarded'];

                // also call base method
                disposeBase.apply(outsider, arguments);
            };

            return outsider;
        };

        function persistExtender(target, value) {
            var options = !_.isString(value) ? value : {
                key: value,
                parse: _.identity,
                stringify: _.identity
            };

            var previousValue = persistExtender.storageGetItem(options.key);
            if (previousValue) {
                // if there's a previous value then set the observable with that value
                target(options.parse(JSON.parse(previousValue)));
            }

            target.subscribe(function (value) {
                var json = JSON.stringify(options.stringify(value));

                // store the latest value every time the observable changes
                persistExtender.storageSetItem(options.key, json);
            });

            return target;
        }
        Knockout.persistExtender = persistExtender;

        /** localStorage functions can't be mocked when testing this function, that's why this module
        exist so the tests can mock these instead */
        (function (persistExtender) {
            function storageGetItem(key) {
                return localStorage.getItem(key);
            }
            persistExtender.storageGetItem = storageGetItem;

            function storageSetItem(key, value) {
                localStorage.setItem(key, value);
            }
            persistExtender.storageSetItem = storageSetItem;
        })(Knockout.persistExtender || (Knockout.persistExtender = {}));
        var persistExtender = Knockout.persistExtender;

        /** extends the knockout observables to store the last value of the observable in the localstorage */
        ko.extenders['persist'] = persistExtender;

        /** returns an observable array that is persisted on the user localStorage with the specified key */
        function persistedArray(options) {
            var options = _.defaults(options, {
                parse: _.identity,
                stringify: _.identity
            });

            return ko.observableArray().extend({
                persist: {
                    key: options.key,
                    parse: function (deserialized) {
                        return _.map(deserialized, options.parse);
                    },
                    stringify: function (array) {
                        return _.map(array, options.stringify);
                    }
                }
            });
        }
        Knockout.persistedArray = persistedArray;

        /** extends knockout observables and adds a writeable computed observable as a property
        of the target observable named 'px'*/
        ko.extenders['px'] = function (target, writeable) {
            target['px'] = ko.computed({
                read: function () {
                    return target() + 'px';
                },
                write: function (newValue) {
                    if (writeable) {
                        var parsed = parseFloat(newValue);

                        // if the value can be parsed
                        if (!isNaN(parsed)) {
                            target(parsed);
                        }
                        //console.log('px extender value changed ', newValue);
                    } else {
                        throw new Error('knockout computed pixel value not writeable');
                    }
                }
            });

            return target;
        };

        /** similar to the with binding but targets bindings extended with the mirror extender */
        ko.bindingHandlers['throttledWith'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var value = valueAccessor(), options = !ko.isObservable(value) ? value : { target: value, delay: 500 }, mirror = ko.computed(function () {
                    return options.target();
                }).extend({ rateLimit: options.delay || 500 });

                ko.applyBindingsToNode(element, { with: mirror }, bindingContext);

                // .busy CSS class styles are described on the app module styles
                // wait some time before removing the .busy class so the with binding can finish rendering the content
                var disposable1 = options.target.subscribe(function () {
                    return $(element).addClass('busy');
                }), disposable2 = mirror.subscribe(function () {
                    return setTimeout(function () {
                        return $(element).removeClass('busy');
                    }, 50);
                });

                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    disposable1.dispose();
                    disposable2.dispose();
                    mirror.dispose();
                });

                return { controlsDescendantBindings: true };
            }
        };

        /** associates the click handler of a button with an async task. After click
        when the promise is still running the button will have the class "q-working"  */
        ko.bindingHandlers['qclick'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var className = "q-working", $element = $(element), value = ko.unwrap(valueAccessor());

                function clickHandler() {
                    // execute the method and add the class while the promise is still unresolved
                    var promise = value.apply(viewModel);

                    $element.addClass(className);
                    function removeClass() {
                        $element.removeClass(className);
                    }

                    promise.done(removeClass, removeClass);
                }

                $element.bind('click', clickHandler);

                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    $element.unbind('click', clickHandler);
                });
            }
        };

        function makeToggleVisibleBinding(name, hide, show) {
            ko.bindingHandlers[name] = {
                init: function (element, valueAccessor) {
                    // Initially set the element to be instantly vi
                    $(element).toggle(ko.unwrap(valueAccessor()));
                },
                update: function (element, valueAccessor) {
                    // Whenever the value subsequently changes, slo
                    ko.unwrap(valueAccessor()) ? hide(element) : show(element);
                }
            };
        }
        makeToggleVisibleBinding('fadeVisible', function (x) {
            return $(x).fadeIn();
        }, function (x) {
            return $(x).fadeOut();
        });
        makeToggleVisibleBinding('slideVisible', function (x) {
            return $(x).slideDown();
        }, function (x) {
            return $(x).slideUp();
        });

        /** renders a backbone view inside the given element. the view is closed once the binding
        is cancelled */
        ko.bindingHandlers['view'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var view = ko.unwrap(valueAccessor()), region = new Marionette.Region({ element: $(element) });

                region.show(view).then(function () {
                    // apply bindings if the view doesn't have a view model associated
                    if (!view.options.viewModel) {
                        ko.applyBindingsToDescendants(bindingContext, element);
                    }
                }).done();

                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    region.close();
                });

                return { controlsDescendantBindings: true };
            }
        };

        var StringTemplateSource = (function () {
            function StringTemplateSource(template) {
                this.template = template;
            }
            StringTemplateSource.prototype.text = function () {
                return this.template;
            };
            return StringTemplateSource;
        })();

        Knockout.StringTemplateEngine = new ko.nativeTemplateEngine();
        Knockout.StringTemplateEngine['makeTemplateSource'] = function (template) {
            return new StringTemplateSource(template);
        };

        function renderTemplate(element, template, bindingContext) {
            ko.renderTemplate(template, bindingContext, { templateEngine: Knockout.StringTemplateEngine }, element, "replaceChildren");
        }
        Knockout.renderTemplate = renderTemplate;

        function renderTemplateAsync(element, template, bindingContext) {
            Utils.async(function () {
                return renderTemplate(element, template, bindingContext);
            });
        }
        Knockout.renderTemplateAsync = renderTemplateAsync;

        /** renders a string template received as an argument */
        ko.bindingHandlers['stringTemplate'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                renderTemplate(element, ko.unwrap(valueAccessor()), bindingContext);
            }
        };

        /** watch an observableArray for changes to it's elements, and executes the added/removed
        callback for each case */
        function watchObservableArray(array, elementAdded, elementRemoved) {
            return array.subscribe(function (changes) {
                _.each(changes, function (change) {
                    if (change.status === 'added') {
                        elementAdded(change.value);
                    } else if (change.status === 'deleted') {
                        elementRemoved(change.value);
                    }
                });
            }, null, 'arrayChange');
        }
        Knockout.watchObservableArray = watchObservableArray;

        var pageReadyPromise = Q.delay(true, 1500);

        var Stabilizer = (function () {
            function Stabilizer() {
                this.binds = [];
                this.ready = Q.defer();
            }
            Stabilizer.prototype.flow = function () {
                var reflow = false;

                _.each(this.binds, function (bind) {
                    var size = bind.measure();
                    if (size !== bind.previousValue) {
                        reflow = true;
                    }
                    bind.previousValue = size;
                });

                if (reflow) {
                    _.each(this.binds, function (bind) {
                        return bind.resize();
                    });
                    this.scheduleReflow();
                } else {
                    this.binds = null;
                    this.ready.resolve(true);
                }
            };

            Stabilizer.prototype.scheduleReflow = function (timeout) {
                var _this = this;
                if (typeof timeout === "undefined") { timeout = 1500; }
                console.log('reflow');
                setTimeout(function () {
                    return _this.flow();
                }, timeout);
            };

            Stabilizer.prototype.start = function () {
                this.scheduleReflow(500);
                return this.ready.promise;
            };

            Stabilizer.prototype.register = function (measure, resize) {
                if (this.binds !== null) {
                    this.binds.push({
                        measure: measure,
                        resize: resize,
                        previousValue: -1
                    });
                } else {
                    resize();
                }
            };
            return Stabilizer;
        })();
        Knockout.Stabilizer = Stabilizer;

        Knockout.flowStabilizer = new Stabilizer();

        ko.bindingHandlers['measurePrev'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var $element = $(element), elementPrev = $element.prev(), direction = ko.unwrap(valueAccessor());

                Knockout.flowStabilizer.register(elementSize, elementResized);

                $element.prevAll().bind(Common.RESIZE, elementResized);

                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    $element.prevAll().unbind(Common.RESIZE, elementResized);
                });

                function elementSize() {
                    // measure previous elements and set the correct position attribute on the target element
                    return elementPrev.position().top + elementPrev.outerHeight(true);
                }

                function elementResized() {
                    Utils.async(function () {
                        var originalValue = $element.position()[direction], size = elementSize(), animationProperties = {};

                        if (originalValue != size) {
                            animationProperties[direction] = size;

                            // without animation
                            $element.css(animationProperties);
                            Common.triggerResize($element);
                        }
                    });
                }
            }
        };

        /** raise the 'resize' event when the Jigsaw resize event is raised for the current element */
        ko.bindingHandlers['kendoResize'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var $element = $(element);

                $element.bind(Common.RESIZE, elementResized);

                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    $element.unbind(Common.RESIZE, elementResized);
                });

                function elementResized() {
                    $element.resize();
                }
            }
        };

        /** must be applied to img elements and sets the image source assuming that the property returns
        the image byte information in base64, and as PNG */
        ko.bindingHandlers['imgSrc'] = {
            update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var value = ko.unwrap(valueAccessor()), binding = "data: image/png; base64," + value;
                $(element).attr('src', binding);
            }
        };

        ko.bindingHandlers['checkbox'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var $element = $(element), value = valueAccessor();

                $element.addClass('checkbox');

                if (ko.isWriteableObservable(value)) {
                    $element.click(function (e) {
                        if ($element.hasClass('checked')) {
                            value(false);
                        } else {
                            value(true);
                        }
                        return false;
                    });
                }

                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    $element.unbind('click');
                });
            },
            update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var value = ko.unwrap(valueAccessor());

                if (value) {
                    $(element).addClass('checked');
                } else {
                    $(element).removeClass('checked');
                }
            }
        };

        ko.bindingHandlers['checkbox2'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var $element = $(element), value = valueAccessor();

                if (ko.isWriteableObservable(value)) {
                    $element.click(function (e) {
                        if ($element.hasClass('checked')) {
                            value(false);
                        } else {
                            value(true);
                        }
                        return false;
                    });
                }

                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    $element.unbind('click');
                });
            },
            update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var value = ko.unwrap(valueAccessor());

                if (value) {
                    $(element).addClass('checked');
                } else {
                    $(element).removeClass('checked');
                    //$(element).removeClass('checked');
                }
            }
        };

        ko.bindingHandlers['dropdown'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var $element = $(element), $menu = $(element).next(), value = valueAccessor();

                if (value.notCloseWithin) {
                    $menu.on('click', function (e) {
                        return e.stopPropagation();
                    });
                }

                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    $menu.unbind('click');
                });
            }
        };

        ko.bindingHandlers['dropdownMouseEnter'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var $element = $(element);

                $element.mouseenter(function (e) {
                    $element.addClass('open');
                });

                $element.mouseleave(function (e) {
                    $element.removeClass('open');
                });

                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    $element.unbind('mouseenter mouseleave');
                });
            }
        };

        ko.bindingHandlers['jarviswidget'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var $element = $(element);

                $element.jarvisWidgets({
                    grid: 'article',
                    widgets: '.jarviswidget',
                    localStorage: true,
                    deleteSettingsKey: '#deletesettingskey-options',
                    settingsKeyLabel: 'Reset settings?',
                    deletePositionKey: '#deletepositionkey-options',
                    positionKeyLabel: 'Reset position?',
                    sortable: true,
                    buttonsHidden: false,
                    // toggle button
                    toggleButton: false,
                    toggleClass: 'fa fa-minus | fa fa-plus',
                    toggleSpeed: 200,
                    onToggle: function () {
                    },
                    // delete btn
                    deleteButton: false,
                    deleteClass: 'fa fa-times',
                    deleteSpeed: 200,
                    onDelete: function () {
                    },
                    // edit btn
                    editButton: false,
                    editPlaceholder: '.jarviswidget-editbox',
                    editClass: 'fa fa-chevron-down | fa fa-chevron-up',
                    editSpeed: 200,
                    onEdit: function () {
                    },
                    // color button
                    colorButton: false,
                    // full screen
                    fullscreenButton: true,
                    fullscreenClass: 'fa fa-expand | fa fa-compress',
                    fullscreenDiff: 3,
                    onFullscreen: function () {
                    },
                    // custom btn
                    customButton: false,
                    customClass: 'folder-10 | next-10',
                    customStart: function () {
                        alert('Hello you, this is a custom button...');
                    },
                    customEnd: function () {
                        alert('bye, till next time...');
                    },
                    // order
                    buttonOrder: '%refresh% %custom% %edit% %toggle% %fullscreen% %delete%',
                    opacity: 1.0,
                    dragHandle: '> header',
                    placeholderClass: 'jarviswidget-placeholder',
                    indicator: true,
                    indicatorTime: 600,
                    ajax: true,
                    timestampPlaceholder: '.jarviswidget-timestamp',
                    timestampFormat: 'Last update: %m%/%d%/%y% %h%:%i%:%s%',
                    refreshButton: true,
                    refreshButtonClass: 'fa fa-refresh',
                    labelError: 'Sorry but there was a error:',
                    labelUpdated: 'Last Update:',
                    labelRefresh: 'Refresh',
                    labelDelete: 'Delete widget:',
                    afterLoad: function () {
                    },
                    rtl: false,
                    onChange: function () {
                    },
                    onSave: function () {
                    },
                    ajaxnav: null
                });

                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    $element.data('jarvisWidgets', null);
                });
            }
        };

        ko.bindingHandlers['visibleExtended'] = {
            'update': function (element, valueAccessor) {
                var $element = $(element), wrapper = ko.unwrap(valueAccessor()), value = ko.utils.unwrapObservable(wrapper.value()), slide = wrapper.slide || false;

                if (slide) {
                    if (value) {
                        $element.slideDown(200);
                    } else {
                        $element.slideUp(200);
                    }

                    return;
                }
                //call knockout visible data-bind
            }
        };

        ko.bindingHandlers['toogleFullScreen'] = {
            init: function (element, valueAccessor) {
                var $element = $(element), options = ko.unwrap(valueAccessor()), selector = options.wrapperSelector, $wrapper = selector[0] === '#' ? $element.parents(selector) : $element.parents(selector).first(), toggled = false, classes = options.class.split('|');

                $element.children().addClass(classes[0]);

                $element.click(function () {
                    if (toggled) {
                        $wrapper.removeClass('fullscreen-mode');

                        //$wrapper.unwrap();
                        $element.children().removeClass(classes[1]).addClass(classes[0]);
                    } else {
                        $wrapper.addClass('fullscreen-mode');

                        //$wrapper.wrap('<div class="fullscreen-mode"/>');
                        $element.children().removeClass(classes[0]).addClass(classes[1]);
                    }

                    toggled = !toggled;
                });

                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    $element.unbind('click');
                });
            }
        };

        /** used internally by TemplateSelector to store possible template candidates.
        each template is tested using a match method in the candidate */
        var TemplateCandidate = (function () {
            function TemplateCandidate(template, match) {
                this.template = template;
                this.match = match;
            }
            return TemplateCandidate;
        })();

        /** Used to build a dinamically template selector, that can select a single template
        from a list of candidate templates to render a given viewmodel
        pass the 'template'  */
        var TemplateSelector = (function () {
            function TemplateSelector(fallbackTemplate) {
                if (typeof fallbackTemplate === "undefined") { fallbackTemplate = ""; }
                this.fallbackTemplate = fallbackTemplate;
                this._candidates = [];
            }
            TemplateSelector.prototype.candidate = function (template, match) {
                this._candidates.push(new TemplateCandidate(template, match));
            };

            /** finds the first candidate which template can render the passed viewModel */
            TemplateSelector.prototype.select = function (viewModel) {
                var candidate = _.find(this._candidates, function (c) {
                    return c.match(viewModel);
                });

                if (candidate) {
                    return candidate.template;
                } else {
                    return this.fallbackTemplate;
                }
            };
            return TemplateSelector;
        })();
        Knockout.TemplateSelector = TemplateSelector;

        /** creates a new binding with the specified name that renders the given element */
        function makeTemplateSelector(bindingName, fallbackTemplate) {
            var templateSelector = new Knockout.TemplateSelector(fallbackTemplate);

            ko.bindingHandlers[bindingName] = {
                init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    ko.applyBindingsToNode(element, {
                        template: {
                            name: function (x) {
                                return templateSelector.select(x);
                            },
                            data: valueAccessor(),
                            templateEngine: Knockout.StringTemplateEngine
                        }
                    }, viewModel);

                    return { 'controlsDescendantBindings': true };
                }
            };

            return templateSelector;
        }
        Knockout.makeTemplateSelector = makeTemplateSelector;

        /** declares the given binding name and returns a template collection that can be used to
        specify the templates used by this binding */
        function makeForeachWithTemplateSelector(bindingName, fallbackTemplate) {
            var templateSelector = new Knockout.TemplateSelector(fallbackTemplate);

            ko.bindingHandlers[bindingName] = {
                init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    ko.applyBindingsToNode(element, {
                        template: {
                            name: function (x) {
                                return templateSelector.select(x);
                            },
                            foreach: valueAccessor(),
                            templateEngine: Knockout.StringTemplateEngine
                        }
                    }, bindingContext);

                    return { controlsDescendantBindings: true };
                }
            };

            return templateSelector;
        }
        Knockout.makeForeachWithTemplateSelector = makeForeachWithTemplateSelector;

        /** inside a foreach binding, bind an item context to a binding so when the element is
        clicked the context is passed to the observable. Optionally some options can be passed
        to toggle classes when the element is selected */
        ko.bindingHandlers['foreachSelected'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var $element = $(element), value = valueAccessor(), options = ko.isObservable(value) ? { value: value } : value, isSelected = ko.computed(function () {
                    return options.value() === bindingContext.$data;
                }), cssBindingOptions = {};
                options = _.defaults(options, { selectedClass: 'k-state-selected' });

                $element.click(function (e) {
                    // mark the context as selected when the element is clicked
                    options.value(bindingContext.$data);
                    e.preventDefault();
                });

                cssBindingOptions[options.selectedClass] = isSelected;
                ko.applyBindingsToNode(element, {
                    css: cssBindingOptions
                }, bindingContext);

                // TODO: Deselect the currently selected item after a lost click... if that's possible to detect with JS
                //function deselectHandler(e: JQueryEventObject) {
                //     if (!e.isDefaultPrevented() && $(e.target).is('div') && options.value() === bindingContext.$data) {
                //        options.value(null);
                //    }
                //}
                //$('body').click(deselectHandler);
                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    isSelected.dispose();
                    $element.unbind('click');
                    //$('body').unbind('click', deselectHandler);
                });
            }
        };

        ko.bindingHandlers['var'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var innerBindingContext = bindingContext.extend(valueAccessor());
                ko.applyBindingsToDescendants(innerBindingContext, element);

                return { controlsDescendantBindings: true };
            }
        };

        /** shows a list of options to select one of them mst likely from an enum */
        ko.bindingHandlers['expandOptions'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var options = ko.unwrap(valueAccessor()), template = templates.widget.expandOptions(options);

                renderTemplateAsync(element, template, options);

                return { controlsDescendantBindings: true };
            }
        };

        /** binds two observables optionally specifing map functions between the observable values */
        function bind(options) {
            var ignoreSync = false, subscription = options.from.subscribe(function (value) {
                if (!ignoreSync) {
                    var correspondingValue = options.forward(value);
                    ignoreSync = true;
                    options.to(correspondingValue);
                    ignoreSync = false;
                }
            }), subscription1 = options.to.subscribe(function (value) {
                if (!ignoreSync) {
                    var correspondingValue = options.backward(value);
                    ignoreSync = true;
                    options.from(correspondingValue);
                    ignoreSync = false;
                }
            }), initialImage = options.forward(options.from());

            // check that the observables are synced
            if (initialImage !== options.to()) {
                options.to(initialImage);
            }

            return {
                dispose: function () {
                    subscription.dispose();
                    subscription1.dispose();
                }
            };
        }
        Knockout.bind = bind;

        /** adds two elements to the target element, that when hovered make the element
        children scroll in their direction.
        Scroll function on hover thanks to http://jsfiddle.net/gaby/xmAvh/ */
        ko.bindingHandlers['virtualScroll'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var $element = $(element), children = $element.children().wrapAll("<div class='virtual-scroll-wrapper'></div>").parent(), leftElement = $(templates.widget.VirtualScrollButton()), rightElement = $(templates.widget.VirtualScrollButton());

                $element.addClass('virtual-scroll').prepend(leftElement).append(rightElement);

                var amount = '';
                function scroll() {
                    children.animate({ scrollLeft: amount }, 100, 'linear', function () {
                        if (amount != '') {
                            scroll();
                        }
                    });
                }

                leftElement.hover(function () {
                    amount = '+=10';
                    scroll();
                }, function () {
                    amount = '';
                });
                rightElement.hover(function () {
                    amount = '-=10';
                    scroll();
                }, function () {
                    amount = '';
                });

                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    leftElement.unbind('hover');
                    rightElement.unbind('hover');
                });
            }
        };

        /** intended to be used for elements inside a virtualScroll, when the passed value evaluates to true,
        the binding will bring the given element into view */
        ko.bindingHandlers['virtualScrollFocus'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            }
        };

        /** convenience functions to extend existing binding functions, so all extenders are kept in a single place */
        (function (extend) {
            var extenders = new Common.Dict();

            function registerExtender(bindingName) {
                // register binding on extenders dictionary
                extenders.add(bindingName, []);

                var binding = ko.bindingHandlers[bindingName], init = binding.init, update = binding.update, preprocess = binding.preprocess;

                if (init) {
                    binding.init = function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                        var result = init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
                        _.each(extenders.get(bindingName), function (handler) {
                            return handler.init && handler.init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
                        });
                        return result;
                    };
                }

                if (update) {
                    binding.update = function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                        var result = update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
                        _.each(extenders.get(bindingName), function (handler) {
                            return handler.update && handler.update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
                        });
                        return result;
                    };
                }

                binding.preprocess = function (value, name, addBindingCallback) {
                    _.each(extenders.get(bindingName), function (handler) {
                        return handler.preprocess && handler.preprocess(value, name, addBindingCallback);
                    });

                    if (preprocess) {
                        return preprocess(value, name, addBindingCallback);
                    } else {
                        return value;
                    }
                };
            }

            function binding(name, options) {
                if (!extenders.contains(name)) {
                    registerExtender(name);
                }

                extenders.get(name).push(options);
            }
            extend.binding = binding;

            function bindingInit(name, init) {
                binding(name, { init: init });
            }
            extend.bindingInit = bindingInit;

            function bindingUpdate(name, update) {
                binding(name, { update: update });
            }
            extend.bindingUpdate = bindingUpdate;

            function bindingPreprocess(name, preprocess) {
                binding(name, { preprocess: preprocess });
            }
            extend.bindingPreprocess = bindingPreprocess;

            /** can be used as preprocessor function on bindings that can be used without any binding value */
            function emptyBindingPreprocess(value) {
                return value || '{}';
            }
            extend.emptyBindingPreprocess = emptyBindingPreprocess;
        })(Knockout.extend || (Knockout.extend = {}));
        var extend = Knockout.extend;

        function makeBindingHandlerNotifyResize(bindingName) {
            Knockout.extend.bindingUpdate(bindingName, function (element) {
                return Utils.async(function () {
                    return Common.triggerResize($(element));
                });
            });
        }
        makeBindingHandlerNotifyResize('visible');

        /** creates a new binding called 'mark'+name, that creates a new field on the context
        for child bindings named '$jigsaw'+name; containing the specified mark */
        function createContextMarkBinding(name, mark) {
            var bindingName = 'mark' + name, contextKey = '$jigsaw' + name;

            // create the binging
            ko.bindingHandlers[bindingName] = {
                init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var options = {};
                    options[contextKey] = mark ? mark() : valueAccessor();

                    var context = bindingContext.extend(options);

                    ko.applyBindingsToDescendants(context, element);
                    return { controlsDescendantBindings: true };
                }
            };

            return {
                bindingName: bindingName,
                contextKey: contextKey
            };
        }
        Knockout.createContextMarkBinding = createContextMarkBinding;

        var Ribbon;
        (function (Ribbon) {
            var RibbonTabStrip = (function (_super) {
                __extends(RibbonTabStrip, _super);
                function RibbonTabStrip(element, collapsed, options) {
                    if (typeof options === "undefined") { options = {}; }
                    var _this = this;
                    _super.call(this, element, _.defaults(options, {
                        animation: false
                    }));
                    this.collapsed = collapsed;
                    this.disposables = [];
                    this.lastTab = null;

                    var firstTabActivated = true;

                    // Triggered just after a tab is being made visible, but before the end of the animation
                    this.bind('activate', function () {
                        // don't active any tab if the ribbonTabStrip is initialized collapsed
                        if (!firstTabActivated || !collapsed()) {
                            _this.tabActivated();
                        } else {
                            // first tab activated and initialized collapsed
                            _this.collapse();
                        }
                        firstTabActivated = false;
                    });

                    this.disposables.push(collapsed.subscribe(function (x) {
                        if (x) {
                            _this.collapse();
                        } else {
                            _this.expand();
                        }
                    }));
                }
                RibbonTabStrip.prototype.collapse = function () {
                    this.wrapper.find('.k-tabstrip-items > li').removeClass('k-tab-on-top k-state-active');
                    this.wrapper.find('.k-content').css({ display: 'none', position: 'absolute', left: 0, right: 0 });

                    this.triggerResize();
                };

                RibbonTabStrip.prototype.expand = function () {
                    this.wrapper.find('.k-content').css({ position: 'relative', left: 0, right: 0 });
                    this.select(this.lastTab);

                    this.triggerResize();
                };

                RibbonTabStrip.prototype.triggerResize = function () {
                    Common.triggerResize(this.wrapper);
                    Common.triggerResize(this.wrapper.parent('.ribbon')); // trigger the resize event on the ribbon object
                };

                RibbonTabStrip.prototype.tabActivated = function () {
                    this.lastTab = this.select();
                    this.collapsed(false);
                };

                RibbonTabStrip.prototype.destroy = function () {
                    _super.prototype.destroy.call(this);
                    this.unbind('activate');
                    _.forEach(this.disposables, function (disposable) {
                        return disposable.dispose();
                    });
                };
                return RibbonTabStrip;
            })(kendo.ui.TabStrip);

            ko.bindingHandlers['ribbonTabStrip'] = {
                init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var options = ko.unwrap(valueAccessor());

                    // process descendant bindings before creating the tab-strip
                    ko.applyBindingsToDescendants(bindingContext, element);

                    //setTimeout(()=> tabStrip.triggerResize(), 500);
                    var tabStrip = new RibbonTabStrip(element, options.collapsed);

                    ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                        tabStrip.destroy();
                    });

                    return { controlsDescendantBindings: true };
                }
            };
        })(Ribbon || (Ribbon = {}));

        (function (Keytips) {
            var CustomKeyTipTree = (function () {
                function CustomKeyTipTree(root) {
                    this.root = root;
                }
                /**
                depth first search through the tree with certain predicate p
                */
                CustomKeyTipTree.prototype._dfs = function (node, p) {
                    if (p(node)) {
                        return node;
                    } else {
                        if (node.children) {
                            for (var i = 0; i < node.children.length; i++) {
                                var result = this._dfs(node.children[i], p);
                                if (result != null)
                                    return result;
                            }
                        }
                        return null;
                    }
                };

                CustomKeyTipTree.prototype.findNodeByLabel = function (label) {
                    return this._dfs(this.root, function (element) {
                        return element.label == label;
                    });
                };

                CustomKeyTipTree.prototype.findNodeByJQueryElement = function (element) {
                    return this._dfs(this.root, function (node) {
                        return node.element == element;
                    });
                };
                return CustomKeyTipTree;
            })();

            var CustomKeyTipNode = (function () {
                function CustomKeyTipNode(element, label, key, action, after, zindex) {
                    if (typeof zindex === "undefined") { zindex = 0; }
                    this.element = element;
                    this.label = label;
                    this.key = key;
                    this.action = action;
                    this.after = after;
                    this.zindex = zindex;
                    this.children = [];
                }
                CustomKeyTipNode.prototype.addChild = function (child) {
                    if (!child.key) {
                        child.key = this.getNewChildrenKey(child.zindex);
                    }

                    child.parent = this;

                    for (var i = 0; i < this.children.length; i++) {
                        if (child.zindex > this.children[i].zindex) {
                            this.children.splice(i, 0, child);
                            return;
                        }
                    }

                    this.children.push(child);
                };

                CustomKeyTipNode.prototype.removeChild = function (child) {
                    //console.log(child);
                    var index = this.children.indexOf(child);

                    if (index > -1) {
                        this.children.splice(index, 1);
                    }
                };

                CustomKeyTipNode.prototype.validKey = function (key, zindex) {
                    return !_.some(this.children, function (x) {
                        return x.key.indexOf(key) == 0 && x.zindex == zindex;
                    });
                };

                CustomKeyTipNode.prototype.getNewChildrenKey = function (zindex) {
                    for (var i = 65; i <= 90; i++) {
                        if (this.validKey(String.fromCharCode(i), zindex))
                            return String.fromCharCode(i);
                    }
                    return 'ZZ';
                };

                CustomKeyTipNode.prototype.getNewChildrenKeyStartWith = function (start, zindex) {
                    for (var i = 65; i <= 90; i++) {
                        if (this.validKey(start + String.fromCharCode(i), zindex))
                            return start + String.fromCharCode(i);
                    }
                    return 'ZZ';
                };
                return CustomKeyTipNode;
            })();

            var CustomKeyTipLeaf = (function () {
                function CustomKeyTipLeaf(element, key, action, after, zindex) {
                    if (typeof zindex === "undefined") { zindex = 0; }
                    this.element = element;
                    this.key = key;
                    this.action = action;
                    this.after = after;
                    this.zindex = zindex;
                }
                return CustomKeyTipLeaf;
            })();

            var zIndexBaseBindingInfo = createContextMarkBinding('ZIndexBase');

            ko.bindingHandlers['keyTips'] = {
                init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var value = ko.unwrap(valueAccessor()), parent = (value.parentGroup) ? tree.findNodeByLabel(value.parentGroup) : root, zindex = (value.zindex || 0) + (bindingContext[zIndexBaseBindingInfo.contextKey] || 0), key = value.key || parent.getNewChildrenKey(zindex), leaf = new CustomKeyTipLeaf(element, key, function () {
                        return $(element).click();
                    }, null, zindex);

                    parent.addChild(leaf);

                    ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                        // TODO add binding disposal
                        leaf.parent.removeChild(leaf);
                    });
                }
            };

            ko.bindingHandlers['keyTipsGroup'] = {
                init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var value = ko.unwrap(valueAccessor()), parent = (value.parentGroup) ? tree.findNodeByLabel(value.parentGroup) : root, zindex = (value.zindex || 0) + (bindingContext[zIndexBaseBindingInfo.contextKey] || 0), key = (value.key) ? value.key : ((value.keyStartWith) ? parent.getNewChildrenKeyStartWith(value.keyStartWith, zindex) : parent.getNewChildrenKey(zindex)), node = new CustomKeyTipNode(element, value.group, key, function () {
                        return $(element).click();
                    }, null, zindex);

                    parent.addChild(node);

                    ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                        node.parent.removeChild(node);
                    });
                }
            };

            ko.bindingHandlers['keyTipsKendoTab'] = {
                init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var value = ko.unwrap(valueAccessor()), parent = (value.parentGroup) ? tree.findNodeByLabel(value.parentGroup) : root, zindex = (value.zindex || 0) + (bindingContext[zIndexBaseBindingInfo.contextKey] || 0), key = (value.key) ? value.key : parent.getNewChildrenKey(zindex), node = new CustomKeyTipNode($(element).find('a')[0], value.group, key, function () {
                        return $(element).find('a').get(0).click();
                    }, null, zindex);

                    parent.addChild(node);

                    ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                        // TODO add binding disposal
                        node.parent.removeChild(node);
                    });
                }
            };

            ko.bindingHandlers['keyTipsInput'] = {
                init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var value = ko.unwrap(valueAccessor()), parent = (value.parentGroup) ? tree.findNodeByLabel(value.parentGroup) : root, zindex = (value.zindex || 0) + (bindingContext[zIndexBaseBindingInfo.contextKey] || 0), key = value.key || parent.getNewChildrenKey(zindex), leaf = new CustomKeyTipLeaf($(element).parent()[0], key, function () {
                        return $(element).focus();
                    }, null, zindex);

                    parent.addChild(leaf);

                    ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                        leaf.parent.removeChild(leaf);
                    });
                }
            };

            ko.bindingHandlers['keyTipsGrid'] = {
                init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var value = ko.unwrap(valueAccessor()), parent = (value.parentGroup) ? tree.findNodeByLabel(value.parentGroup) : root, zindex = (value.zindex || 0) + (bindingContext[zIndexBaseBindingInfo.contextKey] || 0), key = value.key || parent.getNewChildrenKey(zindex), leaf = new CustomKeyTipLeaf($(element).parent()[0], key, function () {
                        return $(element).find('table').get(0).focus();
                    }, null, zindex);

                    parent.addChild(leaf);

                    ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                        leaf.parent.removeChild(leaf);
                    });
                }
            };

            var KeyTipsController = (function () {
                function KeyTipsController(root) {
                    var _this = this;
                    this.keyTipPopups = [];
                    this.stack = '';

                    this.settings = {
                        popupClass: 'KeyTips__popup',
                        offsets: {
                            label: {
                                left: -20,
                                top: 2
                            },
                            button: {
                                left: -3,
                                top: -3
                            },
                            anchor: {
                                left: 2,
                                top: 9
                            },
                            text: {
                                left: -3,
                                top: -3
                            },
                            other: {
                                left: -3,
                                top: -3
                            }
                        },
                        b: 1
                    };

                    this.root = tree.root;

                    this.lastKeyTipsGroupSelected = tree.root;

                    this.keyTipsSelection = '';

                    $(document).keydown(function (e) {
                        return _this.handleKeyDown(e);
                    });
                    $(document).click(function (e) {
                        return _this.handleClick(e);
                    });
                }
                KeyTipsController.prototype.handleClick = function (e) {
                    if (this.keyTipsShowing) {
                        this.reset();
                    }
                };

                KeyTipsController.prototype.handleKeyDown = function (e) {
                    var _this = this;
                    //Esc presed
                    if (e.keyCode == 27 && this.keyTipsShowing) {
                        this.back();
                    } else if (this.keyTipsShowing && (e.keyCode == 37 || e.keyCode == 38 || e.keyCode == 39 || e.keyCode == 40)) {
                        this.reset();
                    } else if (this.shiftAndAltPressed(e)) {
                        if (this.keyTipsShowing) {
                            this.reset();
                        } else {
                            $(document.activeElement).blur();
                            this.showKeyTipsGroupSelection();
                        }
                    } else if (this.keyTipsShowing) {
                        this.keyTipsSelection = String.fromCharCode(e.keyCode);

                        if (this.keyTipsSelection.length == 1) {
                            setTimeout(function () {
                                return _this.handleKeyTipsSelection();
                            }, 250);
                        }
                    }
                };

                KeyTipsController.prototype.handleKeyTipsSelection = function () {
                    this.handleKeyTipPressed();
                    this.keyTipsSelection = '';
                };

                KeyTipsController.prototype.handleKeyTipPressed = function () {
                    var temp = this.stack + this.keyTipsSelection;
                    var zindex = _.max(_.map(this.lastKeyTipsGroupSelected.children, function (x) {
                        return x.zindex;
                    }));

                    var flag = _.some(this.lastKeyTipsGroupSelected.children, function (x) {
                        return x.key.indexOf(temp) == 0 && x.zindex == zindex && $(x.element).is(":visible");
                    });
                    this.stack = (flag) ? temp : this.stack;

                    for (var i = 0; i < this.lastKeyTipsGroupSelected.children.length; i++) {
                        var child = this.lastKeyTipsGroupSelected.children[i];
                        if (child.key == this.stack && child.zindex == zindex && $(child.element).is(":visible")) {
                            this.hideKeyTipsGroupSelection();
                            this.keyTipsShowing = false;
                            child.action();
                            this.stack = '';
                            if (child.children) {
                                this.lastKeyTipsGroupSelected = child;
                                this.showKeyTipsGroupSelection();
                            } else {
                                this.reset();
                            }
                        } else if (this.stack.length > 0 && child.key.indexOf(this.stack) != 0) {
                            this.keyTipPopups[i].css("display", 'none');
                        }
                    }
                };

                KeyTipsController.prototype.shiftAndAltPressed = function (e) {
                    return (e.keyCode == 16 && e.altKey) || (e.keyCode == 18 && e.shiftKey);
                };

                KeyTipsController.prototype.back = function () {
                    this.stack = '';
                    if (this.lastKeyTipsGroupSelected.after)
                        this.lastKeyTipsGroupSelected.after();
                    this.hideKeyTipsGroupSelection();
                    if (this.lastKeyTipsGroupSelected.parent) {
                        this.lastKeyTipsGroupSelected = this.lastKeyTipsGroupSelected.parent;
                        this.showKeyTipsGroupSelection();
                    } else {
                        this.reset();
                    }
                };

                KeyTipsController.prototype.showKeyTipsGroupSelection = function () {
                    if (this.keyTipPopups.length == 0) {
                        var zindex = _.max(_.map(this.lastKeyTipsGroupSelected.children, function (x) {
                            return x.zindex;
                        }));
                        for (var i = 0; i < this.lastKeyTipsGroupSelected.children.length; i++) {
                            var children = this.lastKeyTipsGroupSelected.children[i];
                            var popup = this.createPopup(children.element, children.key, this.settings);

                            if (children.zindex == zindex) {
                                popup.toggle(true);
                            }

                            this.keyTipPopups.push(popup);
                        }
                    }

                    this.keyTipsShowing = true;
                };

                KeyTipsController.prototype.hideKeyTipsGroupSelection = function () {
                    $.each(this.keyTipPopups, function () {
                        $(this).remove();
                    });

                    this.keyTipPopups = [];
                };

                KeyTipsController.prototype.reset = function () {
                    if (this.lastKeyTipsGroupSelected.after)
                        this.lastKeyTipsGroupSelected.after();
                    this.stack = '';
                    this.lastKeyTipsGroupSelected = this.root;
                    this.hideKeyTipsGroupSelection();
                    this.keyTipsShowing = false;
                };

                KeyTipsController.prototype.getOffset = function (element, settings) {
                    var $el = $(element);

                    if ($el.is("label")) {
                        return settings.offsets.label;
                    } else if ($el.is(":button, :submit, :reset, :image")) {
                        return settings.offsets.button;
                    } else if ($el.is("a")) {
                        return settings.offsets.anchor;
                    } else if ($el.is(":text, textarea")) {
                        return settings.offsets.text;
                    } else {
                        return settings.offsets.other;
                    }
                };

                KeyTipsController.prototype.getPopupLocation = function (element, settings) {
                    var $el = $(element), popupLocation, offset;

                    if ($el.is(":hidden") || $el.css("visibility") === "hidden") {
                        return false;
                    }

                    popupLocation = $el.offset();
                    offset = this.getOffset(element, settings);

                    return {
                        left: popupLocation.left + offset.left,
                        top: popupLocation.top + offset.top
                    };
                };

                KeyTipsController.prototype.createPopup = function (field, accessKey, settings) {
                    var popup = $("<div/>").text(accessKey).addClass(settings.popupClass).prependTo(field);

                    return popup;
                };
                return KeyTipsController;
            })();

            var root = new CustomKeyTipNode(null, null, null, null, null), tree = new CustomKeyTipTree(root), controller = new KeyTipsController(root);
        })(Knockout.Keytips || (Knockout.Keytips = {}));
        var Keytips = Knockout.Keytips;

        (function (HtmlTunneling) {
            var HtmlTunnel = (function () {
                function HtmlTunnel() {
                }
                HtmlTunnel.prototype.setEntrance = function (entrance) {
                    this.entrance = entrance;
                };

                HtmlTunnel.prototype.setExit = function (exit) {
                    if (!this.exit)
                        this.exit = exit;
                };

                HtmlTunnel.prototype.makeFlow = function () {
                    //console.log($(this.exit));
                    //console.log($(this.entrance).html());
                    $(this.exit).html($(this.entrance).html());

                    //$(this.entrance).empty();
                    console.log('FLOW DONE!!');
                };

                HtmlTunnel.prototype.isComplete = function () {
                    return (this.entrance && this.exit) ? true : false;
                };

                HtmlTunnel.prototype.flowsCount = function () {
                };

                HtmlTunnel.prototype.getEntrance = function () {
                    return this.entrance;
                };

                HtmlTunnel.prototype.getExit = function () {
                    return this.exit;
                };
                return HtmlTunnel;
            })();
            HtmlTunneling.HtmlTunnel = HtmlTunnel;

            var HtmlTunnelsDict = {};

            ko.bindingHandlers['htmlTunnel'] = {
                init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var options = ko.unwrap(valueAccessor()), id = options.id, end = options.end;

                    if (!HtmlTunnelsDict[id]) {
                        HtmlTunnelsDict[id] = new HtmlTunneling.HtmlTunnel();
                    }

                    var tunnel = HtmlTunnelsDict[id];

                    if (end === 'entrance') {
                        tunnel.setEntrance(element);
                    } else {
                        tunnel.setExit(element);
                    }

                    if (tunnel.isComplete()) {
                        tunnel.makeFlow();

                        ko.applyBindingsToDescendants(bindingContext, tunnel.getExit());
                    }

                    ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                        for (var id in HtmlTunnelsDict) {
                            var t = HtmlTunnelsDict[id];

                            if (t.getEntrance() == element) {
                                var exit = t.getExit();

                                var children = $(exit).children();

                                _.forEach(children, function (x) {
                                    var bindedElement = $(x).children('a')[0];

                                    ko.cleanNode(bindedElement);
                                });
                            }

                            if (t.getExit() == element) {
                                delete HtmlTunnelsDict[id];
                            }
                        }
                    });
                }
            };
        })(Knockout.HtmlTunneling || (Knockout.HtmlTunneling = {}));
        var HtmlTunneling = Knockout.HtmlTunneling;

        var PinUnpinStatus;
        (function (PinUnpinStatus) {
            PinUnpinStatus[PinUnpinStatus["Expanded"] = 0] = "Expanded";
            PinUnpinStatus[PinUnpinStatus["Collapsed"] = 1] = "Collapsed";
            PinUnpinStatus[PinUnpinStatus["Preview"] = 2] = "Preview";
        })(PinUnpinStatus || (PinUnpinStatus = {}));

        ko.bindingHandlers['pinunpin'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var $element = $(element), collapsedInitially = valueAccessor(), status = ko.observable(collapsedInitially && ko.unwrap(collapsedInitially) ? 1 /* Collapsed */ : 0 /* Expanded */), checkboxObservable = ko.computed({
                    read: function () {
                        return status() === 0 /* Expanded */;
                    },
                    write: function (value) {
                        return status(value ? 0 /* Expanded */ : 1 /* Collapsed */);
                    }
                }), collapsedObservable = ko.computed(function () {
                    return status() === 1 /* Collapsed */;
                }), context = bindingContext.extend({
                    '$jigsawPinUnpinCheckbox': checkboxObservable
                });

                ko.applyBindingsToNode(element, { css: { 'pin-unpin-collapsed': collapsedObservable } }, bindingContext);
                ko.applyBindingsToDescendants(context, element);

                // this can be used as a helper for the click handler, in case the checkbox binding isn't appropiate
                checkboxObservable['negate'] = function (_, e) {
                    checkboxObservable(!checkboxObservable());
                    e.preventDefault();
                    e.stopPropagation();
                };

                $element.click(function () {
                    if (status() === 1 /* Collapsed */) {
                        status(2 /* Preview */);
                    }
                });

                /** detect click outside the bounds of an element, thanks to http://stackoverflow.com/a/7385673/763705 */
                function clickOutsideBounds(e) {
                    if (status() === 2 /* Preview */ && !$element.is(e.target) && $element.has(e.target).length === 0) {
                        status(1 /* Collapsed */);
                    }
                }

                $(document).mouseup(clickOutsideBounds);

                if (collapsedInitially && ko.isObservable(collapsedInitially)) {
                    status.subscribe(function (x) {
                        return collapsedInitially(x === 1 /* Collapsed */);
                    });
                }

                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    $element.unbind('click');
                    $(document).unbind('mouseup', clickOutsideBounds);
                });

                return { controlsDescendantBindings: true };
            }
        };

        (function (SwiperEffect) {
            var MinimumHeight = 300;

            var RibbonTabSwiper = (function () {
                function RibbonTabSwiper(settings) {
                    var _this = this;
                    this.settings = settings;
                    this.disposables = [];
                    this.container = null;
                    this.ribbonTabSwiper = null;
                    this.N = 0;
                    this.tabActiveClass = 'active';
                    this.lastHeight = null;
                    this.element = settings.element;

                    this.tabs = settings.tabs;
                    this.collapsed = settings.collapsed;
                    this.speed = settings.speed;

                    this.container = $(this.element).find('.swiper-container')[0];

                    //$(this.element).find('.swiper-slide').css('width', screen.width);
                    this.initSwiper();

                    this.collapseSubscription();

                    this.tabsSubscription();

                    //set first tab as active
                    $(this.element).find(".tabs li").first().addClass(this.tabActiveClass);

                    //set tabs handler
                    $(this.element).on('touchstart mousedown click', '.tabs a', function (e) {
                        return _this.tabsHandler(e);
                    });

                    $(this.element).on('touchend click', '.content-slide-end', function (e) {
                        return _this.endsOfEachSlideClickHandler(e);
                    });

                    //patch to recalculate swipe slider margins
                    setTimeout(function () {
                        return _this.refresh();
                    }, 5000);

                    //handle window resize for responsive behavior
                    $(window).resize(function () {
                        return _this.handleViewPortResize();
                    });
                }
                RibbonTabSwiper.prototype.updateTabsStatus = function () {
                    $(this.element).find(".tabs " + "." + this.tabActiveClass).removeClass(this.tabActiveClass);
                    $(this.element).find(".tabs li").eq(this.ribbonTabSwiper.activeIndex).addClass(this.tabActiveClass);
                };

                RibbonTabSwiper.prototype.initSwiper = function () {
                    var _this = this;
                    this.ribbonTabSwiper = new Swiper(this.container, {
                        speed: this.speed,
                        onSlideChangeStart: function () {
                            _this.updateTabsStatus();
                        },
                        onTouchStart: function () {
                            _this.wrapperPositionBefore = _this.ribbonTabSwiper.getWrapperTranslate();
                        },
                        onTouchEnd: function () {
                            _this.wrapperPositionAfter = _this.ribbonTabSwiper.getWrapperTranslate();
                            _this.updateTabsStatus();
                        },
                        freeMode: true,
                        //freeModeFluid: true,
                        slidesPerView: 'auto'
                    });
                };

                RibbonTabSwiper.prototype.collapseSubscription = function () {
                    var _this = this;
                    this.disposables.push(this.collapsed.subscribe(function (x) {
                        if (x) {
                            _this.collapse();
                        } else {
                            _this.expand();
                        }
                    }));
                };

                RibbonTabSwiper.prototype.tabsSubscription = function () {
                    var _this = this;
                    this.N = $(this.element).find(".tabs li").length;

                    this.disposables.push(this.tabs.subscribe(function (x) {
                        if (x.length < _this.N) {
                            _this.popSlider();

                            _this.activateSlide(0);
                        }

                        if (x.length > _this.N) {
                            _this.pushSlider();

                            _this.activateSlide(_this.N);
                        }

                        _this.N = x.length;
                    }));
                };

                RibbonTabSwiper.prototype.activateSlide = function (index) {
                    var tab = $(this.element).find(".tabs li").get(index);
                    setTimeout(function () {
                        return $(tab).children().first().click();
                    }, 200);
                };

                RibbonTabSwiper.prototype.tabsHandler = function (e) {
                    e.preventDefault();

                    $(this.element).find(".tabs " + "." + this.tabActiveClass).removeClass(this.tabActiveClass);

                    var $target = $(e.currentTarget).parent();

                    $target.addClass(this.tabActiveClass);

                    this.ribbonTabSwiper.swipeTo($target.index());
                };

                RibbonTabSwiper.prototype.refresh = function () {
                    this.ribbonTabSwiper.reInit(true);
                };

                RibbonTabSwiper.prototype.pushSlider = function () {
                    this.refresh();
                };

                RibbonTabSwiper.prototype.popSlider = function () {
                    this.refresh();
                };

                RibbonTabSwiper.prototype.collapse = function () {
                    this.refresh();
                    this.triggerResize();
                };

                RibbonTabSwiper.prototype.expand = function () {
                    this.refresh();
                    this.triggerResize();
                };

                RibbonTabSwiper.prototype.triggerResize = function () {
                    Common.triggerResize($(this.element).parent().parent());
                };

                RibbonTabSwiper.prototype.handleViewPortResize = function () {
                    var currentHeight = $(document).height();

                    if (currentHeight != this.lastHeight && currentHeight < MinimumHeight) {
                        this.collapsed(true);
                        this.lastHeight = currentHeight;
                    }
                };

                RibbonTabSwiper.prototype.destroy = function () {
                    $(this.element).unbind('touchstart touchend mousedown click');

                    this.ribbonTabSwiper.destroy();

                    _.forEach(this.disposables, function (disposable) {
                        return disposable.dispose();
                    });
                };

                RibbonTabSwiper.prototype.endsOfEachSlideClickHandler = function (e) {
                    if (this.wrapperPositionAfter <= this.wrapperPositionBefore) {
                        this.ribbonTabSwiper.swipeNext();
                    } else {
                        this.ribbonTabSwiper.swipePrev();
                    }
                };
                return RibbonTabSwiper;
            })();

            ko.bindingHandlers['ribbonTabsSwiper'] = {
                init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    // bind our child elements (which will create the virtual foreach elements)
                    ko.applyBindingsToDescendants(bindingContext, element);

                    var options = ko.unwrap(valueAccessor()), speed = options.speed || 200, emptySpaces = options.emptySpaces || false, ribbonTabsSwiper = new RibbonTabSwiper({ element: element, tabs: options.tabs, collapsed: options.collapsed, speed: speed, emptySpaces: emptySpaces });

                    /*                ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                    ribbonTabsSwiper.destroy();
                    });*/
                    // tell KO we have already bound the children
                    return { controlsDescendantBindings: true };
                }
            };
        })(Knockout.SwiperEffect || (Knockout.SwiperEffect = {}));
        var SwiperEffect = Knockout.SwiperEffect;
    })(exports.Knockout || (exports.Knockout = {}));
    var Knockout = exports.Knockout;

    /* Module : DragDrop */
    (function (DragDrop) {
        /** this variable holds data that is being dragged */
        var DragData = null;

        function makeDraggable(element, value) {
            var $element = $(element);

            if (!value.cursorOffset) {
                value.cursorOffset = { left: 5, bottom: 30 };
            }

            return $element.draggable({
                appendTo: "body",
                scope: value.group,
                //filter: "No alternative found",
                axis: value.axis,
                cursorAt: value.cursorOffset,
                zIndex: 20000,
                helper: function (item) {
                    var dragHint;
                    if (_.isString(value.hint)) {
                        if (value.data() !== null) {
                            dragHint = $(value.hint);
                            var data = ko.unwrap(value.data);
                            ko.applyBindings(data, dragHint[0]);
                            ko.cleanNode(dragHint[0]);
                        } else {
                            $element.draggable("disable");
                            return $('<div style="display: none;"></div>');
                        }
                    } else {
                        // else just clone the given element
                        var hintTarget = value.hintTarget ? $element.find(value.hintTarget) : $element;
                        dragHint = hintTarget.clone().height($element.height()).width($element.width());
                    }

                    if (!value.wrap) {
                        return dragHint.addClass('drag-hint');
                    } else {
                        return $(templates.DragWrap()).addClass('drag-hint').append(dragHint);
                    }
                },
                start: function (e) {
                    DragData = ko.unwrap(value.data);
                    $element.addClass('dragging');
                },
                stop: function (e) {
                    DragData = null;
                    $element.removeClass('dragging');
                    try  {
                        $element.draggable("enable");
                    } catch (e) {
                        // Do nothing if the element is not a draggable
                    }
                }
            });
        }
        DragDrop.makeDraggable = makeDraggable;

        ko.bindingHandlers['jQueryUIDraggable'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var value = ko.unwrap(valueAccessor()), draggable = makeDraggable(element, value);

                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    draggable && draggable.draggable() && draggable.draggable("destroy");
                });
            }
        };

        function makeDropTarget(element, dropViewModel, value) {
            var $element = $(element);

            return $element.droppable({
                scope: value.group,
                tolerance: 'touch',
                drop: function () {
                    DragData && value.drop.call(dropViewModel, DragData);
                    $element.removeClass('can-drop');
                },
                hoverClass: 'can-drop',
                over: function (e, ui) {
                    ui.helper.addClass('can-drop');
                },
                out: function (e, ui) {
                    ui.helper.removeClass('can-drop');
                }
            });
        }
        DragDrop.makeDropTarget = makeDropTarget;

        ko.bindingHandlers['jQueryUIDropTarget'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var $element = $(element), value = ko.unwrap(valueAccessor()), target = value.toParent ? $element.parents(value.toParent)[0] : element, dropTarget = makeDropTarget(target, viewModel, value);

                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    dropTarget && dropTarget.droppable() && dropTarget.droppable("destroy");
                });
            }
        };
    })(exports.DragDrop || (exports.DragDrop = {}));
    var DragDrop = exports.DragDrop;

    /* Module : Collection */
    (function (Collection) {
        

        

        var SetCollection = (function () {
            function SetCollection() {
                this.items = ko.observableArray();
            }
            SetCollection.prototype.add = function (item) {
                this.items.push(item);
            };

            SetCollection.prototype.remove = function () {
                var items = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    items[_i] = arguments[_i + 0];
                }
                this.items.removeAll(items);
            };

            /** to be implemented in derived classes, always returns true */
            SetCollection.prototype.belongsTo = function (item) {
                return true;
            };
            return SetCollection;
        })();
        Collection.SetCollection = SetCollection;

        /** this class is intended to compose a collection from different collections, where
        each collection represent a disjunt set in the space of <T> */
        var MultiSetCollection = (function () {
            /** if 'storeMissingItems' == true then all elements that doesn't below to any set
            will be stored in a special part created just for them */
            function MultiSetCollection(storeMissingItems) {
                if (typeof storeMissingItems === "undefined") { storeMissingItems = false; }
                var _this = this;
                this.storeMissingItems = storeMissingItems;
                this.items = ko.observableArray();
                this.parts = ko.observableArray();
                this.missingItems = new SetCollection();
                // TODO improve union algorithm between parts
                ko.computed(function () {
                    var partItems = _.map(_this.parts(), function (part) {
                        return part.items();
                    });
                    if (storeMissingItems) {
                        partItems.push(_this.missingItems.items());
                    }
                    var items = _.union.apply(_, partItems);
                    return _this.mapItems(items);
                }).extend({ throttle: 500 }).subscribe(function (items) {
                    // remove all items without sending any notification
                    _this.items().splice(0);
                    _this.items.push.apply(_this.items, items);
                });
            }
            /** modifies the resulting array in some way just before updating it */
            MultiSetCollection.prototype.mapItems = function (items) {
                return items;
            };

            /** adds a new part to compose the items of this collection */
            MultiSetCollection.prototype.blendWith = function () {
                var collections = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    collections[_i] = arguments[_i + 0];
                }
                this.parts.push.apply(this.parts, collections);
            };

            MultiSetCollection.prototype.add = function (item) {
                // find the collection where this items fits
                var collection = _.find(this.parts(), function (x) {
                    return x.belongsTo(item);
                });
                if (collection) {
                    collection.add(item);
                } else if (this.storeMissingItems) {
                    this.missingItems.add(item);
                } else {
                    throw new Error('there is no place where I can add the passed item');
                }
            };

            MultiSetCollection.prototype.remove = function (item) {
                var collection = _.find(this.parts(), function (x) {
                    return x.belongsTo(item);
                });
                if (collection) {
                    collection.remove(item);
                } else if (this.storeMissingItems) {
                    this.missingItems.remove(item);
                } else {
                    throw new Error('the given item does not belong to any set');
                }
            };

            MultiSetCollection.prototype.belongsTo = function (item) {
                return _.any(this.parts(), function (x) {
                    return x.belongsTo(item);
                }) || this.storeMissingItems;
            };

            MultiSetCollection.prototype.findPartContaining = function (item) {
                return _.find(this.parts(), function (part) {
                    return part.belongsTo(item);
                });
            };
            return MultiSetCollection;
        })();
        Collection.MultiSetCollection = MultiSetCollection;
    })(exports.Collection || (exports.Collection = {}));
    var Collection = exports.Collection;

    /** features borrowed from Backbone.Marionette in order to remove all references
    to these libraries from Jigsaw */
    (function (Marionette) {
        /** combination between Backbone and Marionette base View class */
        var View = (function () {
            function View(options) {
                this.options = options;
                /** returns the array of elements created after the view was rendered */
                this.element = null;
                this._renderedEvent = new Common.Event();
                this._closedEvent = new Common.Event();
            }
            Object.defineProperty(View.prototype, "isClosed", {
                get: function () {
                    return this.element === null;
                },
                enumerable: true,
                configurable: true
            });

            /** helper function to set the view model after the view has been created.
            It will throw an exception if there's already a viewmodel setted */
            View.prototype.withViewModel = function (viewModel) {
                if (this.options.viewModel) {
                    throw new Error('a view can only have one view-model associated');
                }
                this.options.viewModel = viewModel;

                return this;
            };

            /** returns the data that should be used to generate the template if any */
            View.prototype.templateData = function () {
                return null;
            };

            /** renders the current view, this method should be protected. */
            View.prototype.renderOverride = function () {
                var _this = this;
                return Q(this.options.template(this.templateData())).then(function (template) {
                    _this.element = $(template);
                });
            };

            View.prototype.render = function () {
                var _this = this;
                if (!this.isClosed) {
                    this.close();
                }

                return this.renderOverride().finally(function () {
                    _this._renderedEvent.fire();
                });
            };

            View.prototype.rendered = function (handler) {
                return this._renderedEvent.add(handler);
            };

            View.prototype.find = function (selector) {
                return this.element.find(selector);
            };

            View.prototype.close = function () {
                if (this.isClosed)
                    return;

                if (this.element) {
                    // clean knockout bindings if a view model was specified
                    if (this.options.viewModel) {
                        this.element.each(function (_, element) {
                            ko.cleanNode(element);
                        });
                    }

                    this._closedEvent.fire();

                    this.element = null;
                }
            };

            View.prototype.closed = function (handler) {
                return this._closedEvent.add(handler);
            };

            /** this method is called by the parent region when the view is attached to the DOM,
            don't call it. */
            View.prototype.domReady = function () {
                var _this = this;
                if (this.options.viewModel) {
                    this.element.each(function (_, element) {
                        if (element.nodeType !== Node.TEXT_NODE) {
                            ko.applyBindings(_this.options.viewModel, element);
                        }
                    });
                }
            };
            return View;
        })();
        Marionette.View = View;

        /** returns a function that can be used as a templateFunction for views */
        function urlTemplate(url, data) {
            var template;
            return result;

            function result(helpers) {
                if (template) {
                    return template(helpers);
                } else {
                    return ajax.get(url, data).then(function (rawTemplate) {
                        template = _.template(rawTemplate);
                        return result(helpers);
                    });
                }
            }
        }
        Marionette.urlTemplate = urlTemplate;

        function remoteSourceTemplate(remoteSource) {
            var template;
            return result;

            function result(helpers) {
                if (template) {
                    return template(helpers);
                } else if (remoteSource.isReady) {
                    template = _.template(remoteSource.value);
                    return result(helpers);
                } else {
                    throw new Error('the remote source must be ready before rendering the template');
                }
            }
        }
        Marionette.remoteSourceTemplate = remoteSourceTemplate;

        /** convenience class name for empty regions */
        var EMPTYREGION = 'empty-region';

        var Region = (function () {
            function Region(options) {
                this.options = options;
                $(options.element).addClass(EMPTYREGION);
            }
            Region.prototype.show = function (view) {
                var _this = this;
                // check if there's a previous view opened
                this.close();

                // replace the current view
                this._view = view;
                var ignoreRender = true;
                this._renderHandler = view.rendered(function () {
                    // below the view.render() method is called, and the rendered event will be raised
                    // for those cases it should be ignored
                    if (ignoreRender)
                        return;
                    _this.viewRendered();
                });
                this._closedHandler = view.closed(function () {
                    return _this.removeView();
                });

                // render the new view
                return view.render().then(function () {
                    _this.viewRendered();
                    ignoreRender = false;
                });
            };

            /** called when the render event of the view is raised */
            Region.prototype.viewRendered = function () {
                this.reloadView();

                // notify the new view elements that they are in the DOM
                this._view.domReady();
            };

            /** this is called when the view's render method is called, and the element
            on the region must be updated */
            Region.prototype.reloadView = function () {
                this.options.element.empty().append(this._view.element);
                this.options.element.removeClass(EMPTYREGION);
            };

            Region.prototype.close = function () {
                if (this._view) {
                    this.removeView();
                    this._renderHandler.dispose();
                    this._closedHandler.dispose();
                    this._view.close();
                    this._view = null;
                }
            };

            /** removes the element of an already closed view */
            Region.prototype.removeView = function () {
                if (this._view.element) {
                    this._view.element.remove();
                    this.options.element.addClass(EMPTYREGION);
                }
            };

            /** removes the target view from the current region without closing it,
            so it can be re-attached in another region without rendering the view */
            Region.prototype.detach = function () {
                var view = this._view;

                if (view) {
                    view.element.detach();
                    this._renderHandler.dispose();
                    this._closedHandler.dispose();
                    this._view = null;
                }

                return view;
            };

            Region.prototype.attach = function (view) {
                var _this = this;
                this.close();
                this._view = view;
                this._renderHandler = view.rendered(function () {
                    return _this.viewRendered();
                });
                this._closedHandler = view.closed(function () {
                    return _this.removeView();
                });
                this.reloadView();
            };

            Region.prototype.domReady = function () {
                if (this._view) {
                    this._view.domReady();
                }
            };
            return Region;
        })();
        Marionette.Region = Region;

        var Layout = (function (_super) {
            __extends(Layout, _super);
            function Layout(options) {
                _super.call(this, options);
                this._detachedViews = {};

                this.regionNames = _.keys(this.options.regions);
            }
            Layout.prototype.renderOverride = function () {
                var _this = this;
                return _super.prototype.renderOverride.call(this).then(function () {
                    // initialize regions after the view has been rendered
                    _.each(_this.regionNames, function (regionName) {
                        var region = new Region({ element: _this.find(_this.options.regions[regionName]) });
                        _this[regionName] = region;
                    });
                });
            };

            /** this is called when the layout is re-rendered. detaches all associated
            views and re-attaches them once the layout has been recreated; so associated
            views don't have to be recreated when the layout is re-rendered. */
            Layout.prototype.renderAndKeepViews = function () {
                var _this = this;
                var region;

                _(this.regionNames).each(function (regionName) {
                    var region = _this[regionName];
                    _this._detachedViews[regionName] = region.detach();
                });

                // bindings need to be removed from root element
                _(this.element).each(function (x) {
                    return ko.cleanNode(x);
                });

                return this.renderOverride();
            };

            Layout.prototype.render = function () {
                var _this = this;
                if (!this.isClosed) {
                    // assume the layout is being re-rendered
                    // all views will be detached and stored in this._detachedViews
                    // then all views will be re-atached when domReady is called
                    return this.renderAndKeepViews().finally(function () {
                        _this._renderedEvent.fire();
                    });
                } else {
                    return _super.prototype.render.call(this);
                }
            };

            Layout.prototype.close = function () {
                var _this = this;
                // and close/delete regions
                _.each(this.regionNames, function (regionName) {
                    var region = _this[regionName];
                    if (region) {
                        region.close();

                        _this[regionName] = null;
                        delete region;
                    }
                });

                _super.prototype.close.call(this);
            };

            Layout.prototype.domReady = function () {
                var _this = this;
                _super.prototype.domReady.call(this);

                _.each(this.regionNames, function (regionName) {
                    var region = _this[regionName];

                    // notify views inside of it's regions that the dom is ready,
                    // all regions should have been created on the render method
                    region.domReady();

                    // check if there's any detached view to re-attach to this region
                    if (_this._detachedViews[regionName]) {
                        region.attach(_this._detachedViews[regionName]);
                        delete _this._detachedViews[regionName];
                    }
                });
            };
            return Layout;
        })(View);
        Marionette.Layout = Layout;

        var CollectionView = (function (_super) {
            __extends(CollectionView, _super);
            function CollectionView(root) {
                if (typeof root === "undefined") { root = 'div'; }
                _super.call(this, { template: function () {
                        return $('<' + root + '>');
                    } });
                this._views = [];
            }
            CollectionView.prototype.add = function (item) {
                this._views.push(item);
            };

            CollectionView.prototype.render = function () {
                var _this = this;
                return _super.prototype.render.call(this).then(function () {
                    var renderPromises = _(_this._views).map(function (view) {
                        return view.render();
                    });
                    return Q.all(renderPromises).then(function () {
                        _(_this._views).each(function (view) {
                            _this.element.append(view.element);
                        });
                    });
                });
            };

            CollectionView.prototype.close = function () {
                // close all inner views
                _(this._views).each(function (view) {
                    return view.close();
                });
                _super.prototype.close.call(this);
            };

            CollectionView.prototype.domReady = function () {
                _(this._views).each(function (view) {
                    return view.domReady();
                });
            };
            return CollectionView;
        })(View);
        Marionette.CollectionView = CollectionView;

        

        /**  */
        function renderViewIntoElement(element, view) {
            var region = new Region({ element: element });

            region.show(view).done();

            return {
                dispose: function () {
                    region.close();
                    delete region;
                }
            };
        }
        Marionette.renderViewIntoElement = renderViewIntoElement;
    })(exports.Marionette || (exports.Marionette = {}));
    var Marionette = exports.Marionette;

    /* Module : Views */
    (function (Views) {
        (function (WindowSize) {
            WindowSize[WindowSize["SMALL"] = 0] = "SMALL";
            WindowSize[WindowSize["MEDIUM"] = 1] = "MEDIUM";
            WindowSize[WindowSize["LARGE"] = 2] = "LARGE";
        })(Views.WindowSize || (Views.WindowSize = {}));
        var WindowSize = Views.WindowSize;

        var WindowView = (function () {
            function WindowView(view, options) {
                if (typeof options === "undefined") { options = {}; }
                this.view = view;
                this.options = options;
                this._preventWindowClose = true;
                var size = (options.size || options.size === 0) ? options.size : 1 /* MEDIUM */;

                this.$dialogWrapper = $(templates.Dialog({ size: size }));
            }
            WindowView.prototype.showDialog = function () {
                //if (this.$dialogWrapper) {
                //    throw new Error('the window is still open');
                //}
                var _this = this;
                this._dialogDefered = Q.defer();

                // render the view and show it on a window
                return this.view.render().then(function () {
                    _this.$dialogWrapper.appendTo('body');

                    _this.renderingResult = Marionette.renderViewIntoElement(_this.$dialogWrapper.find('.modal-content'), _this.view);

                    //This event is fired immediately when the hide instance method has been called.
                    _this.$dialogWrapper.on('hide.bs.modal', function (e) {
                        return _this.windowCloseHandler(e);
                    });

                    //This event is fired when the modal has finished being hidden from the user (will wait for CSS transitions to complete).
                    _this.$dialogWrapper.on('hidden.bs.modal', function (e) {
                        _this.destroyWindow();
                    });

                    return Q.delay(true, 100).then(function () {
                        // notify the view that it's DOM ready
                        //this.view.domReady();
                        //this.options.backdrop = 'static';
                        //this.options.keyboard = false;
                        _this.$dialogWrapper.modal();

                        return _this._dialogDefered.promise;
                    });
                });
            };

            WindowView.prototype.windowCloseHandler = function (e) {
                if (this._preventWindowClose && this.options.close) {
                    e.preventDefault();

                    // this should call the close method on this class
                    this.options.close(e);
                }
            };

            /** Close the window, and destroys it after the close animation has completed */
            WindowView.prototype.close = function () {
                this._preventWindowClose = false;
                this.$dialogWrapper.modal('hide'); // this calls destroyWindow after the window is closed
                this._preventWindowClose = true;
            };

            WindowView.prototype.destroyWindow = function () {
                this.view.close();
                this.$dialogWrapper.data('modal', null);
                this.renderingResult.dispose();
                this.$dialogWrapper.remove();
                this.resolveDeferred();
            };

            WindowView.prototype.resolveDeferred = function () {
                this._dialogDefered.resolve(true);
            };
            return WindowView;
        })();
        Views.WindowView = WindowView;

        var DialogMessageBase = (function () {
            function DialogMessageBase(template, viewModel) {
                /** marks when the showDialog promise should fail */
                this._cancelFlag = false;
                var view = new Marionette.View({
                    template: template,
                    viewModel: viewModel
                });
                this._window = new WindowView(view);
            }
            DialogMessageBase.prototype.showDialog = function () {
                var _this = this;
                return this._window.showDialog().then(function () {
                    if (!_this._cancelFlag) {
                        return _this.dialogResult();
                    } else {
                        _this._cancelFlag = false;

                        // Cancel action, the promise should fail
                        return Q.reject();
                    }
                });
            };

            /** must be implemented in derived classes and return the Dialog's result
            after it has been closed */
            DialogMessageBase.prototype.dialogResult = function () {
                throw new Error('not implemented');
            };

            DialogMessageBase.prototype.cancel = function () {
                this._cancelFlag = true;
                this.close();
            };

            DialogMessageBase.prototype.close = function () {
                this._window.close();
            };
            return DialogMessageBase;
        })();
        Views.DialogMessageBase = DialogMessageBase;

        (function (MessageBoxType) {
            MessageBoxType[MessageBoxType["Question"] = 0] = "Question";
            MessageBoxType[MessageBoxType["QuestionYesNo"] = 1] = "QuestionYesNo";
        })(Views.MessageBoxType || (Views.MessageBoxType = {}));
        var MessageBoxType = Views.MessageBoxType;

        (function (MessageBoxResult) {
            MessageBoxResult[MessageBoxResult["Yes"] = 0] = "Yes";
            MessageBoxResult[MessageBoxResult["No"] = 1] = "No";
            MessageBoxResult[MessageBoxResult["Cancel"] = 2] = "Cancel";
        })(Views.MessageBoxResult || (Views.MessageBoxResult = {}));
        var MessageBoxResult = Views.MessageBoxResult;

        function smartMessage(options) {
            var result = Q.defer();

            $.SmartMessageBox({
                title: options.title,
                content: options.content,
                buttons: options.type === 1 /* QuestionYesNo */ ? '[No][Yes]' : '[Cancel][No][Yes]'
            }, function (x) {
                if (x === 'Yes')
                    result.resolve(0 /* Yes */);
                else if (x === 'No')
                    result.resolve(1 /* No */);
                else
                    result.resolve(2 /* Cancel */);
            });

            return result.promise;
        }
        Views.smartMessage = smartMessage;

        function smartInput(options) {
            var result = Q.defer();

            $.SmartMessageBox({
                title: options.title,
                content: options.content,
                input: 'text',
                buttons: '[Cancel][Ok]'
            }, function (x, content) {
                if (x === 'Ok') {
                    result.resolve(content);
                } else {
                    result.reject(false);
                }
            });

            return result.promise;
        }
        Views.smartInput = smartInput;
    })(exports.Views || (exports.Views = {}));
    var Views = exports.Views;

    /* Module : Utils */
    (function (Utils) {
        function requirePromise() {
            var _this = this;
            var modules = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                modules[_i] = arguments[_i + 0];
            }
            var deferred = Q.defer();

            require(modules, function () {
                var result = _.toArray(arguments);
                deferred.resolve.apply(_this, result);
            });

            return deferred.promise;
        }
        Utils.requirePromise = requirePromise;

        function cssPromise() {
            var deferreds = _.map(arguments, function (url) {
                return ajax.get(url).then(function (css) {
                    $("<style type='text/css'></style>").html(css).appendTo('head');
                    return true;
                });
            });
            return Q.all(deferreds).then(function () {
                return true;
            });
        }
        Utils.cssPromise = cssPromise;

        /** executes the specified function when the passed 'element' is idle 'ms' milliseconds,
        'minimumInterval' specifies the number of times that the control is checked for activity */
        function runIdle(element, ms, fun, minimumInterval) {
            if (typeof minimumInterval === "undefined") { minimumInterval = 1000; }
            var idleTime = 0;

            function resetIdle() {
                idleTime = 0;
            }

            element.mousemove(resetIdle);
            element.keydown(resetIdle);

            function runIdle() {
                idleTime = idleTime + minimumInterval;

                // time passed execute the action
                if (idleTime > ms) {
                    idleTime = 0;
                    fun();
                }

                // schedule another run
                setTimeout(runIdle, minimumInterval);
            }

            setTimeout(runIdle, minimumInterval);

            return {
                destroy: function () {
                    element.unbind('mousemove', resetIdle);
                    element.unbind('keydown', resetIdle);
                }
            };
        }
        Utils.runIdle = runIdle;

        /** detects if caps lock key is ative by checking at the event args of the key press event
        taken from: stackoverflow.com/questions/348792 */
        function capsLockOn(e) {
            var s = String.fromCharCode(e.which);
            return s.toUpperCase() === s && s.toLowerCase() !== s && !e.shiftKey;
        }
        Utils.capsLockOn = capsLockOn;

        /** Loads the given CSS stylesheet */
        function loadStylesheet(file) {
            // to load a stylesheet dynamically on IE need to call this method, but apparently the other
            // way is best at least on IE10: document.createStyleSheet(file)
            return $("<link>").appendTo("head").attr({ type: 'text/css', rel: 'stylesheet' }).attr('href', file);
        }
        Utils.loadStylesheet = loadStylesheet;

        function sum(items) {
            var result = 0, i;
            for (i = 0; i < items.length; i++) {
                result += items[i];
            }
            return result;
        }
        Utils.sum = sum;

        function scrollIntoView(element, container) {
            var containerTop = $(container).scrollTop();
            var containerBottom = containerTop + $(container).height();
            var elemTop = element.offsetTop;
            var elemBottom = elemTop + $(element).height();

            if (elemTop < containerTop) {
                $(container).scrollTop(elemTop);
            } else if (elemBottom > containerBottom) {
                $(container).scrollTop(elemBottom - $(container).height());
            }
        }
        Utils.scrollIntoView = scrollIntoView;

        /** remove the given element from the array */
        function remove(array, item) {
            var index = _.indexOf(array, item);
            if (index >= 0) {
                array.splice(index, 1);
            }
        }
        Utils.remove = remove;

        /** replaces the contents of an array with new values */
        function replace(array, newContent) {
            array.splice.apply(array, [0, array.length].concat(newContent));
        }
        Utils.replace = replace;

        function replaceObservable(array, newContent) {
            array.splice.apply(array, [0, array().length].concat(newContent));
        }
        Utils.replaceObservable = replaceObservable;

        function waitForEvent(target, event) {
            var result = Q.defer();
            target.one(event, function (e) {
                return result.resolve(e);
            });
            return result.promise;
        }
        Utils.waitForEvent = waitForEvent;

        /* executes the given function asynchronously */
        function async(expr) {
            if (window.setImmediate) {
                window.setImmediate(expr);
            } else {
                window.setTimeout(expr, 0);
            }
        }
        Utils.async = async;

        /** returns the number of elements passing the given filter */
        function count(array, filter) {
            var result = 0;
            _.each(array, function (item) {
                if (filter(item)) {
                    result++;
                }
            });
            return result;
        }
        Utils.count = count;

        function shake(element, shakes, distance, duration) {
            if (typeof shakes === "undefined") { shakes = 3; }
            if (typeof distance === "undefined") { distance = 3; }
            if (typeof duration === "undefined") { duration = 100; }
            if (shakes > 0) {
                element.css('position', 'relative');

                element.each(function () {
                    var $el = $(this);
                    var left = $el.css('left');

                    $el.animate({
                        left: "-=" + distance
                    }, duration, function () {
                        $el.animate({
                            left: "+=" + distance * 2
                        }, duration, function () {
                            $el.animate({
                                left: left
                            }, duration, function () {
                                shake($el, shakes - 1, distance, duration);
                            });
                        });
                    });
                });
            }
        }
        Utils.shake = shake;

        /** evaluates handler() different times separated by the specified timeout, when two calls return
        the same result callback is called */
        function stabilize(timeout, handler) {
            var previousValue = handler(), result = Q.defer();

            setTimeout(scheduleNext, timeout);

            return result.promise;

            function scheduleNext() {
                var value = handler();

                if (value === previousValue) {
                    result.resolve(value);
                } else {
                    previousValue = value;
                    setTimeout(scheduleNext, timeout);
                }
            }
        }
        Utils.stabilize = stabilize;
    })(exports.Utils || (exports.Utils = {}));
    var Utils = exports.Utils;

    (function (History) {
        var KendoHistoryProxy = (function () {
            function KendoHistoryProxy() {
                var _this = this;
                this.router = new kendo.Router({
                    change: function (e) {
                        return _this._location = e.url;
                    },
                    routeMissing: function (e) {
                        return console.error('route missing: ', e.url);
                    }
                });

                this._location = this.cleanUrl(window.location.hash);
            }
            KendoHistoryProxy.prototype.cleanUrl = function (url) {
                var hashStrip = /^#*/;
                return url.replace(hashStrip, '');
            };

            KendoHistoryProxy.prototype.start = function () {
                this.router.start();
            };

            KendoHistoryProxy.prototype.location = function () {
                return this._location;
            };

            KendoHistoryProxy.prototype.navigate = function (route) {
                this.router.navigate(route);
            };

            KendoHistoryProxy.prototype.register = function (route, callback) {
                this.router.route(route, callback);
            };
            return KendoHistoryProxy;
        })();
        History.KendoHistoryProxy = KendoHistoryProxy;

        /** All browser history should be managed throught an instance of this class inside this module */
        var HistoryController = (function () {
            function HistoryController(history, _showWelcomeScreen) {
                if (typeof _showWelcomeScreen === "undefined") { _showWelcomeScreen = true; }
                this.history = history;
                this._showWelcomeScreen = _showWelcomeScreen;
                this.door = new Knockout.Door();
                this._silent = false;
                this._firstRoute = true;
                this._beforeWakeCallback = new Common.DelayedCallbacks();
                this._mustReload = false;
                /** this is used to syncronize executing the callback on the navigateSilent method */
                this._routeCallback = null;
                this._current = history.location();
            }
            /** adds a callback that will be executed before waking up the application */
            HistoryController.prototype.beforeWake = function (handler) {
                return this._beforeWakeCallback.add(handler);
            };

            HistoryController.prototype.start = function () {
                this.history.start();
            };

            HistoryController.prototype.location = function () {
                return this._current;
            };

            HistoryController.prototype.addGuardian = function (guardian) {
                this.door.add(guardian);
            };

            /** Navigates away from the page */
            HistoryController.prototype.navigate = function (route) {
                // console.log('requested route', route);
                this.history.navigate(route);
            };

            /** navigates to the requested route and returns a promise that is resolved once
            the route callback is executed.  */
            HistoryController.prototype.navigateSilent = function (route, executeCallback) {
                var _this = this;
                if (typeof executeCallback === "undefined") { executeCallback = true; }
                this._routeCallback = Q.defer();

                if (route != this._current) {
                    // start the navigation if the route is different from the current route
                    this._silent = true;
                    this.navigate(route);

                    return this._routeCallback.promise.then(function (callback) {
                        _this._silent = false;
                        return _this.tryNavigate(route).then(function (canNavigate) {
                            if (canNavigate && executeCallback) {
                                return callback.apply(_this);
                            } else {
                                return true;
                            }
                        });
                    });
                } else {
                    // the route is active
                    return Q(true);
                }
            };

            /** if possible navigates to the specified route, otherwise returns to the previous route,
            this method assumes that the route is already setted on the browser */
            HistoryController.prototype.tryNavigate = function (route) {
                var _this = this;
                return this.door.open(route).then(function () {
                    // the route is accepted, execute corresponding method
                    _this._current = _this.history.location();
                    return Q(true);
                }).fail(function () {
                    // the route isn't accepted, so navigate to the previous path
                    _this.navigate(_this._current);
                    return Q(false);
                });
            };

            /** the page will be reloaded when navigates to the next uri */
            HistoryController.prototype.mustReaload = function () {
                this._mustReload = true;
            };

            HistoryController.prototype.register = function (route, callback) {
                var _this = this;
                var navigated = function () {
                    if (_this._mustReload) {
                        Utils.async(function () {
                            return window.location.reload();
                        });
                        return;
                    }

                    var pathArguments = _.toArray(arguments);

                    // only execute the route if the navigation isn't silent
                    if (!_this._silent) {
                        // only check the navigation if the current path and the navigated path are different
                        if (_this._firstRoute && _this._showWelcomeScreen) {
                            _this.displayLoadingScreen(function () {
                                return callback.apply(_this, pathArguments);
                            });
                        } else if (_this._current != _this.history.location()) {
                            // executed when the URL is changed manually, by writing on the URL bar for example
                            // or clicking back/forward button
                            _this.tryNavigate(_this.history.location()).then(function (canNavigate) {
                                if (canNavigate) {
                                    return callback.apply(_this, pathArguments);
                                }
                            }).done();
                        }

                        // the first route is called using backbone internal methods, that's why that's a special case
                        _this._firstRoute = false;
                    } else {
                        // resolve the callback promise
                        var silentCallback = function () {
                            return callback.apply(_this, pathArguments);
                        };
                        _this._routeCallback.resolve(silentCallback);
                    }
                };

                this.history.register(route, navigated);
            };

            /** displays the loading screen before executing the action and waits for it's
            completition before removing the loading screen */
            HistoryController.prototype.displayLoadingScreen = function (callback) {
                var loadingScreen = $(templates.LoadingScreen()), jigsawRoot = $('#jigsaw-root');

                this._beforeWakeCallback.fire().then(function () {
                    // append the loading screen
                    $('body').append(loadingScreen);
                    //jigsawRoot.hide();
                    //return callback()
                    //.then(() => jigsawRoot.show());
                }).then(function () {
                    return Q.delay(true, 500);
                }).then(function () {
                    return callback();
                }).timeout(25000, 'initial module loading process is taking too long').then(function () {
                    return Q.delay(true, 500);
                }).then(function () {
                    return Knockout.flowStabilizer.start();
                }).finally(function () {
                    // remove the loading screen
                    loadingScreen.remove();

                    delete loadingScreen;
                    delete jigsawRoot;
                }).done();
            };
            return HistoryController;
        })();
        History.HistoryController = HistoryController;

        History.history = new HistoryController(new KendoHistoryProxy());
    })(exports.History || (exports.History = {}));
    var History = exports.History;

    (function (Modules) {
        var ModuleBase = (function () {
            function ModuleBase() {
            }
            ModuleBase.prototype.requiredModules = function () {
                return [];
            };

            ModuleBase.prototype.load = function () {
                return Q(true);
            };

            ModuleBase.prototype.unload = function () {
                return Q(true);
            };
            return ModuleBase;
        })();
        Modules.ModuleBase = ModuleBase;

        var ModuleWithSlavesBase = (function (_super) {
            __extends(ModuleWithSlavesBase, _super);
            function ModuleWithSlavesBase() {
                _super.apply(this, arguments);
                this._slaves = [];
            }
            ModuleWithSlavesBase.prototype.slaveModules = function () {
                return this._slaves;
            };

            ModuleWithSlavesBase.prototype.addSlave = function (m) {
                this._slaves.push(m);
            };

            /** executes the given action as a slave of the current module */
            ModuleWithSlavesBase.prototype.slaveExecute = function (execute) {
                var _this = this;
                this.addSlave({
                    requiredModules: function () {
                        return [_this];
                    },
                    load: execute
                });
            };

            ModuleWithSlavesBase.prototype.slaveExecuteOneTime = function (execute) {
                var executed = false;
                this.slaveExecute(function () {
                    if (!executed) {
                        executed = true;
                        return execute();
                    }
                    return Q(true);
                });
            };
            return ModuleWithSlavesBase;
        })(ModuleBase);
        Modules.ModuleWithSlavesBase = ModuleWithSlavesBase;

        function scheduleModuleLoading(target, loadedModules) {
            if (typeof loadedModules === "undefined") { loadedModules = []; }
            var modules = new Common.Dict();

            function schedule(target) {
                if (!target) {
                    // ignore null dependencies, for convenience
                    return Q(true);
                } else if (modules.contains(target)) {
                    // if the module has been scheduled for loading then return that promise
                    return modules.get(target);
                } else if (_.contains(loadedModules, target)) {
                    modules.add(target, Q(true));

                    // if the module is already loaded then mark it on the modules collection
                    // and return a resolved promise. Also ensure all it's dependencies are loaded
                    // and on the dictionary
                    _.forEach(target.requiredModules(), function (m) {
                        return schedule(m);
                    });
                    if (target.slaveModules) {
                        _.forEach(target.slaveModules(), function (m) {
                            return schedule(m);
                        });
                    }

                    return modules.get(target);
                } else {
                    //console.log('scheduled loading of', target);
                    // else - schedule module loading after having loaded all it's required modules
                    var requiredModules = target.requiredModules(), beforePromises = _.map(requiredModules, function (m) {
                        return schedule(m);
                    }), promise = Q.all(beforePromises).then(function () {
                        return target.load();
                    });

                    modules.add(target, promise);

                    if (target.slaveModules) {
                        return promise.then(function () {
                            // load slave modules, these doesn't need to be part of the loading tree
                            var slaves = target.slaveModules(), afterPromises = _.map(slaves, function (m) {
                                return schedule(m);
                            });

                            return Q.all(afterPromises);
                        });
                    }

                    return promise;
                }
            }

            return schedule(target).then(function () {
                return modules.keys();
            });
        }

        var FakeModule = (function (_super) {
            __extends(FakeModule, _super);
            function FakeModule(_requiredModules) {
                _super.call(this);
                this._requiredModules = _requiredModules;
            }
            FakeModule.prototype.requiredModules = function () {
                return this._requiredModules;
            };
            return FakeModule;
        })(ModuleBase);

        var ModuleManager = (function () {
            function ModuleManager(history) {
                var _this = this;
                this._isLoading = false;
                this._loadedModules = [];
                /** contains the head modules that trigered the loading of all other modules.
                New modules can only be loaded if the heads can be unloaded */
                this.heads = [];
                if (history) {
                    history.addGuardian(function () {
                        return _this.canUnloadHeads();
                    });
                }
            }
            Object.defineProperty(ModuleManager.prototype, "isLoading", {
                get: function () {
                    return this._isLoading;
                },
                enumerable: true,
                configurable: true
            });

            /** loads the given module and all it's dependencies and slaves */
            ModuleManager.prototype.load = function () {
                var _this = this;
                var targets = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    targets[_i] = arguments[_i + 0];
                }
                if (this._isLoading) {
                    throw new Error("can't load a module while loading another");
                }
                this._isLoading = true;

                // Create a fake module that depends on the modules that need to be loaded
                var fake = new FakeModule(targets);

                return scheduleModuleLoading(fake, this._loadedModules).then(function (modules) {
                    // unload modules that didn't got loaded
                    var tobeUnloaded = _.filter(_.difference(_this._loadedModules, modules), function (m) {
                        return !!m.unload;
                    }), promises = _.map(tobeUnloaded, function (m) {
                        return m.unload();
                    });

                    return Q.all(promises).then(function () {
                        // be sure not to include the fake module on the currently loaded modules
                        _this._loadedModules = _.without(modules, fake);

                        _this.heads = targets;
                    });
                }).finally(function () {
                    _this._isLoading = false;
                });
            };

            ModuleManager.prototype.canUnloadHeads = function () {
                var filteredHeads = _.filter(this.heads, function (m) {
                    return !!m.canUnload;
                }), promises = _.map(filteredHeads, function (m) {
                    return m.canUnload();
                });

                return Q.all(promises).then(function (results) {
                    if (_.all(results, function (x) {
                        return x;
                    })) {
                        return Q(true);
                    } else {
                        return Q.reject();
                    }
                });
            };

            ModuleManager.prototype.isLoaded = function (target) {
                if (this._isLoading) {
                    throw new Error("can't load a module while loading another");
                }

                return _.contains(this._loadedModules, target);
            };
            return ModuleManager;
        })();
        Modules.ModuleManager = ModuleManager;
    })(exports.Modules || (exports.Modules = {}));
    var Modules = exports.Modules;

    (function (Jigsaw) {
        function updateCache() {
            try  {
                applicationCache.update();
            } catch (e) {
            }
        }
        Jigsaw.updateCache = updateCache;

        //#region CoreModule
        var AppLayout = (function (_super) {
            __extends(AppLayout, _super);
            function AppLayout(viewModel) {
                var _this = this;
                _super.call(this, {
                    template: templates.CoreMain,
                    viewModel: viewModel,
                    regions: {
                        content: "#main-content",
                        active: "#active-content"
                    }
                });

                viewModel.updateTabStripInteraction.handle(function () {
                    return _this.updateTabStrip();
                });
            }
            AppLayout.prototype.domReady = function () {
                _super.prototype.domReady.call(this);

                this.updateTabStrip();
            };

            /** tweaks for the tabStrip to pick up all tabs generated by Knockout during the binding process */
            AppLayout.prototype.updateTabStrip = function () {
                // this should be removed from the viewmodel; maybe create a custom knockout binding
                var tabstrip = this.find('#tabStrip').data('kendoTabStrip');
                if (tabstrip) {
                    tabstrip._updateClasses();
                    tabstrip._updateContentElements();

                    // select the first item if no item is selected
                    if (!tabstrip.select().length) {
                        tabstrip.select(0);

                        // BUG: for some reason on the mobile view the first tab isn't selected without these two calls
                        tabstrip.select(1);
                        tabstrip.select(0);
                    }
                }
            };
            return AppLayout;
        })(Marionette.Layout);
        Jigsaw.AppLayout = AppLayout;

        /** represents the core viewModel.
        This class doesn't inherit from ViewModelBase because ko.applyBindings needs to be applied
        after the view has been added to the DOM */
        var CoreViewModel = (function () {
            function CoreViewModel() {
                this.ribbon = new Ribbon.RibbonSet();
                this.menu = new Ribbon.MenuSet();
                this.quickStart = ko.observableArray();
                this.breadcrumb = new Common.Breadcrumb({ text: 'Home', href: '/#' });
                this.messageQueue = new Messages.InlineMessageQueue();
                /** when true shows an overlay on the entire page */
                this.isBusy = ko.observable(false);
                this.updateTabStripInteraction = new Common.InteractionRequest();
            }
            /** refresh the tabStrip tabs, this is called on the afterAdd parameter of a foreach binding
            on the template */
            CoreViewModel.prototype.updateTabStrip = function () {
                this.updateTabStripInteraction.request();
            };
            return CoreViewModel;
        })();
        Jigsaw.CoreViewModel = CoreViewModel;

        /** this is the base module, all modules should depend on this one as it automatically contains
        references to other modules such as Security, Layout, FullScreen, ... This module doesn't depends
        of any other module */
        var CoreModuleBase = (function (_super) {
            __extends(CoreModuleBase, _super);
            function CoreModuleBase() {
                _super.call(this);
                this.stylesModules = new Theming.ContentStyleSheet(templates.styles);

                this.viewModel = new CoreViewModel();
                this.layout = new AppLayout(this.viewModel);

                this.globalErrorCatching = new GlobalErrorCatching.Module(this.messageQueue, Messages);

                this.jigsawBodyRegion = new Marionette.Region({ element: $("#jigsaw-root") });
            }
            Object.defineProperty(CoreModuleBase.prototype, "isBusy", {
                get: function () {
                    return this.viewModel.isBusy();
                },
                set: function (value) {
                    this.viewModel.isBusy(value);
                },
                enumerable: true,
                configurable: true
            });

            Object.defineProperty(CoreModuleBase.prototype, "ribbon", {
                get: function () {
                    return this.viewModel.ribbon;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(CoreModuleBase.prototype, "menu", {
                get: function () {
                    return this.viewModel.menu;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(CoreModuleBase.prototype, "quickStart", {
                get: function () {
                    return this.viewModel.quickStart;
                },
                enumerable: true,
                configurable: true
            });

            Object.defineProperty(CoreModuleBase.prototype, "breadcrumb", {
                get: function () {
                    return this.viewModel.breadcrumb;
                },
                enumerable: true,
                configurable: true
            });

            Object.defineProperty(CoreModuleBase.prototype, "messageQueue", {
                get: function () {
                    return this.viewModel.messageQueue;
                },
                enumerable: true,
                configurable: true
            });

            Object.defineProperty(CoreModuleBase.prototype, "content", {
                /** main content region */
                get: function () {
                    return this.layout.content;
                },
                enumerable: true,
                configurable: true
            });

            Object.defineProperty(CoreModuleBase.prototype, "active", {
                /** active content region, meant to be used to display details about the currently displayed content */
                get: function () {
                    return this.layout.active;
                },
                enumerable: true,
                configurable: true
            });

            CoreModuleBase.prototype.requiredModules = function () {
                return [this.stylesModules];
            };

            CoreModuleBase.prototype.load = function () {
                return this.jigsawBodyRegion.show(this.layout);
            };

            CoreModuleBase.prototype.unload = function () {
                return Q(true);
            };
            return CoreModuleBase;
        })(Modules.ModuleWithSlavesBase);
        Jigsaw.CoreModuleBase = CoreModuleBase;

        (function (Messages) {
            (function (MessageLevel) {
                MessageLevel[MessageLevel["Error"] = 0] = "Error";
                MessageLevel[MessageLevel["Warning"] = 1] = "Warning";
                MessageLevel[MessageLevel["Success"] = 2] = "Success";
                MessageLevel[MessageLevel["Info"] = 3] = "Info";
            })(Messages.MessageLevel || (Messages.MessageLevel = {}));
            var MessageLevel = Messages.MessageLevel;

            (function (MessageQueueType) {
                MessageQueueType[MessageQueueType["Inline"] = 1] = "Inline";
                MessageQueueType[MessageQueueType["ExtraSmall"] = 2] = "ExtraSmall";
                MessageQueueType[MessageQueueType["Small"] = 3] = "Small";
                MessageQueueType[MessageQueueType["Big"] = 4] = "Big";
            })(Messages.MessageQueueType || (Messages.MessageQueueType = {}));
            var MessageQueueType = Messages.MessageQueueType;

            var InlineMessageQueue = (function () {
                function InlineMessageQueue() {
                    this.messages = ko.observableArray();
                }
                InlineMessageQueue.prototype.add = function (message) {
                    var _this = this;
                    this.messages.push(message);

                    if (message.timeout) {
                        Q.delay(true, message.timeout).then(function () {
                            return _this.remove(message);
                        }).done();
                    }

                    return Q(true);
                };

                InlineMessageQueue.prototype.remove = function (message) {
                    this.messages.remove(message);
                    // delete message;
                };

                InlineMessageQueue.prototype.clear = function () {
                    this.messages.removeAll();
                    return this;
                };
                return InlineMessageQueue;
            })();
            Messages.InlineMessageQueue = InlineMessageQueue;

            function ServerRequestError(status, text) {
                return { title: "Server error " + status, body: text };
            }
            Messages.ServerRequestError = ServerRequestError;

            /** this variable can be used to add new messages and template selector for them */
            Messages.messageTemplateSelector = new Knockout.TemplateSelector(templates.messages.Generic({
                alert: 'alert-info',
                header: 'Info!'
            }));
            Messages.messageTemplateSelector.candidate(templates.messages.Generic({
                alert: 'alert-warning',
                header: 'Warning!'
            }), function (x) {
                return x.level === 1 /* Warning */;
            });
            Messages.messageTemplateSelector.candidate(templates.messages.Generic({
                alert: 'alert-success',
                header: 'Success!'
            }), function (x) {
                return x.level === 2 /* Success */;
            });
            Messages.messageTemplateSelector.candidate(templates.messages.Error(), function (x) {
                return x.level === 0 /* Error */;
            });

            ko.bindingHandlers['messageQueue'] = {
                init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var $element = $(element), model = ko.unwrap(valueAccessor()), context = bindingContext.createChildContext(model);

                    // append the template to the element
                    $element.addClass('messageQueue');

                    ko.applyBindingsToNode(element, {
                        template: {
                            name: function (x) {
                                return Messages.messageTemplateSelector.select(x);
                            },
                            foreach: model.messages,
                            templateEngine: Knockout.StringTemplateEngine,
                            afterRender: function () {
                                return Common.triggerResize($element);
                            },
                            beforeRemove: function (node) {
                                $(node).remove();
                                Common.triggerResize($element);
                            }
                        }
                    }, context);

                    return { controlsDescendantBindings: true };
                }
            };

            var boxOptions;
            (function (boxOptions) {
                var error = {
                    color: "#C46A69",
                    icon: "fa fa-warning shake animated"
                }, info = {
                    color: "#3276B1",
                    icon: "fa fa-bell swing animated"
                }, warning = {
                    color: "#C79121",
                    icon: "fa fa-shield fadeInLeft animated"
                }, success = {
                    color: "#739E73",
                    icon: "fa fa-check"
                };

                function colorFor(level) {
                    switch (level) {
                        case 0 /* Error */:
                            return error.color;
                        case 3 /* Info */:
                            return info.color;
                        case 1 /* Warning */:
                            return warning.color;
                        case 2 /* Success */:
                            return success.color;
                    }
                }
                boxOptions.colorFor = colorFor;

                function iconFor(level) {
                    switch (level) {
                        case 0 /* Error */:
                            return error.icon;
                        case 3 /* Info */:
                            return info.icon;
                        case 1 /* Warning */:
                            return warning.icon;
                        case 2 /* Success */:
                            return success.icon;
                    }
                }
                boxOptions.iconFor = iconFor;
            })(boxOptions || (boxOptions = {}));

            /** displays smart-admin big box */
            function bigBox(options) {
                var result = Q.defer();

                $.bigBox({
                    title: options.title,
                    content: options.body,
                    color: boxOptions.colorFor(options.level),
                    icon: boxOptions.iconFor(options.level),
                    timeout: options.timeout
                }, function () {
                    return result.resolve(true);
                });

                return result.promise;
            }
            Messages.bigBox = bigBox;

            /** displays smart-admin small box */
            function smallBox(options) {
                var result = Q.defer();

                $.smallBox({
                    title: options.title,
                    content: options.body,
                    color: boxOptions.colorFor(options.level),
                    icon: boxOptions.iconFor(options.level),
                    timeout: options.timeout
                }, function () {
                    return result.resolve(true);
                });

                return result.promise;
            }
            Messages.smallBox = smallBox;

            /** displays smart-admin small box */
            function extraSmallBox(options) {
                var result = Q.defer();

                $.smallBox({
                    title: options.title,
                    content: options.body,
                    color: boxOptions.colorFor(options.level),
                    iconSmall: boxOptions.iconFor(options.level),
                    timeout: options.timeout
                }, function () {
                    return result.resolve(true);
                });

                return result.promise;
            }
            Messages.extraSmallBox = extraSmallBox;

            var SmallBoxMessageQueue = (function () {
                function SmallBoxMessageQueue() {
                }
                SmallBoxMessageQueue.prototype.add = function (message) {
                    return smallBox(message);
                };

                SmallBoxMessageQueue.prototype.remove = function (message) {
                };

                SmallBoxMessageQueue.prototype.clear = function () {
                    $('#divSmallBoxes').children().remove();
                    return this;
                };
                return SmallBoxMessageQueue;
            })();
            Messages.SmallBoxMessageQueue = SmallBoxMessageQueue;

            var SmallBoxPrevNextMessageQueue = (function (_super) {
                __extends(SmallBoxPrevNextMessageQueue, _super);
                function SmallBoxPrevNextMessageQueue() {
                    _super.apply(this, arguments);
                }
                //message: JumpToMultipleResultsMessage
                SmallBoxPrevNextMessageQueue.prototype.add = function (message) {
                    var _this = this;
                    var result = _super.prototype.add.call(this, message);

                    $("#prev").bind('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        message.findPrev();
                    });

                    $("#next").bind('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        message.findNext();
                    });

                    result.then(function () {
                        return _this._removeListeners();
                    });

                    return result;
                };

                SmallBoxPrevNextMessageQueue.prototype.remove = function (message) {
                };

                SmallBoxPrevNextMessageQueue.prototype.clear = function () {
                    this._removeListeners();
                    return _super.prototype.clear.call(this);
                };

                SmallBoxPrevNextMessageQueue.prototype._removeListeners = function () {
                    $("#prev").unbind('click');
                    $("#next").unbind('click');
                };
                return SmallBoxPrevNextMessageQueue;
            })(SmallBoxMessageQueue);
            Messages.SmallBoxPrevNextMessageQueue = SmallBoxPrevNextMessageQueue;

            var ExtraSmallBoxMessageQueue = (function () {
                function ExtraSmallBoxMessageQueue() {
                }
                ExtraSmallBoxMessageQueue.prototype.add = function (message) {
                    return extraSmallBox(message);
                };

                ExtraSmallBoxMessageQueue.prototype.remove = function (message) {
                };

                ExtraSmallBoxMessageQueue.prototype.clear = function () {
                    $('#divSmallBoxes').children().remove();
                    return this;
                };
                return ExtraSmallBoxMessageQueue;
            })();
            Messages.ExtraSmallBoxMessageQueue = ExtraSmallBoxMessageQueue;

            var BigBoxMessageQueue = (function () {
                function BigBoxMessageQueue() {
                }
                BigBoxMessageQueue.prototype.add = function (message) {
                    return bigBox(message);
                };

                BigBoxMessageQueue.prototype.remove = function (message) {
                };

                BigBoxMessageQueue.prototype.clear = function () {
                    return this;
                };
                return BigBoxMessageQueue;
            })();
            Messages.BigBoxMessageQueue = BigBoxMessageQueue;

            function createMessageQueue(type) {
                switch (type) {
                    case 2 /* ExtraSmall */:
                        return new ExtraSmallBoxMessageQueue();
                    case 3 /* Small */:
                        return new SmallBoxMessageQueue();
                    case 4 /* Big */:
                        return new BigBoxMessageQueue();
                    default:
                        return new InlineMessageQueue();
                }
            }
            Messages.createMessageQueue = createMessageQueue;
        })(Jigsaw.Messages || (Jigsaw.Messages = {}));
        var Messages = Jigsaw.Messages;

        (function (Ribbon) {
            var RibbonGroup = (function (_super) {
                __extends(RibbonGroup, _super);
                function RibbonGroup(header) {
                    _super.call(this);
                    this.header = header;
                }
                return RibbonGroup;
            })(Common.PrioritySet);
            Ribbon.RibbonGroup = RibbonGroup;

            var RibbonTab = (function (_super) {
                __extends(RibbonTab, _super);
                function RibbonTab(header) {
                    _super.call(this);
                    this.header = header;
                }
                RibbonTab.prototype.filterItems = function (x) {
                    return x.length > 0;
                };

                /** returns the group with the specified header if exist, otherwise creates a new group with
                the specified header and priority */
                RibbonTab.prototype.group = function (header, priority) {
                    if (typeof priority === "undefined") { priority = 0; }
                    var group = _.find(this.items(), function (x) {
                        return x.header === header;
                    });
                    if (!group) {
                        group = new RibbonGroup(header);
                        this.add(group, priority);
                    }
                    return group;
                };
                return RibbonTab;
            })(Common.PrioritySet);
            Ribbon.RibbonTab = RibbonTab;

            /** collection to store the tabs for a ribbon bar, this is the top level object */
            var RibbonSet = (function (_super) {
                __extends(RibbonSet, _super);
                function RibbonSet() {
                    _super.apply(this, arguments);
                }
                RibbonSet.prototype.filterItems = function (x) {
                    return _.any(x.items(), function (group) {
                        return group.length > 0;
                    });
                };

                /** returns the tab with the specified header if exist, otherwise creates a new tab with
                the specified header and priority */
                RibbonSet.prototype.tab = function (header, priority) {
                    if (typeof priority === "undefined") { priority = 0; }
                    var tab = _.find(this.items(), function (x) {
                        return x.header === header;
                    });
                    if (!tab) {
                        tab = new RibbonTab(header);
                        this.add(tab, priority);
                    }
                    return tab;
                };
                return RibbonSet;
            })(Common.PrioritySet);
            Ribbon.RibbonSet = RibbonSet;

            var RibbonButton = (function () {
                function RibbonButton(text, content, description, cssClass) {
                    if (typeof text === "undefined") { text = ""; }
                    if (typeof content === "undefined") { content = function () {
                    }; }
                    if (typeof description === "undefined") { description = ""; }
                    if (typeof cssClass === "undefined") { cssClass = ""; }
                    this.text = text;
                    this.content = content;
                    this.description = description;
                    this.cssClass = cssClass;
                }
                return RibbonButton;
            })();
            Ribbon.RibbonButton = RibbonButton;

            var RibbonSelect = (function () {
                function RibbonSelect(text, options, selected, description, cssClass) {
                    if (typeof text === "undefined") { text = ""; }
                    if (typeof options === "undefined") { options = []; }
                    if (typeof description === "undefined") { description = ""; }
                    if (typeof cssClass === "undefined") { cssClass = ""; }
                    this.text = text;
                    this.options = options;
                    this.selected = selected;
                    this.description = description;
                    this.cssClass = cssClass;
                    if (!this.selected && this.options.length > 0) {
                        this.selected = options[0];
                    }
                }
                return RibbonSelect;
            })();
            Ribbon.RibbonSelect = RibbonSelect;

            Ribbon.ribbonItemTemplateSelector = Knockout.makeForeachWithTemplateSelector('foreachRibbonItem', templates.ribbon.Button());
            Ribbon.ribbonItemTemplateSelector.candidate(templates.ribbon.Select(), function (x) {
                return x instanceof RibbonSelect;
            });

            var MenuSet = (function (_super) {
                __extends(MenuSet, _super);
                function MenuSet() {
                    _super.call(this, "");
                }
                return MenuSet;
            })(RibbonTab);
            Ribbon.MenuSet = MenuSet;

            Ribbon.ribbonQuickStartTemplateSelector = Knockout.makeForeachWithTemplateSelector('foreachRibbonQuickStart');

            var RibbonItemModule = (function (_super) {
                __extends(RibbonItemModule, _super);
                function RibbonItemModule(options) {
                    _super.call(this);
                    this.options = options;
                    this.storage = new Common.PrioritySet();

                    this.storage.addAll(options.items, options.priority);
                }
                /** adds a new ribbon item */
                RibbonItemModule.prototype.add = function (item, priority) {
                    if (typeof priority === "undefined") { priority = 0; }
                    this.storage.add(item, priority);
                };

                RibbonItemModule.prototype.unload = function () {
                    this._ribbonDisposable.dispose();

                    return _super.prototype.unload.call(this);
                };

                RibbonItemModule.prototype.load = function () {
                    this._ribbonDisposable = this.options.coreModule.ribbon.tab(this.options.tab.header, this.options.tab.priority).group(this.options.group.header, this.options.group.priority).addAll(this.storage.items(), this.options.priority);

                    return _super.prototype.load.call(this);
                };
                return RibbonItemModule;
            })(Modules.ModuleBase);
            Ribbon.RibbonItemModule = RibbonItemModule;
        })(Jigsaw.Ribbon || (Jigsaw.Ribbon = {}));
        var Ribbon = Jigsaw.Ribbon;

        (function (Theming) {
            var ContentStyleSheet = (function (_super) {
                __extends(ContentStyleSheet, _super);
                function ContentStyleSheet(content) {
                    _super.call(this);
                    this.content = content;
                }
                ContentStyleSheet.prototype.unload = function () {
                    if (this._element) {
                        this._element.remove();
                        delete this._element;
                    }
                    return _super.prototype.unload.call(this);
                };

                ContentStyleSheet.prototype.load = function () {
                    if (this.content) {
                        this._element = $("<style>").html(this.content).appendTo("head");
                    }
                    return _super.prototype.load.call(this);
                };
                return ContentStyleSheet;
            })(Modules.ModuleBase);
            Theming.ContentStyleSheet = ContentStyleSheet;

            var StyleSheet = (function (_super) {
                __extends(StyleSheet, _super);
                function StyleSheet(path, async) {
                    if (typeof async === "undefined") { async = false; }
                    _super.call(this);
                    this.path = path;
                    this.async = async;
                }
                StyleSheet.prototype.unload = function () {
                    if (this._element) {
                        this._element.remove();
                        delete this._element;
                    }
                    return _super.prototype.unload.call(this);
                };

                StyleSheet.prototype.load = function () {
                    var _this = this;
                    if (this.async) {
                        Utils.loadStylesheet(this.path);
                        return Q(true);
                    }

                    return ajax.get(this.path).then(function (content) {
                        _this._element = $("<style>").html(content).appendTo("head");
                        return true;
                    });
                };
                return StyleSheet;
            })(Modules.ModuleBase);
            Theming.StyleSheet = StyleSheet;

            var Theme = (function (_super) {
                __extends(Theme, _super);
                function Theme(name, styles) {
                    _super.call(this);
                    this.name = name;

                    this._styles = _.map(styles, function (path) {
                        return new StyleSheet(path, true);
                    });
                }
                /** overwrite this module to run any custom JS code when the module is being loaded */
                Theme.prototype.initialize = function () {
                };

                Theme.prototype.unload = function () {
                    // unload all resources used by this theme
                    _.forEach(this._styles, function (element) {
                        return element.unload();
                    });

                    return _super.prototype.unload.call(this);
                };

                Theme.prototype.load = function () {
                    var _this = this;
                    return Q.fcall(function () {
                        var promises = _.map(_this._styles, function (style) {
                            return style.load();
                        });
                        return Q.all(promises);
                    });
                };
                return Theme;
            })(Modules.ModuleBase);
            Theming.Theme = Theme;

            function addCantSwitchTemeBecauseOfflineMessage(coreModule) {
                coreModule.messageQueue.add({ title: "Offline", body: "The current theme can't be switched if offline. Try it later.", level: 0 /* Error */ });
            }

            var ThemeManager = (function (_super) {
                __extends(ThemeManager, _super);
                function ThemeManager(coreModule, accountModule) {
                    var _this = this;
                    _super.call(this);
                    this.coreModule = coreModule;
                    this.accountModule = accountModule;
                    this.themes = ko.observableArray();

                    this.selectedTheme = ko.guarded();
                    this.selectedTheme.guard(function (theme) {
                        return _this.load(theme).fail(function () {
                            addCantSwitchTemeBecauseOfflineMessage(coreModule);
                            return Q.reject();
                        });
                    });

                    this.selectedThemeName = ko.computed({
                        read: function () {
                            return _this.selectedTheme() && _this.selectedTheme().name;
                        },
                        write: function (name) {
                            var theme = _this.getTheme(name);
                            if (theme) {
                                _this.selectedTheme(theme);
                            } else {
                                throw new Error("Unknown theme name specified");
                            }
                        }
                    });
                }
                /** returns the theme with the given name */
                ThemeManager.prototype.getTheme = function (name) {
                    return _.find(this.themes(), function (theme) {
                        return theme.name === name;
                    });
                };

                ThemeManager.prototype.register = function () {
                    var themes = [];
                    for (var _i = 0; _i < (arguments.length - 0); _i++) {
                        themes[_i] = arguments[_i + 0];
                    }
                    this.themes.push.apply(this.themes, themes);
                };

                ThemeManager.prototype.initialize = function () {
                    var _this = this;
                    // update current theme every time the theme preferences changes
                    this.accountModule.userState.subscribe(function () {
                        _this.selectedThemeName(_this.accountModule.getPreference("Theme"));
                        Jigsaw.updateCache();
                    });

                    // change user preferences every time the current theme changes
                    this.selectedThemeName.subscribe(function (theme) {
                        _this.accountModule.setPreferences({ Theme: theme });
                    });

                    var initialTheme = this.accountModule.getPreference("Theme");

                    return this.selectedTheme.inject(this.getTheme(initialTheme));
                };
                return ThemeManager;
            })(Modules.ModuleManager);
            Theming.ThemeManager = ThemeManager;

            function loadThemes(themeManager) {
                var themes = _.map(JigsawConfig.Themes, function (theme) {
                    return new Theme(theme.Name, theme.Styles);
                });
                _.forEach(themes, function (theme) {
                    return themeManager.register(theme);
                });
            }
            Theming.loadThemes = loadThemes;
        })(Jigsaw.Theming || (Jigsaw.Theming = {}));
        var Theming = Jigsaw.Theming;

        (function (Account) {
            function encript(data) {
                // TODO add some encryption algorithm, possibly MD5 to store passwords on the client
                return data;
            }
            Account.encript = encript;

            var AccountViewModel = (function (_super) {
                __extends(AccountViewModel, _super);
                function AccountViewModel() {
                    var _this = this;
                    _super.call(this);
                    this.dataSubmited = $.Callbacks();
                    this.messageQueue = new Messages.SmallBoxMessageQueue();
                    this.user = ko.observable("");
                    this.password = ko.observable("");
                    this.processingForm = ko.observable(false);

                    // remove all custom errors when some of the fields is changed
                    this.user.subscribe(function () {
                        return _this.messageQueue.clear();
                    });
                    this.password.subscribe(function () {
                        return _this.messageQueue.clear();
                    });
                }
                /** this is called trought a knockout binding, see submit binding docs */
                AccountViewModel.prototype.submitForm = function (formElement) {
                    if (this.processingForm())
                        return false;

                    this.processingForm(true);
                    var data = $(formElement).serialize();
                    this.dataSubmited.fire(data);

                    // cancel the default form action
                    return false;
                };

                AccountViewModel.prototype.resetForm = function () {
                    this.password("");
                    this.messageQueue.clear();
                    this.processingForm(false);
                };

                /** returns an encripted value that identifies the current user and password */
                AccountViewModel.prototype.userKey = function () {
                    var data = this.user() + " - " + this.password();
                    return encript(data);
                };
                return AccountViewModel;
            })(Common.ViewModelBase);

            (function (UserState) {
                UserState[UserState["None"] = 0] = "None";
                UserState[UserState["Present"] = 1] = "Present";
                UserState[UserState["Dimmed"] = 2] = "Dimmed";
            })(Account.UserState || (Account.UserState = {}));
            var UserState = Account.UserState;

            var UserPreferences = (function () {
                function UserPreferences(url, storageKey) {
                    if (typeof url === "undefined") { url = "preferences"; }
                    if (typeof storageKey === "undefined") { storageKey = "preferences"; }
                    this.url = url;
                    this.storageKey = storageKey;
                    this.values = {
                        Theme: typeof JigsawConfig != 'undefined' ? JigsawConfig.DefaultTheme : ''
                    };
                    var value = localStorage.getItem(storageKey);
                    if (value) {
                        this.set(JSON.parse(value));
                    }
                }
                UserPreferences.prototype.get = function (key) {
                    return this.values[key];
                };

                UserPreferences.prototype.set = function (preferences) {
                    _.extend(this.values, preferences);
                    localStorage.setItem(this.storageKey, JSON.stringify(this.values));
                };

                /** Stores all the attributes on the server */
                UserPreferences.prototype.save = function () {
                    return $.post(this.url, this.values);
                };
                return UserPreferences;
            })();
            Account.UserPreferences = UserPreferences;

            function showCantLogInBecauseOfflineMessage(coreModule) {
                coreModule.messageQueue.add({
                    title: "Error",
                    body: "can't login because the application is offline.",
                    level: 0 /* Error */
                });
            }

            var userAutorized = JigsawConfig.InitialUserAutorized, userState = ko.observable(userAutorized ? 2 /* Dimmed */ : 0 /* None */), previousUserName = ko.observable("").extend({ persist: "previousUserName" }), userKey = ko.observable("").extend({ persist: "userKey" }), preferences = new UserPreferences("/Account/Preferences"), sessionFinalizers = [];

            function logout() {
                return Q.all(sessionFinalizers).then(function () {
                    return Q($.post('/Account/LogOff', preferences.values));
                }).then(function (result) {
                    if (result.success) {
                        userKey(""); // clear user key
                        userState(0 /* None */);
                    } else {
                        throw new Error("can't logout because server error");
                    }
                }).fail(function () {
                    // the application is offline, so the current user can't be logged out
                    // simulate this by putting the user in a dimmed state
                    userState(2 /* Dimmed */);
                });
            }

            function login(viewModel, formData, addFinalizerCallbacks) {
                return ajax.post('/Account/Login/?' + formData).then(function (data) {
                    if (data.success) {
                        // store current user key
                        userKey(viewModel.userKey());

                        // fire finalizers callbacks to allow modules to clear up things when the session
                        // is going to be terminated
                        sessionFinalizers.splice(0, sessionFinalizers.length);
                        addFinalizerCallbacks.fire(function (promise) {
                            return sessionFinalizers.push(promise);
                        });

                        // update preferences
                        preferences.set(data.preferences);

                        userState(1 /* Present */);
                    } else {
                        viewModel.resetForm();
                        viewModel.messageQueue.add({ title: "Something went wrong", body: data.errors, level: 0 /* Error */ });
                    }
                });
            }

            function showDialog(addFinalizerCallbacks, coreModule) {
                // mark the UI as busy while the template is loading
                coreModule.isBusy = true;

                /** request the template for the account window content, this is requested every time
                to get the AntiforgeryToken */
                ajax.get("/Account/Login").then(function (template) {
                    coreModule.isBusy = false;

                    // create a new window and show it
                    var viewModel = new AccountViewModel(), view = new Marionette.View({ template: function () {
                            return template;
                        }, viewModel: viewModel }), window = new Views.WindowView(view, { title: "Sign In", resizable: false, actions: [] });

                    viewModel.dataSubmited.add(function (formData) {
                        if (userState() === 2 /* Dimmed */) {
                            // check if the current password is the same as
                            if (viewModel.userKey() === userKey()) {
                                // same user trying to log in again, just switch the current state
                                userState(1 /* Present */);
                                window.close();
                            } else {
                                return logout().then(function () {
                                    return login(viewModel, formData, addFinalizerCallbacks);
                                }).then(function () {
                                    return window.close();
                                });
                            }
                        } else if (userState() === 0 /* None */) {
                            return login(viewModel, formData, addFinalizerCallbacks).then(function () {
                                return window.close();
                            });
                        }
                    });

                    // this promise is never resolved, however it fails if the cancel button is clicked
                    return window.showDialog();
                }).fail(function (error) {
                    // if the trmplate request fails then we need to show an offline version of
                    // the login form
                    coreModule.isBusy = false;

                    if (!error) {
                        // the dialog was cancelled, then there's no error => do nothing
                    } else if (userState() === 2 /* Dimmed */) {
                        // create a new window and show it using the offline loginform template
                        var viewModel = new AccountViewModel(), view = new Marionette.View({ template: templates.LoginForm, viewModel: viewModel }), window = new Views.WindowView(view, { title: "Sign In", resizable: false, actions: [] });

                        viewModel.dataSubmited.add(function (formData) {
                            // check if the current password is the same as
                            if (viewModel.userKey() === userKey()) {
                                // same user trying to log in again, just switch the current state
                                userState(1 /* Present */);
                                window.close();
                            } else {
                                // there's no conection and it isn't the same user
                                viewModel.resetForm();
                                viewModel.messageQueue.add({
                                    title: "Error",
                                    body: "Jigsaw is currently blocked and offline and only the previous user can unblock it.",
                                    level: 0 /* Error */
                                });
                            }
                        });

                        return window.showDialog();
                    } else if (error.status === 0) {
                        showCantLogInBecauseOfflineMessage(coreModule);
                    } else {
                        coreModule.messageQueue.add({
                            title: error.status + " " + error.statusText,
                            body: "Server error... try again later.",
                            level: 0 /* Error */
                        });
                    }
                });
            }

            var AccountModule = (function (_super) {
                __extends(AccountModule, _super);
                function AccountModule(coreModule) {
                    var _this = this;
                    _super.call(this);
                    this.coreModule = coreModule;
                    /** only allow read-only access to the user state variable, the real one will be hidden on the scopes */
                    this.userState = ko.computed(function () {
                        return userState();
                    });
                    /** Notifies listeners when the user logs in, the state goes from: None -> Present */
                    this.loggedIn = $.Callbacks();
                    this._addRibbonButton();

                    // when the idle timeout passes, show the login dialog and DIM the current user
                    Utils.runIdle($(document), 1 * 60000, function () {
                        if (_this.userState() === 1 /* Present */) {
                            // check if there's an user present and simulate user log out
                            userState(2 /* Dimmed */);
                            showDialog(_this.loggedIn, _this.coreModule);
                        }
                    }, 60000);
                }
                AccountModule.prototype.getPreference = function (key) {
                    return preferences.get(key);
                };

                AccountModule.prototype.setPreferences = function (attributes) {
                    preferences.set(attributes);
                };

                AccountModule.prototype._addRibbonButton = function () {
                    var _this = this;
                    var buttonText = ko.computed(function () {
                        return _this.userState() === 1 /* Present */ ? "Sign out" : "Sign in";
                    });

                    this.coreModule.ribbon.tab("Users").group("Security", 60).add(new Ribbon.RibbonButton(buttonText, function () {
                        return _this.ribbonButtonClicked();
                    }, "Click to Sign in/out from the application", "fa fa-group"), 1);
                };

                AccountModule.prototype.ribbonButtonClicked = function () {
                    if (userState() === 1 /* Present */) {
                        logout();
                    } else {
                        showDialog(this.loggedIn, this.coreModule);
                    }
                };
                return AccountModule;
            })(Modules.ModuleBase);
            Account.AccountModule = AccountModule;

            // shows a tooltip if capsLock is pressed onkeydown
            ko.bindingHandlers['capsLockWarning'] = {
                init: function (element, valueAccessor) {
                    // Initially set the element to be instantly vi
                    var tooltip = new kendo.ui.Tooltip(element, {
                        autoHide: true,
                        position: "bottom",
                        showOn: "none",
                        content: "Caps lock is active"
                    }), keypressEventHandler = function (e) {
                        if (Utils.capsLockOn(e)) {
                            tooltip.show($(element));
                        } else {
                            tooltip.hide();
                        }
                    };

                    $(element).keypress(keypressEventHandler);

                    // if the HTML element is cleaned then remove the subscription
                    ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                        $(element).unbind('keypress', keypressEventHandler);
                    });
                }
            };
        })(Jigsaw.Account || (Jigsaw.Account = {}));
        var Account = Jigsaw.Account;

        (function (Sync) {
            

            var SyncManager = (function () {
                function SyncManager() {
                    var _this = this;
                    this.syncs = ko.observableArray();
                    /** returns true while changes are being synced to the server */
                    this.syncingChanges = ko.observable(false);
                    this.pendingChanges = ko.computed(function () {
                        return _.union.apply(_, _.map(_this.syncs(), function (s) {
                            return s.pending();
                        }));
                    });

                    // 5 seconds after the application started, check if there's some pending changes
                    // and schedule a sync operation if the app is online
                    setTimeout(function () {
                        if (_this.pendingChanges().length > 0) {
                            ajax.connection.online().then(function () {
                                return _this.sync();
                            }).done();
                        }
                    }, 5000);

                    var previousOnlineValue = ajax.connection.isOnline();
                    this.subscription = ajax.connection.isOnline.subscribe(function (online) {
                        if (!previousOnlineValue && online) {
                            // there just was a transition from false => true
                            // the application just reconnected, so sync all pending changes if any
                            if (_this.pendingChanges().length > 0) {
                                _this.sync().done();
                            }
                        }
                        previousOnlineValue = online;
                    });
                }
                SyncManager.prototype.dispose = function () {
                    this.subscription.dispose();
                    this.pendingChanges.dispose();
                };

                SyncManager.prototype.register = function (synchronizable) {
                    this.syncs.push(synchronizable);
                };

                SyncManager.prototype.sync = function () {
                    var _this = this;
                    this.syncingChanges(true);
                    return ajax.connection.online(true).then(function (online) {
                        if (online) {
                            return Q.all(_.map(_this.syncs(), function (s) {
                                return s.sync();
                            })).then(function () {
                                _this.syncingChanges(false);
                                return true;
                            });
                        } else {
                            _this.syncingChanges(false);
                            return Q(false);
                        }
                    });
                };
                return SyncManager;
            })();
            Sync.SyncManager = SyncManager;

            var QuickStartNotification = (function () {
                function QuickStartNotification(syncManager) {
                    this.syncManager = syncManager;
                    this.online = ko.computed(function () {
                        return ajax.connection.isOnline();
                    });
                    this.pendingChangesCount = ko.computed(function () {
                        return syncManager.pendingChanges().length;
                    });
                }
                QuickStartNotification.prototype.sync = function () {
                    return this.syncManager.sync();
                };
                return QuickStartNotification;
            })();
            Sync.QuickStartNotification = QuickStartNotification;
            Ribbon.ribbonQuickStartTemplateSelector.candidate(templates.notification.SyncPendingChanges(), function (x) {
                return x instanceof QuickStartNotification;
            });

            var SyncModule = (function (_super) {
                __extends(SyncModule, _super);
                function SyncModule(coreModule) {
                    _super.call(this);
                    this._syncManager = new SyncManager();

                    // load this module alongside with the core module, as it will display an icon
                    // on the quick start
                    //coreModule.addSlave(this);
                    coreModule.quickStart.push(new QuickStartNotification(this._syncManager));
                }
                SyncModule.prototype.register = function (synchronizable) {
                    this._syncManager.register(synchronizable);
                };
                return SyncModule;
            })(Modules.ModuleBase);
            Sync.SyncModule = SyncModule;
        })(Jigsaw.Sync || (Jigsaw.Sync = {}));
        var Sync = Jigsaw.Sync;

        (function (Notifications) {
            /** corresponds to the type Jigsaw.Data.Notification.NotificationLevel from the server */
            (function (NotificationLevel) {
                NotificationLevel[NotificationLevel["Success"] = 0] = "Success";
                NotificationLevel[NotificationLevel["Warning"] = 1] = "Warning";
                NotificationLevel[NotificationLevel["Error"] = 2] = "Error";
            })(Notifications.NotificationLevel || (Notifications.NotificationLevel = {}));
            var NotificationLevel = Notifications.NotificationLevel;

            

            var NotificationSetCollection = (function (_super) {
                __extends(NotificationSetCollection, _super);
                function NotificationSetCollection(owner) {
                    _super.call(this);
                    this.owner = owner;
                }
                NotificationSetCollection.prototype.belongsTo = function (item) {
                    return item.Owner === this.owner;
                };
                return NotificationSetCollection;
            })(Collection.SetCollection);
            Notifications.NotificationSetCollection = NotificationSetCollection;

            var NOTIFICATIONTIMEOUT = 60000;

            /** base multiset for all notifications. Using multi-sets may be over-kill for this
            use case, it could also be solved with a simple ObservableArray. The only advantage
            of using Multisets it to allow the client to control some notifications in some way
            but that isn't a requeriment... only pending changes on the mobile offline mode
            could benefit from this feature */
            var NotificationMultiset = (function (_super) {
                __extends(NotificationMultiset, _super);
                function NotificationMultiset() {
                    var _this = this;
                    _super.call(this, true);

                    // todo notifications should dissapear after a setted time
                    this._intervalId = setInterval(function () {
                        var now = new Date();
                        var itemsToRemove = _.filter(_this.items(), function (x) {
                            return now.getTime() - x.TimeStamp.getTime() > NOTIFICATIONTIMEOUT;
                        });
                        _.each(itemsToRemove, function (item) {
                            return _this.remove(item);
                        });
                    }, NOTIFICATIONTIMEOUT / 2);
                }
                NotificationMultiset.prototype.mapItems = function (items) {
                    return _.sortBy(items, function (x) {
                        return x.TimeStamp;
                    });
                };

                NotificationMultiset.prototype.dispose = function () {
                    return clearInterval(this._intervalId);
                };
                return NotificationMultiset;
            })(Collection.MultiSetCollection);
            Notifications.NotificationMultiset = NotificationMultiset;

            var LocalNotificationMultiset = (function (_super) {
                __extends(LocalNotificationMultiset, _super);
                function LocalNotificationMultiset() {
                    _super.apply(this, arguments);
                }
                /** updates all notifications from an URL */
                LocalNotificationMultiset.prototype.refresh = function () {
                    // TODO refresh method for notifications
                };

                LocalNotificationMultiset.prototype.belongsTo = function (item) {
                    // check if the notification is from the current user
                    // todo: check the current user name if any user is signed in
                    return item.Author === '';
                };
                return LocalNotificationMultiset;
            })(NotificationMultiset);
            Notifications.LocalNotificationMultiset = LocalNotificationMultiset;

            var GlobalNotificationMultiset = (function (_super) {
                __extends(GlobalNotificationMultiset, _super);
                function GlobalNotificationMultiset() {
                    _super.apply(this, arguments);
                }
                return GlobalNotificationMultiset;
            })(NotificationMultiset);
            Notifications.GlobalNotificationMultiset = GlobalNotificationMultiset;

            /** returns the total number of elements that have been present in the returned array
            that pass the filter */
            function historicalCount(items, filter) {
                var result = ko.observable(Utils.count(items(), filter));

                items.subscribe(function (changes) {
                    var difference = Utils.count(changes, function (x) {
                        return x.status === 'added' && filter(x.value);
                    });
                    result(result() + difference);
                }, null, 'arrayChange');

                return result;
            }
            Notifications.historicalCount = historicalCount;

            var NotificationQuickStartViewModel = (function () {
                function NotificationQuickStartViewModel(storage, isGlobal) {
                    if (typeof isGlobal === "undefined") { isGlobal = false; }
                    this.storage = storage;
                    this.isGlobal = isGlobal;
                    this.showNotificationsEvent = new Common.Event();
                    this.count = historicalCount(this.storage.items, function () {
                        return true;
                    });
                    this.errorCount = historicalCount(this.storage.items, function (n) {
                        return n.Level === 2 /* Error */;
                    });
                    this.warningCount = historicalCount(this.storage.items, function (n) {
                        return n.Level === 1 /* Warning */;
                    });
                    this.successCount = historicalCount(this.storage.items, function (n) {
                        return n.Level === 0 /* Success */;
                    });
                }
                /** fires the showNotifications event */
                NotificationQuickStartViewModel.prototype.showNotifications = function (level) {
                    this.showNotificationsEvent.fire(level);
                };

                /** returns the number of notifications with the passed level */
                NotificationQuickStartViewModel.prototype.countNotificationLevel = function (level) {
                    var result = 0;
                    _.each(this.storage.items(), function (notification) {
                        if (notification.Level === level) {
                            result++;
                        }
                    });
                    return result;
                };

                NotificationQuickStartViewModel.prototype.showNotificationsClick = function (level) {
                    var _this = this;
                    return function () {
                        return _this.showNotifications(level);
                    };
                };
                return NotificationQuickStartViewModel;
            })();
            Notifications.NotificationQuickStartViewModel = NotificationQuickStartViewModel;
            Ribbon.ribbonQuickStartTemplateSelector.candidate(templates.notification.Notification(), function (x) {
                return x instanceof NotificationQuickStartViewModel;
            });

            var RibbonNotificationViewModel = (function () {
                function RibbonNotificationViewModel(gloabalNotifications, localNotifications) {
                    this.gloabalNotifications = gloabalNotifications;
                    this.localNotifications = localNotifications;
                    this.isNotificationPanel = true;
                    this.notifications = ko.computed(function () {
                        return _.sortBy(_.union(gloabalNotifications.items(), localNotifications.items()), function (x) {
                            return x.TimeStamp;
                        });
                    });
                }
                return RibbonNotificationViewModel;
            })();
            Notifications.RibbonNotificationViewModel = RibbonNotificationViewModel;
            Jigsaw.Ribbon.ribbonItemTemplateSelector.candidate(templates.notification.RibbonNotificationPanel(), function (x) {
                return x.isNotificationPanel;
            });

            var NotificationsViewModel = (function () {
                function NotificationsViewModel() {
                    var _this = this;
                    this.local = new NotificationQuickStartViewModel(new LocalNotificationMultiset());
                    this.global = new NotificationQuickStartViewModel(new GlobalNotificationMultiset(), true);
                    this.total = ko.computed(function () {
                        return _this.local.count() + _this.global.count();
                    });
                }
                return NotificationsViewModel;
            })();
            Notifications.NotificationsViewModel = NotificationsViewModel;

            var NotificationsModule = (function (_super) {
                __extends(NotificationsModule, _super);
                function NotificationsModule(coreModule, sidebarModule) {
                    _super.call(this);
                    this.coreModule = coreModule;
                    this.sidebarModule = sidebarModule;
                    this.notifications = new NotificationsViewModel();
                    this.stylesModule = new Theming.ContentStyleSheet(templates.notification.styles);

                    this.setUpSignalR();
                    this.addSidebarNotifications();
                    coreModule.addSlave(this);

                    coreModule.quickStart.push(this.localNotificationsViewModel, this.globalNotificationsViewModel);

                    var ribbonNotification = new RibbonNotificationViewModel(this.globalNotifications, this.localNotifications);

                    coreModule.ribbon.tab("Users").group("", 9999).add(ribbonNotification);
                }
                Object.defineProperty(NotificationsModule.prototype, "localNotificationsViewModel", {
                    get: function () {
                        return this.notifications.local;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(NotificationsModule.prototype, "globalNotificationsViewModel", {
                    get: function () {
                        return this.notifications.global;
                    },
                    enumerable: true,
                    configurable: true
                });

                NotificationsModule.prototype.requiredModules = function () {
                    return [this.coreModule, this.stylesModule];
                };

                Object.defineProperty(NotificationsModule.prototype, "localNotifications", {
                    get: function () {
                        return this.localNotificationsViewModel.storage;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(NotificationsModule.prototype, "globalNotifications", {
                    get: function () {
                        return this.globalNotificationsViewModel.storage;
                    },
                    enumerable: true,
                    configurable: true
                });

                NotificationsModule.prototype.setUpSignalR = function () {
                    var _this = this;
                    var connection = $.connection('notification');
                    connection.received(function (data) {
                        // cast server dateTime string to JS date
                        data.TimeStamp = new Date(data.TimeStamp);

                        if (_this.localNotifications.belongsTo(data)) {
                            _this.localNotifications.add(data);
                        } else {
                            _this.globalNotifications.add(data);
                        }
                    });

                    // start the connection and ensure it's maintained
                    connection.disconnected(function () {
                        setTimeout(function () {
                            connection.start().done();
                        }, 30000);
                    }).start();
                };

                NotificationsModule.prototype.addSidebarNotifications = function () {
                    this.sidebarModule.registerView(new Marionette.View({
                        template: templates.notification.SidebarNotifications,
                        viewModel: this.notifications
                    }), new Marionette.View({
                        template: templates.notification.NotificationsCollapsed,
                        viewModel: this.notifications
                    }));
                };
                return NotificationsModule;
            })(Modules.ModuleBase);
            Notifications.NotificationsModule = NotificationsModule;

            Notifications.notificationTemplate = Knockout.makeTemplateSelector('notificationTemplate', 'untemplated notification');
        })(Jigsaw.Notifications || (Jigsaw.Notifications = {}));
        var Notifications = Jigsaw.Notifications;

        (function (UserSettings) {
            UserSettings.SETTINGSURL = 'user-settings';

            (function (FontSize) {
                FontSize[FontSize["Small"] = 0] = "Small";
                FontSize[FontSize["Medium"] = 1] = "Medium";
                FontSize[FontSize["Large"] = 2] = "Large";
            })(UserSettings.FontSize || (UserSettings.FontSize = {}));
            var FontSize = UserSettings.FontSize;

            /** this is the viewmodel used for the basic user settings */
            var UserSettingsViewModel = (function (_super) {
                __extends(UserSettingsViewModel, _super);
                function UserSettingsViewModel() {
                    _super.call(this);

                    this.fontSize = ko.observable(1 /* Medium */).extend({ persist: "fontSize" });
                    this.fontSize.subscribe(function (size) {
                        $('body').toggleClass('font-small', size === 0 /* Small */).toggleClass('font-medium', size === 1 /* Medium */).toggleClass('font-large', size === 2 /* Large */);

                        Common.triggerResize($('.ribbon'));
                    });
                    this.fontSize.valueHasMutated();
                }
                return UserSettingsViewModel;
            })(Common.ViewModelBase);
            UserSettings.UserSettingsViewModel = UserSettingsViewModel;

            var UserSettingsNotification = (function () {
                function UserSettingsNotification(accountModule) {
                    this.accountModule = accountModule;
                    this.signButtonText = ko.computed(function () {
                        return accountModule.userState() === 1 /* Present */ ? "Sign out" : "Sign in";
                    });
                }
                UserSettingsNotification.prototype.signButtonClicked = function () {
                    this.accountModule.ribbonButtonClicked();
                };

                UserSettingsNotification.prototype.showUserDetailsButtonClicked = function () {
                };

                UserSettingsNotification.prototype.settingsButtonClicked = function () {
                    return exports.history.navigateSilent(Jigsaw.UserSettings.SETTINGSURL);
                };
                return UserSettingsNotification;
            })();
            UserSettings.UserSettingsNotification = UserSettingsNotification;
            Jigsaw.Ribbon.ribbonQuickStartTemplateSelector.candidate(templates.userSettings.Notification(), function (x) {
                return x instanceof UserSettingsNotification;
            });

            var UserSettingsModule = (function (_super) {
                __extends(UserSettingsModule, _super);
                function UserSettingsModule(coreModule, accountModule) {
                    _super.call(this);
                    this.coreModule = coreModule;
                    this._view = new Marionette.CollectionView();
                    this._styles = new Jigsaw.Theming.ContentStyleSheet(templates.userSettings.styles);

                    this.userSettingsViewModel = new UserSettingsViewModel();
                    var baseSettingsView = new Marionette.View({
                        template: templates.userSettings.UserSettings,
                        viewModel: this.userSettingsViewModel
                    });
                    this._view.add(baseSettingsView);

                    this.registerUrl();

                    coreModule.addSlave(this._styles); // the styles should always be loaded for the Quickstart

                    var notification = new UserSettingsNotification(accountModule);
                    coreModule.quickStart.push(notification);
                }
                UserSettingsModule.prototype.requiredModules = function () {
                    return [this.coreModule];
                };

                UserSettingsModule.prototype.registerUrl = function () {
                    var _this = this;
                    exports.history.register(UserSettings.SETTINGSURL, function () {
                        return exports.moduleManager.load(_this);
                    });
                };

                UserSettingsModule.prototype.load = function () {
                    return this.coreModule.content.show(this._view);
                };
                return UserSettingsModule;
            })(Modules.ModuleBase);
            UserSettings.UserSettingsModule = UserSettingsModule;
        })(Jigsaw.UserSettings || (Jigsaw.UserSettings = {}));
        var UserSettings = Jigsaw.UserSettings;

        /** contains base classes and the module that serves as the base for the sidebar views */
        (function (Sidebar) {
            var MinimumWidth = 798;

            var SidebarView = (function (_super) {
                __extends(SidebarView, _super);
                function SidebarView(initOptions) {
                    _super.call(this, {
                        template: templates.sidebar.Sidebar,
                        viewModel: initOptions.viewModel,
                        regions: {
                            collapsed: '#sidebar-collapsed',
                            expanded: '#sidebar-expanded'
                        }
                    });
                    this.initOptions = initOptions;

                    this.expandedView = initOptions.expandedView;
                    this.collapsedView = initOptions.collapsedView;
                }
                SidebarView.prototype.domReady = function () {
                    _super.prototype.domReady.call(this);

                    this.collapsed.show(this.collapsedView);
                    this.expanded.show(this.expandedView);

                    this.initOptions.viewModel.collapsed.valueHasMutated();
                };

                SidebarView.prototype.collapse = function () {
                    this.initOptions.viewModel.collapsed(true);
                };
                return SidebarView;
            })(Marionette.Layout);
            Sidebar.SidebarView = SidebarView;

            var SidebarViewModel = (function (_super) {
                __extends(SidebarViewModel, _super);
                function SidebarViewModel(sidebarSize) {
                    _super.call(this);
                    this.collapsed = ko.observable(false).extend({ persist: 'sidebarCollapsedState' });

                    this.collapsed.subscribe(function (x) {
                        if (x) {
                            sidebarSize.minimizeSidebar().done();
                        } else {
                            sidebarSize.expandSidebar().done();
                        }
                    });
                }
                return SidebarViewModel;
            })(Common.ViewModelBase);
            Sidebar.SidebarViewModel = SidebarViewModel;

            var SidebarModule = (function (_super) {
                __extends(SidebarModule, _super);
                function SidebarModule(options) {
                    _super.call(this);
                    this.options = options;

                    this._sidebarViewModel = new SidebarViewModel(options.sidebarSize);
                    this._sidebarView = new SidebarView({
                        expandedView: new Marionette.CollectionView('ul'),
                        collapsedView: new Marionette.CollectionView('ul'),
                        viewModel: this._sidebarViewModel
                    });
                }
                SidebarModule.prototype.requiredModules = function () {
                    // this needs to be modified when the work sideLayoutModule is required
                    return [this.options.viewLayoutModule];
                };

                /** registers a view that will be rendered in the sidebar. */
                SidebarModule.prototype.registerView = function (expandedView, collapsedView) {
                    //this._view.expandedView.add(view);
                    this._sidebarView.expandedView.add(expandedView);

                    if (collapsedView) {
                        this._sidebarView.collapsedView.add(collapsedView);
                    }
                };

                SidebarModule.prototype.load = function () {
                    var _this = this;
                    //handle window resize for responsive purpose
                    $(window).resize(function () {
                        return _this.handleViewPortResize();
                    });

                    //handling toggling sidebar
                    $(window).bind('togggle-sidebar', function () {
                        return _this._sidebarViewModel.collapsed(!_this._sidebarViewModel.collapsed());
                    });

                    return this.options.viewLayoutModule.sidebar.show(this._sidebarView);
                };

                SidebarModule.prototype.unload = function () {
                    //unbind window resize
                    $(window).unbind('resize');

                    $(window).unbind('togggle-sidebar');

                    this._sidebarView.close();

                    return Q(true);
                };

                SidebarModule.prototype.handleViewPortResize = function () {
                    var currentWidth = $(document).width();

                    if (currentWidth != this._lastViewPortWidth && currentWidth < MinimumWidth) {
                        this._sidebarView.collapse();
                        this._lastViewPortWidth = currentWidth;
                    }
                };
                return SidebarModule;
            })(Modules.ModuleWithSlavesBase);
            Sidebar.SidebarModule = SidebarModule;

            var menu;
            (function (menu) {
                function expandTree(li, speed) {
                    if (typeof speed === "undefined") { speed = 200; }
                    if (li.is('li')) {
                        // expand parents
                        expandTree(li.parent().parent());

                        // expand current element
                        li.addClass('open').children('a').next().slideDown(speed);

                        // collapse sibilings
                        li.siblings().removeClass('open').find('a').next().slideUp(speed);
                    }
                }

                ko.bindingHandlers['jarvisMenu'] = {
                    init: function (element, valueAccessor) {
                        var defaults = {
                            speed: 200
                        }, options = valueAccessor(), opts = $.extend(defaults, options), $element = $(element), parents, visible;

                        $element.on('click', 'li a', toggleMenu);

                        function toggleMenu() {
                            if ($(this).next().is(':visible')) {
                                // just hide the element
                                $(this).parent().removeClass('open');
                                $(this).next().slideUp(options.speed);
                            } else {
                                expandTree($(this).parent(), options.speed);
                            }
                        }
                    }
                };

                ko.bindingHandlers['expandMenuWhen'] = {
                    init: function (element, valueAccessor) {
                        var value = valueAccessor(), subscription = value.subscribe(function () {
                            return expandTree($(element).parent());
                        });

                        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                            subscription.dispose();
                        });
                    }
                };
            })(menu || (menu = {}));
        })(Jigsaw.Sidebar || (Jigsaw.Sidebar = {}));
        var Sidebar = Jigsaw.Sidebar;
    })(exports.Jigsaw || (exports.Jigsaw = {}));
    var Jigsaw = exports.Jigsaw;

    /** unique instance of HistoryController that will handle all history in the application */
    exports.history = History.history;

    exports.moduleManager = new Modules.ModuleManager(exports.history);
});
