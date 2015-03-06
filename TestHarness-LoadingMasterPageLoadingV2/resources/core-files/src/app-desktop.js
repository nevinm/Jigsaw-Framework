/// <reference path="definitions/_definitions.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", 'app', 'templates/app'], function(require, exports, _app, templates) {
    (function (Knockout) {
        /** kendo splitter is very important for the layout, and is created asynchronously by default. */
        var kendoSplitterBinding = ko.bindingHandlers['kendoSplitter'];
        kendoSplitterBinding.widgetConfig.async = false;

        ko.bindingHandlers['kendoTooltip'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var value = ko.unwrap(valueAccessor());
                if (value) {
                    var tooltip = new kendo.ui.Tooltip(element, {
                        autoHide: true,
                        position: "bottom",
                        content: value
                    });

                    ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                        tooltip.destroy();
                    });
                }
            }
        };

        function getHoverObservable(element) {
            var result = ko.observable(false);
            element.mouseenter(function () {
                return result(true);
            });
            element.mouseleave(function () {
                return result(false);
            });
            return result;
        }

        ko.bindingHandlers['visibleWhenHover'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                // valueAccessor - refers to the css selector or the element that should be followed
                var activeClass = "k-state-border-down", value = $(ko.unwrap(valueAccessor())), contentElement = $(element), itemHover = getHoverObservable(value), contentHover = getHoverObservable(contentElement), visibleObservable = ko.computed(function () {
                    return itemHover() || contentHover();
                }).extend({ throttle: 200 });

                contentElement.mouseup(function () {
                    return contentHover(false);
                });

                // TODO: dispose event handlers created on the getHoverObservable method
                // TODO-cleaning: assume that element isn't a jquery array and process the array on the menuAlike binding
                _.each(contentElement, function (node) {
                    // apply bindings to menu items to follow the visible observable,
                    // can use the visible binding and pass the observable directly
                    // This is done for each element because the menuAlike binding can pass
                    // an array of items
                    ko.applyBindingsToNode(node, { visible: visibleObservable }, viewModel);
                });

                _.each(value, function (node) {
                    ko.applyBindingsToNode(node, { css: { 'k-state-border-down': contentHover } }, viewModel);
                });
            }
        };

        /** applies the visibleWhenHover binding to the second element, when the first one is hovered */
        ko.bindingHandlers['menuAlike'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var value = ko.unwrap(valueAccessor()), menuItems = _.isString(value) ? $(element).children(value) : $(element).children(':not(:first-child)');

                ko.bindingHandlers['visibleWhenHover'].init(menuItems, function () {
                    return $(element).children(':first-child');
                }, allBindingsAccessor, viewModel, bindingContext);
            }
        };

        $['browser'] = {
            msie: false,
            mozilla: true,
            safari: false,
            opera: false
        };

        /** splitter */
        var splitterCount = 0;
        ko.bindingHandlers['splitter'] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                splitterCount++;

                var value = ko.unwrap(valueAccessor()), type = value.type || 'v', setup = {
                    type: type,
                    outline: true,
                    resizeToWidth: true,
                    anchorToWindow: true
                }, firtPanel = $(element).children().first(), secondPanel = $(element).children().last(), basePluginCardinalProperties = ['minLeft', 'maxLeft', 'minRight', 'maxRight', 'minTop', 'minBottom', 'dock', 'dockSize'], basePluginDependentProperties = ['sizeLeft', 'sizeRight', 'sizeTop', 'sizeBottom'], eventNamespace = '.splitter' + splitterCount;

                basePluginCardinalProperties.forEach(function (property) {
                    if (value[property]) {
                        var extension = {};
                        extension[property] = value[property];
                        $.extend(setup, extension);
                    }
                });

                basePluginDependentProperties.forEach(function (property) {
                    if (value[property]) {
                        var extension = {};
                        extension[property] = value[property]();
                        $.extend(setup, extension);
                    }
                });

                $(element).splitter(setup);

                var splitter = $(element), splitBar = $(element).children().first().next();

                if (value.toggleDockHandler) {
                    $(splitBar).dblclick(function () {
                        viewModel[value.toggleDockHandler]();
                    });
                }

                if (value.docked) {
                    var setDockedClass = function (obs) {
                        splitBar.removeClass('docked');
                        if (obs()) {
                            splitBar.addClass('docked');
                        }
                    };

                    setDockedClass(value.docked);

                    value.docked.subscribe(function () {
                        setDockedClass(value.docked);
                    });

                    //mandatory resize after set docked or not to splitter bar at first time
                    splitter.trigger('mandatory-resize');
                }

                //to update observables
                var updateObservablesHandler = function () {
                    var sizes = [firtPanel.width(), secondPanel.width(), firtPanel.height(), secondPanel.height()];
                    basePluginDependentProperties.forEach(function (property, index) {
                        if (value[property]) {
                            value[property](sizes[index]);
                        }
                    });
                    //splitter.trigger('mandatory-resize');
                };

                $(document).bind('manually-resize' + eventNamespace, updateObservablesHandler);

                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    $(document).unbind('manually-resize');

                    splitter.trigger('destroy');
                });
            }
        };
    })(exports.Knockout || (exports.Knockout = {}));
    var Knockout = exports.Knockout;

    (function (Jigsaw) {
        function updateCache() {
            applicationCache.update();
        }
        Jigsaw.updateCache = updateCache;

        var CoreModule = (function (_super) {
            __extends(CoreModule, _super);
            function CoreModule() {
                _super.apply(this, arguments);
                this._styles = new _app.Jigsaw.Theming.StyleSheet("content/modules/core.css", true);
            }
            CoreModule.prototype.requiredModules = function () {
                return _super.prototype.requiredModules.call(this).concat(this._styles);
            };
            return CoreModule;
        })(_app.Jigsaw.CoreModuleBase);
        Jigsaw.CoreModule = CoreModule;

        

        /** Adds the full screen button */
        function addFullScreenRibbonButton(coreModule) {
            _app.Utils.requirePromise('../libs/screenfull').done(function () {
                // if the fullscreen api is available
                if (screenfull.enabled) {
                    var full = "Full Screen", exit = "Exit <br/>Full Screen", buttonText = ko.observable(full);

                    screenfull.onchange = function () {
                        // change the text in the button depending on the full screen status
                        if (screenfull.isFullscreen) {
                            buttonText(exit);
                        } else {
                            buttonText(full);
                        }
                    };

                    coreModule.ribbon.tab("Users").group("Screen", 100).add(new _app.Jigsaw.Ribbon.RibbonButton(buttonText, function () {
                        screenfull.toggle();
                    }, "", "fa fa-recycle"), 1);
                }
            });
        }
        Jigsaw.addFullScreenRibbonButton = addFullScreenRibbonButton;

        //#endregion Full screen support (adds button to the ribbon)
        (function (Theming) {
            var ThemeManager = (function (_super) {
                __extends(ThemeManager, _super);
                function ThemeManager() {
                    _super.apply(this, arguments);
                }
                ThemeManager.prototype.initialize = function () {
                    this.addSelectThemeRibbonButton();

                    return _super.prototype.initialize.call(this);
                };

                ThemeManager.prototype.addSelectThemeRibbonButton = function () {
                    var availableThemes = _.map(this.themes(), function (theme) {
                        return theme.name;
                    });

                    this.coreModule.ribbon.tab("Users").group("Theme", 90).add(new _app.Jigsaw.Ribbon.RibbonSelect("Theme", availableThemes, this.selectedThemeName, "", "fa fa-cubes"));
                };
                return ThemeManager;
            })(_app.Jigsaw.Theming.ThemeManager);
            Theming.ThemeManager = ThemeManager;
        })(Jigsaw.Theming || (Jigsaw.Theming = {}));
        var Theming = Jigsaw.Theming;

        (function (Layout) {
            var layoutAnimationDuration = 250;

            (function (SidebarPosition) {
                SidebarPosition[SidebarPosition["Left"] = 0] = "Left";
                SidebarPosition[SidebarPosition["Right"] = 1] = "Right";
            })(Layout.SidebarPosition || (Layout.SidebarPosition = {}));
            var SidebarPosition = Layout.SidebarPosition;

            /** default variable for the initial sidebar position */
            var defaultSidebarPosition = 1 /* Right */;

            /** default variable for the initial sidebar size*/
            var defaultSidebarSize = 250;

            var SideLayoutViewModel = (function (_super) {
                __extends(SideLayoutViewModel, _super);
                function SideLayoutViewModel(initialSidebarPosition, initialSidebarSize) {
                    if (typeof initialSidebarPosition === "undefined") { initialSidebarPosition = defaultSidebarPosition; }
                    if (typeof initialSidebarSize === "undefined") { initialSidebarSize = defaultSidebarSize; }
                    var _this = this;
                    _super.call(this);
                    this.animateSidebarTo = new _app.Common.InteractionRequest();
                    /** flag to indicate that the invalidate layout event shouldn't be fired
                    because there'll be a series of changes in the properties. it'll probably
                    be fired after those changes */
                    this.editingLayout = false;
                    this.invalidateLayoutEvent = new _app.Common.Event();

                    this.sidebarPosition = ko.observable(initialSidebarPosition).extend({ persist: "sidebarPosition" });

                    var sidebarSize = ko.observable(initialSidebarSize).extend({ persist: "sidebarSize" });
                    this._sidebarSizeLocker = new ObservableSizeLocker(ko.computed({
                        read: function () {
                            return sidebarSize();
                        }, write: function (value) {
                            return sidebarSize(value);
                        }
                    }), function (x) {
                        return _this.animateSidebarTo.request(x);
                    });
                    this.sidebarSize = this._sidebarSizeLocker.calculatedSize.extend({ px: true });

                    this.sidebarPosition.subscribe(function () {
                        if (!_this.editingLayout) {
                            _this.invalidateLayoutEvent.fire();
                        }
                    });

                    this.sidebarLocked = this._sidebarSizeLocker.locked;
                }
                SideLayoutViewModel.prototype.invalidateLayout = function (handler) {
                    return this.invalidateLayoutEvent.add(handler);
                };

                SideLayoutViewModel.prototype.resetLayout = function () {
                    this.sidebarSize(defaultSidebarSize);
                    this.sidebarPosition(defaultSidebarPosition);
                };

                SideLayoutViewModel.prototype.minimizeSidebar = function () {
                    return this._sidebarSizeLocker.lock(50);
                };

                SideLayoutViewModel.prototype.expandSidebar = function () {
                    return this._sidebarSizeLocker.expand();
                };

                SideLayoutViewModel.prototype.toggleSidebar = function () {
                    $(window).trigger('togggle-sidebar');
                };
                return SideLayoutViewModel;
            })(_app.Common.ViewModelBase);
            Layout.SideLayoutViewModel = SideLayoutViewModel;

            var SideLayoutView = (function (_super) {
                __extends(SideLayoutView, _super);
                function SideLayoutView(options) {
                    var _this = this;
                    _super.call(this, {
                        template: options.template,
                        viewModel: options.viewModel,
                        regions: _.defaults(options.regions, {
                            content: "#sideLayout-content",
                            sidebar: "#sideLayout-sidebar"
                        })
                    });
                    this._firstRender = true;

                    var viewModel = options.viewModel;
                    viewModel.animateSidebarTo.handle(function (x) {
                        return _this.animateSidebarTo(x);
                    });

                    viewModel.invalidateLayout(function () {
                        return _this.invalidateLayout();
                    });
                }
                Object.defineProperty(SideLayoutView.prototype, "sidebarPosition", {
                    get: function () {
                        return this.options.viewModel.sidebarPosition();
                    },
                    enumerable: true,
                    configurable: true
                });

                SideLayoutView.prototype.invalidateLayout = function () {
                    // this happens when the view is re-rendered
                    this.render().done();
                };

                SideLayoutView.prototype.templateData = function () {
                    // this variables are used in the template
                    return {
                        sidebarLeft: this.sidebarPosition === 0 /* Left */
                    };
                };

                SideLayoutView.prototype.close = function () {
                    _super.prototype.close.call(this);
                    // next time the view is rendered it should be as usual
                    //this._firstRender = true;
                };

                SideLayoutView.prototype.render = function () {
                    //this.element.parent().addClass('busy');
                    // call base method
                    return _super.prototype.render.call(this).then(function () {
                        //this.element.parent().removeClass('busy');
                    });
                };

                SideLayoutView.prototype.animateSidebarTo = function (sidebarSize, duration) {
                    if (typeof duration === "undefined") { duration = layoutAnimationDuration; }
                    var sidebarRegionContainer = this.sidebar.options.element.parent(), sidebarRegionContainerWidth = sidebarRegionContainer.width(), difference = sidebarRegionContainerWidth - sidebarSize;

                    if (this.sidebarPosition === 1 /* Right */) {
                        var splitbar = sidebarRegionContainer.prev(), contentToExpand = splitbar.prev();

                        return Q.all([
                            sidebarRegionContainer.deferredAnimate({ left: "+=" + difference, width: sidebarSize }, duration),
                            splitbar.deferredAnimate({ left: "+=" + difference }, duration),
                            contentToExpand.deferredAnimate({ width: "+=" + difference }, duration)
                        ]);
                    } else {
                        var splitbar = sidebarRegionContainer.next(), contentToExpand = splitbar.next();

                        return Q.all([
                            sidebarRegionContainer.deferredAnimate({ width: sidebarSize }, duration),
                            splitbar.deferredAnimate({ left: "-=" + difference }, duration),
                            contentToExpand.deferredAnimate({ left: "-=" + difference, width: "+=" + difference }, duration)
                        ]);
                    }
                };
                return SideLayoutView;
            })(_app.Marionette.Layout);
            Layout.SideLayoutView = SideLayoutView;

            var SideLayoutModule = (function (_super) {
                __extends(SideLayoutModule, _super);
                function SideLayoutModule(coreModule) {
                    var _this = this;
                    _super.call(this);
                    this.coreModule = coreModule;

                    this.setup();

                    var selectedLocation = ko.computed({
                        read: function () {
                            return _this.viewModel.sidebarPosition() === 0 ? "Left" : "Right";
                        },
                        write: function (value) {
                            return _this.viewModel.sidebarPosition(value === "Left" ? 0 /* Left */ : 1 /* Right */);
                        }
                    }), ribbonSideBarSelect = new _app.Jigsaw.Ribbon.RibbonSelect("Side bar", ["Left", "Right"], selectedLocation, "", "/images/sidebar-ribbon.png");

                    this.ribbonModule = new _app.Jigsaw.Ribbon.RibbonItemModule({
                        coreModule: coreModule,
                        tab: { header: "Users" },
                        group: { header: "Layout", priority: 80 },
                        priority: 10,
                        items: [
                            ribbonSideBarSelect,
                            new _app.Jigsaw.Ribbon.RibbonButton("Reset all", function () {
                                return _this.viewModel.resetLayout();
                            }, "", "/images/restartlayout-ribbon.png")
                        ]
                    });
                }
                Object.defineProperty(SideLayoutModule.prototype, "content", {
                    get: function () {
                        return this.contentView.content;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(SideLayoutModule.prototype, "sidebar", {
                    get: function () {
                        return this.contentView.sidebar;
                    },
                    enumerable: true,
                    configurable: true
                });

                SideLayoutModule.prototype.setup = function () {
                    this.viewModel = new SideLayoutViewModel();
                    this.contentView = new SideLayoutView({
                        template: templates.SideLayout,
                        viewModel: this.viewModel,
                        regions: {}
                    });
                };

                SideLayoutModule.prototype.requiredModules = function () {
                    return [this.coreModule, this.ribbonModule];
                };

                SideLayoutModule.prototype.unload = function () {
                    //this.coreModule.content.close();
                    return _super.prototype.unload.call(this);
                };

                SideLayoutModule.prototype.load = function () {
                    return this.coreModule.content.show(this.contentView).then(function () {
                        return Q.delay(true, 100);
                    });
                };
                return SideLayoutModule;
            })(_app.Modules.ModuleBase);
            Layout.SideLayoutModule = SideLayoutModule;

            var ObservableSizeLocker = (function () {
                function ObservableSizeLocker(size, transition) {
                    var _this = this;
                    this.size = size;
                    this.transition = transition;
                    this.lockedSize = ko.observable(0);
                    this.locked = ko.observable(false);
                    this._queue = new _app.Common.PromiseQueue();
                    this.calculatedSize = ko.computed({
                        read: function () {
                            return _this.locked() ? _this.lockedSize() : size();
                        },
                        write: function (value) {
                            if (!_this.locked()) {
                                size(value);
                            } else {
                                // refresh the observable value
                                _this.locked.valueHasMutated();
                            }
                        }
                    });
                }
                /** puts the viewbar in a collapsed state. also hides the splitter on the view */
                ObservableSizeLocker.prototype.lock = function (size) {
                    var _this = this;
                    if (typeof size === "undefined") { size = 0; }
                    return this._queue.enqueue(function () {
                        return _this.transition(size).then(function () {
                            _this.lockedSize(size);
                            _this.locked(true);
                        });
                    });
                };

                ObservableSizeLocker.prototype.expand = function () {
                    var _this = this;
                    var size = this.size();

                    return this._queue.enqueue(function () {
                        return _this.transition(size).then(function () {
                            _this.locked(false);
                        });
                    });
                };
                return ObservableSizeLocker;
            })();

            (function (BarState) {
                BarState[BarState["Visible"] = 0] = "Visible";
                BarState[BarState["Collapsed"] = 1] = "Collapsed";
                BarState[BarState["Hidden"] = 2] = "Hidden";
            })(Layout.BarState || (Layout.BarState = {}));
            var BarState = Layout.BarState;

            (function (ViewbarPosition) {
                ViewbarPosition[ViewbarPosition["Bottom"] = 0] = "Bottom";
                ViewbarPosition[ViewbarPosition["Right"] = 1] = "Right";
            })(Layout.ViewbarPosition || (Layout.ViewbarPosition = {}));
            var ViewbarPosition = Layout.ViewbarPosition;

            /** default variable for the initial sidebar position */
            var defaultViewbarPosition = 0 /* Bottom */;

            /** default variable for the initial sidebar size */
            var defaultViewbarBottomSize = 250;
            var defaultViewbarRightSize = 400;

            var ViewLayoutViewModel = (function (_super) {
                __extends(ViewLayoutViewModel, _super);
                function ViewLayoutViewModel(initialSidebarPosition, initialSidebarSize, initialViewBarPosition) {
                    if (typeof initialSidebarPosition === "undefined") { initialSidebarPosition = defaultSidebarPosition; }
                    if (typeof initialSidebarSize === "undefined") { initialSidebarSize = defaultSidebarSize; }
                    if (typeof initialViewBarPosition === "undefined") { initialViewBarPosition = defaultViewbarPosition; }
                    var _this = this;
                    _super.call(this, initialSidebarPosition, initialSidebarSize);
                    this.animateViewbarTo = new _app.Common.InteractionRequest();
                    this._viewbarQueue = new _app.Common.PromiseQueue();

                    this.viewbarPosition = ko.observable(initialViewBarPosition).extend({ persist: "viewbarPosition" });

                    this.viewbarSizeBottom = ko.observable(defaultViewbarBottomSize).extend({ persist: "viewbarSizeBottom", px: true });
                    this.viewbarSizeRight = ko.observable(defaultViewbarRightSize).extend({ persist: "viewbarSizeRight", px: true });

                    this._viewbarSizeLocker = new ObservableSizeLocker(ko.computed({
                        read: function () {
                            return _this.viewbarPosition() === 0 /* Bottom */ ? _this.viewbarSizeBottom() : _this.viewbarSizeRight();
                        },
                        write: function (value) {
                            if (_this.viewbarPosition() === 0 /* Bottom */) {
                                _this.viewbarSizeBottom(value);
                            } else {
                                _this.viewbarSizeRight(value);
                            }
                        }
                    }), function (x) {
                        return _this.animateViewbarTo.request(x);
                    });
                    this.viewbarSize = this._viewbarSizeLocker.calculatedSize.extend({ px: true });

                    this.viewbarPosition.subscribe(function () {
                        if (!_this.editingLayout) {
                            _this.invalidateLayoutEvent.fire();
                        }
                    });

                    this.viewbarLocked = this._viewbarSizeLocker.locked;
                }
                ViewLayoutViewModel.prototype.resetLayout = function () {
                    this.editingLayout = true;

                    _super.prototype.resetLayout.call(this);

                    this.viewbarPosition(defaultViewbarPosition);
                    this.viewbarSize(defaultViewbarBottomSize);

                    this.editingLayout = false;
                    this.invalidateLayoutEvent.fire();
                };

                /** puts the viewbar in a collapsed state. also hides the splitter on the view */
                ViewLayoutViewModel.prototype.collapseViewbar = function () {
                    return this._viewbarSizeLocker.lock(0);
                };

                ViewLayoutViewModel.prototype.expandViewbar = function () {
                    return this._viewbarSizeLocker.expand();
                };
                return ViewLayoutViewModel;
            })(SideLayoutViewModel);
            Layout.ViewLayoutViewModel = ViewLayoutViewModel;

            var ViewLayoutView = (function (_super) {
                __extends(ViewLayoutView, _super);
                function ViewLayoutView(options) {
                    var _this = this;
                    _super.call(this, {
                        template: options.template,
                        viewModel: options.viewModel,
                        regions: _.defaults(options.regions, {
                            content: "#viewLayout-content",
                            viewbar: "#viewLayout-viewbar",
                            sidebar: "#sideLayout-sidebar"
                        })
                    });

                    var viewModel = options.viewModel;
                    viewModel.animateViewbarTo.handle(function (x) {
                        return _this.animateViewbarTo(x);
                    });

                    if (viewModel.viewbarSize() === 0) {
                        this.viewbar.options.element.hide();
                    }
                }
                Object.defineProperty(ViewLayoutView.prototype, "viewbarPosition", {
                    get: function () {
                        return this.options.viewModel.viewbarPosition();
                    },
                    enumerable: true,
                    configurable: true
                });

                ViewLayoutView.prototype.templateData = function () {
                    return _.defaults(_super.prototype.templateData.call(this), {
                        viewbarBottom: this.viewbarPosition === 0 /* Bottom */
                    });
                };

                ViewLayoutView.prototype.hideViewbarIfCollapsed = function () {
                    if (this.options.viewModel.viewbarSize() === 0) {
                        this.viewbar.options.element.hide();
                    }
                };

                ViewLayoutView.prototype.render = function () {
                    var _this = this;
                    return _super.prototype.render.call(this).then(function () {
                        return _this.hideViewbarIfCollapsed();
                    });
                };

                ViewLayoutView.prototype.animateSidebarTo = function (sidebarSize, duration) {
                    if (typeof duration === "undefined") { duration = layoutAnimationDuration; }
                    $(document).trigger('animating', 1000);

                    if (this.viewbarPosition === 0 /* Bottom */) {
                        // if the viewbar is at the bottom, then it's inner kendo splitter width needs to be increased
                        var sidebarRegionContainer = this.sidebar.options.element.parent(), sidebarRegionContainerWidth = sidebarRegionContainer.width(), difference = sidebarRegionContainerWidth - sidebarSize, mainContentContainer = this.content.options.element.parent();

                        return Q.all([
                            mainContentContainer.parent().children().deferredAnimate({ width: "+=" + difference }, duration),
                            _super.prototype.animateSidebarTo.call(this, sidebarSize, duration)
                        ]);
                    } else if (this.sidebarPosition === 1 /* Right */ && this.viewbarPosition === 1 /* Right */) {
                        // when both bars are on the right then both need to be animated
                        var sidebarRegionContainer = this.sidebar.options.element.parent(), sidebarRegionContainerWidth = sidebarRegionContainer.width(), difference = sidebarRegionContainerWidth - sidebarSize, sidebarSplitbar = sidebarRegionContainer.prev(), contentContainer = sidebarSplitbar.prev(), contentToExpand = contentContainer.children().children().first(), viewbarSplitbar = contentToExpand.next(), viewbarContent = viewbarSplitbar.next(), viewbarWidth = viewbarContent.width();

                        var result;

                        return Q.all([
                            sidebarRegionContainer.deferredAnimate({ left: "+=" + difference, width: sidebarSize }, duration),
                            sidebarSplitbar.deferredAnimate({ left: "+=" + difference }, duration),
                            viewbarSplitbar.deferredAnimate({ left: "+=" + difference }, duration),
                            viewbarContent.deferredAnimate({ left: "+=" + difference }, duration),
                            contentToExpand.deferredAnimate({ width: "+=" + difference }, duration),
                            contentContainer.deferredAnimate({ width: "+=" + difference }, duration)
                        ]).then(function () {
                            return sidebarRegionContainer.resize();
                        });
                    } else if (this.sidebarPosition === 0 /* Left */ && this.viewbarPosition === 1 /* Right */) {
                        var sidebarRegionContainer = this.sidebar.options.element.parent(), sidebarRegionContainerWidth = sidebarRegionContainer.width(), difference = sidebarRegionContainerWidth - sidebarSize, splitbar = sidebarRegionContainer.next(), contentContainer = splitbar.next(), contentToExpand = contentContainer.children().children().first(), viewbarSplitbar = contentToExpand.next(), viewbarContent = viewbarSplitbar.next();

                        result = Q.all([
                            sidebarRegionContainer.deferredAnimate({ width: sidebarSize }, duration),
                            splitbar.deferredAnimate({ left: "-=" + difference }, duration),
                            contentToExpand.deferredAnimate({ width: "+=" + difference }, duration),
                            viewbarSplitbar.deferredAnimate({ left: "+=" + difference }, duration),
                            viewbarContent.deferredAnimate({ left: "+=" + difference }, duration),
                            contentContainer.deferredAnimate({ left: "-=" + difference, width: "+=" + difference }, duration)
                        ]);

                        //return result;
                        //Patch - raise the resize event for splitter recalculations
                        return result.then(function () {
                            return sidebarRegionContainer.resize();
                        });
                    }

                    return _super.prototype.animateSidebarTo.call(this, sidebarSize, duration);
                };

                ViewLayoutView.prototype.animateViewbarTo = function (viewbarSize, duration) {
                    var _this = this;
                    if (typeof duration === "undefined") { duration = layoutAnimationDuration; }
                    var viewbarRegionContainer = this.viewbar.options.element.parent(), splitbar = viewbarRegionContainer.prev(), contentToExpand = splitbar.prev(), result;

                    $(document).trigger('animating', 1000);

                    if (this.viewbarPosition === 0 /* Bottom */) {
                        var viewbarRegionContainerHeight = viewbarRegionContainer.height(), difference = viewbarRegionContainerHeight - viewbarSize;

                        result = Q.all([
                            viewbarRegionContainer.deferredAnimate({ top: "+=" + difference, height: viewbarSize }, duration),
                            splitbar.deferredAnimate({ top: "+=" + difference }, duration),
                            contentToExpand.deferredAnimate({ height: "+=" + difference }, duration)
                        ]);
                    } else {
                        var viewbarRegionContainerWidth = viewbarRegionContainer.width(), difference = viewbarRegionContainerWidth - viewbarSize;

                        result = Q.all([
                            viewbarRegionContainer.deferredAnimate({ left: "+=" + difference, width: viewbarSize }, duration),
                            splitbar.deferredAnimate({ left: "+=" + difference }, duration),
                            contentToExpand.deferredAnimate({ width: "+=" + difference }, duration)
                        ]);
                    }

                    if (viewbarSize === 0) {
                        this.viewbar.options.element.hide();
                        return result;
                    } else {
                        return result.then(function () {
                            return _this.viewbar.options.element.show();
                        });
                    }
                };
                return ViewLayoutView;
            })(SideLayoutView);
            Layout.ViewLayoutView = ViewLayoutView;

            var ViewLayoutModule = (function (_super) {
                __extends(ViewLayoutModule, _super);
                function ViewLayoutModule(coreModule) {
                    var _this = this;
                    _super.call(this, coreModule);

                    var selectedLocation = ko.computed({
                        read: function () {
                            return _this.viewModel.viewbarPosition() === 0 ? "Bottom" : "Right";
                        },
                        write: function (value) {
                            return _this.viewModel.viewbarPosition(value === "Bottom" ? 0 /* Bottom */ : 1 /* Right */);
                        }
                    }), ribbonViewBarSelect = new _app.Jigsaw.Ribbon.RibbonSelect("View bar", ["Bottom", "Right"], selectedLocation, "", "fa  fa-search-plus");
                    this.ribbonModule.add(ribbonViewBarSelect, 5);
                }
                Object.defineProperty(ViewLayoutModule.prototype, "content", {
                    get: function () {
                        return this.contentView.content;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(ViewLayoutModule.prototype, "viewbar", {
                    get: function () {
                        return this.contentView.viewbar;
                    },
                    enumerable: true,
                    configurable: true
                });

                ViewLayoutModule.prototype.setup = function () {
                    this.viewModel = new ViewLayoutViewModel();
                    this.contentView = new ViewLayoutView({
                        template: templates.ViewLayout,
                        viewModel: this.viewModel,
                        regions: {}
                    });

                    var viewModel = this.viewModel;
                };
                return ViewLayoutModule;
            })(SideLayoutModule);
            Layout.ViewLayoutModule = ViewLayoutModule;
        })(Jigsaw.Layout || (Jigsaw.Layout = {}));
        var Layout = Jigsaw.Layout;

        /** extends user settings module from the core app module */
        (function (UserSettings) {
            var UserSettingsModule = (function (_super) {
                __extends(UserSettingsModule, _super);
                function UserSettingsModule(coreModule, accountModule, layoutModule) {
                    _super.call(this, coreModule, accountModule);

                    _.extend(this.userSettingsViewModel, {
                        sidebarPosition: layoutModule.viewModel.sidebarPosition,
                        viewbarPosition: layoutModule.viewModel.viewbarPosition
                    });
                }
                return UserSettingsModule;
            })(_app.Jigsaw.UserSettings.UserSettingsModule);
            UserSettings.UserSettingsModule = UserSettingsModule;
        })(Jigsaw.UserSettings || (Jigsaw.UserSettings = {}));
        var UserSettings = Jigsaw.UserSettings;
    })(exports.Jigsaw || (exports.Jigsaw = {}));
    var Jigsaw = exports.Jigsaw;

    exports.coreModule = new Jigsaw.CoreModule();

    exports.accountModule = new _app.Jigsaw.Account.AccountModule(exports.coreModule);
    exports.coreModule.addSlave(exports.accountModule);

    // export var sideLayoutModule = new Jigsaw.Layout.SideLayoutModule();
    exports.viewLayoutModule = new Jigsaw.Layout.ViewLayoutModule(exports.coreModule);

    // add custom buttons
    Jigsaw.addFullScreenRibbonButton(exports.coreModule);

    var UserSettingsNotifications = new Jigsaw.UserSettings.UserSettingsModule(exports.coreModule, exports.accountModule, exports.viewLayoutModule);

    exports.themeManager = new Jigsaw.Theming.ThemeManager(exports.coreModule, exports.accountModule);
    _app.Jigsaw.Theming.loadThemes(exports.themeManager); // load themes sent by server on configuration
    _app.history.beforeWake(function () {
        return exports.themeManager.initialize();
    });

    exports.sidebarModule = new _app.Jigsaw.Sidebar.SidebarModule({
        sidebarSize: exports.viewLayoutModule.viewModel,
        viewLayoutModule: exports.viewLayoutModule
    });

    exports.notificationsModule = new _app.Jigsaw.Notifications.NotificationsModule(exports.coreModule, exports.sidebarModule);
});
