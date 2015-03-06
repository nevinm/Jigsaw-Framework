var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", 'modules/core/common'], function(require, exports, Common) {
    (function (Modules) {
        var ModuleBase = (function () {
            function ModuleBase() {
            }
            ModuleBase.prototype.requiredModules = function () {
                return [];
            };

            ModuleBase.prototype.load = function () {
                return Q(true);
            };

            ModuleBase.prototype.unload = function () {
                return Q(true);
            };
            return ModuleBase;
        })();
        Modules.ModuleBase = ModuleBase;

        var ModuleWithSlavesBase = (function (_super) {
            __extends(ModuleWithSlavesBase, _super);
            function ModuleWithSlavesBase() {
                _super.apply(this, arguments);
                this._slaves = [];
            }
            ModuleWithSlavesBase.prototype.slaveModules = function () {
                return this._slaves;
            };

            ModuleWithSlavesBase.prototype.addSlave = function (m) {
                this._slaves.push(m);
            };

            /** executes the given action as a slave of the current module */
            ModuleWithSlavesBase.prototype.slaveExecute = function (execute) {
                var _this = this;
                this.addSlave({
                    requiredModules: function () {
                        return [_this];
                    },
                    load: execute
                });
            };

            ModuleWithSlavesBase.prototype.slaveExecuteOneTime = function (execute) {
                var executed = false;
                this.slaveExecute(function () {
                    if (!executed) {
                        executed = true;
                        return execute();
                    }
                    return Q(true);
                });
            };
            return ModuleWithSlavesBase;
        })(ModuleBase);
        Modules.ModuleWithSlavesBase = ModuleWithSlavesBase;

        function scheduleModuleLoading(target, loadedModules) {
            if (typeof loadedModules === "undefined") { loadedModules = []; }
            var modules = new Common.Dict();

            function schedule(target) {
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
                    _.forEach(target.requiredModules(), function (m) {
                        return schedule(m);
                    });
                    if (target.slaveModules) {
                        _.forEach(target.slaveModules(), function (m) {
                            return schedule(m);
                        });
                    }

                    return modules.get(target);
                } else {
                    //console.log('scheduled loading of', target);
                    // else - schedule module loading after having loaded all it's required modules
                    var requiredModules = target.requiredModules(), beforePromises = _.map(requiredModules, function (m) {
                        return schedule(m);
                    }), promise = Q.all(beforePromises).then(function () {
                        return target.load();
                    });

                    modules.add(target, promise);

                    if (target.slaveModules) {
                        return promise.then(function () {
                            // load slave modules, these doesn't need to be part of the loading tree
                            var slaves = target.slaveModules(), afterPromises = _.map(slaves, function (m) {
                                return schedule(m);
                            });

                            return Q.all(afterPromises);
                        });
                    }

                    return promise;
                }
            }

            return schedule(target).then(function () {
                return modules.keys();
            });
        }

        var FakeModule = (function (_super) {
            __extends(FakeModule, _super);
            function FakeModule(_requiredModules) {
                _super.call(this);
                this._requiredModules = _requiredModules;
            }
            FakeModule.prototype.requiredModules = function () {
                return this._requiredModules;
            };
            return FakeModule;
        })(ModuleBase);

        var ModuleManager = (function () {
            function ModuleManager(history) {
                var _this = this;
                this._isLoading = false;
                this._loadedModules = [];
                /** contains the head modules that trigered the loading of all other modules.
                New modules can only be loaded if the heads can be unloaded */
                this.heads = [];
                if (history) {
                    history.addGuardian(function () {
                        return _this.canUnloadHeads();
                    });
                }
            }
            Object.defineProperty(ModuleManager.prototype, "isLoading", {
                get: function () {
                    return this._isLoading;
                },
                enumerable: true,
                configurable: true
            });

            /** loads the given module and all it's dependencies and slaves */
            ModuleManager.prototype.load = function () {
                var _this = this;
                var targets = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    targets[_i] = arguments[_i + 0];
                }
                if (this._isLoading) {
                    throw new Error("can't load a module while loading another");
                }
                this._isLoading = true;

                // Create a fake module that depends on the modules that need to be loaded
                var fake = new FakeModule(targets);

                return scheduleModuleLoading(fake, this._loadedModules).then(function (modules) {
                    // unload modules that didn't got loaded
                    var tobeUnloaded = _.filter(_.difference(_this._loadedModules, modules), function (m) {
                        return !!m.unload;
                    }), promises = _.map(tobeUnloaded, function (m) {
                        return m.unload();
                    });

                    return Q.all(promises).then(function () {
                        // be sure not to include the fake module on the currently loaded modules
                        _this._loadedModules = _.without(modules, fake);

                        _this.heads = targets;
                    });
                }).finally(function () {
                    _this._isLoading = false;
                });
            };

            ModuleManager.prototype.canUnloadHeads = function () {
                var filteredHeads = _.filter(this.heads, function (m) {
                    return !!m.canUnload;
                }), promises = _.map(filteredHeads, function (m) {
                    return m.canUnload();
                });

                return Q.all(promises).then(function (results) {
                    if (_.all(results, function (x) {
                        return x;
                    })) {
                        return Q(true);
                    } else {
                        return Q.reject();
                    }
                });
            };

            ModuleManager.prototype.isLoaded = function (target) {
                if (this._isLoading) {
                    throw new Error("can't load a module while loading another");
                }

                return _.contains(this._loadedModules, target);
            };
            return ModuleManager;
        })();
        Modules.ModuleManager = ModuleManager;
    })(exports.Modules || (exports.Modules = {}));
    var Modules = exports.Modules;
});
