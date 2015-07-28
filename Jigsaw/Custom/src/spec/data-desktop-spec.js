var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", './mother', '../modules/formeditor/spec/breeze-testfn', '../app', '../modules/data-desktop', './data-spec'], function(require, exports, mother, fn, _app, data, dataSpec) {
    var qwait = mother.Qwait;

    var MockInlineDataItemsView = (function (_super) {
        __extends(MockInlineDataItemsView, _super);
        function MockInlineDataItemsView() {
            _super.call(this, { template: function () {
                    return '';
                } });
        }
        /** returns true if there's some change that needs to be synced to the model. */
        MockInlineDataItemsView.prototype.hasPendingChanges = function () {
            return false;
        };

        /** syncronizes all pending datagrid changes throught the grid's datasource to the transport
        and to the viewmodel */
        MockInlineDataItemsView.prototype.syncChanges = function () {
            return Q(true);
        };

        MockInlineDataItemsView.prototype.addRow = function () {
        };

        /** called to reject all the changes on the grid, it should refresh the current data from the server */
        MockInlineDataItemsView.prototype.refresh = function (local) {
            if (typeof local === "undefined") { local = false; }
        };
        return MockInlineDataItemsView;
    })(data.InlineDataItemsView);

    describe('data-desktop', function () {
        describe('InlineEditing', function () {
            it('edits entities and save them', function () {
                var em = fn.newEm(), dataSource = new dataSpec.MockDataSource(em), view = new MockInlineDataItemsView(), dataItems = new data.InlineDataItemsViewModel(dataSource);
                dataItems.view = view;

                fn.fillEm(em);
                qwait(dataSource.query());

                runs(function () {
                    var entity1 = dataSource.data[0], entity2 = dataSource.data[1];

                    spyOn(view, 'hasPendingChanges').andReturn(true);
                    var syncSpy = spyOn(view, 'syncChanges').andCallFake(function () {
                        entity1['name']('changed');
                        entity2['name']('changed');
                        return Q(true);
                    });

                    qwait(dataItems.save());

                    runs(function () {
                        expect(entity1['name']()).toBe('changed');
                        expect(entity2['name']()).toBe('changed');

                        expect(entity1.entityAspect.entityState).toBe(breeze.EntityState.Unchanged);
                        expect(entity2.entityAspect.entityState).toBe(breeze.EntityState.Unchanged);
                    });
                });
            });

            it('rejects all changes', function () {
                var em = fn.newEm(), dataSource = new dataSpec.MockDataSource(em), view = new MockInlineDataItemsView(), dataItems = new data.InlineDataItemsViewModel(dataSource);
                dataItems.view = view;

                fn.fillEm(em);
                qwait(dataSource.query());

                spyOn(view, 'hasPendingChanges').andReturn(true);
                spyOn(dataItems, 'showMessageBox').andCallFake(function () {
                    return Q(0 /* Yes */);
                });

                runs(function () {
                    var entity1 = dataSource.data[0], entity2 = dataSource.data[1];
                    entity1['name']('changed');
                    entity2['name']('changed');

                    qwait(dataItems.rejectAllChanges());

                    runs(function () {
                        expect(entity1['name']()).toNotBe('changed');
                        expect(entity2['name']()).toNotBe('changed');

                        expect(entity1.entityAspect.entityState).toBe(breeze.EntityState.Unchanged);
                        expect(entity2.entityAspect.entityState).toBe(breeze.EntityState.Unchanged);
                    });
                });
            });

            describe('save bundle with one entity having validation errors on the client', function () {
                var em = fn.newEm(), dataSource = new dataSpec.MockDataSource(em), view = new MockInlineDataItemsView(), dataItems = new data.InlineDataItemsViewModel(dataSource);
                dataItems.view = view;

                fn.fillEm(em);
                qwait(dataSource.query());

                it('edit two entities, one with validation errors and save', function () {
                    runs(function () {
                        var entity1 = dataSource.data[0], entity2 = dataSource.data[1];

                        spyOn(view, 'hasPendingChanges').andReturn(true);
                        var syncSpy = spyOn(view, 'syncChanges').andCallFake(function () {
                            entity1['name']('changed');
                            entity2['name']('very long name supposed to fail');
                            return Q(true);
                        });

                        qwait(dataItems.save());

                        runs(function () {
                            expect(entity1['name']()).toBe('changed');
                            expect(entity1.entityAspect.entityState).toBe(breeze.EntityState.Unchanged);

                            expect(entity2.entityAspect.entityState).toBe(breeze.EntityState.Modified);
                        });
                    });
                });

                it('validation error displayed for entity navigates to entity', function () {
                    var entity1 = dataSource.data[0], entity2 = dataSource.data[1];

                    expect(entity2.entityAspect.validateEntity()).toBeFalsy();
                    expect(entity2.entityAspect.getValidationErrors().length).toBeGreaterThan(0);
                    expect(dataItems.errorCollection().length).toBeGreaterThan(0);

                    dataItems.errorCollection()[0].navigate();

                    expect(dataItems.selectedItem()).toBe(entity2);
                });

                it('fix errors and save entity successfully', function () {
                    var entity1 = dataSource.data[0], entity2 = dataSource.data[1];

                    spyOn(view, 'hasPendingChanges').andReturn(true);
                    var syncSpy = spyOn(view, 'syncChanges').andCallFake(function () {
                        entity2['name']('valid');
                        return Q(true);
                    });

                    qwait(dataItems.save());

                    runs(function () {
                        expect(entity2['name']()).toBe('valid');
                        expect(entity2.entityAspect.entityState).toBe(breeze.EntityState.Unchanged);
                    });
                });
            });
        });
    });
});
