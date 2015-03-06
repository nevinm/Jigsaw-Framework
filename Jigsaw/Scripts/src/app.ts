/// <reference path="definitions/_definitions.d.ts" />

/// <reference path="definitions/jquery.d.ts" />
/// <reference path="definitions/jqueryui.d.ts" />
/// <reference path="definitions/signalr.d.ts" />
/// <reference path="definitions/kendo.web.d.ts" />
/// <reference path="definitions/Q.d.ts" />
/// <reference path="definitions/underscore.d.ts" />
/// <reference path="definitions/knockout.d.ts" />

/// <reference path="definitions/require.d.ts" />

/// <reference path="definitions/idangerous.swiper.d.ts" />

/// <reference path="definitions/bootstrap.d.ts" />

/// <reference path="definitions/smartadmin.d.ts" />


/// <reference path="templates/definitions.d.ts" />

import templates = require('templates/app');
import $ui = require('jquery-ui');
import GlobalErrorCatching = require('modules/core/global-error-catching');

/** returns a promise that is resolved when the animation finishes */
$.fn.deferredAnimate = function (properties: any, duration: any, queue= false) {
    var result = Q.defer();

    (<JQuery>this).stop(false, true).animate(properties, {
        duration: duration,
        complete: () => result.resolve(true),
        queue: queue
    });

    return result.promise;
}

$(document).on('click', 'a[href="#"]', e => e.preventDefault());



/* Module : Ajax */
/** low level functions to control network */
export module ajax {

    function retrieveFromServer(func: () => JQueryXHR) {
        return Q(func())
            .fail(e => {
                // if the server is offline desconnect the application
                if (isOfflineError(e)) {
                    connection.disconnect();
                }

                return Q.reject(e);
            });
    }

    export function get(url: string, data?): Q.Promise<any> {
        return retrieveFromServer(() => $.get(url, data));
    }

    export function post(url: string, data?): Q.Promise<any> {
        // WebApi doesn't support native jquery parameter encode on the server,
        // thanks to http://weblog.west-wind.com/posts/2012/May/08/Passing-multiple-POST-parameters-to-Web-API-Controller-Methods
        return retrieveFromServer(() => {
            return $.ajax(
                {
                    url: url,
                    type: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(data),
                });
        });
    }

    export function fileDownload(url: string, data?): Q.Promise<any> {
        // for now uses the jquery fileDownload plugin
        return Q(<any>$.fileDownload(url, { data: data }))
            .fail(e => {
                // if the server is offline desconnect the application
                if (isOfflineError(e)) {
                    connection.disconnect();
                }

                return Q.reject(e);
            });
    }

    /** returns tru if the given error was returned from a request where the server
    was offline */
    export function isOfflineError(error) {
        return error.status === 0 || error.status === 404;
    }


    /* Module : Ajax.Connection */

    export module connection {

        /** when true the application will act as offline, even if the server is available */
        export var forceOffline = ko.observable(false);

        /** This class can be used to track throught it's single instance if the application is online or not */
        var disconected = ko.observable(false);
        var _reconectingPromise: Q.Promise<boolean> = null;

        export var isOnline = ko.computed(() => !forceOffline() && !disconected());

        export function online(ping: boolean = false): Q.Promise<boolean> {
            if (forceOffline()) {
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

        export function disconnect(): void {
            disconected(true);
            signalR.ping.stop();
        }

        export function reconnect(): Q.Promise<boolean> {
            if (!_reconectingPromise) {
                _reconectingPromise = Q($.get('ping.js'))
                    .then(() => {
                        disconected(false);
                        return true;
                    })
                    .fail(() => {
                        disconected(true);
                        signalR.ping.stop();
                        return false;
                    })
                    .finally(() => _reconectingPromise = null);
            }

            return _reconectingPromise;
        }

        /* add some additional code to detect when the application goes offline using SignalR,
        also tries to reconnect every 1min */
        module signalR {
            export var ping = $.connection('ping');

            ping
                .disconnected(() => {
                    disconected(true);

                    setTimeout(() => {
                        _reconectingPromise = Q(ping.start())
                            .then(() => {
                                disconected(false);
                                return true;
                            })
                            .fail(() => {
                                disconected(true);
                                return false;
                            })
                            .finally(() => _reconectingPromise = null);

                    }, 60000); // try to reconnect in one minute
                })
                .start();
        }

    }


}


/* Module : Common */

export module Common {

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
            return ajax.get(this.url, this.options);
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
}


/* Module : Knockout */
export module Knockout {

    /** triggers the resize event on the target element when the observable value is changed */
    ko.bindingHandlers['resizeWhen'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value: KnockoutObservable<any> = valueAccessor(),
                subscription = value.subscribe(() => Common.triggerResize($(element)));

            ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                subscription.dispose();
            });
        }
    }

    interface EventWhenBindingOptions {
        event: string;
        fire: KnockoutObservable<any>;
    }

    ko.bindingHandlers['eventWhen'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value: EventWhenBindingOptions = valueAccessor(),
                subscription = value.fire.subscribe(() => $(element).trigger(value.event));

            ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                subscription.dispose();
            });
        }
    }

    /** default text binding, returns the text in the inside of the element if the target binding
    has no value. */
    ko.bindingHandlers['dtext'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = valueAccessor(),
                defaultText = $(element).html(),
                computed = ko.computed(() => value() || defaultText);

            ko.applyBindingsToNode(element, { text: computed }, bindingContext);

            ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                computed.dispose();
            });
        }
    }

    /** executes an action when enter is pressed */
    ko.bindingHandlers['pressEnter'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var func = <Function>ko.unwrap(valueAccessor());
            $(element)
                .keydown(e => {
                    if (e.keyCode === 13) {
                        $(element).change(); // triggeer change event so knockout can pick up changes, if any
                        func.call(viewModel, e);
                    }
                });
        }
    }

    /** knockout binding to help with debuging */
    ko.bindingHandlers['debug'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            console.log('knockout binding: ', element, valueAccessor());

            ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                console.log('disposed binding: ', element, valueAccessor());
            });
        }
    }

    export interface Guardian {
        (value, silent?): Q.Promise<any>;
    }

    export class Door {
        guardians: Guardian[] = [];

        private _isOpen = false;
        private _lastKey: any;
        private _lastPromise: Q.Promise<any>;

        constructor() {
        }

        add(guardian: Guardian): Common.IDisposable {
            this.guardians.push(guardian);

            return {
                dispose: () => Utils.remove(this.guardians, guardian)
            };
        }

        /** returns a promise that checks if ALL guardians accept the passed key, in
        which case the promise is resolved. Otherwise fails.
        Note: Only one key can be tested at a single time, and an error is thrown otherwise. */
        open(key, silent = false) {
            if (!this._isOpen) {

                var promises = _.map(this.guardians, guardian=> guardian(key, silent));

                this._isOpen = true;
                this._lastKey = key;
                this._lastPromise = Q.all(promises)
                    .then(() => Q(key))
                    .fail(() => Q.reject(key))
                    .finally(() => this._isOpen = false);

                return this._lastPromise;
            } else if (key === this._lastKey) {
                return this._lastPromise;
            } else {
                return Q.reject(new Error('the door can only handle one item at a time.'));
            }
        }

    }

    /**
    guarded observable, contains a list of promises that are used to filter a .guarded
    observable if all promises are resolved
     */
    ko['guarded'] = function <T>(initialValue?: T) {
        var NOPASSING = {}, // constant to mark when no object is passing through the door
            passing = ko.observable(NOPASSING), // contains the object that is passing
            guarded = ko.observable(initialValue), // contains the object inside the door
            guardedReadOnly = ko.computed(() => guarded()),
            door = new Door(),
            // will contain a list of Guardians to be executed before the value is setted
            // can be used to execute async actions right before setting the value
            // note all of them must not fail
            prepare = new Door(),
            outsider = ko.computed({
                read: () => passing() !== NOPASSING ? passing() : guarded(),
                write: inject
            }),
            disposeBase = outsider.dispose;

        function inject(value, silent= false) {
            passing(value);

            return door.open(value, silent)
                .then(() => <any>prepare.open(value))
                .then((key: T) => {
                    if (key === passing()) {
                        guarded(key);
                        passing(NOPASSING);
                    }
                    return key;
                })
                .fail(key => {
                    if (key === passing()) {
                        passing(NOPASSING);
                    }
                    return Q.reject(key);
                });
        }

        // the guarded observable is read-only
        outsider['guarded'] = guardedReadOnly;
        outsider['guard'] = guardian => door.add(guardian);
        outsider['prepare'] = guardian => prepare.add(guardian);
        outsider['inject'] = inject;
        outsider['dispose'] = function () {
            // dispose logic
            guardedReadOnly.dispose();
            delete outsider['guarded'];
            // also call base method
            disposeBase.apply(outsider, arguments);
        };

        return <any>outsider;
    }

    export interface PersistOptions<T> {
        /** key used to store the item on the localStorage */
        key: string;
        /** this function gets called before setting the value on the observable,
        and after deserialize it using the JSON.parse */
        parse? (deserialized): T;
        /** this function gets called after the objservable changes and before serializing 
        the value using the JSON.stringify*/
        stringify? (item: T);
    }

    export function persistExtender<T>(target: KnockoutObservable<T>, value) {
        var options: PersistOptions<T> = !_.isString(value) ? value : {
            key: value,
            parse: _.identity,
            stringify: _.identity
        };

        var previousValue = persistExtender.storageGetItem(options.key);
        if (previousValue) {
            // if there's a previous value then set the observable with that value
            target(options.parse(JSON.parse(previousValue)));
        }

        target.subscribe(value => {
            var json = JSON.stringify(options.stringify(value));
            // store the latest value every time the observable changes
            persistExtender.storageSetItem(options.key, json);
        });

        return target;
    }

    /** localStorage functions can't be mocked when testing this function, that's why this module
    exist so the tests can mock these instead */
    export module persistExtender {
        export function storageGetItem(key: string) {
            return localStorage.getItem(key);
        }

        export function storageSetItem(key: string, value: string) {
            localStorage.setItem(key, value);
        }
    }

    /** extends the knockout observables to store the last value of the observable in the localstorage */
    ko.extenders['persist'] = persistExtender;

    /** returns an observable array that is persisted on the user localStorage with the specified key */
    export function persistedArray<T>(options: PersistOptions<T>): KnockoutObservableArray<T> {
        var options: PersistOptions<T> = _.defaults(options, {
            parse: _.identity,
            stringify: _.identity
        });

        return ko.observableArray<T>().extend({
            persist: <PersistOptions<T[]>>{
                key: options.key,
                parse: deserialized => _.map(deserialized, options.parse),
                stringify: array => _.map(array, options.stringify)
            }
        });
    }

    /** extends knockout observables and adds a writeable computed observable as a property
    of the target observable named 'px'*/
    ko.extenders['px'] = function (target: KnockoutObservable<number>, writeable: boolean) {

        target['px'] = ko.computed<string>({
            read: () => target() + 'px',
            write: newValue => {
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
    }

    interface IThrottledWithBindingOptions {
        target: KnockoutObservable<any>;
        delay?: number; // defaults to 500ms
    }

    /** similar to the with binding but targets bindings extended with the mirror extender */
    ko.bindingHandlers['throttledWith'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = valueAccessor(),
                options: IThrottledWithBindingOptions = !ko.isObservable(value) ? value : { target: value, delay: 500 },
                mirror: KnockoutComputed<any> = ko.computed(() => options.target()).extend({ rateLimit: options.delay || 500 });

            ko.applyBindingsToNode(element, { with: mirror }, bindingContext);

            // .busy CSS class styles are described on the app module styles
            // wait some time before removing the .busy class so the with binding can finish rendering the content
            var disposable1 = options.target.subscribe(() => $(element).addClass('busy')),
                disposable2 = mirror.subscribe(() => setTimeout(() => $(element).removeClass('busy'), 50));

            ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                disposable1.dispose();
                disposable2.dispose();
                mirror.dispose();
            });

            return { controlsDescendantBindings: true };
        }
    }

    /** associates the click handler of a button with an async task. After click
    when the promise is still running the button will have the class "q-working"  */
    ko.bindingHandlers['qclick'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var className = "q-working",
                $element = $(element),
                value: () => Q.Promise<any> = ko.unwrap(valueAccessor());

            function clickHandler() {
                // execute the method and add the class while the promise is still unresolved
                var promise: Q.Promise<any> = value.apply(viewModel);

                $element.addClass(className);
                function removeClass() {
                    $element.removeClass(className);
                }

                promise.done(removeClass, removeClass);
            }

            $element.bind('click', clickHandler);

            ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                $element.unbind('click', clickHandler);
            });
        }
    };

    function makeToggleVisibleBinding(name: string, hide: (x) => void, show: (x) => void) {
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
    makeToggleVisibleBinding('fadeVisible', x=> $(x).fadeIn(), x=> $(x).fadeOut());
    makeToggleVisibleBinding('slideVisible', x=> $(x).slideDown(), x => $(x).slideUp());

    /** renders a backbone view inside the given element. the view is closed once the binding 
    is cancelled */
    ko.bindingHandlers['view'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var view: Marionette.View = ko.unwrap(valueAccessor()),
                region = new Marionette.Region({ element: $(element) });

            region.show(view)
                .then(() => {
                    // apply bindings if the view doesn't have a view model associated
                    if (!view.options.viewModel) {
                        ko.applyBindingsToDescendants(bindingContext, element);
                    }
                })
                .done();

            ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                region.close();
            });

            return { controlsDescendantBindings: true };
        }
    }

    class StringTemplateSource {
        constructor(public template: string) {

        }

        text() {
            return this.template;
        }
    }

    export var StringTemplateEngine = new ko.nativeTemplateEngine();
    StringTemplateEngine['makeTemplateSource'] = function (template) {
        return new StringTemplateSource(template);
    };

    export function renderTemplate(element, template: string, bindingContext) {
        ko.renderTemplate(template, bindingContext, { templateEngine: StringTemplateEngine }, element, "replaceChildren");
    }

    export function renderTemplateAsync(element, template: string, bindingContext) {
        Utils.async(() => renderTemplate(element, template, bindingContext));
    }

    /** renders a string template received as an argument */
    ko.bindingHandlers['stringTemplate'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            renderTemplate(element, ko.unwrap(valueAccessor()), bindingContext);
        }
    }

    /** watch an observableArray for changes to it's elements, and executes the added/removed 
    callback for each case */
    export function watchObservableArray<T>(array: KnockoutObservableArray<T>, elementAdded: (x: T) => void,
        elementRemoved: (x: T) => void): Common.IDisposable {

        return array.subscribe((changes: KnockoutArrayChange<T>[]) => {
            _.each(changes, change => {
                if (change.status === 'added') {
                    elementAdded(change.value);
                } else if (change.status === 'deleted') {
                    elementRemoved(change.value);
                }
            });
        }, null, 'arrayChange');
    }

    var pageReadyPromise = Q.delay(true, 1500);

    interface StabilizerBinding {
        measure: () => number;
        resize: () => void;
        previousValue: number;
    }

    export class Stabilizer {
        private binds: StabilizerBinding[] = [];
        private ready = Q.defer();

        constructor() {
        }

        private flow() {
            var reflow = false;

            _.each(this.binds, bind=> {
                var size = bind.measure();
                if (size !== bind.previousValue) {
                    reflow = true;
                }
                bind.previousValue = size;
            });

            if (reflow) {
                _.each(this.binds, bind => bind.resize());
                this.scheduleReflow();
            } else {
                this.binds = null;
                this.ready.resolve(true);
            }
        }

        private scheduleReflow(timeout = 1500) {
            console.log('reflow')
            setTimeout(() => this.flow(), timeout);
        }

        start() {
            this.scheduleReflow(500);
            return this.ready.promise;
        }

        register(measure: () => number, resize: () => void) {
            if (this.binds !== null) {
                this.binds.push({
                    measure: measure,
                    resize: resize,
                    previousValue: -1
                });
            } else {
                resize();
            }
        }
    }

    export var flowStabilizer = new Stabilizer();

    ko.bindingHandlers['measurePrev'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var $element = $(element),
                elementPrev = $element.prev(),
                direction = ko.unwrap(valueAccessor());

            flowStabilizer.register(elementSize, elementResized);

            $element.prevAll().bind(Common.RESIZE, elementResized);

            ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                $element.prevAll().unbind(Common.RESIZE, elementResized);
            });

            function elementSize() {
                // measure previous elements and set the correct position attribute on the target element
                return elementPrev.position().top + elementPrev.outerHeight(true);
            }

            function elementResized() {
                Utils.async(() => {
                    var originalValue = $element.position()[direction],
                        size = elementSize(),
                        animationProperties = {};

                    if (originalValue != size) {
                        animationProperties[direction] = size;

                        // without animation
                        $element.css(animationProperties);
                        Common.triggerResize($element);
                    }
                });
            }
        }
    }

    /** raise the 'resize' event when the Jigsaw resize event is raised for the current element */
    ko.bindingHandlers['kendoResize'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var $element = $(element);

            $element.bind(Common.RESIZE, elementResized);

            ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                $element.unbind(Common.RESIZE, elementResized);
            });

            function elementResized() {
                $element.resize();
            }
        }
    }

    /** must be applied to img elements and sets the image source assuming that the property returns
    the image byte information in base64, and as PNG */
    ko.bindingHandlers['imgSrc'] = {
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = ko.unwrap(valueAccessor()),
                binding = "data: image/png; base64," + value;
            $(element).attr('src', binding);
        }
    }

    ko.bindingHandlers['checkbox'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var $element = $(element),
                value: KnockoutObservable<boolean> = valueAccessor();

            $element.addClass('checkbox');

            if (ko.isWriteableObservable(value)) {
                $element.click(e => {
                    if ($element.hasClass('checked')) {
                        value(false);
                    } else {
                        value(true);
                    }
                    return false;
                });
            }

            ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                $element.unbind('click');
            });
        },
        update: function (element: Element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value: boolean = ko.unwrap(valueAccessor());

            if (value) {
                $(element).addClass('checked');
            } else {
                $(element).removeClass('checked');
            }
        }
    }

    ko.bindingHandlers['checkbox2'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var $element = $(element),
                value: KnockoutObservable<boolean> = valueAccessor();

            if (ko.isWriteableObservable(value)) {
                $element.click(e => {
                    if ($element.hasClass('checked')) {
                        value(false);
                    } else {
                        value(true);
                    }
                    return false;
                });
            }

            ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                $element.unbind('click');
            });
        },
        update: function (element: Element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value: boolean = ko.unwrap(valueAccessor());

            if (value) {
                $(element).addClass('checked');
            } else {
                $(element).removeClass('checked');
                //$(element).removeClass('checked');
            }
        }
    }


    ko.bindingHandlers['dropdown'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

            var $element = $(element),
                $menu = $(element).next(),
                value = valueAccessor();

            if (value.notCloseWithin) {
                $menu.on('click', e => e.stopPropagation() );
            }
            
            ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                $menu.unbind('click');
            });

        }
    };

    ko.bindingHandlers['dropdownMouseEnter'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

            var $element = $(element);

            $element.mouseenter(e => {
                $element.addClass('open');
            });

            $element.mouseleave(e => {
                $element.removeClass('open');
            });

            ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
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
                onToggle: function () { },

                // delete btn
                deleteButton: false,
                deleteClass: 'fa fa-times',
                deleteSpeed: 200,
                onDelete: function () { },

                // edit btn
                editButton: false,
                editPlaceholder: '.jarviswidget-editbox',
                editClass: 'fa fa-chevron-down | fa fa-chevron-up',
                editSpeed: 200,
                onEdit: function () { },

                // color button
                colorButton: false,

                // full screen
                fullscreenButton: true,
                fullscreenClass: 'fa fa-expand | fa fa-compress',
                fullscreenDiff: 3,
                onFullscreen: function () { },

                // custom btn
                customButton: false,
                customClass: 'folder-10 | next-10',
                customStart: function () {
                    alert('Hello you, this is a custom button...')
                },

                customEnd: function () {
                    alert('bye, till next time...')
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
                afterLoad: function () { },
                rtl: false, // best not to toggle this!
                onChange: function () {

                },
                onSave: function () {

                },

                ajaxnav: null // declears how the localstorage should be saved
            });


            ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                $element.data('jarvisWidgets', null);
            });
        }
    }

    ko.bindingHandlers['visibleExtended'] = {
        'update': function (element, valueAccessor) {
            var $element = $(element),
                wrapper = ko.unwrap(valueAccessor()),
                value = ko.utils.unwrapObservable(wrapper.value()),
                slide = wrapper.slide || false;

            if (slide) {

                if (value) {
                    $element.slideDown(200);
                }
                else {
                    $element.slideUp(200);
                }

                return;
            }

            //call knockout visible data-bind
        }
    };


    interface ToggleFullScreenModeOptions {

        /* selector of the parent DOM element that it will be toggled into full screen mode */
        wrapperSelector: string;

        /* Value Format: "fa fa-expand | fa fa-compress"  
           classes for normal mode and full screen mode for children's element 
        */
        class: string;

    }


    ko.bindingHandlers['toogleFullScreen'] = {
        init: function (element, valueAccessor) {
            var $element = $(element),
                options: ToggleFullScreenModeOptions = ko.unwrap(valueAccessor()),
                selector = options.wrapperSelector,
                $wrapper = selector[0] === '#'
                ? $element.parents(selector)
                : $element.parents(selector).first(),
                toggled = false,
                classes = options.class.split('|');

            $element.children().addClass(classes[0]);
  
            $element.click(() => {

                if (toggled) {
                    $wrapper.removeClass('fullscreen-mode');
                    //$wrapper.unwrap();

                    $element.children()
                        .removeClass(classes[1])
                        .addClass(classes[0]);
  
                }
                else {

                    $wrapper.addClass('fullscreen-mode');
                    //$wrapper.wrap('<div class="fullscreen-mode"/>');

                    $element.children()
                        .removeClass(classes[0])
                        .addClass(classes[1]);
  
                }

                toggled = !toggled;
 
            });

            ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                $element.unbind('click');
            });
        }
    };

  


    /** used internally by TemplateSelector to store possible template candidates.
    each template is tested using a match method in the candidate */
    class TemplateCandidate {
        constructor(public template: string, public match: (viewModel) => boolean) { }
    }

    /** Used to build a dinamically template selector, that can select a single template
    from a list of candidate templates to render a given viewmodel
    pass the 'template'  */
    export class TemplateSelector {
        private _candidates: TemplateCandidate[] = [];

        constructor(public fallbackTemplate: string = "") { }

        candidate(template: string, match: (viewModel) => boolean) {
            this._candidates.push(new TemplateCandidate(template, match));
        }

        /** finds the first candidate which template can render the passed viewModel */
        select(viewModel) {
            var candidate = _.find<TemplateCandidate>(this._candidates, c=> c.match(viewModel));

            if (candidate) {
                return candidate.template;
            } else {
                return this.fallbackTemplate;
            }
        }
    }

    /** creates a new binding with the specified name that renders the given element */
    export function makeTemplateSelector(bindingName: string, fallbackTemplate?: string): Knockout.TemplateSelector {
        var templateSelector = new Knockout.TemplateSelector(fallbackTemplate);

        ko.bindingHandlers[bindingName] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

                ko.applyBindingsToNode(element, {
                    template: {
                        name: x => templateSelector.select(x),
                        data: valueAccessor(),
                        templateEngine: Knockout.StringTemplateEngine,
                    }
                }, viewModel);

                return { 'controlsDescendantBindings': true };
            }
        };

        return templateSelector;
    }

    /** declares the given binding name and returns a template collection that can be used to 
    specify the templates used by this binding */
    export function makeForeachWithTemplateSelector(bindingName: string, fallbackTemplate?: string): Knockout.TemplateSelector {
        var templateSelector = new Knockout.TemplateSelector(fallbackTemplate);

        ko.bindingHandlers[bindingName] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

                ko.applyBindingsToNode(element, {
                    template: {
                        name: x => templateSelector.select(x),
                        foreach: valueAccessor(),
                        templateEngine: Knockout.StringTemplateEngine,
                    }
                }, bindingContext);

                return { controlsDescendantBindings: true };
            }
        };

        return templateSelector;
    }

    interface ForeachSelectedOptions {
        value: KnockoutObservable<any>;

        selectedClass?: string;
    }

    /** inside a foreach binding, bind an item context to a binding so when the element is 
    clicked the context is passed to the observable. Optionally some options can be passed 
    to toggle classes when the element is selected */
    ko.bindingHandlers['foreachSelected'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var $element = $(element),
                value = valueAccessor(),
                options: ForeachSelectedOptions = ko.isObservable(value) ? { value: value } : value,
                isSelected = ko.computed(() => options.value() === bindingContext.$data),
                cssBindingOptions = {};
            options = _.defaults(options, { selectedClass: 'k-state-selected' });

            $element.click((e) => {
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

            ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                isSelected.dispose();
                $element.unbind('click');
                //$('body').unbind('click', deselectHandler);
            });
        }
    }

    ko.bindingHandlers['var'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var innerBindingContext = bindingContext.extend(valueAccessor());
            ko.applyBindingsToDescendants(innerBindingContext, element);

            return { controlsDescendantBindings: true };
        }
    }

    interface ExpandOptionsOptions {
        value: KnockoutObservable<any>;
        text: string[];
    }

    /** shows a list of options to select one of them mst likely from an enum */
    ko.bindingHandlers['expandOptions'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var options: ExpandOptionsOptions = ko.unwrap(valueAccessor()),
                template = templates.widget.expandOptions(options);

            renderTemplateAsync(element, template, options);

            return { controlsDescendantBindings: true };
        }
    }

    export interface BindOptions<T, U> {
        /** starting observable */
        from: KnockoutObservable<T>;

        to: KnockoutObservable<U>;

        /** maps an element from T to U */
        forward(item: T): U;

        /** maps an element from U to T */
        backward(item: U): T;
    }

    /** binds two observables optionally specifing map functions between the observable values */
    export function bind<T, U>(options: BindOptions<T, U>): Common.IDisposable {
        var ignoreSync = false,
            subscription = options.from.subscribe(value => {
                if (!ignoreSync) {
                    var correspondingValue = options.forward(value);
                    ignoreSync = true;
                    options.to(correspondingValue);
                    ignoreSync = false;
                }
            }),
            subscription1 = options.to.subscribe(value => {
                if (!ignoreSync) {
                    var correspondingValue = options.backward(value);
                    ignoreSync = true;
                    options.from(correspondingValue);
                    ignoreSync = false;
                }
            }),
            initialImage = options.forward(options.from());

        // check that the observables are synced
        if (initialImage !== options.to()) {
            options.to(initialImage);
        }

        return {
            dispose: () => {
                subscription.dispose();
                subscription1.dispose();
            }
        };
    }

    /** adds two elements to the target element, that when hovered make the element
    children scroll in their direction.
    Scroll function on hover thanks to http://jsfiddle.net/gaby/xmAvh/ */
    ko.bindingHandlers['virtualScroll'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var $element = $(element),
                children = $element.children().wrapAll("<div class='virtual-scroll-wrapper'></div>").parent(),
                leftElement = $(templates.widget.VirtualScrollButton()),
                rightElement = $(templates.widget.VirtualScrollButton());

            $element.addClass('virtual-scroll').prepend(leftElement).append(rightElement);

            var amount = '';
            function scroll() {
                children.animate({ scrollLeft: amount }, 100, 'linear', () => {
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

            ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                leftElement.unbind('hover');
                rightElement.unbind('hover');
            });

        }
    }

    /** intended to be used for elements inside a virtualScroll, when the passed value evaluates to true,
    the binding will bring the given element into view */
    ko.bindingHandlers['virtualScrollFocus'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

        }
    }

    /** convenience functions to extend existing binding functions, so all extenders are kept in a single place */
    export module extend {
        var extenders = new Common.Dict<string, KnockoutBindingHandler[]>();

        function registerExtender(bindingName: string) {
            // register binding on extenders dictionary
            extenders.add(bindingName, []);

            var binding = ko.bindingHandlers[bindingName],
                init = binding.init,
                update = binding.update,
                preprocess = binding.preprocess;

            if (init) {
                binding.init = function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var result = init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
                    _.each(extenders.get(bindingName), handler =>
                        handler.init && handler.init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext));
                    return result;
                }
            }

            if (update) {
                binding.update = function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var result = update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
                    _.each(extenders.get(bindingName), handler =>
                        handler.update && handler.update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext));
                    return result;
                }
            }

            binding.preprocess = function (value, name, addBindingCallback) {

                _.each(extenders.get(bindingName), handler => handler.preprocess && handler.preprocess(value, name, addBindingCallback));

                if (preprocess) {
                    return preprocess(value, name, addBindingCallback);
                } else {
                    return value;
                }
            }
        }

        export function binding(name: string, options: KnockoutBindingHandler) {
            if (!extenders.contains(name)) {
                registerExtender(name);
            }

            extenders.get(name).push(options);
        }

        export function bindingInit(name: string, init: (element: Element, valueAccessor: () => any, allBindingsAccessor: () => any, viewModel: any, bindingContext: KnockoutBindingContext) => void) {
            binding(name, { init: init });
        }

        export function bindingUpdate(name: string, update: (element: Element, valueAccessor: () => any, allBindingsAccessor: () => any, viewModel: any, bindingContext: KnockoutBindingContext) => void) {
            binding(name, { update: update });
        }

        export function bindingPreprocess(name: string, preprocess: (value: string, name: string, addBindingCallback: (name: string, value: string) => void) => void) {
            binding(name, { preprocess: <any>preprocess });
        }

        /** can be used as preprocessor function on bindings that can be used without any binding value */
        export function emptyBindingPreprocess(value) {
            return value || '{}';
        }
    }

    function makeBindingHandlerNotifyResize(bindingName: string) {
        Knockout.extend.bindingUpdate(bindingName, (element) => Utils.async(() => Common.triggerResize($(element))));
    }
    makeBindingHandlerNotifyResize('visible');


    /** creates a new binding called 'mark'+name, that creates a new field on the context
    for child bindings named '$jigsaw'+name; containing the specified mark */
    export function createContextMarkBinding(name: string, mark?: () => any) {
        var bindingName = 'mark' + name,
            contextKey = '$jigsaw' + name;

        // create the binging
        ko.bindingHandlers[bindingName] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var options = {};
                options[contextKey] = mark ? mark() : valueAccessor();

                var context = bindingContext.extend(options);

                ko.applyBindingsToDescendants(context, element);
                return { controlsDescendantBindings: true };
            }
        }

        return {
            bindingName: bindingName,
            contextKey: contextKey
        }
    }

    module Ribbon {

        class RibbonTabStrip extends kendo.ui.TabStrip {

            disposables: Common.IDisposable[] = [];
            lastTab = null;


            constructor(element, private collapsed: KnockoutObservable<boolean>, options: kendo.ui.TabStripOptions = {}) {
                super(element, _.defaults(options, {
                    animation: false
                }));

                var firstTabActivated = true;
                // Triggered just after a tab is being made visible, but before the end of the animation
                this.bind('activate', () => {
                    // don't active any tab if the ribbonTabStrip is initialized collapsed
                    if (!firstTabActivated || !collapsed()) {
                        this.tabActivated();
                    } else {
                        // first tab activated and initialized collapsed
                        this.collapse();
                    }
                    firstTabActivated = false;
                });

                this.disposables.push(collapsed.subscribe(x => {
                    if (x) {
                        this.collapse();
                    } else {
                        this.expand();
                    }
                }));

            }

            collapse() {
                this.wrapper.find('.k-tabstrip-items > li').removeClass('k-tab-on-top k-state-active');
                this.wrapper.find('.k-content').css({ display: 'none', position: 'absolute', left: 0, right: 0 });

                this.triggerResize();
            }

            expand() {
                this.wrapper.find('.k-content').css({ position: 'relative', left: 0, right: 0 });
                this.select(this.lastTab);

                this.triggerResize();
            }

            triggerResize() {
                Common.triggerResize(this.wrapper);
                Common.triggerResize(this.wrapper.parent('.ribbon')); // trigger the resize event on the ribbon object
            }

            tabActivated() {
                this.lastTab = this.select();
                this.collapsed(false);
            }

            destroy() {
                super.destroy();
                this.unbind('activate');
                _.forEach(this.disposables, disposable => disposable.dispose());
            }
        }

        interface RibbonTabStripOptions {
            collapsed: KnockoutObservable<boolean>;
        }

        ko.bindingHandlers['ribbonTabStrip'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var options: RibbonTabStripOptions = ko.unwrap(valueAccessor());

                // process descendant bindings before creating the tab-strip
                ko.applyBindingsToDescendants(bindingContext, element);
                //setTimeout(()=> tabStrip.triggerResize(), 500);

                var tabStrip = new RibbonTabStrip(element, options.collapsed);

                ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                    tabStrip.destroy();
                });

                return { controlsDescendantBindings: true };

            }
        }

    }

    export module Keytips {

        interface IKeyTipTree {
            root: IKeyTipTreeNode;
            findNodeByLabel: (label: string) => IKeyTipTreeNode;
        }

        interface IKeyTipTreeNode {

            element: any;

            label?: string;

            key: string;

            /** action to be executed when this key tip is activated */
            action: () => void;

            /** action to be executed when this key tip lose the focus */
            after: () => void;

            zindex: number;

            parent: IKeyTipTreeNode;

            children?: Array<IKeyTipTreeNode>;

            addChild?: (child: IKeyTipTreeNode) => void;

            removeChild?: (child: IKeyTipTreeNode) => void;

            getNewChildrenKey?: (zindex: number) => string;

            getNewChildrenKeyStartWith?: (start: string, zindex: number) => string;
        }

        class CustomKeyTipTree implements IKeyTipTree {

            root: IKeyTipTreeNode;

            constructor(root: IKeyTipTreeNode) {
                this.root = root;
            }

            /**
               depth first search through the tree with certain predicate p 
            */
            private _dfs(node: IKeyTipTreeNode, p: (IKeyTipTreeNode) => boolean): IKeyTipTreeNode {

                if (p(node)) {
                    return node;
                }
                else {
                    if (node.children) {
                        for (var i = 0; i < node.children.length; i++) {
                            var result = this._dfs(node.children[i], p);
                            if (result != null)
                                return result;
                        }
                    }
                    return null;
                }
            }

            public findNodeByLabel(label: string): IKeyTipTreeNode {
                return this._dfs(this.root, (element: IKeyTipTreeNode) => {
                    return element.label == label;
                });
            }

            public findNodeByJQueryElement(element: JQuery): IKeyTipTreeNode {
                return this._dfs(this.root, (node: IKeyTipTreeNode) => {
                    return node.element == element;
                });
            }

        }

        class CustomKeyTipNode implements IKeyTipTreeNode {
            parent: IKeyTipTreeNode;

            children: IKeyTipTreeNode[] = [];

            constructor(public element: any, public label: string, public key: string, public action: () => void, public after: () => void, public zindex: number = 0) {
            }

            addChild(child: IKeyTipTreeNode): void {

                if (!child.key) {
                    child.key = this.getNewChildrenKey(child.zindex);
                }

                child.parent = this;

                //insert in order zindex=>appearing
                for (var i = 0; i < this.children.length; i++) {
                    if (child.zindex > this.children[i].zindex) {
                        this.children.splice(i, 0, child);
                        return;
                    }
                }

                this.children.push(child);
            }

            removeChild(child: IKeyTipTreeNode): void {

                //console.log(child);
                var index = this.children.indexOf(child);

                if (index > -1) {
                    this.children.splice(index, 1);
                }

            }

            private validKey(key: string, zindex: number): boolean {
                return !_.some<IKeyTipTreeNode>(this.children, (x) => x.key.indexOf(key) == 0 && x.zindex == zindex);
            }

            getNewChildrenKey(zindex: number): string {
                for (var i = 65; i <= 90; i++) {
                    if (this.validKey(String.fromCharCode(i), zindex))
                        return String.fromCharCode(i);
                }
                return 'ZZ';
            }

            getNewChildrenKeyStartWith(start: string, zindex: number): string {
                for (var i = 65; i <= 90; i++) {
                    if (this.validKey(start  +  String.fromCharCode(i), zindex))
                        return start + String.fromCharCode(i);
                }
                return 'ZZ';
            }

        }

        class CustomKeyTipLeaf implements IKeyTipTreeNode {

            parent: IKeyTipTreeNode;

            constructor(public element, public key: string, public action: () => void, public after: () => void, public zindex: number = 0) {

            }

        }

        interface KeyTipsBindingOptions {
            /** returns the keyboard key that executes this group, if no key is specified one will
            be assigned automatically */
            key?: string;

            /** activate keyTip only when the parent group is executed */
            parentGroup?: string;

            /** to show keytips with highest zindex values at same keytips tree level  */
            zindex?: number;
        }

        var zIndexBaseBindingInfo = createContextMarkBinding('ZIndexBase');

        ko.bindingHandlers['keyTips'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

                var value: KeyTipsBindingOptions = ko.unwrap(valueAccessor()),
                    parent = (value.parentGroup) ? tree.findNodeByLabel(value.parentGroup) : root,
                    // check if there's any z-index value specified for the tree and add it
                    // to the specified value if any
                    zindex = (value.zindex || 0) + (bindingContext[zIndexBaseBindingInfo.contextKey] || 0),
                    key = value.key || parent.getNewChildrenKey(zindex), // Automatic Key Value
                    leaf = new CustomKeyTipLeaf(element, key, () => $(element).click(), null, zindex);

                parent.addChild(leaf);

                ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                    // TODO add binding disposal
                    leaf.parent.removeChild(leaf);
                });

            }
        };

        interface KeyTipsGroupBindingOptions {

            /** keytip key */
            key?: string;

            /** keytip must start with this value it this value is setted */
            keyStartWith?: string;

            /** declares a new key tips group with the specified key */
            group: string;

            /** activate keyTip group when the parent group is executed */
            parentGroup?: string;

            /** to show keytips with highest zindex values at same keytips tree level  */
            zindex?: number;
        }

        ko.bindingHandlers['keyTipsGroup'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

                var value: KeyTipsGroupBindingOptions = ko.unwrap(valueAccessor()),
                    parent = (value.parentGroup) ? tree.findNodeByLabel(value.parentGroup) : root,
                    // check if there's any z-index value specified for the tree and add it
                    // to the specified value if any
                    zindex = (value.zindex || 0) + (bindingContext[zIndexBaseBindingInfo.contextKey] || 0),

                    key = (value.key) ? value.key
                    : ((value.keyStartWith)
                    ? parent.getNewChildrenKeyStartWith(value.keyStartWith, zindex)
                    : parent.getNewChildrenKey(zindex)),

                    node = new CustomKeyTipNode(element, value.group, key, () => $(element).click(), null, zindex);

                parent.addChild(node);

                ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                    node.parent.removeChild(node);
                });

            }
        };


        ko.bindingHandlers['keyTipsKendoTab'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

                var value: KeyTipsGroupBindingOptions = ko.unwrap(valueAccessor()),
                    parent = (value.parentGroup) ? tree.findNodeByLabel(value.parentGroup) : root,
                    // check if there's any z-index value specified for the tree and add it
                    // to the specified value if any
                    zindex = (value.zindex || 0) + (bindingContext[zIndexBaseBindingInfo.contextKey] || 0),
                    key = (value.key) ? value.key : parent.getNewChildrenKey(zindex),
                    node = new CustomKeyTipNode($(element).find('a')[0], value.group, key, () => $(element).find('a').get(0).click(), null, zindex);

                parent.addChild(node);

                ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                    // TODO add binding disposal
                    node.parent.removeChild(node);
                });

            }
        };

        ko.bindingHandlers['keyTipsInput'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

                var value: KeyTipsBindingOptions = ko.unwrap(valueAccessor()),
                    parent = (value.parentGroup) ? tree.findNodeByLabel(value.parentGroup) : root,
                    // check if there's any z-index value specified for the tree and add it
                    // to the specified value if any
                    zindex = (value.zindex || 0) + (bindingContext[zIndexBaseBindingInfo.contextKey] || 0),
                    key = value.key || parent.getNewChildrenKey(zindex), // Automatic Key Value
                    leaf = new CustomKeyTipLeaf($(element).parent()[0], key, () => $(element).focus(), null, zindex);


                parent.addChild(leaf);

                ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                    leaf.parent.removeChild(leaf);
                });

            }
        };

		
        ko.bindingHandlers['keyTipsGrid'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

                var value: KeyTipsBindingOptions = ko.unwrap(valueAccessor()),
                    parent = (value.parentGroup) ? tree.findNodeByLabel(value.parentGroup) : root,
                    // check if there's any z-index value specified for the tree and add it
                    // to the specified value if any
                    zindex = (value.zindex || 0) + (bindingContext[zIndexBaseBindingInfo.contextKey] || 0),
                    key = value.key || parent.getNewChildrenKey(zindex), // Automatic Key Value
                    leaf = new CustomKeyTipLeaf($(element).parent()[0], key, () => $(element).find('table').get(0).focus(), null, zindex);


                parent.addChild(leaf);

                ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                    leaf.parent.removeChild(leaf);
                });
            }
        };


        class KeyTipsController {

            root: IKeyTipTreeNode;

            keyTipsSelection: string;

            keyTipsShowing: boolean;

            lastKeyTipsGroupSelected: IKeyTipTreeNode;

            settings: {};

            keyTipPopups: any[] = [];

            stack: string;

            constructor(root: IKeyTipTreeNode) {

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

                $(document).keydown(e => this.handleKeyDown(e));
                $(document).click(e => this.handleClick(e));
            }

            private handleClick(e) {
                if (this.keyTipsShowing) {
                    this.reset();
                }
            }

            private handleKeyDown(e) {

                //Esc presed
                if (e.keyCode == 27 && this.keyTipsShowing) {
                    this.back();
                }
                //cursor pressed
                else if (this.keyTipsShowing && (e.keyCode == 37 || e.keyCode == 38 || e.keyCode == 39 || e.keyCode == 40)) {
                    this.reset();
                }
                else if (this.shiftAndAltPressed(e)) {
                    if (this.keyTipsShowing) {
                        this.reset();
                    }
                    else {
                        $(document.activeElement).blur();
                        this.showKeyTipsGroupSelection();
                    }
                }
                else if (this.keyTipsShowing) {

                    this.keyTipsSelection = String.fromCharCode(e.keyCode);

                    if (this.keyTipsSelection.length == 1) {
                        setTimeout(() => this.handleKeyTipsSelection(), 250);
                    }
                }

            }

            private handleKeyTipsSelection() {
                this.handleKeyTipPressed();
                this.keyTipsSelection = '';
            }

            private handleKeyTipPressed() {

                var temp = this.stack + this.keyTipsSelection;
                var zindex = _.max(_.map(this.lastKeyTipsGroupSelected.children, (x) => x.zindex));

                var flag = _.some<IKeyTipTreeNode>(this.lastKeyTipsGroupSelected.children, (x) => x.key.indexOf(temp) == 0 && x.zindex == zindex && $(x.element).is(":visible"));
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
                        }
                        else {
                            this.reset();
                        }
                    }
                    else if (this.stack.length > 0 && child.key.indexOf(this.stack) != 0) {
                        this.keyTipPopups[i].css("display", 'none');
                    }
                }
            }

            private shiftAndAltPressed(e): boolean {
                return (e.keyCode == 16 && e.altKey) || (e.keyCode == 18 && e.shiftKey);
            }

            private back(): void {
                this.stack = '';
                if (this.lastKeyTipsGroupSelected.after) this.lastKeyTipsGroupSelected.after();
                this.hideKeyTipsGroupSelection();
                if (this.lastKeyTipsGroupSelected.parent) {
                    this.lastKeyTipsGroupSelected = this.lastKeyTipsGroupSelected.parent;
                    this.showKeyTipsGroupSelection();
                }
                else {
                    this.reset();
                }
            }

            private showKeyTipsGroupSelection(): void {
                if (this.keyTipPopups.length == 0) {
                    var zindex = _.max(_.map(this.lastKeyTipsGroupSelected.children, (x) => x.zindex));
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

            }

            private hideKeyTipsGroupSelection(): void {
                $.each(this.keyTipPopups, function () {
                    $(this).remove();
                });

                this.keyTipPopups = [];
            }

            private reset(): void {
                if (this.lastKeyTipsGroupSelected.after) this.lastKeyTipsGroupSelected.after();
                this.stack = '';
                this.lastKeyTipsGroupSelected = this.root;
                this.hideKeyTipsGroupSelection();
                this.keyTipsShowing = false;
            }

            private getOffset(element, settings) {

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
            }

            private getPopupLocation(element, settings): any {
                var $el = $(element),
                    popupLocation,
                    offset;

                if ($el.is(":hidden") || $el.css("visibility") === "hidden") {
                    return false;
                }

                popupLocation = $el.offset();
                offset = this.getOffset(element, settings);

                return {
                    left: popupLocation.left + offset.left,
                    top: popupLocation.top + offset.top
                };

            }

            private createPopup(field, accessKey, settings) {

                var popup = $("<div/>")
                    .text(accessKey)
                    .addClass(settings.popupClass)
                    .prependTo(field);

                return popup;

            }

        }

        var root = new CustomKeyTipNode(null, null, null, null, null),
            tree = new CustomKeyTipTree(root),
            controller = new KeyTipsController(root);

    }


    export module HtmlTunneling {

        export class HtmlTunnel {

            private entrance;
            private exit;

            constructor() {

            }

            setEntrance(entrance) {
                this.entrance = entrance;
            }

            setExit(exit) {
                if (!this.exit)
                    this.exit = exit;
            }

            makeFlow() {

                //console.log($(this.exit));
                //console.log($(this.entrance).html());
                $(this.exit).html($(this.entrance).html());
                //$(this.entrance).empty();
                console.log('FLOW DONE!!');
            }

            isComplete() {
                return (this.entrance && this.exit) ? true : false;
            }

            flowsCount() {

            }

            getEntrance() {
                return this.entrance;    
            }

            getExit() {
                return this.exit;
            }
        }
  
        interface HtmlTunnelOptions {

            id: string;  // tunnel id
            end: string; // entrance or exit

        }

        var HtmlTunnelsDict = {};

        ko.bindingHandlers['htmlTunnel'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

                var options: HtmlTunnelOptions = ko.unwrap(valueAccessor()),
                    id = options.id,
                    end = options.end;

                if (!HtmlTunnelsDict[id]) {
                    HtmlTunnelsDict[id] = new HtmlTunneling.HtmlTunnel();
                }

                var tunnel = HtmlTunnelsDict[id];

                if (end === 'entrance') {
                    tunnel.setEntrance(element);
                }
                else {
                    tunnel.setExit(element);
                }

                if (tunnel.isComplete()) {

                    tunnel.makeFlow();

                    ko.applyBindingsToDescendants(bindingContext, tunnel.getExit());
                }

                ko.utils.domNodeDisposal.addDisposeCallback(element, () => {

                    for (var id in HtmlTunnelsDict) {

                        var t = HtmlTunnelsDict[id];

                        if (t.getEntrance() == element) {

                            var exit = t.getExit();

                            var children = $(exit).children();

                            _.forEach(children, (x) => {

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

    }

    enum PinUnpinStatus {
        Expanded, Collapsed, Preview
    }

    ko.bindingHandlers['pinunpin'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var $element = $(element),
                collapsedInitially: KnockoutObservable<boolean> = valueAccessor(),
                status = ko.observable(collapsedInitially && ko.unwrap(collapsedInitially) ? PinUnpinStatus.Collapsed : PinUnpinStatus.Expanded),
                checkboxObservable = ko.computed<boolean>({
                    read: () => status() === PinUnpinStatus.Expanded,
                    write: value => status(value ? PinUnpinStatus.Expanded : PinUnpinStatus.Collapsed)
                }),
                collapsedObservable = ko.computed(() => status() === PinUnpinStatus.Collapsed),
                context = bindingContext.extend({
                    '$jigsawPinUnpinCheckbox': checkboxObservable
                });

            ko.applyBindingsToNode(element, { css: { 'pin-unpin-collapsed': collapsedObservable } }, bindingContext);
            ko.applyBindingsToDescendants(context, element);

            // this can be used as a helper for the click handler, in case the checkbox binding isn't appropiate
            checkboxObservable['negate'] = (_, e:JQueryEventObject) => {
                checkboxObservable(!checkboxObservable());
                e.preventDefault();
                e.stopPropagation();
            };

            $element.click(() => {
                if (status() === PinUnpinStatus.Collapsed) {
                    status(PinUnpinStatus.Preview);
                }
            });

            /** detect click outside the bounds of an element, thanks to http://stackoverflow.com/a/7385673/763705 */
            function clickOutsideBounds(e) {
                if (status() === PinUnpinStatus.Preview
                    && !$element.is(e.target) // if the target of the click isn't the container...
                    && $element.has(e.target).length === 0) // ... nor a descendant of the container
                {
                    status(PinUnpinStatus.Collapsed);
                }
            }

            $(document).mouseup(clickOutsideBounds);

            if (collapsedInitially && ko.isObservable(collapsedInitially)) {
                status.subscribe(x => collapsedInitially(x === PinUnpinStatus.Collapsed));
            }

            ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                $element.unbind('click');
                $(document).unbind('mouseup', clickOutsideBounds);
            });

            return { controlsDescendantBindings: true };

        }
    }

    export module SwiperEffect {

        var MinimumHeight = 300;

        interface IRibbonSwiperSettings {

            element: HTMLElement;

            tabs;

            collapsed;

            speed: number;

        }

        class RibbonTabSwiper {

            private element;
            private tabs: KnockoutObservable<any>;
            private collapsed: KnockoutObservable<boolean>;
            private speed: number;
            private emptySpaces: boolean;
            private disposables: Common.IDisposable[] = [];

            private wrapperPositionBefore: number;
            private wrapperPositionAfter: number;

            container = null;
            ribbonTabSwiper: Swiper = null;
            N = 0; //tabsNumber
            tabActiveClass = 'active';
            lastHeight = null;
            

            constructor(private settings: IRibbonSwiperSettings) {

              
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
                $(this.element).on('touchstart mousedown click', '.tabs a', (e) => this.tabsHandler(e));

                $(this.element).on('touchend click', '.content-slide-end', (e) => this.endsOfEachSlideClickHandler(e));

                //patch to recalculate swipe slider margins
                setTimeout(() => this.refresh(), 5000);

                //handle window resize for responsive behavior
                $(window).resize(() => this.handleViewPortResize());
            }


            updateTabsStatus() {
                $(this.element).find(".tabs " + "." + this.tabActiveClass).removeClass(this.tabActiveClass);
                $(this.element).find(".tabs li").eq(this.ribbonTabSwiper.activeIndex).addClass(this.tabActiveClass);
            }

            initSwiper() {

                this.ribbonTabSwiper = new Swiper(this.container, {
                    speed: this.speed,
                    onSlideChangeStart: () => {
                        this.updateTabsStatus();
                    },
                    onTouchStart: () => {
                        this.wrapperPositionBefore = this.ribbonTabSwiper.getWrapperTranslate();
                    },
                    onTouchEnd: () => {
                        this.wrapperPositionAfter = this.ribbonTabSwiper.getWrapperTranslate();
                        this.updateTabsStatus();
                    },
                    freeMode: true,
                    //freeModeFluid: true,
                    slidesPerView: 'auto'
                });

            }

            collapseSubscription() {

                this.disposables.push(

                    this.collapsed.subscribe(x => {
                        if (x) {
                            this.collapse();
                        } else {
                            this.expand();
                        }
                    })

               );
            }

            tabsSubscription() {

                this.N = $(this.element).find(".tabs li").length;

                this.disposables.push(

                    this.tabs.subscribe(x => {

                        if (x.length < this.N) {

                            this.popSlider();

                            this.activateSlide(0);

                        }

                        if (x.length > this.N) {

                            this.pushSlider();

                            this.activateSlide(this.N);

                        }

                        this.N = x.length;

                    })
               );
            }

            activateSlide(index: number) {
                var tab = $(this.element).find(".tabs li").get(index);
                setTimeout(() => $(tab).children().first().click(), 200);
            }

            tabsHandler(e) {

                e.preventDefault();

                $(this.element).find(".tabs " + "." + this.tabActiveClass).removeClass(this.tabActiveClass);

                var $target = $(e.currentTarget).parent();

                $target.addClass(this.tabActiveClass);

                this.ribbonTabSwiper.swipeTo($target.index());

            }

            refresh() {

                this.ribbonTabSwiper.reInit(true);

            }

            pushSlider() {
                this.refresh();
            }

            popSlider() {
                this.refresh();
            }

            collapse() {
                this.refresh();
                this.triggerResize();
            }

            expand() {
                this.refresh();
                this.triggerResize();
            }

            triggerResize() {
                Common.triggerResize($(this.element).parent().parent());
            }

            handleViewPortResize() {

                var currentHeight = $(document).height();

                if (currentHeight != this.lastHeight && currentHeight < MinimumHeight) {
                    this.collapsed(true);
                    this.lastHeight = currentHeight;
                }

            }

            destroy() {
                $(this.element).unbind('touchstart touchend mousedown click');

                this.ribbonTabSwiper.destroy();

                _.forEach(this.disposables, disposable => disposable.dispose());
            }

            endsOfEachSlideClickHandler(e) {

                if (this.wrapperPositionAfter <= this.wrapperPositionBefore) {
                    this.ribbonTabSwiper.swipeNext();
                }
                else {
                    this.ribbonTabSwiper.swipePrev();
                }

            }

         
        }

        ko.bindingHandlers['ribbonTabsSwiper'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

                // bind our child elements (which will create the virtual foreach elements)
                ko.applyBindingsToDescendants(bindingContext, element);

                var options: any = ko.unwrap(valueAccessor()),
                    speed = options.speed || 200,
                    emptySpaces = options.emptySpaces || false,
                    ribbonTabsSwiper = new RibbonTabSwiper({ element: element, tabs: options.tabs, collapsed: options.collapsed, speed: speed, emptySpaces : emptySpaces });

/*                ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                    ribbonTabsSwiper.destroy();
                });*/

                // tell KO we have already bound the children
                return { controlsDescendantBindings: true };

            }
        };
    }
}

/* Module : DragDrop */
export module DragDrop {
    /** this variable holds data that is being dragged */
    var DragData = null;

    export interface DraggableOptions {
        group: string;
        appendTo?: string
        axis?: any;
        cursorOffset?: any;
        data: any;
        wrap?: boolean;
        filter;
        hint?: any;
        /** the hint is created by clonning this element when no hint template is specified */
        hintTarget?: string;
    }

    export function makeDraggable(element: Element, value: DraggableOptions) {
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
            helper: item => {
                var dragHint: JQuery;
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
                    dragHint = hintTarget.clone()
                        .height($element.height())
                        .width($element.width());
                }

                if (!value.wrap) {
                    return dragHint.addClass('drag-hint');
                } else {
                    return $(templates.DragWrap()).addClass('drag-hint').append(dragHint);
                }
            },
            start: e => {
                DragData = ko.unwrap(value.data);
                $element.addClass('dragging');
            },
            stop: e => {
                DragData = null;
                $element.removeClass('dragging');
                try {
                    $element.draggable("enable");
                } catch (e) {
                    // Do nothing if the element is not a draggable
                }
            }
        });
    }

    ko.bindingHandlers['jQueryUIDraggable'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value: DraggableOptions = ko.unwrap(valueAccessor()),
                draggable = makeDraggable(element, value);

            ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                draggable && draggable.draggable() && draggable.draggable("destroy");
            });
        }
    }

    export function makeDropTarget(element: Element, dropViewModel, value: JQueryUIDropTargetOptions) {
        var $element = $(element);

        return $element.droppable({
            scope: value.group,
            tolerance: 'touch',
            drop: () => {
                DragData && value.drop.call(dropViewModel, DragData);
                $element.removeClass('can-drop');
            },
            hoverClass: 'can-drop',
            over: (e, ui) => {
                ui.helper.addClass('can-drop');
            },
            out: (e, ui) => {
                ui.helper.removeClass('can-drop');
            }
        });
    }

    export interface JQueryUIDropTargetOptions {
        group: string;
        drop(data): void;

        toParent?: string;
    }

    ko.bindingHandlers['jQueryUIDropTarget'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var $element = $(element),
                value: JQueryUIDropTargetOptions = ko.unwrap(valueAccessor()),
                target = value.toParent ? $element.parents(value.toParent)[0] : element,
                dropTarget = makeDropTarget(target, viewModel, value);

            ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                dropTarget && dropTarget.droppable() && dropTarget.droppable("destroy");
            });
        }
    }
}

/* Module : Collection */
export module Collection {

    /** represents a collection that is modified throught async operations */
    export interface IKoCollection<T> {
        items: KnockoutObservableArray<T>;

        add(item: T): void;
        remove(...items: T[]): void;
    }

    /** adds a condition that must be met by all the items in the collection */
    export interface IKoSetCollection<T> extends IKoCollection<T> {
        /** returns true if the passed item belongs to the set represented by this item */
        belongsTo(item: T): boolean;
    }

    export class SetCollection<T> implements IKoSetCollection<T> {
        items: KnockoutObservableArray<T> = ko.observableArray<T>();

        constructor() {

        }

        add(item: T): void {
            this.items.push(item);
        }

        remove(...items: T[]): void {
            this.items.removeAll(items);
        }

        /** to be implemented in derived classes, always returns true */
        belongsTo(item: T): boolean {
            return true;
        }
    }

    /** this class is intended to compose a collection from different collections, where
    each collection represent a disjunt set in the space of <T> */
    export class MultiSetCollection<T> implements IKoSetCollection<T> {
        items = ko.observableArray<T>();

        parts = ko.observableArray<IKoSetCollection<T>>();
        missingItems = new SetCollection<T>();

        /** if 'storeMissingItems' == true then all elements that doesn't below to any set
        will be stored in a special part created just for them */
        constructor(public storeMissingItems = false) {

            // TODO improve union algorithm between parts
            ko.computed(() => {
                var partItems = _.map(this.parts(), part => part.items());
                if (storeMissingItems) {
                    partItems.push(this.missingItems.items());
                }
                var items = _.union.apply(_, partItems);
                return this.mapItems(items);
            })
                .extend({ throttle: 500 })
                .subscribe((items: T[]) => {
                    // remove all items without sending any notification
                    this.items().splice(0);
                    this.items.push.apply(this.items, items);
                });
        }

        /** modifies the resulting array in some way just before updating it */
        mapItems(items: T[]): T[] {
            return items;
        }

        /** adds a new part to compose the items of this collection */
        blendWith(...collections: IKoSetCollection<T>[]) {
            this.parts.push.apply(this.parts, collections);
        }

        add(item: T): void {
            // find the collection where this items fits
            var collection = _.find<IKoSetCollection<T>>(this.parts(), x => x.belongsTo(item));
            if (collection) {
                collection.add(item);
            } else if (this.storeMissingItems) {
                this.missingItems.add(item);
            } else {
                throw new Error('there is no place where I can add the passed item');
            }
        }

        remove(item: T): void {
            var collection = _.find<IKoSetCollection<T>>(this.parts(), x => x.belongsTo(item));
            if (collection) {
                collection.remove(item);
            } else if (this.storeMissingItems) {
                this.missingItems.remove(item);
            } else {
                throw new Error('the given item does not belong to any set');
            }
        }

        belongsTo(item: T): boolean {
            return _.any<IKoSetCollection<T>>(this.parts(), x => x.belongsTo(item)) || this.storeMissingItems;
        }

        findPartContaining(item: T) {
            return _.find<IKoSetCollection<T>>(this.parts(), part => part.belongsTo(item));
        }
    }

}

/** features borrowed from Backbone.Marionette in order to remove all references
to these libraries from Jigsaw */
export module Marionette {

    export interface TemplateFunction {
        (data?): any;
    }

    export interface ViewOptions {
        /** function to generate the template for the view, this function can
        return any object that can be injected into jQuery to build an HTML
        element. */
        template: TemplateFunction;

        /** optionally the view can be attached to this view-model when attached
        to the DOM,  */
        viewModel?: any;
    }

    /** combination between Backbone and Marionette base View class */
    export class View {
        /** returns the array of elements created after the view was rendered */
        element: JQuery = null;

        _renderedEvent = new Common.Event();
        private _closedEvent = new Common.Event();

        constructor(public options: ViewOptions) {

        }

        get isClosed() { return this.element === null; }

        /** helper function to set the view model after the view has been created.
        It will throw an exception if there's already a viewmodel setted */
        withViewModel(viewModel: any) {
            if (this.options.viewModel) {
                throw new Error('a view can only have one view-model associated');
            }
            this.options.viewModel = viewModel;

            return this;
        }

        /** returns the data that should be used to generate the template if any */
        templateData() {
            return null;
        }

        /** renders the current view, this method should be protected. */
        renderOverride() {
            return Q(this.options.template(this.templateData()))
                .then(template => {
                    this.element = $(template);
                });
        }

        render() { // should be sealed
            if (!this.isClosed) {
                this.close();
            }

            return this.renderOverride()
                .finally(() => {
                    this._renderedEvent.fire();
                });
        }

        rendered(handler: () => void) {
            return this._renderedEvent.add(handler);
        }

        find(selector: string) {
            return this.element.find(selector);
        }

        close() {
            if (this.isClosed) return;

            if (this.element) {
                // clean knockout bindings if a view model was specified
                if (this.options.viewModel) {
                    this.element.each((_, element) => {
                        ko.cleanNode(element);
                    });
                }

                this._closedEvent.fire();

                this.element = null;
            }

        }

        closed(handler: () => void) {
            return this._closedEvent.add(handler);
        }

        /** this method is called by the parent region when the view is attached to the DOM,
        don't call it. */
        domReady() {
            if (this.options.viewModel) {
                this.element.each((_, element) => {
                    if (element.nodeType !== Node.TEXT_NODE) {
                        ko.applyBindings(this.options.viewModel, element);
                    }
                });
            }
        }
    }

    /** returns a function that can be used as a templateFunction for views */
    export function urlTemplate(url, data?): TemplateFunction {
        var template: TemplateFunction;
        return result;

        function result(helpers?) {
            if (template) {
                return template(helpers);
            } else {
                return ajax.get(url, data)
                    .then((rawTemplate: string) => {
                        template = _.template(rawTemplate);
                        return result(helpers);
                    });
            }
        }
    }

    export function remoteSourceTemplate(remoteSource: Common.RemoteResource<string>): TemplateFunction {
        var template: TemplateFunction;
        return result;

        function result(helpers?) {
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

    export interface RegionOptions {
        /** returns the region's target element */
        element: JQuery;
    }

    /** convenience class name for empty regions */
    var EMPTYREGION = 'empty-region';

    export class Region {
        private _view: View;
        private _renderHandler: Common.IDisposable;
        private _closedHandler: Common.IDisposable;

        constructor(public options: RegionOptions) {
            $(options.element).addClass(EMPTYREGION);
        }

        show(view: View) {
            // check if there's a previous view opened
            this.close();

            // replace the current view
            this._view = view;
            var ignoreRender = true;
            this._renderHandler = view.rendered(() => {
                // below the view.render() method is called, and the rendered event will be raised
                // for those cases it should be ignored
                if (ignoreRender) return;
                this.viewRendered();
            });
            this._closedHandler = view.closed(() => this.removeView());

            // render the new view
            return view.render()
                .then(() => {
                    this.viewRendered();
                    ignoreRender = false;
                });
        }

        /** called when the render event of the view is raised */
        private viewRendered() {
            this.reloadView();

            // notify the new view elements that they are in the DOM
            this._view.domReady();
        }

        /** this is called when the view's render method is called, and the element
        on the region must be updated */
        private reloadView() {
            this.options.element.empty().append(this._view.element);
            this.options.element.removeClass(EMPTYREGION);
        }

        close() {
            if (this._view) {
                this.removeView();
                this._renderHandler.dispose();
                this._closedHandler.dispose();
                this._view.close();
                this._view = null;
            }
        }

        /** removes the element of an already closed view */
        private removeView() {
            if (this._view.element) {
                this._view.element.remove();
                this.options.element.addClass(EMPTYREGION);
            }
        }

        /** removes the target view from the current region without closing it,
        so it can be re-attached in another region without rendering the view */
        detach() {
            var view = this._view;

            if (view) {
                view.element.detach();
                this._renderHandler.dispose();
                this._closedHandler.dispose();
                this._view = null;
            }

            return view;
        }

        attach(view: View) {
            this.close();
            this._view = view;
            this._renderHandler = view.rendered(() => this.viewRendered());
            this._closedHandler = view.closed(() => this.removeView());
            this.reloadView();
        }

        domReady() {
            if (this._view) {
                this._view.domReady();
            }
        }
    }

    export interface LayoutOptions extends ViewOptions {
        regions: { [name: string]: string };
    }

    export class Layout extends View {
        options: LayoutOptions;
        regionNames: string[];

        private _detachedViews: {} = {};

        constructor(options: LayoutOptions) {
            super(options);

            this.regionNames = _.keys(this.options.regions);
        }

        renderOverride() {
            return super.renderOverride()
                .then(() => {
                    // initialize regions after the view has been rendered
                    _.each(this.regionNames, regionName => {
                        var region: Region = new Region({ element: this.find(this.options.regions[regionName]) });
                        this[regionName] = region;
                    });
                });
        }

        /** this is called when the layout is re-rendered. detaches all associated
        views and re-attaches them once the layout has been recreated; so associated 
        views don't have to be recreated when the layout is re-rendered. */
        private renderAndKeepViews() {
            var region; // save all the view regions

            _(this.regionNames).each(regionName => {
                var region: Region = this[regionName];
                this._detachedViews[regionName] = region.detach();
            });

            // bindings need to be removed from root element
            _(this.element).each(x => ko.cleanNode(<any>x));

            return this.renderOverride();
        }

        render() {
            if (!this.isClosed) {
                // assume the layout is being re-rendered
                // all views will be detached and stored in this._detachedViews
                // then all views will be re-atached when domReady is called
                return this.renderAndKeepViews()
                    .finally(() => {
                        this._renderedEvent.fire();
                    });
            } else {
                return super.render();
            }
        }

        close() {
            // and close/delete regions
            _.each(this.regionNames, regionName => {
                var region: Region = this[regionName];
                if (region) {
                    region.close();

                    this[regionName] = null;
                    delete region;
                }
            });

            super.close();
        }

        domReady() {
            super.domReady();

            _.each(this.regionNames, regionName => {
                var region: Region = this[regionName];

                // notify views inside of it's regions that the dom is ready,
                // all regions should have been created on the render method
                region.domReady();

                // check if there's any detached view to re-attach to this region
                if (this._detachedViews[regionName]) {
                    region.attach(this._detachedViews[regionName]);
                    delete this._detachedViews[regionName];
                }
            });
        }
    }

    export class CollectionView extends View {
        private _views: View[] = [];

        constructor(root = 'div') {
            super({ template: () => $('<' + root +'>') });
        }

        add(item: View) {
            this._views.push(item);
        }

        render() {
            return super.render()
                .then(() => {
                    var renderPromises = _(this._views).map(view => view.render());
                    return Q.all(renderPromises)
                        .then(() => {
                            _(this._views).each(view => {
                                this.element.append(view.element);
                            });
                        });
                });
        }

        close() {
            // close all inner views
            _(this._views).each(view => view.close());
            super.close();
        }

        domReady() {
            _(this._views).each(view => view.domReady());
        }
    }

    /** represents a delegate that can be used to get a view from a given object */
    export interface IRenderer<T> {
        (item: T): Marionette.View;
    }

    /**  */
    export function renderViewIntoElement(element: JQuery, view: View) {
        var region = new Region({ element: element });

        region.show(view).done();

        return {
            dispose: () => {
                region.close();
                delete region;
            }
        }
    }
}

/* Module : Views */
export module Views {

    export interface IWindow {
        showDialog(): Q.Promise<any>;
        close(): void;
    }

    export enum WindowSize {
        SMALL,
        MEDIUM,
        LARGE,
    }

    export interface WindowOptions {

        close?: (e) => void;
        size?: WindowSize; 

    }

    export class WindowView implements IWindow {
        
        /** initialized when a new dialog is to be shown, and this promise get's resolved
        when the dialog is closed */
        private _dialogDefered: Q.Deferred<any>;

        private _preventWindowClose = true;

        private $dialogWrapper: JQuery; 

        private renderingResult;

        constructor(public view: Marionette.View, public options: WindowOptions = {}) {
            
            var size = (options.size || options.size === 0) ? options.size : Views.WindowSize.MEDIUM;

            this.$dialogWrapper = $(templates.Dialog({ size: size }));

        }

        showDialog() {
            
            //if (this.$dialogWrapper) {
            //    throw new Error('the window is still open');
            //}

            this._dialogDefered = Q.defer();

            // render the view and show it on a window
            return this.view.render()
                .then(() => {
                    
                    this.$dialogWrapper.appendTo('body');

                    this.renderingResult = Marionette.renderViewIntoElement(this.$dialogWrapper.find('.modal-content'), this.view);

                    //This event is fired immediately when the hide instance method has been called.
                    this.$dialogWrapper.on('hide.bs.modal', (e) => this.windowCloseHandler(e));

                    //This event is fired when the modal has finished being hidden from the user (will wait for CSS transitions to complete).
                    this.$dialogWrapper.on('hidden.bs.modal', (e) => { this.destroyWindow(); });

                    return Q.delay(true, 100)
                        .then(() => {

                            // notify the view that it's DOM ready
                            //this.view.domReady();

                            //this.options.backdrop = 'static';
                            //this.options.keyboard = false;
                            this.$dialogWrapper.modal();


                            return this._dialogDefered.promise;
                        });

                });
        }


        private windowCloseHandler(e) {
            if (this._preventWindowClose && this.options.close) {
                e.preventDefault();
                // this should call the close method on this class
                this.options.close(e);
            }
        }


        /** Close the window, and destroys it after the close animation has completed */
        close() {
            this._preventWindowClose = false;
            this.$dialogWrapper.modal('hide'); // this calls destroyWindow after the window is closed
            this._preventWindowClose = true;
        }

        destroyWindow() {
            this.view.close();
            this.$dialogWrapper.data('modal', null);
            this.renderingResult.dispose();
            this.$dialogWrapper.remove();
            this.resolveDeferred();
        }

        private resolveDeferred() {
            this._dialogDefered.resolve(true);
        }
    }


    export class DialogMessageBase {
        private _window: WindowView;

        /** marks when the showDialog promise should fail */
        private _cancelFlag = false;

        constructor(template: Marionette.TemplateFunction, viewModel: any) {
            var view = new Marionette.View({
                template: template,
                viewModel: viewModel
            });
            this._window = new WindowView(view);
        }

        showDialog() {
            return this._window.showDialog()
                .then(() => {
                    if (!this._cancelFlag) {
                        return this.dialogResult();
                    } else {
                        this._cancelFlag = false;
                        // Cancel action, the promise should fail
                        return Q.reject();
                    }
                });
        }

        /** must be implemented in derived classes and return the Dialog's result
        after it has been closed */
        dialogResult(): any {
            throw new Error('not implemented');
        }

        cancel() {
            this._cancelFlag = true;
            this.close();
        }

        close() {
            this._window.close();
        }
    }

    export enum MessageBoxType {
        Question,
        QuestionYesNo
    }

    export enum MessageBoxResult {
        Yes,
        No,
        Cancel
    }

    export interface SmartMessageOptions {
        title: string;
        content: string;
        type?: MessageBoxType;
    }

    export function smartMessage(options: SmartMessageOptions) {
        var result = Q.defer<MessageBoxResult>();

        $.SmartMessageBox({
                title: options.title,
                content: options.content,
                buttons: options.type === MessageBoxType.QuestionYesNo
                ? '[No][Yes]'
                : '[Cancel][No][Yes]'
            }, x => {
                if (x === 'Yes')
                    result.resolve(MessageBoxResult.Yes)
                else if (x === 'No')
                    result.resolve(MessageBoxResult.No)
                else
                    result.resolve(MessageBoxResult.Cancel);
            });

        return result.promise;
    }

    export interface SmartInputOptions {
        title: string;
        content: string;
    }

    export function smartInput(options: SmartInputOptions) {
        var result = Q.defer<string>();

        $.SmartMessageBox({
                title: options.title,
            content: options.content,
                input: 'text',
                buttons: '[Cancel][Ok]'
            }, (x, content) => {
                if (x === 'Ok') {
                    result.resolve(content)
                } else {
                    result.reject(false);
                }
            });

        return result.promise;
    }

}

/* Module : Utils */
export module Utils {

    export function requirePromise(...modules: string[]): Q.Promise<any[]> {
        var deferred = Q.defer<any>();

        require(modules, () => {
            var result = _.toArray(arguments);
            deferred.resolve.apply(this, result);
        });

        return deferred.promise;
    }

    export function cssPromise(...url: string[]): Q.Promise<boolean>;
    export function cssPromise() {
        var deferreds = _.map(arguments,
            url => ajax.get(url)
                .then(css => {
                    $("<style type='text/css'></style>")
                        .html(css)
                        .appendTo('head');
                    return true;
                }));
        return Q.all(deferreds).then(() => true);
    }

    /** executes the specified function when the passed 'element' is idle 'ms' milliseconds,
    'minimumInterval' specifies the number of times that the control is checked for activity */
    export function runIdle(element: JQuery, ms: number, fun: () => void, minimumInterval = 1000): Common.IDestroyable {
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
            destroy: () => {
                element.unbind('mousemove', resetIdle);
                element.unbind('keydown', resetIdle);
            }
        }
    }

    /** detects if caps lock key is ative by checking at the event args of the key press event
    taken from: stackoverflow.com/questions/348792 */
    export function capsLockOn(e: JQueryKeyEventObject) {
        var s = String.fromCharCode(e.which);
        return s.toUpperCase() === s && s.toLowerCase() !== s && !e.shiftKey;
    }

    /** Loads the given CSS stylesheet */
    export function loadStylesheet(file) {
        // to load a stylesheet dynamically on IE need to call this method, but apparently the other 
        // way is best at least on IE10: document.createStyleSheet(file)

        return $("<link>").appendTo("head")
            .attr({ type: 'text/css', rel: 'stylesheet' })
            .attr('href', file);
    }

    export function sum(items: number[]) {
        var result = 0, i;
        for (i = 0; i < items.length; i++) {
            result += items[i];
        }
        return result;
    }

    export function scrollIntoView(element, container) {
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

    /** remove the given element from the array */
    export function remove<T>(array: T[], item: T): void {
        var index = _.indexOf(array, item);
        if (index >= 0) {
            array.splice(index, 1);
        }
    }

    /** replaces the contents of an array with new values */
    export function replace<T>(array: T[], newContent: T[]) {
        array.splice.apply(array, [0, array.length].concat(<any>newContent))
    }

    export function replaceObservable<T>(array: KnockoutObservableArray<T>, newContent: T[]) {
        array.splice.apply(array, [0, array().length].concat(<any>newContent))
    }

    export function waitForEvent(target, event: string): Q.Promise<any> {
        var result = Q.defer();
        target.one(event, e => result.resolve(e));
        return result.promise;
    }

    /* executes the given function asynchronously */
    export function async(expr: Function) {
        if (window.setImmediate) { window.setImmediate(expr); }
        else { window.setTimeout(expr, 0); }
    }

    /** returns the number of elements passing the given filter */
    export function count<T>(array: T[], filter: (x: T) => boolean) {
        var result = 0;
        _.each(array, item => {
            if (filter(item)) {
                result++;
            }
        });
        return result;
    }

    export function shake(element: JQuery, shakes = 3, distance= 3, duration= 100) {

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

    /** evaluates handler() different times separated by the specified timeout, when two calls return
    the same result callback is called */
    export function stabilize<T>(timeout: number, handler: () => T) {
        var previousValue = handler(),
            result = Q.defer<T>();

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
}


export module History {

    export interface IHistory {
        start();
        /** returns the current location */
        location(): string;
        navigate(route: string): void;
        register(route: string, callback: Function): void;
    }

    export class KendoHistoryProxy implements IHistory {
        router: kendo.Router;
        private _location: string;

        constructor() {
            this.router = new kendo.Router({
                change: e => this._location = e.url,
                routeMissing: e => console.error('route missing: ', e.url)
            });

            this._location = this.cleanUrl(window.location.hash);
        }

        private cleanUrl(url: string) {
            var hashStrip = /^#*/;
            return url.replace(hashStrip, '');
        }

        start() {
            this.router.start();
        }

        location(): string {
            return this._location;
        }

        navigate(route: string): void {
            this.router.navigate(route);
        }

        register(route: string, callback: Function): void {
            this.router.route(route, callback);
        }
    }

    /** All browser history should be managed throught an instance of this class inside this module */
    export class HistoryController {

        private door = new Knockout.Door();
        private _current;
        private _silent = false;
        private _firstRoute = true;

        private _beforeWakeCallback = new Common.DelayedCallbacks();

        private _mustReload = false;

        /** this is used to syncronize executing the callback on the navigateSilent method */
        private _routeCallback: Q.Deferred<Function> = null;

        constructor(private history: IHistory, private _showWelcomeScreen = true) {
            this._current = history.location();
        }

        /** adds a callback that will be executed before waking up the application */
        beforeWake(handler: () => Q.Promise<any>) {
            return this._beforeWakeCallback.add(handler);
        }

        start() {
            this.history.start();
        }

        location() {
            return this._current;
        }

        addGuardian(guardian: Knockout.Guardian) {
            this.door.add(guardian);
        }

        /** Navigates away from the page */
        navigate(route: string): void {
            // console.log('requested route', route);
            this.history.navigate(route);
        }

        /** navigates to the requested route and returns a promise that is resolved once
        the route callback is executed.  */
        navigateSilent(route: string, executeCallback = true): Q.Promise<boolean> {
            this._routeCallback = Q.defer<Function>();

            if (route != this._current) {
                // start the navigation if the route is different from the current route
                this._silent = true;
                this.navigate(route);

                return this._routeCallback.promise
                    .then(callback => {
                        this._silent = false;
                        return <any>this.tryNavigate(route)
                            .then((canNavigate) => {
                                if (canNavigate && executeCallback) {
                                    return callback.apply(this);
                                } else {
                                    return true;
                                }
                            });
                    });
            } else {
                // the route is active
                return Q(true);
            }
        }

        /** if possible navigates to the specified route, otherwise returns to the previous route,
        this method assumes that the route is already setted on the browser */
        private tryNavigate(route: string): Q.Promise<boolean> {
            return <any>this.door.open(route)
                .then(() => {
                    // the route is accepted, execute corresponding method
                    this._current = this.history.location();
                    return Q(true);
                })
                .fail(() => {
                    // the route isn't accepted, so navigate to the previous path
                    this.navigate(this._current);
                    return Q(false)
                });
        }

        /** the page will be reloaded when navigates to the next uri */
        mustReaload() {
            this._mustReload = true;
        }

        register(route: string, callback: Function) {
            var navigated = () => {
                if (this._mustReload) {
                    Utils.async(() => window.location.reload());
                    return;
                }

                var pathArguments = _.toArray(arguments);
                // only execute the route if the navigation isn't silent
                if (!this._silent) {
                    // only check the navigation if the current path and the navigated path are different
                    if (this._firstRoute && this._showWelcomeScreen) {
                        this.displayLoadingScreen(() => callback.apply(this, pathArguments));
                    } else if (this._current != this.history.location()) {
                        // executed when the URL is changed manually, by writing on the URL bar for example
                        // or clicking back/forward button
                        this.tryNavigate(this.history.location())
                            .then((canNavigate) => {
                                if (canNavigate) {
                                    return callback.apply(this, pathArguments);
                                }
                            })
                            .done();
                    }
                    // the first route is called using backbone internal methods, that's why that's a special case

                    this._firstRoute = false;
                } else {
                    // resolve the callback promise 
                    var silentCallback = () => callback.apply(this, pathArguments);
                    this._routeCallback.resolve(silentCallback);
                }
            }

            this.history.register(route, navigated);
        }

        /** displays the loading screen before executing the action and waits for it's 
        completition before removing the loading screen */
        private displayLoadingScreen(callback: () => Q.Promise<any>) {
            var loadingScreen = $(templates.LoadingScreen()),
                jigsawRoot = $('#jigsaw-root');

            this._beforeWakeCallback.fire()
                .then(() => {
                    // append the loading screen
                    $('body').append(loadingScreen);
                    //jigsawRoot.hide();
                    //return callback()
                    //.then(() => jigsawRoot.show());
                })
                .then(() => Q.delay(true, 500))
                .then(() => callback())
                .timeout(25000, 'initial module loading process is taking too long')
                .then(() => Q.delay(true, 500))
                .then(() => Knockout.flowStabilizer.start())
                .finally(() => {
                    // remove the loading screen
                    loadingScreen.remove();

                    delete loadingScreen;
                    delete jigsawRoot;
                })
                .done();
        }
    }

    export var history = new HistoryController(new KendoHistoryProxy());
}

export module Modules {

    export interface IModule {
        /** returns a list with the required modules */
        requiredModules(): IModule[];

        /** slave modules are modules that depends on this one, possibly because they enhace
        in some way the current module, for that reason they must be loaded when the current
        module is loaded.
        Because the slaves depends on this module, they get loaded after this module by
        the module manager. */
        slaveModules? (): IModule[];

        /** if this module is the head of a module tree that got loaded by a ModuleManager,
        then it can control if new modules can be loaded by implementing this method.
        Possible results are TRUE -> can be unloaded, (FALSE|REJECT) -> can NOT be unloaded*/
        canUnload? (): Q.Promise<boolean>;

        /** returns a deferred that is resolved when the module is completely loaded */
        load(): Q.Promise<any>;

        unload? (): Q.Promise<any>;
    }

    export class ModuleBase implements IModule {
        requiredModules(): IModule[] {
            return [];
        }

        load(): Q.Promise<any> {
            return Q(true);
        }

        unload() {
            return Q(true);
        }
    }

    export class ModuleWithSlavesBase extends ModuleBase {
        private _slaves: IModule[] = [];

        slaveModules() {
            return this._slaves;
        }

        addSlave(m: IModule) {
            this._slaves.push(m);
        }

        /** executes the given action as a slave of the current module */
        slaveExecute(execute: () => Q.Promise<any>) {
            this.addSlave({
                requiredModules: () => [this],
                load: execute
            });
        }

        slaveExecuteOneTime(execute: () => Q.Promise<any>) {
            var executed = false;
            this.slaveExecute(() => {
                if (!executed) {
                    executed = true;
                    return execute();
                }
                return Q(true);
            });
        }
    }

    function scheduleModuleLoading(target: IModule, loadedModules: IModule[]= []): Q.Promise<IModule[]> {

        var modules = new Common.Dict<IModule, Q.Promise<any>>();

        function schedule(target: IModule) {
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
                _.forEach(target.requiredModules(), m => schedule(m));
                if (target.slaveModules) {
                    _.forEach(target.slaveModules(), m => schedule(m));
                }

                return modules.get(target);
            } else {
                //console.log('scheduled loading of', target);
                // else - schedule module loading after having loaded all it's required modules
                var requiredModules = target.requiredModules(),
                    beforePromises = _.map(requiredModules, m => schedule(m)),
                    promise = Q.all(beforePromises)
                        .then(() => target.load())
                //.then(() => console.log('loaded module', target))
                ;

                modules.add(target, promise);

                if (target.slaveModules) {
                    return promise.then(() => {
                        // load slave modules, these doesn't need to be part of the loading tree
                        var slaves = target.slaveModules(),
                            afterPromises = _.map(slaves, m=> schedule(m));

                        return Q.all(afterPromises);
                    });
                }

                return promise;
            }
        }

        return schedule(target).then(() => modules.keys());
    }

    class FakeModule extends ModuleBase {
        constructor(private _requiredModules: IModule[]) {
            super();
        }

        requiredModules(): IModule[] {
            return this._requiredModules;
        }
    }

    export class ModuleManager {
        private _isLoading = false;
        private _loadedModules: IModule[] = [];
        /** contains the head modules that trigered the loading of all other modules. 
        New modules can only be loaded if the heads can be unloaded */
        heads: IModule[] = [];

        constructor(history?: History.HistoryController) {
            if (history) {
                history.addGuardian(() => this.canUnloadHeads());
            }
        }

        get isLoading() { return this._isLoading; }

        /** loads the given module and all it's dependencies and slaves */
        load(...targets: IModule[]): Q.Promise<any> {
            if (this._isLoading) {
                throw new Error("can't load a module while loading another");
            }
            this._isLoading = true;

            // Create a fake module that depends on the modules that need to be loaded
            var fake = new FakeModule(targets);

            return <any>scheduleModuleLoading(fake, this._loadedModules)
                .then((modules: IModule[]) => {
                    // unload modules that didn't got loaded
                    var tobeUnloaded = _.filter<Modules.IModule>(_.difference(this._loadedModules, modules), m => !!m.unload),
                        promises = _.map(tobeUnloaded, m=> m.unload());

                    return Q.all(promises)
                        .then(() => {

                            // be sure not to include the fake module on the currently loaded modules
                            this._loadedModules = _.without(modules, fake);

                            this.heads = targets;
                        });
                })
                .finally(() => {
                    this._isLoading = false;
                });
        }

        canUnloadHeads(): Q.Promise<boolean> {
            var filteredHeads = _.filter<Modules.IModule>(this.heads, m => !!m.canUnload),
                promises = _.map(filteredHeads, m => m.canUnload());

            return <any>Q.all(promises)
                .then(results => {
                    if (_.all<boolean>(results, x => x)) {
                        return Q(true)
                    } else {
                        return Q.reject();
                    }
                });
        }

        isLoaded(target: IModule) {
            if (this._isLoading) {
                throw new Error("can't load a module while loading another");
            }

            return _.contains(this._loadedModules, target);
        }
    }
}

export module Jigsaw {

    export function updateCache() {
        try {
            applicationCache.update();
        } catch (e) {

        }
    }

    //#region CoreModule

    export class AppLayout extends Marionette.Layout {
        content: Marionette.Region;
        active: Marionette.Region;

        constructor(viewModel: CoreViewModel) {
            super({
                template: templates.CoreMain,
                viewModel: viewModel,
                regions: {
                    content: "#main-content",
                    active: "#active-content"
                }
            });

            viewModel.updateTabStripInteraction.handle(() => this.updateTabStrip());
        }

        domReady() {
            super.domReady();

            this.updateTabStrip();
        }

        /** tweaks for the tabStrip to pick up all tabs generated by Knockout during the binding process */
        private updateTabStrip() {
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
        }
    }

    export interface CoreModuleBreadcrumbItem {
        text: string;
        href: string;
    }

    /** represents the core viewModel.
    This class doesn't inherit from ViewModelBase because ko.applyBindings needs to be applied
     after the view has been added to the DOM */
    export class CoreViewModel {
        ribbon = new Ribbon.RibbonSet();
        menu = new Ribbon.MenuSet();
        quickStart = ko.observableArray();

        breadcrumb = new Common.Breadcrumb<CoreModuleBreadcrumbItem>({ text: 'Home', href: '/#' });

        messageQueue = new Messages.InlineMessageQueue();

        /** when true shows an overlay on the entire page */
        isBusy = ko.observable(false);

        updateTabStripInteraction = new Common.InteractionRequest<void, void>();

        /** refresh the tabStrip tabs, this is called on the afterAdd parameter of a foreach binding
        on the template */
        updateTabStrip() {
            this.updateTabStripInteraction.request();
        }
    }
    /** this is the base module, all modules should depend on this one as it automatically contains
    references to other modules such as Security, Layout, FullScreen, ... This module doesn't depends
    of any other module */
    export class CoreModuleBase extends Modules.ModuleWithSlavesBase {
        layout: AppLayout;
        private viewModel: CoreViewModel;

        private stylesModules = new Theming.ContentStyleSheet(templates.styles);

        private jigsawBodyRegion: Marionette.Region;

        private globalErrorCatching: GlobalErrorCatching.Module;

        constructor() {
            super();

            this.viewModel = new CoreViewModel();
            this.layout = new AppLayout(this.viewModel);

            this.globalErrorCatching = new GlobalErrorCatching.Module(this.messageQueue,Messages);

            this.jigsawBodyRegion = new Marionette.Region({ element: $("#jigsaw-root") });
        }

        get isBusy() { return this.viewModel.isBusy(); }
        set isBusy(value: boolean) { this.viewModel.isBusy(value); }

        get ribbon() { return this.viewModel.ribbon }
        get menu() { return this.viewModel.menu }
        get quickStart() { return this.viewModel.quickStart; }

        get breadcrumb() { return this.viewModel.breadcrumb; }

        get messageQueue() { return this.viewModel.messageQueue; }

        /** main content region */
        get content() { return this.layout.content; }

        /** active content region, meant to be used to display details about the currently displayed content */
        get active() { return this.layout.active; }

        requiredModules(): Modules.IModule[] {
            return [this.stylesModules];
        }

        load(): Q.Promise<any> {
            return this.jigsawBodyRegion.show(this.layout);
        }

        unload() {
            return Q(true);
        }
    }

    export module Messages {

        export enum MessageLevel {
            Error, Warning, Success, Info
        }

        export interface Message {
            title: string;
            body: string;
            level?: MessageLevel;
            timeout?: number;
        }

        export interface MessageQueue {
            add(message: Message): Q.Promise<any>;
            remove(message: Message);
            clear(): MessageQueue;
        }

        export enum MessageQueueType {
            Inline=1, ExtraSmall=2, Small=3, Big=4
        }

        export class InlineMessageQueue implements MessageQueue {
            messages = ko.observableArray<Message>();

            add(message: Message) {
                this.messages.push(message);

                if (message.timeout) {
                    Q.delay(true, message.timeout)
                        .then(() => this.remove(message))
                        .done();
                }

                return Q(true);
            }

            remove(message: Message) {
                this.messages.remove(message);

                // delete message;
            }

            clear() {
                this.messages.removeAll();
                return this;
            }
        }

        export function ServerRequestError(status, text) {
            return { title: "Server error " + status, body: text };
        }

        /** this variable can be used to add new messages and template selector for them */
        export var messageTemplateSelector = new Knockout.TemplateSelector(templates.messages.Generic({
            alert: 'alert-info',
            header: 'Info!'
        }));
        messageTemplateSelector.candidate(templates.messages.Generic({
            alert: 'alert-warning',
            header: 'Warning!' 
        }), x => x.level === MessageLevel.Warning);
        messageTemplateSelector.candidate(templates.messages.Generic({
            alert: 'alert-success',
            header: 'Success!'
        }), x => x.level === MessageLevel.Success);
        messageTemplateSelector.candidate(templates.messages.Error(), x => x.level === MessageLevel.Error);


        ko.bindingHandlers['messageQueue'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var $element = $(element),
                    model: InlineMessageQueue = ko.unwrap(valueAccessor()),
                    context = bindingContext.createChildContext(model);

                // append the template to the element
                $element.addClass('messageQueue');

                ko.applyBindingsToNode(element, {
                    template: {
                        name: x => messageTemplateSelector.select(x),
                        foreach: model.messages,
                        templateEngine: Knockout.StringTemplateEngine,
                        afterRender: () => Common.triggerResize($element),
                        beforeRemove: node => {
                            $(node).remove();
                            Common.triggerResize($element);
                        },
                    }
                }, context);

                return { controlsDescendantBindings: true }
            }
        };

        module boxOptions {
            var error = {
                    color: "#C46A69",
                    icon: "fa fa-warning shake animated",
                },
                info = {
                    color: "#3276B1",
                    icon: "fa fa-bell swing animated",
                },
                warning = {
                    color: "#C79121",
                    icon: "fa fa-shield fadeInLeft animated",
                },
                success = {
                    color: "#739E73",
                    icon: "fa fa-check",
                };

            export function colorFor(level: MessageLevel) {
                switch (level) {
                    case MessageLevel.Error:
                        return error.color;
                    case MessageLevel.Info:
                        return info.color;
                    case MessageLevel.Warning:
                        return warning.color;
                    case MessageLevel.Success:
                        return success.color;
                }
            }

            export function iconFor(level: MessageLevel) {
                switch (level) {
                    case MessageLevel.Error:
                        return error.icon;
                    case MessageLevel.Info:
                        return info.icon;
                    case MessageLevel.Warning:
                        return warning.icon;
                    case MessageLevel.Success:
                        return success.icon;
                }
            }
        }


        /** displays smart-admin big box */
        export function bigBox(options: Message) {
            var result = Q.defer();

            $.bigBox({
                title: options.title,
                content: options.body,
                color: boxOptions.colorFor(options.level),
                icon: boxOptions.iconFor(options.level),
                timeout: options.timeout,
            }, () => result.resolve(true));

            return result.promise;
        }

        /** displays smart-admin small box */
        export function smallBox(options: Message) {
            var result = Q.defer();

            $.smallBox({
                title: options.title,
                content: options.body,
                color: boxOptions.colorFor(options.level),
                icon: boxOptions.iconFor(options.level),
                timeout: options.timeout,
            }, () => result.resolve(true));

            return result.promise;
        }

        /** displays smart-admin small box */
        export function extraSmallBox(options: Message) {
            var result = Q.defer();

            $.smallBox({
                title: options.title,
                content: options.body,
                color: boxOptions.colorFor(options.level),
                iconSmall: boxOptions.iconFor(options.level),
                timeout: options.timeout,
            }, () => result.resolve(true));

            return result.promise;
        }

        export class SmallBoxMessageQueue implements MessageQueue {
            add(message: Message) {
                return smallBox(message);
            }

            remove(message: Message) {
                
            }

            clear() {
                $('#divSmallBoxes').children().remove();
                return this;
            }
        }


        
        
        export class SmallBoxPrevNextMessageQueue extends SmallBoxMessageQueue {

            //message: JumpToMultipleResultsMessage
            add(message: any) {

                var result = super.add(message);

                $("#prev").bind('click', (e) => {
                    e.preventDefault(); e.stopPropagation();
                    message.findPrev();
                });

                $("#next").bind('click', (e) => {
                    e.preventDefault(); e.stopPropagation();
                    message.findNext();
                });

                result.then(() => this._removeListeners());

                return result;
                
            }

            remove(message: Message) {

            }

            clear() {
                this._removeListeners();
                return super.clear();
            }
            
            private _removeListeners() {
                $("#prev").unbind('click');
                $("#next").unbind('click');
            }

        }

        export class ExtraSmallBoxMessageQueue implements MessageQueue {
            add(message: Message) {
                return extraSmallBox(message);
            }

            remove(message: Message) {

            }

            clear() {
                $('#divSmallBoxes').children().remove();
                return this;
            }
        }

        export class BigBoxMessageQueue implements MessageQueue {
            add(message: Message) {
                return bigBox(message);
            }

            remove(message: Message) {

            }

            clear() {
                return this;
            }
        }

        export function createMessageQueue(type?: MessageQueueType) {
            switch (type) {
                case MessageQueueType.ExtraSmall:
                    return new ExtraSmallBoxMessageQueue();
                case MessageQueueType.Small:
                    return new SmallBoxMessageQueue();
                case MessageQueueType.Big:
                    return new BigBoxMessageQueue();
                default:
                    return new InlineMessageQueue();
            }
        }
    }

    export module Ribbon {

        export interface IRibbonItem {

        }

        export class RibbonGroup extends Common.PrioritySet<IRibbonItem> {
            constructor(public header: string) {
                super();
            }
        }

        export class RibbonTab extends Common.PrioritySet<RibbonGroup> {
            constructor(public header: string) {
                super();
            }

            filterItems(x: RibbonGroup) {
                return x.length > 0;
            }

            /** returns the group with the specified header if exist, otherwise creates a new group with 
            the specified header and priority */
            group(header: string, priority = 0) {
                var group = _.find<RibbonGroup>(this.items(), x=> x.header === header);
                if (!group) {
                    group = new RibbonGroup(header);
                    this.add(group, priority);
                }
                return group;
            }
        }

        /** collection to store the tabs for a ribbon bar, this is the top level object */
        export class RibbonSet extends Common.PrioritySet<RibbonTab> {
            filterItems(x: RibbonTab) {
                return _.any<RibbonGroup>(x.items(), group => group.length > 0);
            }

            /** returns the tab with the specified header if exist, otherwise creates a new tab with 
            the specified header and priority */
            tab(header: string, priority = 0) {
                var tab = _.find<RibbonTab>(this.items(), x=> x.header === header);
                if (!tab) {
                    tab = new RibbonTab(header);
                    this.add(tab, priority);
                }
                return tab;
            }


        }

        export class RibbonButton implements IRibbonItem {
            constructor(public text: any = "", public content: () => void = () => { }, public description = "", public cssClass= "") {
            }
        }

        export class RibbonSelect implements IRibbonItem {
            constructor(public text = "", public options = [], public selected?, public description = "", public cssClass= "") {
                if (!this.selected && this.options.length > 0) {
                    this.selected = options[0];
                }
            }
        }

        export var ribbonItemTemplateSelector = Knockout.makeForeachWithTemplateSelector('foreachRibbonItem', templates.ribbon.Button());
        ribbonItemTemplateSelector.candidate(templates.ribbon.Select(), x => x instanceof RibbonSelect);

        export class MenuSet extends RibbonTab {
            constructor() {
                super("");
            }
        }

        export var ribbonQuickStartTemplateSelector = Knockout.makeForeachWithTemplateSelector('foreachRibbonQuickStart');


        export interface HeaderOptions {
            header: string;
            priority?: number;
        }

        export interface RibbonItemModuleOptions {
            coreModule: CoreModuleBase;
            tab: HeaderOptions;
            group: HeaderOptions;

            priority?: number;
            items: IRibbonItem[];
        }

        export class RibbonItemModule extends Modules.ModuleBase {
            private storage = new Common.PrioritySet<IRibbonItem>();
            private _ribbonDisposable: Common.IDisposable;

            constructor(public options: RibbonItemModuleOptions) {
                super();

                this.storage.addAll(options.items, options.priority);
            }

            /** adds a new ribbon item */
            add(item: IRibbonItem, priority = 0) {
                this.storage.add(item, priority);
            }

            unload() {
                this._ribbonDisposable.dispose();

                return super.unload();
            }

            load() {
                this._ribbonDisposable = this.options.coreModule.ribbon
                    .tab(this.options.tab.header, this.options.tab.priority)
                    .group(this.options.group.header, this.options.group.priority)
                    .addAll(this.storage.items(), this.options.priority);

                return super.load();
            }
        }

    }

    export module Theming {

        export class ContentStyleSheet extends Modules.ModuleBase {
            private _element: JQuery;

            constructor(public content: string) {
                super();
            }

            unload() {
                if (this._element) {
                    this._element.remove();
                    delete this._element;
                }
                return super.unload();
            }

            load(): Q.Promise<any> {
                if (this.content) {
                    this._element = $("<style>").html(this.content).appendTo("head");
                }
                return super.load();
            }
        }

        export class StyleSheet extends Modules.ModuleBase {
            private _element: JQuery;

            constructor(public path: string, public async= false) {
                super();
            }

            unload() {
                if (this._element) {
                    this._element.remove();
                    delete this._element;
                }
                return super.unload();
            }

            load(): Q.Promise<any> {

                if (this.async) {
                    Utils.loadStylesheet(this.path);
                    return Q(true);
                }

                return ajax.get(this.path)
                    .then(content => {
                        this._element = $("<style>").html(<string>content).appendTo("head");
                        return true;
                    });
            }
        }

        export class Theme extends Modules.ModuleBase {
            private _styles: StyleSheet[];

            constructor(public name: string, styles: string[]) {
                super();

                this._styles = _.map(styles, path => new StyleSheet(path, true));
            }

            /** overwrite this module to run any custom JS code when the module is being loaded */
            initialize() {

            }

            unload() {
                // unload all resources used by this theme
                _.forEach(this._styles, (element: StyleSheet) => element.unload());

                return super.unload();
            }

            load(): Q.Promise<any> {
                return Q.fcall(() => {
                    var promises = _.map(this._styles, (style: StyleSheet) => style.load());
                    return Q.all(promises);
                });
            }
        }

        function addCantSwitchTemeBecauseOfflineMessage(coreModule: CoreModuleBase) {
            coreModule.messageQueue.add({ title: "Offline", body: "The current theme can't be switched if offline. Try it later.", level: Messages.MessageLevel.Error });
        }

        export class ThemeManager extends Modules.ModuleManager {
            themes = ko.observableArray<Theme>();
            private selectedTheme: GuardedObservable<Theme>;
            selectedThemeName: KnockoutComputed<string>;

            constructor(public coreModule: Jigsaw.CoreModuleBase, public accountModule: Account.AccountModule) {
                super();

                this.selectedTheme = ko.guarded<Theme>();
                this.selectedTheme.guard((theme?) =>
                    this.load(theme)
                        .fail(() => {
                            addCantSwitchTemeBecauseOfflineMessage(coreModule);
                            return <any>Q.reject();
                        }));

                this.selectedThemeName = ko.computed<string>({
                    read: () => this.selectedTheme() && this.selectedTheme().name,
                    write: name => {
                        var theme = this.getTheme(name);
                        if (theme) {
                            this.selectedTheme(theme);
                        } else {
                            throw new Error("Unknown theme name specified");
                        }
                    }
                });
            }

            /** returns the theme with the given name */
            private getTheme(name: string) {
                return _.find<Theme>(this.themes(), (theme) => theme.name === name);
            }

            register(...themes: Theme[]) {
                this.themes.push.apply(this.themes, themes);
            }

            initialize() {

                // update current theme every time the theme preferences changes
                this.accountModule.userState.subscribe(() => {
                    this.selectedThemeName(this.accountModule.getPreference("Theme"));
                    Jigsaw.updateCache();
                });

                // change user preferences every time the current theme changes
                this.selectedThemeName.subscribe(theme => {
                    this.accountModule.setPreferences({ Theme: theme });
                });

                var initialTheme: string = this.accountModule.getPreference("Theme");

                return this.selectedTheme.inject(this.getTheme(initialTheme));
            }

        }

        export function loadThemes(themeManager: ThemeManager) {

            var themes = _.map(JigsawConfig.Themes, (theme: ThemeDefinition) => new Theme(theme.Name, theme.Styles));
            _.forEach(themes, theme => themeManager.register(theme));
        }
    }

    export module Account {

        export function encript(data: string): string {
            // TODO add some encryption algorithm, possibly MD5 to store passwords on the client
            return data;
        }

        class AccountViewModel extends Common.ViewModelBase {
            view: Marionette.View;
            dataSubmited = $.Callbacks(); // fired every time new data is submitted

            messageQueue = new Messages.SmallBoxMessageQueue();

            user = ko.observable("");
            password = ko.observable("");
            processingForm = ko.observable(false);

            constructor() {
                super();

                // remove all custom errors when some of the fields is changed
                this.user.subscribe(() => this.messageQueue.clear());
                this.password.subscribe(() => this.messageQueue.clear());
            }

            /** this is called trought a knockout binding, see submit binding docs */
            submitForm(formElement) {
                if (this.processingForm()) return false;

                this.processingForm(true);
                var data = $(formElement).serialize();
                this.dataSubmited.fire(data);

                // cancel the default form action
                return false;
            }

            resetForm() {
                this.password("");
                this.messageQueue.clear();
                this.processingForm(false);
            }

            /** returns an encripted value that identifies the current user and password */
            userKey() {
                var data = this.user() + " - " + this.password();
                return encript(data);
            }
        }

        export enum UserState {
            None,
            Present,
            Dimmed
        }

        export class UserPreferences {
            values = {
                Theme: typeof JigsawConfig != 'undefined' ? JigsawConfig.DefaultTheme : ''
            };

            constructor(public url = "preferences", public storageKey = "preferences") {
                var value = localStorage.getItem(storageKey);
                if (value) {
                    this.set(JSON.parse(value));
                }
            }

            get(key: string) {
                return this.values[key];
            }

            set(preferences) {
                _.extend(this.values, preferences);
                localStorage.setItem(this.storageKey, JSON.stringify(this.values));
            }

            /** Stores all the attributes on the server */
            save() {
                return $.post(this.url, this.values);
            }
        }

        function showCantLogInBecauseOfflineMessage(coreModule: CoreModuleBase) {
            coreModule.messageQueue.add({
                title: "Error",
                body: "can't login because the application is offline."
                , level: Messages.MessageLevel.Error
            });
        }

        var userAutorized = JigsawConfig.InitialUserAutorized,
            userState = ko.observable(userAutorized ? UserState.Dimmed : UserState.None),
            // stores the previous user name to be used when the appliaction is offline
            // and allow the same user to log in again
            previousUserName = ko.observable("").extend({ persist: "previousUserName" }),
            // stores an encripted value of the previous user's password that logged in
            userKey = ko.observable("").extend({ persist: "userKey" }),
            // store user preferences
            preferences = new UserPreferences("/Account/Preferences"),
            // when the user logs in, all modules can add a finalizer promise that will get executed
            // once that user session is finalized
            sessionFinalizers: Q.Promise<any>[] = [];

        function logout(): Q.Promise<any> {
            return Q.all(sessionFinalizers)
                .then(() => Q($.post('/Account/LogOff', preferences.values)))
                .then((result: any) => {
                    if (result.success) {
                        userKey(""); // clear user key
                        userState(UserState.None);
                    } else {
                        // fail, so the user goes to a dimmed state
                        throw new Error("can't logout because server error");
                    }
                })
                .fail(() => {
                    // the application is offline, so the current user can't be logged out
                    // simulate this by putting the user in a dimmed state
                    userState(UserState.Dimmed);
                });
        }

        function login(viewModel: AccountViewModel, formData, addFinalizerCallbacks: JQueryCallback): Q.Promise<any> {
            return ajax.post('/Account/Login/?' + formData)
                .then((data: any) => {
                    if (data.success) {
                        // store current user key
                        userKey(viewModel.userKey());

                        // fire finalizers callbacks to allow modules to clear up things when the session
                        // is going to be terminated
                        sessionFinalizers.splice(0, sessionFinalizers.length);
                        addFinalizerCallbacks.fire(promise => sessionFinalizers.push(promise));

                        // update preferences
                        preferences.set(data.preferences);

                        userState(UserState.Present);
                    } else {
                        viewModel.resetForm();
                        viewModel.messageQueue.add({ title: "Something went wrong", body: data.errors, level: Messages.MessageLevel.Error });
                    }
                });
        }

        function showDialog(addFinalizerCallbacks: JQueryCallback, coreModule: CoreModuleBase) {

            // mark the UI as busy while the template is loading
            coreModule.isBusy = true;

            /** request the template for the account window content, this is requested every time 
            to get the AntiforgeryToken */
            ajax.get("/Account/Login")
                .then(template => {
                    coreModule.isBusy = false

                    // create a new window and show it
                    var viewModel = new AccountViewModel(),
                        view = new Marionette.View({ template: () => template, viewModel: viewModel }),
                        window = new Views.WindowView(view, { title: "Sign In", resizable: false, actions: [] });

                    viewModel.dataSubmited.add(formData => {
                        if (userState() === UserState.Dimmed) {
                            // check if the current password is the same as
                            if (viewModel.userKey() === userKey()) {
                                // same user trying to log in again, just switch the current state
                                userState(UserState.Present);
                                window.close();
                            } else {
                                return logout()
                                    .then(() => login(viewModel, formData, addFinalizerCallbacks))// and try log in for the new user
                                    .then(() => window.close());
                            }
                        } else if (userState() === UserState.None) {
                            return login(viewModel, formData, addFinalizerCallbacks)
                                .then(() => window.close());
                        }
                    });

                    // this promise is never resolved, however it fails if the cancel button is clicked
                    return window.showDialog();
                })
                .fail((error) => {
                    // if the trmplate request fails then we need to show an offline version of 
                    // the login form
                    coreModule.isBusy = false

                    if (!error) {
                        // the dialog was cancelled, then there's no error => do nothing

                    } else if (userState() === UserState.Dimmed) {
                        // create a new window and show it using the offline loginform template
                        var viewModel = new AccountViewModel(),
                            view = new Marionette.View({ template: templates.LoginForm, viewModel: viewModel }),
                            window = new Views.WindowView(view, { title: "Sign In", resizable: false, actions: [] });

                        viewModel.dataSubmited.add(formData => {
                            // check if the current password is the same as
                            if (viewModel.userKey() === userKey()) {
                                // same user trying to log in again, just switch the current state
                                userState(UserState.Present);
                                window.close();
                            } else {
                                // there's no conection and it isn't the same user
                                viewModel.resetForm();
                                viewModel.messageQueue.add({
                                    title: "Error",
                                    body: "Jigsaw is currently blocked and offline and only the previous user can unblock it.",
                                    level: Messages.MessageLevel.Error
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
                            level: Messages.MessageLevel.Error
                        });

                    }
                });
        }

        export class AccountModule extends Modules.ModuleBase {
            /** only allow read-only access to the user state variable, the real one will be hidden on the scopes */
            userState = ko.computed(() => userState());
            /** Notifies listeners when the user logs in, the state goes from: None -> Present */
            loggedIn = $.Callbacks();

            constructor(private coreModule: CoreModuleBase) {
                super();
                this._addRibbonButton();

                // when the idle timeout passes, show the login dialog and DIM the current user
                Utils.runIdle($(document), 1 * 60000 /*5 mins*/, () => {
                    if (this.userState() === UserState.Present) {
                        // check if there's an user present and simulate user log out
                        userState(UserState.Dimmed);
                        showDialog(this.loggedIn, this.coreModule);
                    }
                }, 60000);
            }

            getPreference(key: string) {
                return preferences.get(key);
            }

            setPreferences(attributes) {
                preferences.set(attributes);
            }

            private _addRibbonButton() {
                var buttonText = ko.computed(() => {
                    return this.userState() === UserState.Present ? "Sign out" : "Sign in";
                });

                this.coreModule.ribbon
                    .tab("Users")
                    .group("Security", 60)
                    .add(new Ribbon.RibbonButton(buttonText, () => this.ribbonButtonClicked(),
                        "Click to Sign in/out from the application", "fa fa-group"), 1);
            }

            ribbonButtonClicked() {
                if (userState() === UserState.Present) {
                    logout();
                } else {
                    showDialog(this.loggedIn, this.coreModule);
                }
            }
        }

        // shows a tooltip if capsLock is pressed onkeydown
        ko.bindingHandlers['capsLockWarning'] = {
            init: function (element, valueAccessor) {
                // Initially set the element to be instantly vi
                var tooltip = new kendo.ui.Tooltip(element, {
                    autoHide: true,
                    position: "bottom",
                    showOn: "none",
                    content: "Caps lock is active",
                }),
                    keypressEventHandler = e => {
                        if (Utils.capsLockOn(e)) {
                            tooltip.show($(element));
                        }
                        else {
                            tooltip.hide()
                        }
                    };

                $(element).keypress(keypressEventHandler);

                // if the HTML element is cleaned then remove the subscription
                ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                    $(element).unbind('keypress', keypressEventHandler);
                });
            }
        };
    }

    export module Sync {

        export interface IPendingChange {
            title: string;
        }

        /** Synchronizable objects are responsable for managing a list of pending changes and 
        commiting those to the server. Usually pending changes accumulates when the application
        is offline. This means that Synchronizable objects are also responsible for persisting
        the pending changes in some way. */
        export interface ISynchronizable {
            /** returns an array with all pending notifications */
            pending: KnockoutObservableArray<IPendingChange>;

            /** push all pending changes to the server, all pending notifications are removed
            if the operation is successful */
            sync(): Q.Promise<any>;
        }

        export class SyncManager implements Common.IDisposable {

            private syncs = ko.observableArray<ISynchronizable>();
            pendingChanges: KnockoutComputed<IPendingChange[]>;

            /** returns true while changes are being synced to the server */
            syncingChanges = ko.observable(false);
            subscription: Common.IDisposable;

            constructor() {
                this.pendingChanges = ko.computed(() => _.union.apply(_, _.map(this.syncs(), s=> s.pending())));

                // 5 seconds after the application started, check if there's some pending changes
                // and schedule a sync operation if the app is online
                setTimeout(() => {
                    if (this.pendingChanges().length > 0) {
                        ajax.connection.online()
                            .then(() => this.sync())
                            .done();
                    }
                }, 5000);

                var previousOnlineValue = ajax.connection.isOnline();
                this.subscription = ajax.connection.isOnline.subscribe(online => {
                    if (!previousOnlineValue && online) {
                        // there just was a transition from false => true
                        // the application just reconnected, so sync all pending changes if any
                        if (this.pendingChanges().length > 0) {
                            this.sync().done();
                        }
                    }
                    previousOnlineValue = online;
                });
            }

            dispose() {
                this.subscription.dispose();
                this.pendingChanges.dispose();
            }

            register(synchronizable: ISynchronizable) {
                this.syncs.push(synchronizable);
            }

            sync(): Q.Promise<any> {
                this.syncingChanges(true);
                return ajax.connection.online(true)
                    .then((online): Q.Promise<boolean> => {
                        if (online) {
                            return Q.all(_.map(this.syncs(), s => s.sync()))
                                .then(() => {
                                    this.syncingChanges(false);
                                    return true;
                                });
                        } else {
                            this.syncingChanges(false);
                            return Q(false);
                        }
                    });
            }
        }

        export class QuickStartNotification {
            pendingChangesCount: KnockoutComputed<number>;
            online = ko.computed(() => ajax.connection.isOnline());

            constructor(private syncManager: SyncManager) {
                this.pendingChangesCount = ko.computed(() => syncManager.pendingChanges().length);
            }

            sync() {
                return this.syncManager.sync();
            }
        }
        Ribbon.ribbonQuickStartTemplateSelector.candidate(templates.notification.SyncPendingChanges(), x => x instanceof QuickStartNotification);

        export class SyncModule extends Modules.ModuleBase {
            private _syncManager = new SyncManager();

            constructor(coreModule: Jigsaw.CoreModuleBase) {
                super();

                // load this module alongside with the core module, as it will display an icon
                // on the quick start
                //coreModule.addSlave(this);

                coreModule.quickStart.push(new QuickStartNotification(this._syncManager));
            }

            register(synchronizable: ISynchronizable) {
                this._syncManager.register(synchronizable);
            }
        }

    }

    export module Notifications {

        /** corresponds to the type Jigsaw.Data.Notification.NotificationLevel from the server */
        export enum NotificationLevel {
            Success= 0, Warning= 1, Error= 2
        }

        /** corresponds to the type Jigsaw.Data.Notification.NotificationBase from the server */
        export interface INotificationBase {
            /** Key identifing this notification in the collection, indicating to which module it belongs to */
            Owner: string;

            /** user that throwed this notification, could be a more specific type */
            Author: string;

            TimeStamp: Date;

            Level: NotificationLevel;
        }

        export class NotificationSetCollection<T extends INotificationBase> extends Collection.SetCollection<T> {
            constructor(public owner: string) {
                super();
            }

            belongsTo(item: T) {
                return item.Owner === this.owner;
            }
        }

        var NOTIFICATIONTIMEOUT = 60000;

        /** base multiset for all notifications. Using multi-sets may be over-kill for this
        use case, it could also be solved with a simple ObservableArray. The only advantage
        of using Multisets it to allow the client to control some notifications in some way
        but that isn't a requeriment... only pending changes on the mobile offline mode
        could benefit from this feature */
        export class NotificationMultiset extends Collection.MultiSetCollection<INotificationBase> implements Common.IDisposable {

            private _intervalId: number;

            constructor() {
                super(true);

                // todo notifications should dissapear after a setted time
                this._intervalId = setInterval(() => {
                    var now = new Date();
                    var itemsToRemove = _.filter<INotificationBase>(this.items(), x => now.getTime() - x.TimeStamp.getTime() > NOTIFICATIONTIMEOUT);
                    _.each(itemsToRemove, item => this.remove(item));
                }, NOTIFICATIONTIMEOUT / 2);
            }

            mapItems(items: INotificationBase[]) {
                return _.sortBy(items, x => x.TimeStamp);
            }

            dispose() {
                return clearInterval(this._intervalId);
            }
        }

        export class LocalNotificationMultiset extends NotificationMultiset {
            /** updates all notifications from an URL */
            refresh() {
                // TODO refresh method for notifications
            }

            belongsTo(item: INotificationBase) {
                // check if the notification is from the current user
                // todo: check the current user name if any user is signed in
                return item.Author === '';
            }
        }

        export class GlobalNotificationMultiset extends NotificationMultiset {

        }

        /** returns the total number of elements that have been present in the returned array
        that pass the filter */
        export function historicalCount<T>(items: KnockoutObservableArray<T>, filter: (item: T) => boolean) {
            var result = ko.observable(Utils.count(items(), filter));

            items.subscribe((changes: KnockoutArrayChange<T>[]) => {
                var difference = Utils.count(changes, x => x.status === 'added' && filter(x.value));
                result(result() + difference);
            }, null, 'arrayChange');

            return result;
        }

        export class NotificationQuickStartViewModel {
            count: KnockoutObservable<number>;
            errorCount: KnockoutObservable<number>;
            warningCount: KnockoutObservable<number>;
            successCount: KnockoutObservable<number>;

            showNotificationsEvent = new Common.Event();

            constructor(public storage: NotificationMultiset, public isGlobal = false) {
                this.count = historicalCount(this.storage.items, () => true);
                this.errorCount = historicalCount(this.storage.items, n => n.Level === NotificationLevel.Error);
                this.warningCount = historicalCount(this.storage.items, n => n.Level === NotificationLevel.Warning);
                this.successCount = historicalCount(this.storage.items, n => n.Level === NotificationLevel.Success);
            }

            /** fires the showNotifications event */
            showNotifications(level: NotificationLevel) {
                this.showNotificationsEvent.fire(level);
            }

            /** returns the number of notifications with the passed level */
            private countNotificationLevel(level: NotificationLevel) {
                var result = 0;
                _.each(this.storage.items(), notification => {
                    if (notification.Level === level) {
                        result++;
                    }
                });
                return result;
            }

            showNotificationsClick(level: NotificationLevel) {
                return () => this.showNotifications(level);
            }
        }
        Ribbon.ribbonQuickStartTemplateSelector.candidate(templates.notification.Notification(), x => x instanceof NotificationQuickStartViewModel);


        export class RibbonNotificationViewModel {
            isNotificationPanel = true;
            notifications: KnockoutComputed<Jigsaw.Notifications.INotificationBase[]>;

            constructor(private gloabalNotifications: Jigsaw.Notifications.NotificationMultiset,
                private localNotifications: Jigsaw.Notifications.NotificationMultiset) {
                this.notifications = ko.computed(() => {
                    return _.sortBy(_.union(gloabalNotifications.items(), localNotifications.items()), x => x.TimeStamp);
                });
            }
        }
        Jigsaw.Ribbon.ribbonItemTemplateSelector.candidate(templates.notification.RibbonNotificationPanel(), x => x.isNotificationPanel);

        export class NotificationsViewModel {
            total: KnockoutComputed<number>;
            local = new NotificationQuickStartViewModel(new LocalNotificationMultiset());
            global = new NotificationQuickStartViewModel(new GlobalNotificationMultiset(), true);

            constructor() {
                this.total = ko.computed(() => this.local.count() + this.global.count());
            }
        }

        export class NotificationsModule extends Modules.ModuleBase {
            notifications = new NotificationsViewModel();

            private stylesModule = new Theming.ContentStyleSheet(templates.notification.styles);

            constructor(private coreModule: CoreModuleBase, private sidebarModule: Sidebar.SidebarModule) {
                super();

                this.setUpSignalR();
                this.addSidebarNotifications();
                coreModule.addSlave(this);

                coreModule.quickStart.push(this.localNotificationsViewModel, this.globalNotificationsViewModel);

                var ribbonNotification = new RibbonNotificationViewModel(this.globalNotifications, this.localNotifications);

                coreModule.ribbon
                    .tab("Users")
                    .group("", 9999)
                    .add(ribbonNotification);
            }

            get localNotificationsViewModel() { return this.notifications.local; }
            get globalNotificationsViewModel() { return this.notifications.global; }

            requiredModules(): Modules.IModule[] {
                return [this.coreModule, this.stylesModule];
            }

            get localNotifications() { return this.localNotificationsViewModel.storage; }
            get globalNotifications() { return this.globalNotificationsViewModel.storage; }

            private setUpSignalR() {
                var connection = $.connection('notification');
                connection.received(data => {
                    // cast server dateTime string to JS date
                    data.TimeStamp = new Date(data.TimeStamp);

                    if (this.localNotifications.belongsTo(data)) {
                        this.localNotifications.add(data);
                    } else {
                        this.globalNotifications.add(data);
                    }
                });

                // start the connection and ensure it's maintained
                connection.disconnected(() => {
                    setTimeout(() => {
                        connection.start().done();
                    }, 30000);
                })
                    .start();
            }

            private addSidebarNotifications() {
                this.sidebarModule.registerView(
                        new Marionette.View({
                        template: templates.notification.SidebarNotifications,
                        viewModel: this.notifications
                    }),
                    new Marionette.View({
                        template: templates.notification.NotificationsCollapsed,
                        viewModel: this.notifications
                    }));
            }
        }

        export var notificationTemplate = Knockout.makeTemplateSelector('notificationTemplate', 'untemplated notification');


    }

    export module UserSettings {

        export var SETTINGSURL = 'user-settings';

        export enum FontSize { Small, Medium, Large }

        /** this is the viewmodel used for the basic user settings */
        export class UserSettingsViewModel extends Common.ViewModelBase {
            fontSize: KnockoutObservable<FontSize>;

            constructor() {
                super();

                this.fontSize = ko.observable(FontSize.Medium).extend({ persist: "fontSize" });
                this.fontSize.subscribe(size => {
                    $('body')
                        .toggleClass('font-small', size === FontSize.Small)
                        .toggleClass('font-medium', size === FontSize.Medium)
                        .toggleClass('font-large', size === FontSize.Large);

                    Common.triggerResize($('.ribbon'));
                });
                this.fontSize.valueHasMutated();
            }
        }


        export class UserSettingsNotification {
            signButtonText: KnockoutComputed<string>;

            constructor(private accountModule: Jigsaw.Account.AccountModule) {
                this.signButtonText = ko.computed(() => {
                    return accountModule.userState() === Jigsaw.Account.UserState.Present ? "Sign out" : "Sign in";
                });
            }

            signButtonClicked() {
                this.accountModule.ribbonButtonClicked();
            }

            showUserDetailsButtonClicked() {

            }

            settingsButtonClicked() {
                return history.navigateSilent(Jigsaw.UserSettings.SETTINGSURL);
            }
        }
        Jigsaw.Ribbon.ribbonQuickStartTemplateSelector.candidate(templates.userSettings.Notification(), x => x instanceof UserSettingsNotification);


        export class UserSettingsModule extends Modules.ModuleBase {
            private _view = new Marionette.CollectionView();
            private _styles = new Jigsaw.Theming.ContentStyleSheet(templates.userSettings.styles);

            userSettingsViewModel: UserSettingsViewModel;

            constructor(private coreModule: CoreModuleBase, accountModule: Account.AccountModule) {
                super();

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

            requiredModules(): Modules.IModule[] {
                return [this.coreModule];
            }

            private registerUrl() {
                history.register(SETTINGSURL, () => moduleManager.load(this));
            }

            load() {
                return this.coreModule.content.show(this._view);
            }
        }

    }

    export module Layout {
        export interface SidebarSizeController {
            minimizeSidebar(): Q.Promise<any>;
            expandSidebar(): Q.Promise<any>;
        }

        export interface ViewbarSizeController {
            collapseViewbar(): Q.Promise<any>;
            expandViewbar(): Q.Promise <any>;
        }

        export interface IViewLayoutModule extends Modules.IModule {
            sidebar: Marionette.Region;
            viewbar: Marionette.Region;
            content: Marionette.Region;
        }
    }

    /** contains base classes and the module that serves as the base for the sidebar views */
    export module Sidebar {

        var MinimumWidth: number = 798;

        export interface SidebarViewOptions {
            expandedView: Marionette.CollectionView;
            collapsedView: Marionette.CollectionView;
            viewModel: SidebarViewModel;
        }

        export class SidebarView extends Marionette.Layout {
            collapsed: Marionette.Region;
            expanded: Marionette.Region;

            expandedView: Marionette.CollectionView;
            collapsedView: Marionette.CollectionView;

            constructor(private initOptions: SidebarViewOptions) {
                super({
                    template: templates.sidebar.Sidebar,
                    viewModel: initOptions.viewModel,
                    regions: {
                        collapsed: '#sidebar-collapsed',
                        expanded: '#sidebar-expanded'
                    }
                });

                this.expandedView = initOptions.expandedView;
                this.collapsedView = initOptions.collapsedView;
            }

            domReady() {
                super.domReady();

                this.collapsed.show(this.collapsedView);
                this.expanded.show(this.expandedView);

                this.initOptions.viewModel.collapsed.valueHasMutated();
            }

            collapse() {
                this.initOptions.viewModel.collapsed(true);
            }
          
        }

        export class SidebarViewModel extends Common.ViewModelBase {
            collapsed: KnockoutObservable<boolean> = ko.observable(false).extend({ persist: 'sidebarCollapsedState' });

            constructor(sidebarSize: Layout.SidebarSizeController) {
                super();

                this.collapsed.subscribe(x => {
                    if (x) {
                        sidebarSize.minimizeSidebar()
                            .done();
                    } else {
                        sidebarSize.expandSidebar()
                            .done();
                    }
                });
            }
        }

        export interface SidebarModuleOptions {
            viewLayoutModule: Layout.IViewLayoutModule;
            sidebarSize: Layout.SidebarSizeController;
        }

        export class SidebarModule extends Modules.ModuleWithSlavesBase {

            private _sidebarViewModel: SidebarViewModel;
            private _sidebarView: SidebarView;
            private _lastViewPortWidth: number;

            constructor(private options: SidebarModuleOptions) {
                super();

                this._sidebarViewModel = new SidebarViewModel(options.sidebarSize);
                this._sidebarView = new SidebarView({
                    expandedView: new Marionette.CollectionView('ul'),
                    collapsedView: new Marionette.CollectionView('ul'),
                    viewModel: this._sidebarViewModel
                });
            }

            requiredModules(): Modules.IModule[] {
                // this needs to be modified when the work sideLayoutModule is required
                return [this.options.viewLayoutModule];
            }

            /** registers a view that will be rendered in the sidebar. */
            registerView(expandedView: Marionette.View, collapsedView?: Marionette.View) {
                //this._view.expandedView.add(view);
                this._sidebarView.expandedView.add(expandedView);

                if (collapsedView) {
                    this._sidebarView.collapsedView.add(collapsedView);
                }
            }

            load(): Q.Promise<any> {

                //handle window resize for responsive purpose
                $(window).resize(() => this.handleViewPortResize());

                //handling toggling sidebar
                $(window).bind('togggle-sidebar', () => this._sidebarViewModel.collapsed(!this._sidebarViewModel.collapsed()));

                return this.options.viewLayoutModule.sidebar.show(this._sidebarView);
            }

            unload() {

                //unbind window resize
                $(window).unbind('resize');

                $(window).unbind('togggle-sidebar');

                this._sidebarView.close();

                return Q(true);
            }


            handleViewPortResize() {

                var currentWidth = $(document).width();

                if (currentWidth != this._lastViewPortWidth && currentWidth < MinimumWidth) {
                    this._sidebarView.collapse();                    
                    this._lastViewPortWidth = currentWidth;
                }

            }

        }

        module menu {

            function expandTree(li: JQuery, speed = 200) {
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
                        speed: 200,
                    },
                        options = valueAccessor(),
                        // Extend our default options with those provided.
                        opts = $.extend(defaults, options),
                        //Assign current element to variable, in this case is UL element
                        $element = $(element),
                        parents, visible;

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
            }

            ko.bindingHandlers['expandMenuWhen'] = {
                init: function (element, valueAccessor) {
                    var value: KnockoutObservable<any> = valueAccessor(),
                        subscription = value.subscribe(() => expandTree($(element).parent()));

                    ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                        subscription.dispose();
                    });
                }
            }
       }
    }


    



}


/** unique instance of HistoryController that will handle all history in the application */
export var history = History.history;

export var moduleManager = new Modules.ModuleManager(history);
