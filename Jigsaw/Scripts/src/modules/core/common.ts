/* Module : Common */
import Ajax = require('modules/core/ajax');
import Utils = require('modules/core/utils');

    class KeyValuePair<TKey, TValue> {
        constructor(public key: TKey, public value: TValue) { }
    }

    export class Dict<TKey, TValue> {
        private _storage: KeyValuePair<TKey, TValue>[] = [];

        contains(key: TKey) {
            return _.some<KeyValuePair<TKey, TValue>>(this._storage, pair => pair.key === key);
        }

        add(key: TKey, value: TValue) {
            if (this.contains(key)) {
                throw new Error('the key is already present on the dictionary');
            } else {
                this._storage.push(new KeyValuePair(key, value));
            }
        }

        remove(key) {
            var pair = _.find<KeyValuePair<TKey, TValue>>(this._storage, pair => pair.key === key);
            Utils.remove(this._storage, pair);
        }

        get(key: TKey): TValue {
            var pair = _.find<KeyValuePair<TKey, TValue>>(this._storage, pair => pair.key === key);
            return pair && pair.value;
        }

        keys() {
            return _.map(this._storage, pair=> pair.key);
        }

        values() {
            return _.map(this._storage, pair => pair.value);
        }
    }

    export interface IDisposable {
        dispose(): void;
    }

    /** represents a disposable collection that gets disposed later */
    export class Trash implements IDisposable {

        private _trash: IDisposable[] = [];

        recycle(...items: IDisposable[]) {
            this._trash.push.apply(this._trash, items);
        }

        dispose() {
            _.each(this._trash, item => item && item.dispose());
            // prepare the trash for a new recycle cycle
            this._trash = [];
        }
    }

    export function bulkDispose(...disposables: IDisposable[]) {
        _.each(disposables, disposable => disposable && disposable.dispose());
    }

    export function mergeDisposables(...disposables: IDisposable[]): IDisposable {
        return {
            dispose: () => _.each(disposables, disposable=> disposable.dispose())
        };
    }

    export interface IDestroyable {
        destroy(): void;
    }

    export interface ICollection<T> {
        add(item: T): void;
        // remove(item: T);
        clear();
    }

    export interface IPromiseBuilder {
        (): Q.Promise<any>;
    }

    /** syncronizes some promises such as that only one of them is executing at a given time */
    export class PromiseQueue {
        private _executing = false;
        private _queue: IPromiseBuilder[] = [];

        enqueue(promise: IPromiseBuilder): Q.Promise<any> {
            var result = Q.defer();

            if (this._executing) {

                this._queue.push(() => {
                    return promise().then(x => {
                        result.resolve(x);
                        return x;
                    })
                        .fail(x => {
                            result.reject(x);
                            // catch the exception so it continues executing after this promise
                            return x;
                        });
                });

            } else {
                this._executing = true;
                promise()
                    .then(x => {
                        result.resolve(x);
                        return this.continueQueue();
                    })
                    .fail(x => {
                        result.reject(x);
                        return this.continueQueue();
                    })
                    .done();
            }

            return result.promise;
        }

        private continueQueue(): Q.Promise<any> {
            var next = this._queue.pop();
            if (next) {
                return next().then(() => this.continueQueue()).fail(() => this.continueQueue());
            } else {
                this._executing = false;
                return Q(true);
            }
        }
    }

    /** Base class for all viewModels, handles attaching/detaching THIS knockout viewModel
    every time the view is rendered/closed */
    export class ViewModelBase {
        private _activeViews = 0;

        constructor() {
        }
    }

    export interface IRemoteSource<T> {
        value: T;
        refresh(): Q.Promise<T>;
        download(): Q.Promise<T>;
        isReady: boolean;
    }

    export class ReadyRemoteSource<T> implements IRemoteSource<T> {
        isReady = true;
        constructor(public value: T) { }

        refresh() {
            return Q(this.value);
        }

        download() {
            return Q(this.value);
        }
    }

    export class PromiseRemoteSource<T> implements IRemoteSource<T> {
        private _downloadPromise: Q.Promise<any> = null;
        private _value: T = null;
        private _isReady = false;

        refresh() {
            if (this.isReady) {
                // if the template has been resolved, delete that value and schedule a new download
                this._downloadPromise = null;
            }

            return this.download();
        }

        download() {
            if (!this._downloadPromise) {
                this._downloadPromise = this.getPromise()
                    .then(value => {
                        this._value = value;
                        this._isReady = true;
                    });
            }

            return this._downloadPromise;
        }

        /** to be overwritten on derived classes */
        getPromise(): Q.Promise<T> {
            throw new Error('not implemented');
        }

        get isReady() {
            return this._isReady;
        }

        get value() {
            return this._value;
        }
    }

    /** this class handles the downloading of a remote resource */
    export class RemoteResource<T> extends PromiseRemoteSource<T> {

        constructor(public url: string, public options?) {
            super();
        }

        getPromise() {
            return Ajax.get(this.url, this.options);
        }
    }

    export class ComposeRemoteSource<TOriginal, TModified> implements IRemoteSource<TModified> {

        constructor(private source: IRemoteSource<TOriginal>, private modifier: (x: TOriginal) => TModified) {

        }

        refresh() {
            return this.source.refresh()
                .then(() => this.value);
        }

        download() {
            return this.source.download().then(() => this.value);
        }

        get isReady() {
            return this.source.isReady;
        }

        get value() {
            return this.modifier(this.source.value);
        }
    }

    export class Event {
        private callback = $.Callbacks();

        add(handler): IDisposable {
            this.callback.add(handler);

            return {
                dispose: () => this.callback.remove(handler)
            };
        }

        fire(...args: any[]) {
            this.callback.fire.apply(this.callback, args);
        }
    }

    /** name for the resize event, formely named 'resize' but enters in conflict with an event named
    the same way */
    export var RESIZE = 'resize-event';

    export var resizeEvent = $.Event(RESIZE);

    export function triggerResize(element: JQuery) {
        element.trigger(resizeEvent);
    }

    export class DelayedCallbacks {
        private _handlers: Function[] = [];

        add(handler: (...args) => Q.Promise<any>): IDisposable {
            this._handlers.push(handler);

            return {
                dispose: () => Utils.remove(this._handlers, handler)
            }
        }

        fire(...args) {
            var promises = _.map(this._handlers, handler=> handler.apply(null, args));
            return Q.all(promises);
        }
    }

    export class PromiseGateway<TKey, TValue> {
        private _storage = new Dict<TKey, Q.Promise<TValue>>();

        constructor(public getValue: (key: TKey) => Q.Promise<TValue>) {

        }

        resolve(key: TKey) {
            if (this._storage.contains(key)) {
                return this._storage.get(key);
            } else {
                var promise = this.getValue(key)
                    .then(x => {
                        this._storage.remove(key);
                        return x;
                    });
                this._storage.add(key, promise);
                return promise;
            }
        }
    }

    /** inspired by PRISM interaction requests, to help comunicating loosely coupled components */
    export class InteractionRequest<TIn, TOut> {
        private _handler: (data?: TIn) => TOut;

        request(data?: TIn): TOut {
            if (!this._handler) {
                throw new Error('a handler has not been specified for this InteracionRequest');
            }

            return this._handler(data);
        }

        handle(handler: (data?: TIn) => TOut) {
            if (this._handler) {
                throw new Error('a handler has already been specified for this InteractionRequest');
            }

            this._handler = handler;
        }

    }

    interface PrioritySetItem<T> {
        item: T;
        priority: number;
    }

    export class PrioritySet<T> {
        items: KnockoutObservableArray<T>;
        private _storage = ko.observableArray<PrioritySetItem<T>>();

        constructor() {
            this.items = this._storage.map(x => x.item).filter(x=> this.filterItems(x));
        }

        filterItems(x: T) {
            return true;
        }

        get length() { return this._storage().length }

        add(item: T, priority = 0): IDisposable {
            // adds a new item to the storage array, but considering it's priority
            // so it maintains the array ordered by priority
            var storage = this._storage(),
                storageItem = { item: item, priority: priority };

            // find the position where to insert the item, ordered by the priority
            for (var i = 0; i < this.length; i++) {
                if (priority < storage[i].priority) {
                    this._storage.splice(i, 0, storageItem);
                    return { dispose: () => this._storage.remove(storageItem) };
                }
            }

            // else insert the item at the end of the array
            this._storage.push(storageItem);
            return { dispose: () => this._storage.remove(storageItem) };
        }

        addAll(items: T[], priority = 0): IDisposable {
            var disposables = _.map(items, x => this.add(x, priority));
            return mergeDisposables.apply(null, disposables);
        }
    }

    export class Breadcrumb<T> {
        next = ko.observable<Breadcrumb<T>>();

        constructor(public data: T, next?: Breadcrumb<T>) {
            if (next) {
                this.next(next);
            }
        }

        /** returns all the elements from the breadcrumb */
        enumerate() {
            return ko.computed(() => {
                var result = [this.data],
                    next = this.next();

                while (next) {
                    result.push(next.data);
                    next = next.next();
                }

                return result;
            });
        }
    }