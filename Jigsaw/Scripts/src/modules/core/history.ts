/* Module : History */

/* Requires */
import Common = require('modules/core/common');
import Utils = require('modules/core/utils');
import Knockout = require('modules/core/knockout');

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
            var loadingScreen = $(""),
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
