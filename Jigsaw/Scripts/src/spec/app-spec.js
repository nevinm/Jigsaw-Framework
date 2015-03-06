/// <reference path="../definitions/knockout.d.ts" />
/// <reference path="lib/jasmine.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", '../app'], function(require, exports, app) {
    function Qwait(promise, timeout) {
        if (typeof timeout === "undefined") { timeout = 300; }
        var completed = false;
        waitsFor(function () {
            return completed;
        }, 'promise resolved', timeout);
        return promise.finally(function () {
            return completed = true;
        });
    }

    var MockHistory = (function () {
        function MockHistory() {
            this._storage = new app.Common.Dict();
            this._location = '';
        }
        MockHistory.prototype.start = function () {
        };

        MockHistory.prototype.location = function () {
            return this._location;
        };

        MockHistory.prototype.navigate = function (route) {
            var callback = this._storage.get(route);
            this._location = route;

            // execute the callback asynchronously to mimic how the browser history works
            if (callback) {
                app.Utils.async(function () {
                    return callback();
                });
            }
        };

        MockHistory.prototype.register = function (route, callback) {
            this._storage.add(route, callback);
        };
        return MockHistory;
    })();

    var MockModule = (function (_super) {
        __extends(MockModule, _super);
        function MockModule(_requiredModules, _slaveModules) {
            if (typeof _requiredModules === "undefined") { _requiredModules = []; }
            if (typeof _slaveModules === "undefined") { _slaveModules = []; }
            _super.call(this);
            this._requiredModules = _requiredModules;
            this._slaveModules = _slaveModules;
            this.loadCalled = false;
            this.unloadCalled = false;
            this.onLoad = $.Callbacks();
        }
        MockModule.prototype.slaveModules = function () {
            return this._slaveModules;
        };

        MockModule.prototype.unload = function () {
            this.unloadCalled = true;
            return Q(true);
        };

        MockModule.prototype.requiredModules = function () {
            return this._requiredModules;
        };

        MockModule.prototype.onLoaded = function (callback) {
            this.onLoad.add(callback);
        };

        MockModule.prototype.load = function () {
            this.loadCalled = true;
            this.onLoad.fire();

            return Q(true);
        };
        return MockModule;
    })(app.Modules.ModuleBase);

    describe('app', function () {
        describe('PromiseQueue', function () {
            it('enqueued promise returns promise value', function () {
                var queue = new app.Common.PromiseQueue(), someValue = {}, result;

                Qwait(queue.enqueue(function () {
                    return Q.delay(someValue, 100).then(function (x) {
                        return result = x;
                    });
                }));

                runs(function () {
                    expect(result).toBe(someValue);
                });
            });

            it('executes actions in correct order', function () {
                var queue = new app.Common.PromiseQueue(), completed = false, secondCompleted = false;

                Qwait(queue.enqueue(function () {
                    return Q.delay(true, 100).finally(function () {
                        return completed = true;
                    });
                }));

                runs(function () {
                    expect(completed).toBeTruthy();
                });

                Qwait(queue.enqueue(function () {
                    return Q.delay(true, 100).finally(function () {
                        return secondCompleted = true;
                    });
                }));

                runs(function () {
                    return expect(secondCompleted).toBeTruthy();
                });
            });

            it('continues execution when some promise fails', function () {
                var queue = new app.Common.PromiseQueue(), completed = false;

                // first promise fails and the next one should be executed
                Qwait(queue.enqueue(function () {
                    return Q.delay(true, 100).then(function () {
                        return Q.reject();
                    });
                }));
                Qwait(queue.enqueue(function () {
                    return Q.delay(true, 100).finally(function () {
                        return completed = true;
                    });
                }));

                runs(function () {
                    return expect(completed).toBeTruthy();
                });
            });
        });

        describe("Guarded Observable", function () {
            it('selects item', function () {
                var observable = ko.guarded(1);
                observable(2);
                expect(observable()).toEqual(2);
            });

            it('cancels change if one guard rejects item', function () {
                var observable = ko.guarded(1);
                observable.guard(function () {
                    return Q.reject();
                });
                observable.guard(function () {
                    return Q(true);
                });
                observable(2);

                runs(function () {
                    return expect(observable()).toEqual(2);
                }); // facade should change

                waitsFor(function () {
                    return observable() == 1;
                }, '', 300);
                runs(function () {
                    return expect(observable()).toEqual(1);
                });
            });

            it('guarded observable never knows of new item if the arriving value is rejected', function () {
                var observable = ko.guarded(1), guardedValues = [];

                observable.guarded.subscribe(function (x) {
                    return guardedValues.push(x);
                });

                observable.guard(function () {
                    return Q.reject();
                });
                observable(2);

                waitsFor(function () {
                    return observable() == 1;
                }, '', 300);
                runs(function () {
                    return expect(guardedValues.length).toEqual(0);
                });
            });

            it('guarded only selects item after all guards have completed its verifications', function () {
                var observable = ko.guarded(1), guardedValues = [];

                observable.guarded.subscribe(function (x) {
                    return guardedValues.push(x);
                });

                observable.guard(function () {
                    return Q.delay(true, 100);
                });
                observable(2);

                runs(function () {
                    return expect(guardedValues.length).toEqual(0);
                });

                waitsFor(function () {
                    return guardedValues.length > 0;
                }, 'guarded notified', 300);
                runs(function () {
                    expect(guardedValues.length).toEqual(1);
                    expect(guardedValues[0]).toEqual(2);
                    expect(observable()).toEqual(2);
                    expect(observable.guarded()).toEqual(2);
                });
            });
        });

        describe('Bind Observables', function () {
            describe('bind two observables', function () {
                var from = ko.observable(1), to = ko.observable(), options = {
                    from: from,
                    to: to,
                    forward: function (x) {
                        return -1 * x;
                    },
                    backward: function (x) {
                        return -1 * x;
                    }
                };
                app.Knockout.bind(options);

                it('observables are synced when binded', function () {
                    expect(to()).toBe(-1);
                });

                it('modifing from observable affects the other part', function () {
                    from(2);
                    expect(to()).toBe(-2);
                });

                it('modifing from observable affects the other part', function () {
                    to(3);
                    expect(from()).toBe(-3);
                });
            });
        });

        describe('Persisted Array', function () {
            /** this function spy on the set/get functions of the localStorage and uses a temporary object instead.
            it can be used to make test that should modify the current localStorage */
            function mockLocalStorage() {
                var storage = {}, getItem = spyOn(app.Knockout.persistExtender, 'storageGetItem').andCallFake(function (key) {
                    return storage[key];
                }), setItem = spyOn(app.Knockout.persistExtender, 'storageSetItem').andCallFake(function (key, value) {
                    return storage[key] = value;
                });

                return {
                    storage: storage,
                    getItem: getItem,
                    setItem: setItem
                };
            }

            it('initializes empty array when created', function () {
                var storage = mockLocalStorage(), array = app.Knockout.persistedArray({
                    key: 'key'
                });
                expect(storage.storage.key).toBeUndefined();
                expect(array.length).toEqual(0);
                expect(storage.getItem).toHaveBeenCalled();
            });

            it('stores value after item is inserted in array', function () {
                var storage = mockLocalStorage(), array = app.Knockout.persistedArray({
                    key: 'key'
                });
                array.push(1);
                expect(storage.storage.key).toBe('[1]');
            });
        });

        describe('Marionette', function () {
            it('view generates element when rendered', function () {
                var view = new app.Marionette.View({ template: function () {
                        return '<span>';
                    } });
                expect(view.element).toBeNull();
                Qwait(view.render());
                runs(function () {
                    expect(view.element).toNotBe(null);
                });
            });

            it('closing view throws generated element', function () {
                var view = new app.Marionette.View({ template: function () {
                        return '<span>';
                    } });
                Qwait(view.render());
                runs(function () {
                    view.close();
                    expect(view.isClosed).toBeTruthy();
                    expect(view.element).toBeNull();
                });
            });

            it('shows view in region', function () {
                var regionElement = $('<div>'), region = new app.Marionette.Region({ element: regionElement }), view = new app.Marionette.View({ template: function () {
                        return '<span>';
                    } });

                // region element should be empty when initialized
                expect(regionElement.children().length).toBe(0);

                Qwait(region.show(view));
                runs(function () {
                    // view element should have been added to region
                    expect(regionElement.children().length).toBeGreaterThan(0);
                });
            });

            it('closing region closes the active view', function () {
                var regionElement = $('<div>'), region = new app.Marionette.Region({ element: regionElement }), view = new app.Marionette.View({ template: function () {
                        return '<span>';
                    } });
                Qwait(region.show(view));
                runs(function () {
                    region.close();

                    expect(view.isClosed).toBeTruthy();
                    expect(region.options.element.children().length).toBe(0);
                });
            });

            it('showing a second view on a region closes the first one and displays the second view', function () {
                var regionElement = $('<div>'), region = new app.Marionette.Region({ element: regionElement }), view1 = new app.Marionette.View({ template: function () {
                        return '<span>';
                    } }), view2 = new app.Marionette.View({ template: function () {
                        return '<div>';
                    } });
                Qwait(region.show(view1));
                Qwait(region.show(view2));
                runs(function () {
                    expect(view1.isClosed).toBeFalsy();
                    expect(region.options.element.children('span').length).toBe(0);

                    expect(view2.isClosed).toBeFalsy();
                    expect(region.options.element.children('div').length).toBe(1);
                });
            });

            it('showing a second view calls domReady on the second view', function () {
                var regionElement = $('<div>'), region = new app.Marionette.Region({ element: regionElement }), view1 = new app.Marionette.View({ template: function () {
                        return '<span>';
                    } }), view2 = new app.Marionette.View({ template: function () {
                        return '<div>';
                    } }), domReady = spyOn(view2, 'domReady').andCallThrough();

                Qwait(region.show(view1));
                runs(function () {
                    Qwait(region.show(view2));

                    runs(function () {
                        expect(domReady).toHaveBeenCalled();
                        expect(domReady.callCount).toEqual(1);
                    });
                });
            });

            describe('re-render view', function () {
                var regionElement = $('<div>'), region = new app.Marionette.Region({ element: regionElement }), view = new app.Marionette.View({ template: function () {
                        return '<span>';
                    } });

                it('view is notified of domReady when rendered in a region', function () {
                    var domReady = spyOn(view, 'domReady').andCallThrough();
                    Qwait(region.show(view));

                    runs(function () {
                        expect(domReady).toHaveBeenCalled();
                        expect(domReady.callCount).toBe(1);
                    });
                });

                it('view domReady is called when re-rendered when the view is associated with a region', function () {
                    // because the view is already part of the DOM
                    var domReady = spyOn(view, 'domReady').andCallThrough();
                    Qwait(view.render());

                    runs(function () {
                        expect(domReady).toHaveBeenCalled();
                        expect(domReady.callCount).toEqual(1);
                    });
                });

                it('replace view and go back again, domReady is called once', function () {
                    var view2 = new app.Marionette.View({ template: function () {
                            return '<div>';
                        } }), domReady2 = spyOn(view2, 'domReady').andCallThrough(), domReady = spyOn(view, 'domReady').andCallThrough();

                    Qwait(region.show(view2));

                    runs(function () {
                        Qwait(region.show(view));

                        runs(function () {
                            expect(domReady2).toHaveBeenCalled();
                            expect(domReady2.callCount).toEqual(1);

                            expect(domReady).toHaveBeenCalled();
                            expect(domReady.callCount).toEqual(1);
                        });
                    });
                });
            });

            function testViewWithViewModel(name, view) {
                describe(name, function () {
                    var regionElement = $('<div>'), region = new app.Marionette.Region({ element: regionElement });

                    it('applies view-model to view', function () {
                        var applyBindings = spyOn(ko, 'applyBindings').andCallThrough();
                        Qwait(region.show(view));
                        runs(function () {
                            expect(applyBindings).toHaveBeenCalledWith(view.options.viewModel, view.element[0]);
                        });
                    });

                    it('re-rendering view cleans previous element and applies bindings again with new elements', function () {
                        var applyBindings = spyOn(ko, 'applyBindings').andCallThrough();
                        var cleanNode = spyOn(ko, 'cleanNode').andCallThrough();

                        Qwait(view.render());
                        runs(function () {
                            expect(cleanNode).toHaveBeenCalled();
                            expect(applyBindings).toHaveBeenCalledWith(view.options.viewModel, view.element[0]);
                        });
                    });

                    it('clean up bindings when view closed', function () {
                        var cleanNode = spyOn(ko, 'cleanNode').andCallThrough();
                        region.close();
                        expect(cleanNode).toHaveBeenCalled();
                    });
                });
            }

            testViewWithViewModel('appling bindings with view', new app.Marionette.View({ template: function () {
                    return '<span>';
                }, viewModel: {} }));
            testViewWithViewModel('appling bindings with layout', new app.Marionette.Layout({
                template: function () {
                    return '<span>';
                },
                regions: { content: 'span' },
                viewModel: {}
            }));

            it('layout keeps views when re-rendered', function () {
                var regionElement = $('<div>'), region = new app.Marionette.Region({ element: regionElement }), layout = new app.Marionette.Layout({
                    template: function () {
                        return '<div>';
                    },
                    viewModel: {},
                    regions: { content: 'div' }
                }), view = new app.Marionette.View({ template: function () {
                        return '<span>';
                    }, viewModel: {} });

                Qwait(region.show(layout));

                runs(function () {
                    expect(content()).toBeDefined();

                    Qwait(content().show(view).then(function () {
                        return layout.render();
                    }));

                    runs(function () {
                        expect(view.isClosed).toBeFalsy();
                        expect(view.element.parent()[0]).toBe(content().options.element[0]);
                    });
                });

                function content() {
                    return layout['content'];
                }
            });
        });

        describe('History', function () {
            it('history executes callback one time', function () {
                var controller = new app.History.HistoryController(new MockHistory(), false), times = 0;
                controller.register('#route', function () {
                    return times++;
                });

                runs(function () {
                    return controller.navigate('#route');
                });

                waitsFor(function () {
                    return times > 0;
                }, 'callback executed', 300);
                runs(function () {
                    expect(controller.location()).toEqual('#route');
                    expect(times).toEqual(1);
                });
            });

            it('navigation promise completes after callback promise is resolved', function () {
                var controller = new app.History.HistoryController(new MockHistory(), false), times = 0;
                controller.register('#route', function () {
                    return Q.delay(true, 200).then(function () {
                        return times++;
                    });
                });

                Qwait(controller.navigateSilent('#route'));
                runs(function () {
                    expect(controller.location()).toEqual('#route');
                    expect(times).toEqual(1);
                });
            });

            it('callback isnt called when silent navigation is specified', function () {
                var controller = new app.History.HistoryController(new MockHistory(), false), times = 0;
                controller.register('#route', function () {
                    return Q.delay(true, 200).then(function () {
                        return times++;
                    });
                });

                Qwait(controller.navigateSilent('#route', false));

                runs(function () {
                    expect(controller.location()).toEqual('#route');
                    expect(times).toEqual(0);
                });
            });

            it('navigation isnt performed if guardian is preventing it', function () {
                var controller = new app.History.HistoryController(new MockHistory(), false), times = 0;
                controller.register('#route', function () {
                    return Q.delay(true, 100).then(function () {
                        return times++;
                    });
                });

                controller.addGuardian(function () {
                    return Q.delay(true, 100).then(function () {
                        return Q.reject();
                    });
                });

                Qwait(controller.navigateSilent('#route'));

                runs(function () {
                    // and when the guardian rejects the route it should be setted back to it's original value
                    expect(controller.location()).toEqual('');
                    expect(times).toEqual(0);
                });
            });
        });

        describe('Module manager', function () {
            it('simple module gets loaded', function () {
                var moduleManager = new app.Modules.ModuleManager(), a = new MockModule();

                Qwait(moduleManager.load(a));

                runs(function () {
                    expect(a.loadCalled).toBeTruthy();
                    expect(moduleManager.isLoaded(a)).toBeTruthy();
                    expect(moduleManager.heads).toContain(a);
                });
            });

            it('for convenience null dependencies are ignored', function () {
                var moduleManager = new app.Modules.ModuleManager(), a = new MockModule([null]);

                Qwait(moduleManager.load(a));

                runs(function () {
                    expect(a.loadCalled).toBeTruthy();
                    expect(moduleManager.isLoaded(a)).toBeTruthy();
                    expect(moduleManager.heads).toContain(a);
                });
            });

            it('loaded module does not gets loaded again if re-loaded', function () {
                var moduleManager = new app.Modules.ModuleManager(), a = new MockModule(), loadSpy = spyOn(a, 'load').andCallThrough();

                Qwait(moduleManager.load(a));

                runs(function () {
                    expect(moduleManager.isLoaded(a)).toBeTruthy();
                    expect(a.load).toHaveBeenCalled();

                    Qwait(moduleManager.load(a));

                    runs(function () {
                        expect(moduleManager.isLoaded(a)).toBeTruthy();
                        expect(loadSpy.callCount).toBe(1);
                    });
                });
            });

            it('loading of module with dependencies is performed in correct order', function () {
                var moduleManager = new app.Modules.ModuleManager(), a = new MockModule(), b = new MockModule(), c = new MockModule([a, b]), loadingOrder = [];

                // store the loaded modules into array to get the loading order
                _.each([a, b, c], function (m) {
                    return m.onLoaded(function () {
                        return loadingOrder.push(m);
                    });
                });

                Qwait(moduleManager.load(c));

                runs(function () {
                    _.each([a, b, c], function (m) {
                        expect(m.loadCalled).toBeTruthy();
                        expect(moduleManager.isLoaded(m)).toBeTruthy();
                    });

                    expect(_.isEqual(moduleManager.heads, [c])).toBeTruthy();
                    expect(_.isEqual(loadingOrder, [a, b, c])).toBeTruthy();
                });
            });

            it('module is loaded only once even if is repeated in the requiredModules array', function () {
                var moduleManager = new app.Modules.ModuleManager(), a = new MockModule(), b = new MockModule([a, a]), loadSpy = spyOn(a, 'load').andCallFake(function () {
                    return Q.delay(true, 100);
                });

                Qwait(moduleManager.load(b));

                runs(function () {
                    expect(loadSpy.callCount).toBe(1);
                });
            });

            it('loads modules with diamond shape dependencies', function () {
                var moduleManager = new app.Modules.ModuleManager(), a = new MockModule(), b = new MockModule([a]), c = new MockModule([a]), d = new MockModule([b, c]), loadingOrder = [];

                // store the loaded modules into array to get the loading order
                _.each([a, b, c, d], function (m) {
                    return m.onLoaded(function () {
                        return loadingOrder.push(m);
                    });
                });

                Qwait(moduleManager.load(d));

                runs(function () {
                    _.each([a, b, c, d], function (m) {
                        expect(m.loadCalled).toBeTruthy();
                        expect(moduleManager.isLoaded(m)).toBeTruthy();
                    });

                    // loading order of 'b' and 'c' modules isn't important, but they must be loaded
                    // after 'a' and before 'd'
                    expect(_.isEqual(loadingOrder, [a, b, c, d]) || _.isEqual(loadingOrder, [a, c, b, d])).toBeTruthy();
                });
            });

            it('loads module with slave dependencies', function () {
                var moduleManager = new app.Modules.ModuleManager(), a = new MockModule(), b = new MockModule([], [a]), loadingOrder = [];

                // store the loaded modules into array to get the loading order
                _.each([a, b], function (m) {
                    return m.onLoaded(function () {
                        return loadingOrder.push(m);
                    });
                });

                Qwait(moduleManager.load(b));

                runs(function () {
                    _.each([a, b], function (m) {
                        expect(m.loadCalled).toBeTruthy();
                        expect(moduleManager.isLoaded(m)).toBeTruthy();
                    });

                    // the slave module get's loaded after its parent
                    expect(_.isEqual(loadingOrder, [b, a])).toBeTruthy();
                });
            });

            describe('loading-unloading workflow', function () {
                var moduleManager = new app.Modules.ModuleManager(), a = new MockModule(), b = new MockModule(), c = new MockModule([a, b]), d = new MockModule([a, b]), loadingOrder = [];

                // store the loaded modules into array to get the loading order
                _.each([a, b, c, d], function (m) {
                    return m.onLoaded(function () {
                        return loadingOrder.push(m);
                    });
                });

                it("loads 'c' depending on 'a','b'", function () {
                    Qwait(moduleManager.load(c));

                    runs(function () {
                        _.each([a, b, c], function (m) {
                            expect(m.loadCalled).toBeTruthy();
                            expect(moduleManager.isLoaded(m)).toBeTruthy();
                        });
                        expect(_.isEqual(loadingOrder, [a, b, c])).toBeTruthy();
                    });
                });

                it("loads 'd' depending on 'a','b' only unloading 'c'", function () {
                    loadingOrder.splice(0);
                    Qwait(moduleManager.load(d));

                    runs(function () {
                        _.each([a, b, d], function (m) {
                            expect(m.loadCalled).toBeTruthy();
                            expect(moduleManager.isLoaded(m)).toBeTruthy();
                        });

                        // only 'd' should be loaded because 'a' and 'b' are already loaded
                        expect(_.isEqual(loadingOrder, [d])).toBeTruthy();

                        // check that 'c' isn't loaded
                        expect(c.unloadCalled).toBeTruthy();
                        expect(moduleManager.isLoaded(c)).toBeFalsy();
                    });
                });
            });
        });
    });
});
