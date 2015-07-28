var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", 'modules/core/common', 'modules/core/ajax'], function(require, exports, Common, Ajax) {
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
    exports.View = View;

    /** returns a function that can be used as a templateFunction for views */
    function urlTemplate(url, data) {
        var template;
        return result;

        function result(helpers) {
            if (template) {
                return template(helpers);
            } else {
                return Ajax.get(url, data).then(function (rawTemplate) {
                    template = _.template(rawTemplate);
                    return result(helpers);
                });
            }
        }
    }
    exports.urlTemplate = urlTemplate;

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
    exports.remoteSourceTemplate = remoteSourceTemplate;

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
    exports.Region = Region;

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
    exports.Layout = Layout;

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
    exports.CollectionView = CollectionView;

    

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
    exports.renderViewIntoElement = renderViewIntoElement;
});
