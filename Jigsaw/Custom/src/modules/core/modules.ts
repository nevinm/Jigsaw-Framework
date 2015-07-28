import $ui = require('jquery-ui');
import templates = require('templates/app');
import Common = require('modules/core/common');
import History = require('modules/core/history');

export module Modules {

    export interface IModule {
        /** returns a list with the required modules */
        requiredModules(): IModule[];

        /** slave modules are modules that depends on this one, possibly because they enhace
        in some way the current module, for that reason they must be loaded when the current
        module is loaded.
        Because the slaves depends on this module, they get loaded after this module by
        the module manager. */
        slaveModules? (): IModule[];

        /** if this module is the head of a module tree that got loaded by a ModuleManager,
        then it can control if new modules can be loaded by implementing this method.
        Possible results are TRUE -> can be unloaded, (FALSE|REJECT) -> can NOT be unloaded*/
        canUnload? (): Q.Promise<boolean>;

        /** returns a deferred that is resolved when the module is completely loaded */
        load(): Q.Promise<any>;

        unload? (): Q.Promise<any>;
    }

    export class ModuleBase implements IModule {
        requiredModules(): IModule[] {
            return [];
        }

        load(): Q.Promise<any> {
            return Q(true);
        }

        unload() {
            return Q(true);
        }
    }

    export class ModuleWithSlavesBase extends ModuleBase {
        private _slaves: IModule[] = [];

        slaveModules() {
            return this._slaves;
        }

        addSlave(m: IModule) {
            this._slaves.push(m);
        }

        /** executes the given action as a slave of the current module */
        slaveExecute(execute: () => Q.Promise<any>) {
            this.addSlave({
                requiredModules: () => [this],
                load: execute
            });
        }

        slaveExecuteOneTime(execute: () => Q.Promise<any>) {
            var executed = false;
            this.slaveExecute(() => {
                if (!executed) {
                    executed = true;
                    return execute();
                }
                return Q(true);
            });
        }
    }

    function scheduleModuleLoading(target: IModule, loadedModules: IModule[]= []): Q.Promise<IModule[]> {

        var modules = new Common.Dict<IModule, Q.Promise<any>>();

        function schedule(target: IModule) {
            if (!target) {
                // ignore null dependencies, for convenience
                return Q(true);
            } else if (modules.contains(target)) {
                // if the module has been scheduled for loading then return that promise
                return modules.get(target);
            } else if (_.contains(loadedModules, target)) {
                modules.add(target, Q(true));

                // if the module is already loaded then mark it on the modules collection
                // and return a resolved promise. Also ensure all it's dependencies are loaded
                // and on the dictionary
                _.forEach(target.requiredModules(), m => schedule(m));
                if (target.slaveModules) {
                    _.forEach(target.slaveModules(), m => schedule(m));
                }

                return modules.get(target);
            } else {
                //console.log('scheduled loading of', target);
                // else - schedule module loading after having loaded all it's required modules
                var requiredModules = target.requiredModules(),
                    beforePromises = _.map(requiredModules, m => schedule(m)),
                    promise = Q.all(beforePromises)
                        .then(() => target.load())
                //.then(() => console.log('loaded module', target))
                ;

                modules.add(target, promise);

                if (target.slaveModules) {
                    return promise.then(() => {
                        // load slave modules, these doesn't need to be part of the loading tree
                        var slaves = target.slaveModules(),
                            afterPromises = _.map(slaves, m=> schedule(m));

                        return Q.all(afterPromises);
                    });
                }

                return promise;
            }
        }

        return schedule(target).then(() => modules.keys());
    }

    class FakeModule extends ModuleBase {
        constructor(private _requiredModules: IModule[]) {
            super();
        }

        requiredModules(): IModule[] {
            return this._requiredModules;
        }
    }

    export class ModuleManager {
        private _isLoading = false;
        private _loadedModules: IModule[] = [];
        /** contains the head modules that trigered the loading of all other modules. 
        New modules can only be loaded if the heads can be unloaded */
        heads: IModule[] = [];

        constructor(history?: History.HistoryController) {
            if (history) {
                history.addGuardian(() => this.canUnloadHeads());
            }
        }

        get isLoading() { return this._isLoading; }

        /** loads the given module and all it's dependencies and slaves */
        load(...targets: IModule[]): Q.Promise<any> {
            if (this._isLoading) {
                throw new Error("can't load a module while loading another");
            }
            this._isLoading = true;

            // Create a fake module that depends on the modules that need to be loaded
            var fake = new FakeModule(targets);

            return <any>scheduleModuleLoading(fake, this._loadedModules)
                .then((modules: IModule[]) => {
                    // unload modules that didn't got loaded
                    var tobeUnloaded = _.filter<Modules.IModule>(_.difference(this._loadedModules, modules), m => !!m.unload),
                        promises = _.map(tobeUnloaded, m=> m.unload());

                    return Q.all(promises)
                        .then(() => {

                            // be sure not to include the fake module on the currently loaded modules
                            this._loadedModules = _.without(modules, fake);

                            this.heads = targets;
                        });
                })
                .finally(() => {
                    this._isLoading = false;
                });
        }

        canUnloadHeads(): Q.Promise<boolean> {
            var filteredHeads = _.filter<Modules.IModule>(this.heads, m => !!m.canUnload),
                promises = _.map(filteredHeads, m => m.canUnload());

            return <any>Q.all(promises)
                .then(results => {
                    if (_.all<boolean>(results, x => x)) {
                        return Q(true)
                    } else {
                        return Q.reject();
                    }
                });
        }

        isLoaded(target: IModule) {
            if (this._isLoading) {
                throw new Error("can't load a module while loading another");
            }

            return _.contains(this._loadedModules, target);
        }
    }
}
