/* Module : Knockout */

/// <amd-dependency path="text!modules/core/templates/widget/expandOptions.html" />
/// <amd-dependency path="text!modules/core/templates/widget/VirtualScrollButton.html" />


var templatesExpandOptions = require('text!modules/core/templates/widget/expandOptions.html');
var templatesVirtualScrollButton = require('text!modules/core/templates/widget/VirtualScrollButton.html'); 

import Marionette = require('modules/core/marionette');
import Common = require('modules/core/common');
import Utils = require('modules/core/utils');


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
            $menu.on('click', e => e.stopPropagation());
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
export function makeTemplateSelector(bindingName: string, fallbackTemplate?: string): TemplateSelector {
    var templateSelector = new TemplateSelector(fallbackTemplate);

    ko.bindingHandlers[bindingName] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

            ko.applyBindingsToNode(element, {
                template: {
                    name: x => templateSelector.select(x),
                    data: valueAccessor(),
                    templateEngine: StringTemplateEngine,
                }
            }, viewModel);

            return { 'controlsDescendantBindings': true };
        }
    };

    return templateSelector;
}

/** declares the given binding name and returns a template collection that can be used to 
specify the templates used by this binding */
export function makeForeachWithTemplateSelector(bindingName: string, fallbackTemplate?: string): TemplateSelector {
    var templateSelector = new TemplateSelector(fallbackTemplate);

    ko.bindingHandlers[bindingName] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

            ko.applyBindingsToNode(element, {
                template: {
                    name: x => templateSelector.select(x),
                    foreach: valueAccessor(),
                    templateEngine: StringTemplateEngine,
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
            template = _.template(templatesExpandOptions)(options);

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
            leftElement = $(templatesVirtualScrollButton),
            rightElement = $(templatesVirtualScrollButton);

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
    extend.bindingUpdate(bindingName, (element) => Utils.async(() => Common.triggerResize($(element))));
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
                if (this.validKey(start + String.fromCharCode(i), zindex))
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
        checkboxObservable['negate'] = (_, e: JQueryEventObject) => {
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
                ribbonTabsSwiper = new RibbonTabSwiper({ element: element, tabs: options.tabs, collapsed: options.collapsed, speed: speed, emptySpaces: emptySpaces });

            /*                ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                                ribbonTabsSwiper.destroy();
                            });*/

            // tell KO we have already bound the children
            return { controlsDescendantBindings: true };

        }
    };
}