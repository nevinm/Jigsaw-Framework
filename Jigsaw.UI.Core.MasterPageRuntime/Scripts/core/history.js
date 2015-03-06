/* Module : History */
define(["require", "exports", 'modules/core/common', 'modules/core/utils', 'modules/core/knockout'], function(require, exports, Common, Utils, Knockout) {
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
    exports.KendoHistoryProxy = KendoHistoryProxy;

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
            var loadingScreen = $(""), jigsawRoot = $('#jigsaw-root');

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
    exports.HistoryController = HistoryController;

    exports.history = new HistoryController(new KendoHistoryProxy());
});
