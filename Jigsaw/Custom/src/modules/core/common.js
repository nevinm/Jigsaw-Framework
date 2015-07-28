var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", 'modules/core/ajax', 'modules/core/utils'], function(require, exports, Ajax, Utils) {
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
    exports.Dict = Dict;

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
    exports.Trash = Trash;

    function bulkDispose() {
        var disposables = [];
        for (var _i = 0; _i < (arguments.length - 0); _i++) {
            disposables[_i] = arguments[_i + 0];
        }
        _.each(disposables, function (disposable) {
            return disposable && disposable.dispose();
        });
    }
    exports.bulkDispose = bulkDispose;

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
    exports.mergeDisposables = mergeDisposables;

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
    exports.PromiseQueue = PromiseQueue;

    /** Base class for all viewModels, handles attaching/detaching THIS knockout viewModel
    every time the view is rendered/closed */
    var ViewModelBase = (function () {
        function ViewModelBase() {
            this._activeViews = 0;
        }
        return ViewModelBase;
    })();
    exports.ViewModelBase = ViewModelBase;

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
    exports.ReadyRemoteSource = ReadyRemoteSource;

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
    exports.PromiseRemoteSource = PromiseRemoteSource;

    /** this class handles the downloading of a remote resource */
    var RemoteResource = (function (_super) {
        __extends(RemoteResource, _super);
        function RemoteResource(url, options) {
            _super.call(this);
            this.url = url;
            this.options = options;
        }
        RemoteResource.prototype.getPromise = function () {
            return Ajax.get(this.url, this.options);
        };
        return RemoteResource;
    })(PromiseRemoteSource);
    exports.RemoteResource = RemoteResource;

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
    exports.ComposeRemoteSource = ComposeRemoteSource;

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
    exports.Event = Event;

    /** name for the resize event, formely named 'resize' but enters in conflict with an event named
    the same way */
    exports.RESIZE = 'resize-event';

    exports.resizeEvent = $.Event(exports.RESIZE);

    function triggerResize(element) {
        element.trigger(exports.resizeEvent);
    }
    exports.triggerResize = triggerResize;

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
    exports.DelayedCallbacks = DelayedCallbacks;

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
    exports.PromiseGateway = PromiseGateway;

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
    exports.InteractionRequest = InteractionRequest;

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
            return exports.mergeDisposables.apply(null, disposables);
        };
        return PrioritySet;
    })();
    exports.PrioritySet = PrioritySet;

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
    exports.Breadcrumb = Breadcrumb;
});
