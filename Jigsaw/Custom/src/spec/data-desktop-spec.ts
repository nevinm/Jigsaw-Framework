
import mother = require('./mother');
import fn = require('../modules/formeditor/spec/breeze-testfn');
import _app = require('../app');
import _data = require('../modules/data');
import data = require('../modules/data-desktop');

import dataSpec = require('./data-spec');

var qwait = mother.Qwait;

class MockInlineDataItemsView extends data.InlineDataItemsView {
    constructor() {
        super({template: ()=>''});
    }

    /** returns true if there's some change that needs to be synced to the model. */
    hasPendingChanges() {
        return false;
    }

    /** syncronizes all pending datagrid changes throught the grid's datasource to the transport 
    and to the viewmodel */
    syncChanges(): Q.Promise<boolean> {
        return Q(true);
    }

    addRow(): void {
    }

    /** called to reject all the changes on the grid, it should refresh the current data from the server */
    refresh(local = false) {
    }
}

describe('data-desktop', () => {

    describe('InlineEditing', function () {

        it('edits entities and save them', () => {
            var em = fn.newEm(),
                dataSource = new dataSpec.MockDataSource(em),
                view = new MockInlineDataItemsView(),
                dataItems = new data.InlineDataItemsViewModel(dataSource);
            dataItems.view = view;

            fn.fillEm(em);
            qwait(dataSource.query());

            runs(() => {
                var entity1 = dataSource.data[0], entity2 = dataSource.data[1];

                spyOn(view, 'hasPendingChanges').andReturn(true);
                var syncSpy = spyOn(view, 'syncChanges').andCallFake(() => {
                    entity1['name']('changed');
                    entity2['name']('changed');
                    return Q(true);
                });

                qwait(dataItems.save());

                runs(() => {
                    expect(entity1['name']()).toBe('changed');
                    expect(entity2['name']()).toBe('changed');

                    expect(entity1.entityAspect.entityState).toBe(breeze.EntityState.Unchanged);
                    expect(entity2.entityAspect.entityState).toBe(breeze.EntityState.Unchanged);
                });
            });
        });

        it('rejects all changes', () => {
            var em = fn.newEm(),
                dataSource = new dataSpec.MockDataSource(em),
                view = new MockInlineDataItemsView(),
                dataItems = new data.InlineDataItemsViewModel(dataSource);
            dataItems.view = view;

            fn.fillEm(em);
            qwait(dataSource.query());
            
            spyOn(view, 'hasPendingChanges').andReturn(true);
            spyOn(dataItems, 'showMessageBox').andCallFake(() => Q(_app.Views.MessageBoxResult.Yes));

            runs(() => {
                var entity1 = dataSource.data[0], entity2 = dataSource.data[1];
                entity1['name']('changed');
                entity2['name']('changed');

                qwait(dataItems.rejectAllChanges());

                runs(() => {
                    expect(entity1['name']()).toNotBe('changed');
                    expect(entity2['name']()).toNotBe('changed');

                    expect(entity1.entityAspect.entityState).toBe(breeze.EntityState.Unchanged);
                    expect(entity2.entityAspect.entityState).toBe(breeze.EntityState.Unchanged);
                });
            });
        });

        describe('save bundle with one entity having validation errors on the client', () => {
            var em = fn.newEm(),
                dataSource = new dataSpec.MockDataSource(em),
                view = new MockInlineDataItemsView(),
                dataItems = new data.InlineDataItemsViewModel(dataSource);
            dataItems.view = view;

            fn.fillEm(em);
            qwait(dataSource.query());

            it('edit two entities, one with validation errors and save', () => {
                runs(() => {
                    var entity1 = dataSource.data[0], entity2 = dataSource.data[1];

                    spyOn(view, 'hasPendingChanges').andReturn(true);
                    var syncSpy = spyOn(view, 'syncChanges').andCallFake(() => {
                        entity1['name']('changed');
                        entity2['name']('very long name supposed to fail');
                        return Q(true);
                    });

                    qwait(dataItems.save());

                    runs(() => {
                        expect(entity1['name']()).toBe('changed');
                        expect(entity1.entityAspect.entityState).toBe(breeze.EntityState.Unchanged);

                        expect(entity2.entityAspect.entityState).toBe(breeze.EntityState.Modified);
                    });
                });
            });

            it('validation error displayed for entity navigates to entity', () => {
                var entity1 = dataSource.data[0], entity2 = dataSource.data[1];

                expect(entity2.entityAspect.validateEntity()).toBeFalsy();
                expect(entity2.entityAspect.getValidationErrors().length).toBeGreaterThan(0);
                expect(dataItems.errorCollection().length).toBeGreaterThan(0);

                dataItems.errorCollection()[0].navigate();

                expect(dataItems.selectedItem()).toBe(entity2);
            });

            it('fix errors and save entity successfully', () => {
                var entity1 = dataSource.data[0], entity2 = dataSource.data[1];

                spyOn(view, 'hasPendingChanges').andReturn(true);
                var syncSpy = spyOn(view, 'syncChanges').andCallFake(() => {
                    entity2['name']('valid');
                    return Q(true);
                });

                qwait(dataItems.save());

                runs(() => {
                    expect(entity2['name']()).toBe('valid');
                    expect(entity2.entityAspect.entityState).toBe(breeze.EntityState.Unchanged);
                });
            });



        });

    });

});
