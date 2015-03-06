/// <reference path="../definitions/knockout.d.ts" />
/// <reference path="lib/jasmine.d.ts" />

import app = require('../app')

function Qwait(promise: Q.Promise<any>, timeout = 300) {
    var completed = false;
    waitsFor(() => completed, 'promise resolved', timeout);
    return promise.finally(() => completed = true);
}

class MockHistory implements app.History.IHistory {
    private _storage = new app.Common.Dict<string, Function>();
    private _location = '';

    start() {

    }

    location() {
        return this._location;
    }

    navigate(route: string) {
        var callback = this._storage.get(route);
        this._location = route;
        // execute the callback asynchronously to mimic how the browser history works
        if (callback) {
            app.Utils.async(() => callback());
        }
    }

    register(route: string, callback: Function) {
        this._storage.add(route, callback);
    }
}

class MockModule extends app.Modules.ModuleBase {
    loadCalled = false;
    unloadCalled = false;
    private onLoad = $.Callbacks();

    constructor(private _requiredModules: app.Modules.IModule[]= [], private _slaveModules: app.Modules.IModule[]= []) {
        super();
    }

    slaveModules(): app.Modules.IModule[] {
        return this._slaveModules;
    }

    unload() {
        this.unloadCalled = true;
        return Q(true);
    }

    requiredModules(): app.Modules.IModule[] {
        return this._requiredModules;
    }

    onLoaded(callback) {
        this.onLoad.add(callback);
    }

    load(): Q.Promise<any> {
        this.loadCalled = true;
        this.onLoad.fire();

        return Q(true);
    }
}

describe('app', ()=> {

    describe('PromiseQueue', function() {

        it('enqueued promise returns promise value', function() {
            var queue = new app.Common.PromiseQueue(),
                someValue = {},
                result;

            Qwait(queue.enqueue(() => Q.delay(someValue, 100).then(x => result = x)));

            runs(() => {
                expect(result).toBe(someValue);
            });
        });

        it('executes actions in correct order', function() {
            var queue = new app.Common.PromiseQueue(),
                completed = false,
                secondCompleted = false;

            Qwait(queue.enqueue(() => Q.delay(true, 100).finally(() => completed = true)));

            runs(() => {
                expect(completed).toBeTruthy();
            });

            Qwait(queue.enqueue(() => {
                return Q.delay(true, 100).finally(() => secondCompleted = true);
            }));

            runs(() => expect(secondCompleted).toBeTruthy());
        });

        it('continues execution when some promise fails', function() {
            var queue = new app.Common.PromiseQueue(),
                completed = false;

            // first promise fails and the next one should be executed
            Qwait(queue.enqueue(() => Q.delay(true, 100).then(() => Q.reject())));
            Qwait(queue.enqueue(() => Q.delay(true, 100).finally(() => completed = true)));

            runs(() => expect(completed).toBeTruthy());
        });


    });

    describe("Guarded Observable", function() {

        it('selects item', function() {
            var observable = ko.guarded(1);
            observable(2);
            expect(observable()).toEqual(2);
        });
        
        it('cancels change if one guard rejects item', function() {
            var observable = ko.guarded(1);
            observable.guard(() => Q.reject());
            observable.guard(() => Q(true));
            observable(2);

            runs(() => expect(observable()).toEqual(2)); // facade should change

            waitsFor(() => observable() == 1, '', 300);
            runs(() => expect(observable()).toEqual(1));
        });

        it('guarded observable never knows of new item if the arriving value is rejected', function() {
            var observable = ko.guarded(1),
                guardedValues = [];

            observable.guarded.subscribe(x => guardedValues.push(x));

            observable.guard(() => Q.reject());
            observable(2);

            waitsFor(() => observable() == 1, '', 300);
            runs(() => expect(guardedValues.length).toEqual(0));
        });

        it('guarded only selects item after all guards have completed its verifications', function() {
            var observable = ko.guarded(1),
                guardedValues = [];

            observable.guarded.subscribe(x => guardedValues.push(x));

            observable.guard(() => Q.delay(true, 100));
            observable(2);

            runs(() => expect(guardedValues.length).toEqual(0));

            waitsFor(() => guardedValues.length>0, 'guarded notified', 300);
            runs(() => {
                expect(guardedValues.length).toEqual(1);
                expect(guardedValues[0]).toEqual(2);
                expect(observable()).toEqual(2);
                expect(observable.guarded()).toEqual(2);
            });
        });


    });

    describe('Bind Observables', function () {

        describe('bind two observables', () => {
            var from = ko.observable(1),
                to = ko.observable<number>(),
                options: app.Knockout.BindOptions<number, number> = {
                    from: from,
                    to: to,
                    forward: x => -1 * x,
                    backward: x=> -1 * x
                };
            app.Knockout.bind(options);

            it('observables are synced when binded', () => {
                expect(to()).toBe(-1);
            });

            it('modifing from observable affects the other part', () => {
                from(2);
                expect(to()).toBe(-2);
            });


            it('modifing from observable affects the other part', () => {
                to(3);
                expect(from()).toBe(-3);
            });
        });

    });

    describe('Persisted Array', function () {

        /** this function spy on the set/get functions of the localStorage and uses a temporary object instead.
        it can be used to make test that should modify the current localStorage */
        function mockLocalStorage() {
            var storage: any = {},
                getItem = spyOn(app.Knockout.persistExtender, 'storageGetItem').andCallFake(key => storage[key]),
                setItem = spyOn(app.Knockout.persistExtender, 'storageSetItem').andCallFake((key, value) => storage[key] = value);

            return {
                storage: storage,
                getItem: getItem,
                setItem: setItem
            };
        }

        it('initializes empty array when created', () => {
            var storage = mockLocalStorage(),
                array = app.Knockout.persistedArray({
                    key: 'key'
                });
            expect(storage.storage.key).toBeUndefined();
            expect(array.length).toEqual(0);
            expect(storage.getItem).toHaveBeenCalled();
        });
        
        it('stores value after item is inserted in array', () => {
            var storage = mockLocalStorage(),
                array = app.Knockout.persistedArray({
                    key: 'key'
                });
            array.push(1);
            expect(storage.storage.key).toBe('[1]');
        });


    });

    describe('Marionette', function () {

        it('view generates element when rendered', () => {
            var view = new app.Marionette.View({ template: () => '<span>' });
            expect(view.element).toBeNull();
            Qwait(view.render());
            runs(() => {
                expect(view.element).toNotBe(null);
            });
        });

        it('closing view throws generated element', () => {
            var view = new app.Marionette.View({ template: () => '<span>' });
            Qwait(view.render());
            runs(() => {
                view.close();
                expect(view.isClosed).toBeTruthy();
                expect(view.element).toBeNull();
            });
        });

        it('shows view in region', () => {
            var regionElement = $('<div>'),
                region = new app.Marionette.Region({ element: regionElement }),
                view = new app.Marionette.View({ template: () => '<span>' });

            // region element should be empty when initialized
            expect(regionElement.children().length).toBe(0);

            Qwait(region.show(view));
            runs(() => {
                // view element should have been added to region
                expect(regionElement.children().length).toBeGreaterThan(0);
            });
        });

        it('closing region closes the active view', () => {
            var regionElement = $('<div>'),
                region = new app.Marionette.Region({ element: regionElement }),
                view = new app.Marionette.View({ template: () => '<span>' });
            Qwait(region.show(view));
            runs(() => {
                region.close();

                expect(view.isClosed).toBeTruthy();
                expect(region.options.element.children().length).toBe(0);
            });
        });
        
        it('showing a second view on a region closes the first one and displays the second view', () => {
            var regionElement = $('<div>'),
                region = new app.Marionette.Region({ element: regionElement }),
                view1 = new app.Marionette.View({ template: () => '<span>' }),
                view2 = new app.Marionette.View({ template: () => '<div>' });
            Qwait(region.show(view1));
            Qwait(region.show(view2));
            runs(() => {
                expect(view1.isClosed).toBeFalsy();
                expect(region.options.element.children('span').length).toBe(0);

                expect(view2.isClosed).toBeFalsy();
                expect(region.options.element.children('div').length).toBe(1);
            });
        });

        it('showing a second view calls domReady on the second view', () => {
            var regionElement = $('<div>'),
                region = new app.Marionette.Region({ element: regionElement }),
                view1 = new app.Marionette.View({ template: () => '<span>' }),
                view2 = new app.Marionette.View({ template: () => '<div>' }),
                domReady = spyOn(view2, 'domReady').andCallThrough();
                
            Qwait(region.show(view1));
            runs(() => {
                Qwait(region.show(view2));

                runs(() => {
                    expect(domReady).toHaveBeenCalled();
                    expect(domReady.callCount).toEqual(1);
                });
            });
        });

        describe('re-render view', () => {
            var regionElement = $('<div>'),
                region = new app.Marionette.Region({ element: regionElement }),
                view = new app.Marionette.View({ template: () => '<span>' });

            it('view is notified of domReady when rendered in a region', () => {
                var domReady = spyOn(view, 'domReady').andCallThrough();
                Qwait(region.show(view));

                runs(() => {
                    expect(domReady).toHaveBeenCalled();
                    expect(domReady.callCount).toBe(1);
                });
            });

            it('view domReady is called when re-rendered when the view is associated with a region', () => {
                // because the view is already part of the DOM
                var domReady = spyOn(view, 'domReady').andCallThrough();
                Qwait(view.render());

                runs(() => {
                    expect(domReady).toHaveBeenCalled();
                    expect(domReady.callCount).toEqual(1);
                });
            });

            it('replace view and go back again, domReady is called once', () => {
                var view2 = new app.Marionette.View({ template: () => '<div>' }),
                    domReady2 = spyOn(view2, 'domReady').andCallThrough(),
                    domReady = spyOn(view, 'domReady').andCallThrough();

                Qwait(region.show(view2));

                runs(() => {
                    Qwait(region.show(view));

                    runs(() => {
                        expect(domReady2).toHaveBeenCalled();
                        expect(domReady2.callCount).toEqual(1);

                        expect(domReady).toHaveBeenCalled();
                        expect(domReady.callCount).toEqual(1);
                    });
                });
            });
        });

        function testViewWithViewModel(name: string, view: app.Marionette.View) {
            describe(name, () => {
                var regionElement = $('<div>'),
                    region = new app.Marionette.Region({ element: regionElement });

                it('applies view-model to view', () => {
                    var applyBindings = spyOn(ko, 'applyBindings').andCallThrough();
                    Qwait(region.show(view));
                    runs(() => {
                        expect(applyBindings).toHaveBeenCalledWith(view.options.viewModel, view.element[0]);
                    });
                });

                it('re-rendering view cleans previous element and applies bindings again with new elements', () => {
                    var applyBindings = spyOn(ko, 'applyBindings').andCallThrough();
                    var cleanNode = spyOn(ko, 'cleanNode').andCallThrough();

                    Qwait(view.render());
                    runs(() => {
                        expect(cleanNode).toHaveBeenCalled();
                        expect(applyBindings).toHaveBeenCalledWith(view.options.viewModel, view.element[0]);
                    });
                });

                it('clean up bindings when view closed', () => {
                    var cleanNode = spyOn(ko, 'cleanNode').andCallThrough();
                    region.close();
                    expect(cleanNode).toHaveBeenCalled();
                });
            });
        }

        testViewWithViewModel('appling bindings with view', new app.Marionette.View({ template: () => '<span>', viewModel: {} }));
        testViewWithViewModel('appling bindings with layout', new app.Marionette.Layout({
            template: () => '<span>',
            regions: {content: 'span'},
            viewModel: {}
        }));

        it('layout keeps views when re-rendered', () => {
            var regionElement = $('<div>'),
                region = new app.Marionette.Region({ element: regionElement }),
                layout = new app.Marionette.Layout({
                    template: () => '<div>',
                    viewModel: {},
                    regions: { content: 'div' }
                }),
                view = new app.Marionette.View({ template: () => '<span>', viewModel: {} });

            Qwait(region.show(layout));

            runs(() => {
                expect(content()).toBeDefined();

                Qwait(content().show(view).then(() => layout.render()));

                runs(() => {
                    expect(view.isClosed).toBeFalsy();
                    expect(view.element.parent()[0]).toBe(content().options.element[0]);
                });
            });

            function content(): app.Marionette.Region {
                return layout['content'];
            }
        });
    });

    describe('History', function() {

        it('history executes callback one time', function() {
            var controller = new app.History.HistoryController(new MockHistory(), false),
                times = 0;
            controller.register('#route', () => times++);

            runs(() => controller.navigate('#route'));

            waitsFor(() => times > 0, 'callback executed', 300);
            runs(() => {
                expect(controller.location()).toEqual('#route');
                expect(times).toEqual(1);
            });
        });

        it('navigation promise completes after callback promise is resolved', function() {
            var controller = new app.History.HistoryController(new MockHistory(), false),
                times = 0;
            controller.register('#route', () => Q.delay(true, 200).then(() => times++));

            Qwait(controller.navigateSilent('#route'));
            runs(() => {
                expect(controller.location()).toEqual('#route');
                expect(times).toEqual(1);
            });
        });

        it('callback isnt called when silent navigation is specified', function() {
            var controller = new app.History.HistoryController(new MockHistory(), false),
                times = 0;
            controller.register('#route', () => Q.delay(true, 200).then(() => times++));

            Qwait(controller.navigateSilent('#route', false));

            runs(() => {
                expect(controller.location()).toEqual('#route');
                expect(times).toEqual(0);
            });
        });

        it('navigation isnt performed if guardian is preventing it', function() {
            var controller = new app.History.HistoryController(new MockHistory(), false),
                times = 0;
            controller.register('#route', () => Q.delay(true, 100).then(() => times++));

            controller.addGuardian(() => Q.delay(true, 100).then(() => Q.reject()));

            Qwait(controller.navigateSilent('#route'));

            runs(() => {
                // and when the guardian rejects the route it should be setted back to it's original value
                expect(controller.location()).toEqual('');
                expect(times).toEqual(0);
            });
        });

    });

    describe('Module manager', function() {

        it('simple module gets loaded', function() {
            var moduleManager = new app.Modules.ModuleManager(),
                a = new MockModule();

            Qwait(moduleManager.load(a));

            runs(() => {
                expect(a.loadCalled).toBeTruthy();
                expect(moduleManager.isLoaded(a)).toBeTruthy();
                expect(moduleManager.heads).toContain(a);
            });

        });

        it('for convenience null dependencies are ignored', function () {
            var moduleManager = new app.Modules.ModuleManager(),
                a = new MockModule([null]);

            Qwait(moduleManager.load(a));

            runs(() => {
                expect(a.loadCalled).toBeTruthy();
                expect(moduleManager.isLoaded(a)).toBeTruthy();
                expect(moduleManager.heads).toContain(a);
            });

        });

        it('loaded module does not gets loaded again if re-loaded', () => {
            var moduleManager = new app.Modules.ModuleManager(),
                a = new MockModule(),
                loadSpy = spyOn(a, 'load').andCallThrough();

            Qwait(moduleManager.load(a));

            runs(() => {
                expect(moduleManager.isLoaded(a)).toBeTruthy();
                expect(a.load).toHaveBeenCalled();

                Qwait(moduleManager.load(a));

                runs(() => {
                    expect(moduleManager.isLoaded(a)).toBeTruthy();
                    expect(loadSpy.callCount).toBe(1);
                });
            });
        });

        it('loading of module with dependencies is performed in correct order', function() {
            var moduleManager = new app.Modules.ModuleManager(),
                a = new MockModule(), b = new MockModule(), c = new MockModule([a, b]),
                loadingOrder = [];
            // store the loaded modules into array to get the loading order
            _.each([a, b, c], m=> m.onLoaded(() => loadingOrder.push(m)));

            Qwait(moduleManager.load(c));

            runs(() => {
                _.each([a, b, c], m=> {
                    expect(m.loadCalled).toBeTruthy();
                    expect(moduleManager.isLoaded(m)).toBeTruthy();
                });

                expect(_.isEqual(moduleManager.heads, [c])).toBeTruthy();
                expect(_.isEqual(loadingOrder, [a, b, c])).toBeTruthy();
            });
        });

        it('module is loaded only once even if is repeated in the requiredModules array', function () {
            var moduleManager = new app.Modules.ModuleManager(),
                a = new MockModule(), b = new MockModule([a, a]),
                loadSpy = spyOn(a, 'load').andCallFake(() => Q.delay(true,100));

            Qwait(moduleManager.load(b));

            runs(() => {
                expect(loadSpy.callCount).toBe(1);
            });
        });

        it('loads modules with diamond shape dependencies', function() {
            var moduleManager = new app.Modules.ModuleManager(),
                a = new MockModule(), b = new MockModule([a]), c = new MockModule([a]), d = new MockModule([b,c]),
                loadingOrder = [];
            // store the loaded modules into array to get the loading order
            _.each([a, b, c, d], m=> m.onLoaded(() => loadingOrder.push(m)));

            Qwait(moduleManager.load(d));

            runs(() => {
                _.each([a, b, c, d], m => {
                    expect(m.loadCalled).toBeTruthy();
                    expect(moduleManager.isLoaded(m)).toBeTruthy();
                });
                // loading order of 'b' and 'c' modules isn't important, but they must be loaded
                // after 'a' and before 'd'
                expect(_.isEqual(loadingOrder, [a, b, c, d]) || _.isEqual(loadingOrder, [a, c, b, d])).toBeTruthy();
            });
        });

        it('loads module with slave dependencies', function() {
            var moduleManager = new app.Modules.ModuleManager(),
                a = new MockModule(), b = new MockModule([], [a]),
                loadingOrder = [];
            // store the loaded modules into array to get the loading order
            _.each([a, b], m => m.onLoaded(() => loadingOrder.push(m)));

            Qwait(moduleManager.load(b));

            runs(() => {
                _.each([a, b], m => {
                    expect(m.loadCalled).toBeTruthy();
                    expect(moduleManager.isLoaded(m)).toBeTruthy();
                });
                // the slave module get's loaded after its parent
                expect(_.isEqual(loadingOrder, [b, a])).toBeTruthy();
            });
        });

        describe('loading-unloading workflow', function() {

            var moduleManager = new app.Modules.ModuleManager(),
                a = new MockModule(), b = new MockModule(), c = new MockModule([a, b]), d = new MockModule([a, b]),
                loadingOrder = [];
            // store the loaded modules into array to get the loading order
            _.each([a, b, c, d], m => m.onLoaded(() => loadingOrder.push(m)));

            it("loads 'c' depending on 'a','b'", function() {
                Qwait(moduleManager.load(c));

                runs(() => {
                    _.each([a, b, c], m => {
                        expect(m.loadCalled).toBeTruthy();
                        expect(moduleManager.isLoaded(m)).toBeTruthy();
                    });
                    expect(_.isEqual(loadingOrder, [a, b, c])).toBeTruthy();
                });
            });

            it("loads 'd' depending on 'a','b' only unloading 'c'", function() {
                loadingOrder.splice(0);
                Qwait(moduleManager.load(d));

                runs(() => {
                    _.each([a, b, d], m => {
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


