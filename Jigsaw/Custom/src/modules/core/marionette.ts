/** features borrowed from Backbone.Marionette in order to remove all references
to these libraries from Jigsaw */
import Common = require('modules/core/common');
import Ajax = require('modules/core/ajax');

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
                return Ajax.get(url, data)
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
            super({ template: () => $('<' + root + '>') });
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
        (item: T): View;
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
 