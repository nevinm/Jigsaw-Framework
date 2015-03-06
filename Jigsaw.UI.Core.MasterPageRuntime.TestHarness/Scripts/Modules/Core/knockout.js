/* Module : Knockout */
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", 'modules/core/marionette', 'modules/core/common', 'modules/core/utils', "text!modules/core/templates/widget/expandOptions.html", "text!modules/core/templates/widget/VirtualScrollButton.html"], function (require, exports, Marionette, Common, Utils) {
    /// <amd-dependency path="text!modules/core/templates/widget/expandOptions.html" />
    /// <amd-dependency path="text!modules/core/templates/widget/VirtualScrollButton.html" />
    var templatesExpandOptions = require('text!modules/core/templates/widget/expandOptions.html');
    var templatesVirtualScrollButton = require('text!modules/core/templates/widget/VirtualScrollButton.html');

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
    exports.Door = Door;

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
    exports.persistExtender = persistExtender;

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
    })(exports.persistExtender || (exports.persistExtender = {}));
    var persistExtender = exports.persistExtender;

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
    exports.persistedArray = persistedArray;

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

    exports.StringTemplateEngine = new ko.nativeTemplateEngine();
    exports.StringTemplateEngine['makeTemplateSource'] = function (template) {
        return new StringTemplateSource(template);
    };

    function renderTemplate(element, template, bindingContext) {
        ko.renderTemplate(template, bindingContext, { templateEngine: exports.StringTemplateEngine }, element, "replaceChildren");
    }
    exports.renderTemplate = renderTemplate;

    function renderTemplateAsync(element, template, bindingContext) {
        Utils.async(function () {
            return exports.renderTemplate(element, template, bindingContext);
        });
    }
    exports.renderTemplateAsync = renderTemplateAsync;

    /** renders a string template received as an argument */
    ko.bindingHandlers['stringTemplate'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            exports.renderTemplate(element, ko.unwrap(valueAccessor()), bindingContext);
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
    exports.watchObservableArray = watchObservableArray;

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
    exports.Stabilizer = Stabilizer;

    exports.flowStabilizer = new Stabilizer();

    ko.bindingHandlers['measurePrev'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var $element = $(element), elementPrev = $element.prev(), direction = ko.unwrap(valueAccessor());

            exports.flowStabilizer.register(elementSize, elementResized);

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
    exports.TemplateSelector = TemplateSelector;

    /** creates a new binding with the specified name that renders the given element */
    function makeTemplateSelector(bindingName, fallbackTemplate) {
        var templateSelector = new TemplateSelector(fallbackTemplate);

        ko.bindingHandlers[bindingName] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                ko.applyBindingsToNode(element, {
                    template: {
                        name: function (x) {
                            return templateSelector.select(x);
                        },
                        data: valueAccessor(),
                        templateEngine: exports.StringTemplateEngine
                    }
                }, viewModel);

                return { 'controlsDescendantBindings': true };
            }
        };

        return templateSelector;
    }
    exports.makeTemplateSelector = makeTemplateSelector;

    /** declares the given binding name and returns a template collection that can be used to
    specify the templates used by this binding */
    function makeForeachWithTemplateSelector(bindingName, fallbackTemplate) {
        var templateSelector = new TemplateSelector(fallbackTemplate);

        ko.bindingHandlers[bindingName] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                ko.applyBindingsToNode(element, {
                    template: {
                        name: function (x) {
                            return templateSelector.select(x);
                        },
                        foreach: valueAccessor(),
                        templateEngine: exports.StringTemplateEngine
                    }
                }, bindingContext);

                return { controlsDescendantBindings: true };
            }
        };

        return templateSelector;
    }
    exports.makeForeachWithTemplateSelector = makeForeachWithTemplateSelector;

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
            var options = ko.unwrap(valueAccessor()), template = _.template(templatesExpandOptions)(options);

            exports.renderTemplateAsync(element, template, options);

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
    exports.bind = bind;

    /** adds two elements to the target element, that when hovered make the element
    children scroll in their direction.
    Scroll function on hover thanks to http://jsfiddle.net/gaby/xmAvh/ */
    ko.bindingHandlers['virtualScroll'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var $element = $(element), children = $element.children().wrapAll("<div class='virtual-scroll-wrapper'></div>").parent(), leftElement = $(templatesVirtualScrollButton), rightElement = $(templatesVirtualScrollButton);

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
    })(exports.extend || (exports.extend = {}));
    var extend = exports.extend;

    function makeBindingHandlerNotifyResize(bindingName) {
        extend.bindingUpdate(bindingName, function (element) {
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
    exports.createContextMarkBinding = createContextMarkBinding;

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

        var zIndexBaseBindingInfo = exports.createContextMarkBinding('ZIndexBase');

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
    })(exports.Keytips || (exports.Keytips = {}));
    var Keytips = exports.Keytips;

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
    })(exports.HtmlTunneling || (exports.HtmlTunneling = {}));
    var HtmlTunneling = exports.HtmlTunneling;

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
    })(exports.SwiperEffect || (exports.SwiperEffect = {}));
    var SwiperEffect = exports.SwiperEffect;
});
