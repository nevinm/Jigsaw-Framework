/// <reference path="lib/jasmine.d.ts" />

import mother = require('./mother');
import fn = require('modules/formeditor/spec/breeze-testfn');
import data = require('../modules/data');
import app = require('../app');

var qwait = mother.Qwait;

export class MockDataSource extends data.Server.DataSource {
    constructor(entityManager) {
        super({
            manager: entityManager,
            endPoint: breeze.EntityQuery.from(fn.TAG),
            typeName: fn.TAG,
            cacheData: false
        });
    }
}

describe('data', () => {

    describe('breeze core', function () {

        it('can add entity to entity manager', () => {
            var em = fn.newEm();
            var tag = em.createEntity(fn.TAG, { id: 1, name: 'sample' }, breeze.EntityState.Unchanged);

            expect(tag.entityAspect.entityState).toBe(breeze.EntityState.Unchanged);

            tag['name']('sample1');

            expect(tag.entityAspect.entityState).toBe(breeze.EntityState.Modified);
        });

        it("Event token is not the same for different entities", function () {
            var em = fn.newEm();

            var emp1 = fn.createTag();
            var emp2 = fn.createTag();

            var token1 = emp1.entityAspect.propertyChanged.subscribe(function (changeArgs) {
                var a = changeArgs;
            });
            var token2 = emp2.entityAspect.propertyChanged.subscribe(function (changeArgs) {
                var a = changeArgs;
            });

            expect(token1).toNotBe(token2);
        });

        it('modifing item changes its EntityState to Modified', () => {
            var em = fn.newEm(),
                entity = em.createEntity(fn.TAG, { id: 1, name: 'name' }, breeze.EntityState.Unchanged);

            entity['name']('changed');

            expect(entity.entityAspect.entityState).toBe(breeze.EntityState.Modified);

            qwait(em.saveChanges());

            runs(() => {
                expect(entity.entityAspect.entityState).toBe(breeze.EntityState.Unchanged);
            });
        });

        it('validation works for entities', () => {
            var em = fn.newEm(),
                entity = em.createEntity(fn.TAG, { id: 1, name: 'name' }, breeze.EntityState.Unchanged);

            entity['name']('very long name supposed to fail validation');

            expect(entity.entityAspect.validateEntity()).toBeFalsy();

        });

        //it('can attach entity that already exist on the manager overwriting its values', () => {
        //    // this test describes a bug on breeze 1.4.9, when an entity is to be attached
        //    // and the manager already contains an entity with the same key, then the properties
        //    // are not overwritten alright... apparently this can be solved by changing the method
        //    // breeze.DataProperty.getRawValueFromClient and unwraping the observable value if any
        //    // Ariel modified the breeze source code for this on 03/19/2014, for the next version
        //    // it must be checked if the bug is fixed
        //    var em = fn.newEm(),
        //        entity = em.createEntity(fn.TAG, { id: 1, name: 'name' }, breeze.EntityState.Unchanged),
        //        entity1 = fn.createTag(1, 'name2'),
        //        spy = spyOn(breeze.DataProperty, 'getRawValueFromClient')
        //            .andCallFake((rawEntity, dp) => {
        //                var val = rawEntity[dp.name];
        //                return val !== undefined ? ko.unwrap(val) : dp.defaultValue;
        //            });

        //    em.attachEntity(entity1, breeze.EntityState.Unchanged, breeze.MergeStrategy.OverwriteChanges);

        //    expect(entity['name']()).toBe('name2');
        //});

    });

    describe('DataSource', function () {

        it('performs query against local items', () => {
            var em = fn.newEm(),
                dataSource = new MockDataSource(em);
            fn.fillEm(em);

            mother.Qwait(dataSource.query());

            runs(() => {
                expect(dataSource.data.length).toBeGreaterThan(0);
            });
        });

        it('save caches the data if offline', () => {
            var em = fn.newEm(),
                dataSource = new MockDataSource(em);
            fn.fillEm(em);
            qwait(dataSource.query());

            spyOn(app.ajax.connection, 'online').andCallFake(() => Q(false));
            spyOn(em, 'saveChanges').andCallThrough();
            spyOn(dataSource, 'cacheData').andCallThrough();

            runs(() => {
                qwait(dataSource.saveChanges());

                runs(() => {
                    expect(em.saveChanges).wasNotCalled();
                    expect(dataSource.cacheData).toHaveBeenCalled();
                });
            });
        });

        it('tries to save valid entities in different querys even when one of them has server errors', () => {
            var em = fn.newEm(),
                dataSource = new MockDataSource(em);
            fn.fillEm(em);
            qwait(dataSource.query());

            runs(() => {
                var entity1 = dataSource.data[0], entity2 = dataSource.data[1];
                entity1['name']('changed');
                entity2['name']('changed');

                var spy = spyOn(em, 'saveChanges').andCallFake((bundle) => {
                        var entities = bundle || em.getChanges();
                        if (_.contains(entities, entity2)) {
                            // mock server error if entity2 is included
                            return Q.reject({
                                entityErrors: [{ entity: entity2 }]
                            });
                        } else {
                            _.each(entities, (entity: breeze.Entity) => entity.entityAspect.setUnchanged());
                            return Q({
                                entities: entities
                            });
                        }
                    });

                qwait(dataSource.saveChanges());

                runs(() => {
                    // save must be done in two calls: [entity1, entity2] and [entity1]
                    expect(spy.callCount).toBe(2);
                    // check the entity states to see that entity2 wasn't saved
                    expect(entity1.entityAspect.entityState).toBe(breeze.EntityState.Unchanged);
                    expect(entity2.entityAspect.entityState).toBe(breeze.EntityState.Modified);
                });

            });
        });

    });

    describe('ViewPanel', function () {

        describe('adding new item', () => {
            var em = fn.newEm(),
                dataSource = new MockDataSource(em),
                dataItems = new data.DataItemsViewModel( dataSource),
                viewPanel = new data.DataEditViewModel(dataItems);
            fn.fillEm(em);
            mother.Qwait(dataSource.query());

            it('creates new item', () => {
                qwait(dataItems.addNew());

                runs(() => {
                    var item = viewPanel.item();
                    expect(item.entityAspect.entityState).toBe(breeze.EntityState.Added);
                });
            });

            it('can change added item if no property was edited', () => {
                var entity1 = dataSource.data[1];
                mother.Qwait(dataItems.selectedItem.inject(entity1));

                runs(() => {
                    expect(viewPanel.item()).toBe(entity1);
                });
            });

            it('add entity and edit property', () => {
                qwait(dataItems.addNew());
                runs(() => {
                    var item = viewPanel.item();
                    item['name']('modified');
                });
            });

            it('cant unselect if item is modified', () => {
                var messageSpy = spyOn(viewPanel, 'showMessageBox').andCallFake(() => Q.reject()); // Cancel
                // modify selected item
                var item = viewPanel.item();

                qwait(dataItems.selectedItem.inject(null));

                runs(() => {
                    expect(messageSpy).toHaveBeenCalled();
                    expect(viewPanel.item()).toBe(item);
                });
            });

            it('cant add new if selected item is modified', () => {
                var messageSpy = spyOn(viewPanel, 'showMessageBox').andCallFake(() => Q.reject()); // Cancel
                var item = viewPanel.item();

                qwait(dataItems.addNew());

                runs(() => {
                    expect(messageSpy).toHaveBeenCalled();
                    expect(viewPanel.item()).toBe(item);
                });
            });

            it('save changes', () => {
                var item = viewPanel.item();
                runs(() => expect(item).toNotBe(null));

                mother.Qwait(viewPanel.save());
                runs(() => expect(item.entityAspect.entityState).toBe(breeze.EntityState.Unchanged));
            });

            it('can unselect item after save', () => {
                mother.Qwait(dataItems.selectedItem.inject(null));
                runs(() => {
                    expect(viewPanel.item()).toBeNull();
                });
            });

        });

        describe('selecting items on the ItemsViewModel', () => {
            var em = fn.newEm(),
                dataSource = new MockDataSource(em),
                dataItems = new data.DataItemsViewModel(dataSource),
                viewPanel = new data.DataEditViewModel( dataItems);
            fn.fillEm(em);
            mother.Qwait(dataSource.query());

            it('selects first item', () => {
                var entity1 = dataSource.data[0];
                mother.Qwait(dataItems.selectedItem.inject(entity1));

                runs(() => {
                    expect(viewPanel.item()).toBe(entity1);
                });
            });

            it('changes selected item', () => {
                var entity1 = dataSource.data[1];
                mother.Qwait(dataItems.selectedItem.inject(entity1));
            
                runs(() => {
                    expect(viewPanel.item()).toBe(entity1);
                });
            });

            it('cant unselect if item is modified', () => {
                var messageSpy = spyOn(viewPanel, 'showMessageBox').andCallFake(() => Q.reject()); // Cancel
                // modify selected item
                var item = viewPanel.item();
                item['name']('other name');

                expect(item.entityAspect.entityState).toBe(breeze.EntityState.Modified);

                qwait(dataItems.selectedItem.inject(null));

                runs(() => {
                    expect(messageSpy).toHaveBeenCalled();
                    expect(viewPanel.item()).toBe(item);
                });
            });

            it('cant add new if selected item is modified', () => {
                var messageSpy = spyOn(viewPanel, 'showMessageBox').andCallFake(() => Q.reject()); // Cancel
                var item = viewPanel.item();

                qwait(dataItems.addNew());

                runs(() => {
                    expect(messageSpy).toHaveBeenCalled();
                    expect(viewPanel.item()).toBe(item);
                });
            });

            it('save changes', () => {
                var item = viewPanel.item();
                runs(() => expect(item).toNotBe(null));

                mother.Qwait(viewPanel.save());
                runs(() => expect(item.entityAspect.entityState).toBe(breeze.EntityState.Unchanged));
            });

            it('can unselect item after save', () => {
                mother.Qwait(dataItems.selectedItem.inject(null));
                runs(() => {
                    expect(viewPanel.item()).toBeNull();
                });
            });
        });

        describe('try saving entity with validation errors', () => {

            var em = fn.newEm(),
                dataSource = new MockDataSource(em),
                dataItems = new data.DataItemsViewModel(dataSource),
                viewPanel = new data.DataEditViewModel(dataItems);
            fn.fillEm(em);
            mother.Qwait(dataSource.query());

            it('selects first item', () => {
                var entity1 = dataSource.data[0];
                mother.Qwait(dataItems.selectedItem.inject(entity1));

                runs(() => {
                    expect(viewPanel.item()).toBe(entity1);
                });
            });

            it('modify selected entity to throw validation error', () => {
                // modify selected item
                var item = viewPanel.item();
                item['name']('this is a very long name, the validation should fail');

                expect(item.entityAspect.entityState).toBe(breeze.EntityState.Modified);

                var saveSuccessful = false;
                qwait(viewPanel.save().then(() => saveSuccessful = true));

                runs(() => {
                    expect(saveSuccessful).toBeFalsy();
                    // the save operation shouldn't succeed
                    expect(item.entityAspect.entityState).toBe(breeze.EntityState.Modified);
                });
            });

            it('fix validation errors and save changes', () => {
                var item = viewPanel.item();
                item['name']('valid');

                var saveSuccessful = false;
                qwait(viewPanel.save().then(() => saveSuccessful = true));
                
                runs(() => {
                    expect(saveSuccessful).toBeTruthy();
                    // the save operation shouldn't succeed
                    expect(item.entityAspect.entityState).toBe(breeze.EntityState.Unchanged);
                });
            });

        });



    });

    describe('Version Tracker Manager', function () {

    });
});