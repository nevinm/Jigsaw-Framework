/// <reference path="definitions/_definitions.d.ts" />

/// <reference path="definitions/jquery.d.ts" />
/// <reference path="definitions/kendo.web.d.ts" />
/// <reference path="definitions/Q.d.ts" />
/// <reference path="definitions/underscore.d.ts" />
/// <reference path="definitions/knockout.d.ts" />

/// <reference path="definitions/splitter.d.ts" />

/// <reference path="definitions/require.d.ts" />
/// <reference path="templates/definitions.d.ts" />

// this file holds the core module, most modules will depend on this one

import _app = require('app');
import templates = require('templates/app');

export module Knockout {

    /** kendo splitter is very important for the layout, and is created asynchronously by default. */
    var kendoSplitterBinding: any = ko.bindingHandlers['kendoSplitter'];
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

                ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                    tooltip.destroy();
                });
            }
        }
    };

    function getHoverObservable(element: JQuery) {
        var result = ko.observable(false);
        element.mouseenter(() => result(true));
        element.mouseleave(() => result(false));
        return result;
    }

    ko.bindingHandlers['visibleWhenHover'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            // valueAccessor - refers to the css selector or the element that should be followed
            var activeClass = "k-state-border-down",
                value = $(ko.unwrap(valueAccessor())),
                contentElement = $(element),
                itemHover = getHoverObservable(value),
                contentHover = getHoverObservable(contentElement),
                visibleObservable = ko.computed(() => itemHover() || contentHover())
                    .extend({ throttle: 200 });

            contentElement.mouseup(() => contentHover(false));

            // TODO: dispose event handlers created on the getHoverObservable method
            // TODO-cleaning: assume that element isn't a jquery array and process the array on the menuAlike binding
            _.each<Element>(<any>contentElement, node => {
                // apply bindings to menu items to follow the visible observable,
                // can use the visible binding and pass the observable directly
                // This is done for each element because the menuAlike binding can pass 
                // an array of items
                ko.applyBindingsToNode(node, { visible: visibleObservable }, viewModel);
            });

            _.each(value, node => {
                ko.applyBindingsToNode(node, { css: { 'k-state-border-down': contentHover } }, viewModel);
            });
        }
    }

    /** applies the visibleWhenHover binding to the second element, when the first one is hovered */
    ko.bindingHandlers['menuAlike'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = ko.unwrap(valueAccessor()),
                menuItems = _.isString(value)
                ? $(element).children(value)
                : $(element).children(':not(:first-child)');

            ko.bindingHandlers['visibleWhenHover'].init(menuItems,
                () => $(element).children(':first-child'),
                allBindingsAccessor, viewModel, bindingContext);
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

            var value = ko.unwrap(valueAccessor()),
                type = value.type || 'v',
                setup = {
                    type: type,
                    outline: true,
                    resizeToWidth: true,
                    anchorToWindow: true
                },
                firtPanel = $(element).children().first(),
                secondPanel = $(element).children().last(),
                basePluginCardinalProperties = ['minLeft', 'maxLeft', 'minRight', 'maxRight', 'minTop', 'minBottom', 'dock', 'dockSize'],
                basePluginDependentProperties = ['sizeLeft', 'sizeRight', 'sizeTop', 'sizeBottom'],
                eventNamespace = '.splitter' + splitterCount;
           

            basePluginCardinalProperties.forEach((property) => {
                if (value[property]) {
                    var extension = {};
                    extension[property] = value[property];
                    $.extend(setup, extension);
                }
            });


            basePluginDependentProperties.forEach((property) => {
                if (value[property]) {
                    var extension = {};
                    extension[property] = value[property]();
                    $.extend(setup, extension);
                }
            });

            $(element).splitter(setup);

            var splitter = $(element),
                splitBar = $(element).children().first().next();

           


            if (value.toggleDockHandler) {
                $(splitBar).dblclick(() => {
                    viewModel[value.toggleDockHandler]();
                });
            }

            if (value.docked) {

                var setDockedClass = (obs) => {
                    splitBar.removeClass('docked');
                    if (obs()) {
                        splitBar.addClass('docked');
                    }
                };

                setDockedClass(value.docked);

                value.docked.subscribe(() => {
                    setDockedClass(value.docked);
                });

                //mandatory resize after set docked or not to splitter bar at first time
                splitter.trigger('mandatory-resize');
            }

            //to update observables
            var updateObservablesHandler = () => {
                var sizes = [firtPanel.width(), secondPanel.width(), firtPanel.height(), secondPanel.height()];
                basePluginDependentProperties.forEach((property, index) => {
                    if (value[property]) {
                        value[property](sizes[index]);
                    }
                });

                //splitter.trigger('mandatory-resize');
            };

            $(document).bind('manually-resize' + eventNamespace, updateObservablesHandler);
		
            ko.utils.domNodeDisposal.addDisposeCallback(element, () => {

                $(document).unbind('manually-resize');

                splitter.trigger('destroy');

            });

        }

    };





}

export module Jigsaw {

    export function updateCache() {
        applicationCache.update();
    }

    export class CoreModule extends _app.Jigsaw.CoreModuleBase {
        private _styles = new _app.Jigsaw.Theming.StyleSheet("content/modules/core.css", true);

        requiredModules(): _app.Modules.IModule[] {
            return super.requiredModules().concat(this._styles);
        }
    }

    //#region Full screen support (adds button to the ribbon)

    // adds the go full screen button to the ribbon if supported, the button is 
    // only added if the feature is supperted by the browser
    // a new library is used t provide the cross browser functionality
    // check: https://github.com/sindresorhus/screenfull.js/
    // this could be done in another module, but this funtionality is applicable 
    // to all modules using the core module

    // add some type definitions for the library
    declare var screenfull;

    /** Adds the full screen button */
    export function addFullScreenRibbonButton(coreModule: CoreModule) {

        _app.Utils.requirePromise('../libs/screenfull')
            .done(() => {
                // if the fullscreen api is available
                if (screenfull.enabled) {
                    var full = "Full Screen", exit = "Exit <br/>Full Screen",
                        buttonText = ko.observable(full)

                    screenfull.onchange = () => {
                        // change the text in the button depending on the full screen status
                        if (screenfull.isFullscreen) {
                            buttonText(exit);
                        } else {
                            buttonText(full);
                        }
                    };

                    coreModule.ribbon
                        .tab("Users")
                        .group("Screen", 100)
                        .add(new _app.Jigsaw.Ribbon.RibbonButton(buttonText, () => { screenfull.toggle(); },
                            "", "fa fa-recycle"), 1);
                }
            });
    }

    //#endregion Full screen support (adds button to the ribbon)

    export module Theming {
        export class ThemeManager extends _app.Jigsaw.Theming.ThemeManager {
            initialize() {
                this.addSelectThemeRibbonButton();

                return super.initialize();
            }

            private addSelectThemeRibbonButton() {
                var availableThemes = _.map(this.themes(), (theme: _app.Jigsaw.Theming.Theme) => theme.name);

                this.coreModule.ribbon
                    .tab("Users")
                    .group("Theme", 90)
                    .add(new _app.Jigsaw.Ribbon.RibbonSelect("Theme", availableThemes, this.selectedThemeName, "", "fa fa-cubes"));
            }
        }
    }

    export module Layout {

        var layoutAnimationDuration = 250;

        export enum SidebarPosition {
            Left,
            Right
        }

        /** default variable for the initial sidebar position */
        var defaultSidebarPosition = SidebarPosition.Right;

        /** default variable for the initial sidebar size*/
        var defaultSidebarSize = 250;

        export class SideLayoutViewModel extends _app.Common.ViewModelBase implements _app.Jigsaw.Layout.SidebarSizeController {
            sidebarPosition: KnockoutObservable<SidebarPosition>;
            sidebarSize: KnockoutComputed<number>;
            animateSidebarTo = new _app.Common.InteractionRequest<number, Q.Promise<any>>();
            sidebarLocked: KnockoutObservable<boolean>;


            /** flag to indicate that the invalidate layout event shouldn't be fired
            because there'll be a series of changes in the properties. it'll probably
            be fired after those changes */
            editingLayout = false;
            invalidateLayoutEvent = new _app.Common.Event();

            private _sidebarSizeLocker: ObservableSizeLocker;

            constructor(initialSidebarPosition = defaultSidebarPosition, initialSidebarSize = defaultSidebarSize) {
                super();

                this.sidebarPosition = ko.observable(initialSidebarPosition).extend({ persist: "sidebarPosition" });

                var sidebarSize = ko.observable(initialSidebarSize).extend({ persist: "sidebarSize" });
                this._sidebarSizeLocker = new ObservableSizeLocker(ko.computed({
                    read: () => sidebarSize(), write: value=> sidebarSize(value)
                }), x => this.animateSidebarTo.request(x));
                this.sidebarSize = this._sidebarSizeLocker.calculatedSize.extend({ px: true });

                this.sidebarPosition.subscribe(() => {
                    if (!this.editingLayout) {
                        this.invalidateLayoutEvent.fire();
                    }
                });

                this.sidebarLocked = this._sidebarSizeLocker.locked;
            }

            invalidateLayout(handler: () => void) {
                return this.invalidateLayoutEvent.add(handler);
            }

            resetLayout() {
                this.sidebarSize(defaultSidebarSize);
                this.sidebarPosition(defaultSidebarPosition);
            }

            minimizeSidebar() {
                return this._sidebarSizeLocker.lock(50);
            }

            expandSidebar() {
                return this._sidebarSizeLocker.expand();
            }

            toggleSidebar() {
                $(window).trigger('togggle-sidebar');
            }

        }

        export interface SideLayoutViewOptions extends _app.Marionette.LayoutOptions {
            viewModel: SideLayoutViewModel;
        }

        export class SideLayoutView extends _app.Marionette.Layout {
            options: SideLayoutViewOptions;
            content: _app.Marionette.Region;
            sidebar: _app.Marionette.Region;
            private _firstRender = true;

            constructor(options: SideLayoutViewOptions) {
                super({
                    template: options.template,
                    viewModel: options.viewModel,
                    regions: _.defaults(options.regions, {
                        content: "#sideLayout-content",
                        sidebar: "#sideLayout-sidebar"
                    })
                });

                var viewModel = options.viewModel;
                viewModel.animateSidebarTo.handle(x => this.animateSidebarTo(x));

                viewModel.invalidateLayout(() => this.invalidateLayout());
            }

            get sidebarPosition() {
                return this.options.viewModel.sidebarPosition();
            }

            invalidateLayout() {
                // this happens when the view is re-rendered
                this.render().done();
            }

            templateData() {
                // this variables are used in the template 
                return {
                    sidebarLeft: this.sidebarPosition === SidebarPosition.Left
                };
            }

            close() {
                super.close();

                // next time the view is rendered it should be as usual
                //this._firstRender = true;
            }

            render() {
                //this.element.parent().addClass('busy');

                // call base method
                return super.render()
                    .then(() => {
                        //this.element.parent().removeClass('busy');
                    });
            }

            animateSidebarTo(sidebarSize: number, duration: number = layoutAnimationDuration) {

                var sidebarRegionContainer = this.sidebar.options.element.parent(),
                    sidebarRegionContainerWidth = sidebarRegionContainer.width(),
                    difference = sidebarRegionContainerWidth - sidebarSize;

                if (this.sidebarPosition === SidebarPosition.Right) {

                    var splitbar = sidebarRegionContainer.prev(),
                        contentToExpand = splitbar.prev();

                    return Q.all([
                        sidebarRegionContainer.deferredAnimate({ left: "+=" + difference, width: sidebarSize }, duration),
                        splitbar.deferredAnimate({ left: "+=" + difference }, duration),
                        contentToExpand.deferredAnimate({ width: "+=" + difference }, duration)
                    ]);

                    
                } else {
                    var splitbar = sidebarRegionContainer.next(),
                        contentToExpand = splitbar.next();
                   
                    return Q.all([
                        sidebarRegionContainer.deferredAnimate({ width: sidebarSize }, duration),
                        splitbar.deferredAnimate({ left: "-=" + difference }, duration),
                        contentToExpand.deferredAnimate({ left: "-=" + difference, width: "+=" + difference }, duration)
                    ]);
                }
            }
        }

        export class SideLayoutModule extends _app.Modules.ModuleBase {
            contentView: SideLayoutView;
            viewModel: SideLayoutViewModel;
            ribbonModule: _app.Jigsaw.Ribbon.RibbonItemModule;

            get content() { return this.contentView.content; }
            get sidebar() { return this.contentView.sidebar; }

            constructor(public coreModule: CoreModule) {
                super();

                this.setup();

                var selectedLocation = ko.computed({
                    read: () => this.viewModel.sidebarPosition() === 0 ? "Left" : "Right",
                    write: value => this.viewModel.sidebarPosition(value === "Left" ? SidebarPosition.Left : SidebarPosition.Right)
                }),
                    ribbonSideBarSelect = new _app.Jigsaw.Ribbon.RibbonSelect("Side bar", ["Left", "Right"],
                        selectedLocation, "", "/images/sidebar-ribbon.png");

                this.ribbonModule = new _app.Jigsaw.Ribbon.RibbonItemModule({
                    coreModule: coreModule,
                    tab: { header: "Users" },
                    group: { header: "Layout", priority: 80 },
                    priority: 10,
                    items: [
                        ribbonSideBarSelect,
                        new _app.Jigsaw.Ribbon.RibbonButton("Reset all", () => this.viewModel.resetLayout(), "", "/images/restartlayout-ribbon.png")
                    ]
                });
            }

            setup() {
                this.viewModel = new SideLayoutViewModel();
                this.contentView = new SideLayoutView({
                    template: templates.SideLayout,
                    viewModel: this.viewModel,
                    regions: {}
                });
            }

            requiredModules(): _app.Modules.IModule[] {
                return [this.coreModule, this.ribbonModule];
            }

            unload() {
                //this.coreModule.content.close();
                return super.unload();
            }

            load(): Q.Promise<any> {
                return this.coreModule.content.show(this.contentView)
                    .then(() => Q.delay(true, 100));
            }

        }


        class ObservableSizeLocker {
            lockedSize = ko.observable(0);
            locked = ko.observable(false);
            calculatedSize: KnockoutComputed<number>;

            private _queue = new _app.Common.PromiseQueue();

            constructor(public size: KnockoutComputed<number>, private transition: (x: number) => Q.Promise<any>) {
                this.calculatedSize = ko.computed<number>({
                    read: () => this.locked() ? this.lockedSize() : size(),
                    write: value => {
                        if (!this.locked()) {
                            size(value);
                        } else {
                            // refresh the observable value
                            this.locked.valueHasMutated();
                        }
                    }
                });
            }

            /** puts the viewbar in a collapsed state. also hides the splitter on the view */
            lock(size = 0) {
                return this._queue.enqueue(() => {
                    return this.transition(size)
                        .then(() => {
                            this.lockedSize(size);
                            this.locked(true);
                        });
                });
            }

            expand() {
                var size = this.size();

                return this._queue.enqueue(() => {
                    return this.transition(size)
                        .then(() => {
                            this.locked(false);
                        });
                });
            }
        }

        export enum BarState {
            Visible,
            Collapsed,
            Hidden
        }

        export enum ViewbarPosition {
            Bottom,
            Right
        }

        /** default variable for the initial sidebar position */
        var defaultViewbarPosition = ViewbarPosition.Bottom;

        /** default variable for the initial sidebar size */
        var defaultViewbarBottomSize = 250;
        var defaultViewbarRightSize = 400;

        export class ViewLayoutViewModel extends SideLayoutViewModel implements _app.Jigsaw.Layout.ViewbarSizeController {
            viewbarPosition: KnockoutObservable<ViewbarPosition>;

            private viewbarSizeBottom: KnockoutObservable<number>;
            private viewbarSizeRight: KnockoutObservable<number>;

            viewbarSize: KnockoutComputed<number>;
            animateViewbarTo = new _app.Common.InteractionRequest<number, Q.Promise<any>>();
            viewbarLocked: KnockoutObservable<boolean>;

            private _viewbarQueue = new _app.Common.PromiseQueue();
            private _viewbarSizeLocker: ObservableSizeLocker;

            constructor(initialSidebarPosition = defaultSidebarPosition, initialSidebarSize = defaultSidebarSize,
                initialViewBarPosition = defaultViewbarPosition) {
                super(initialSidebarPosition, initialSidebarSize);

                this.viewbarPosition = ko.observable(initialViewBarPosition).extend({ persist: "viewbarPosition" });

                this.viewbarSizeBottom = ko.observable(defaultViewbarBottomSize).extend({ persist: "viewbarSizeBottom", px: true });
                this.viewbarSizeRight = ko.observable(defaultViewbarRightSize).extend({ persist: "viewbarSizeRight", px: true });

                this._viewbarSizeLocker = new ObservableSizeLocker(ko.computed<number>({
                    read: () => this.viewbarPosition() === ViewbarPosition.Bottom
                        ? this.viewbarSizeBottom()
                        : this.viewbarSizeRight(),
                    write: value => {
                        if (this.viewbarPosition() === ViewbarPosition.Bottom) {
                            this.viewbarSizeBottom(value);
                        } else {
                            this.viewbarSizeRight(value);
                        }
                    }
                }), x => this.animateViewbarTo.request(x));
                this.viewbarSize = this._viewbarSizeLocker.calculatedSize.extend({ px: true });

                this.viewbarPosition.subscribe(() => {
                    if (!this.editingLayout) {
                        this.invalidateLayoutEvent.fire();
                    }
                });

                this.viewbarLocked = this._viewbarSizeLocker.locked;

            }

            resetLayout() {
                this.editingLayout = true;

                super.resetLayout();

                this.viewbarPosition(defaultViewbarPosition);
                this.viewbarSize(defaultViewbarBottomSize);

                this.editingLayout = false;
                this.invalidateLayoutEvent.fire();
            }

            /** puts the viewbar in a collapsed state. also hides the splitter on the view */
            collapseViewbar() {
                return this._viewbarSizeLocker.lock(0);
            }

            expandViewbar() {
                return this._viewbarSizeLocker.expand();
            }

        }

        export interface ViewLayoutViewOptions extends SideLayoutViewOptions {
            viewModel: ViewLayoutViewModel;
        }

        export class ViewLayoutView extends SideLayoutView {
            options: ViewLayoutViewOptions;
            viewbar: _app.Marionette.Region;

            constructor(options: ViewLayoutViewOptions) {
                super({
                    template: options.template,
                    viewModel: options.viewModel,
                    regions: _.defaults(options.regions, {
                        content: "#viewLayout-content",
                        viewbar: "#viewLayout-viewbar",
                        sidebar: "#sideLayout-sidebar"
                    })
                });

                var viewModel = options.viewModel;
                viewModel.animateViewbarTo.handle(x => this.animateViewbarTo(x));

                if (viewModel.viewbarSize() === 0) {
                    this.viewbar.options.element.hide();
                }
            }

            get viewbarPosition() {
                return this.options.viewModel.viewbarPosition();
            }

            templateData() {
                return _.defaults(super.templateData(), {
                    viewbarBottom: this.viewbarPosition === ViewbarPosition.Bottom,
                });
            }

            private hideViewbarIfCollapsed() {
                if (this.options.viewModel.viewbarSize() === 0) {
                    this.viewbar.options.element.hide();
                }
            }

            render() {
                return super.render()
                    .then(() => this.hideViewbarIfCollapsed());
            }

            animateSidebarTo(sidebarSize: number, duration: number = layoutAnimationDuration): Q.Promise<any> {

                $(document).trigger('animating', 1000);

                if (this.viewbarPosition === ViewbarPosition.Bottom) {
                    // if the viewbar is at the bottom, then it's inner kendo splitter width needs to be increased
                    var sidebarRegionContainer = this.sidebar.options.element.parent(),
                        sidebarRegionContainerWidth = sidebarRegionContainer.width(),
                        difference = sidebarRegionContainerWidth - sidebarSize,
                        mainContentContainer = this.content.options.element.parent();

                    return Q.all([
                        mainContentContainer.parent().children()
                            .deferredAnimate({ width: "+=" + difference }, duration),
                        super.animateSidebarTo(sidebarSize, duration)
                    ]);
                } else if (this.sidebarPosition === SidebarPosition.Right && this.viewbarPosition === ViewbarPosition.Right) {

                    // when both bars are on the right then both need to be animated
                    var sidebarRegionContainer = this.sidebar.options.element.parent(),
                        sidebarRegionContainerWidth = sidebarRegionContainer.width(),
                        difference = sidebarRegionContainerWidth - sidebarSize,
                        sidebarSplitbar = sidebarRegionContainer.prev(),
                        contentContainer = sidebarSplitbar.prev(),
                        contentToExpand = contentContainer.children().children().first(),
                        viewbarSplitbar = contentToExpand.next(),
                        viewbarContent = viewbarSplitbar.next(),
                        viewbarWidth = viewbarContent.width();

                    var result: Q.Promise<any>;

                    return Q.all([
                        sidebarRegionContainer.deferredAnimate({ left: "+=" + difference, width: sidebarSize }, duration),
                        sidebarSplitbar.deferredAnimate({ left: "+=" + difference }, duration),
                        viewbarSplitbar.deferredAnimate({ left: "+=" + difference }, duration),
                        viewbarContent.deferredAnimate({ left: "+=" + difference }, duration),
                        contentToExpand.deferredAnimate({ width: "+=" + difference }, duration),
                        contentContainer.deferredAnimate({ width: "+=" + difference }, duration)
                    //]);
                    ]).then(() => sidebarRegionContainer.resize());

                } else if (this.sidebarPosition === SidebarPosition.Left && this.viewbarPosition === ViewbarPosition.Right) {

                    var sidebarRegionContainer = this.sidebar.options.element.parent(),
                        sidebarRegionContainerWidth = sidebarRegionContainer.width(),
                        difference = sidebarRegionContainerWidth - sidebarSize,
                        splitbar = sidebarRegionContainer.next(),
                        contentContainer = splitbar.next(),
                        contentToExpand = contentContainer.children().children().first(),
                        viewbarSplitbar = contentToExpand.next(),
                        viewbarContent = viewbarSplitbar.next();

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
                    return result.then(() => sidebarRegionContainer.resize());

                }

                return super.animateSidebarTo(sidebarSize, duration);
            }

            animateViewbarTo(viewbarSize: number, duration: number = layoutAnimationDuration) {

                var viewbarRegionContainer = this.viewbar.options.element.parent(),
                    splitbar = viewbarRegionContainer.prev(),
                    contentToExpand = splitbar.prev(),
                    result: Q.Promise<any>;

                $(document).trigger('animating', 1000);

                if (this.viewbarPosition === ViewbarPosition.Bottom) {
                    var viewbarRegionContainerHeight = viewbarRegionContainer.height(),
                        difference = viewbarRegionContainerHeight - viewbarSize;

                    result = Q.all([
                        viewbarRegionContainer.deferredAnimate({ top: "+=" + difference, height: viewbarSize }, duration),
                        splitbar.deferredAnimate({ top: "+=" + difference }, duration),
                        contentToExpand.deferredAnimate({ height: "+=" + difference }, duration)
                    ]);
                } else {

                    var viewbarRegionContainerWidth = viewbarRegionContainer.width(),
                        difference = viewbarRegionContainerWidth - viewbarSize;

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
                    return result.then(() => this.viewbar.options.element.show());
                }

            }
        }

        export class ViewLayoutModule extends SideLayoutModule implements _app.Jigsaw.Layout.IViewLayoutModule {
            contentView: ViewLayoutView;
            viewModel: ViewLayoutViewModel;

            constructor(coreModule: CoreModule) {
                super(coreModule);

                var selectedLocation = ko.computed({
                    read: () => this.viewModel.viewbarPosition() === 0 ? "Bottom" : "Right",
                    write: value => this.viewModel.viewbarPosition(value === "Bottom"
                        ? ViewbarPosition.Bottom : ViewbarPosition.Right)
                }),
                    ribbonViewBarSelect = new _app.Jigsaw.Ribbon.RibbonSelect("View bar", ["Bottom", "Right"],
                        selectedLocation, "", "fa  fa-search-plus");
                this.ribbonModule.add(ribbonViewBarSelect, 5);
            }

            get content() { return this.contentView.content; }
            get viewbar() { return this.contentView.viewbar; }

            setup() {
                this.viewModel = new ViewLayoutViewModel();
                this.contentView = new ViewLayoutView({
                    template: templates.ViewLayout,
                    viewModel: this.viewModel,
                    regions: {}
                });

                var viewModel = this.viewModel;
            }

        }

    }


    /** extends user settings module from the core app module */
    export module UserSettings {

        export class UserSettingsModule extends _app.Jigsaw.UserSettings.UserSettingsModule {

            constructor(coreModule: CoreModule, accountModule: _app.Jigsaw.Account.AccountModule, layoutModule: Layout.ViewLayoutModule) {
                super(coreModule, accountModule);

                _.extend(this.userSettingsViewModel, {
                    sidebarPosition: layoutModule.viewModel.sidebarPosition,
                    viewbarPosition: layoutModule.viewModel.viewbarPosition
                });
            }
        }

    }


}



export var coreModule = new Jigsaw.CoreModule();


export var accountModule = new _app.Jigsaw.Account.AccountModule(coreModule);
coreModule.addSlave(accountModule);

// export var sideLayoutModule = new Jigsaw.Layout.SideLayoutModule();
export var viewLayoutModule = new Jigsaw.Layout.ViewLayoutModule(coreModule);

// add custom buttons
Jigsaw.addFullScreenRibbonButton(coreModule);

var UserSettingsNotifications = new Jigsaw.UserSettings.UserSettingsModule(coreModule, accountModule, viewLayoutModule);

export var themeManager = new Jigsaw.Theming.ThemeManager(coreModule, accountModule);
_app.Jigsaw.Theming.loadThemes(themeManager); // load themes sent by server on configuration
_app.history.beforeWake(() => themeManager.initialize());

export var sidebarModule = new _app.Jigsaw.Sidebar.SidebarModule({
    sidebarSize: viewLayoutModule.viewModel,
    viewLayoutModule: viewLayoutModule
});

export var notificationsModule = new _app.Jigsaw.Notifications.NotificationsModule(coreModule, sidebarModule);
