using System;
using System.Collections.Generic;
using System.Linq;
using Breeze.ContextProvider;

namespace Jigsaw.Server.Notification
{
    public class EntityStateChangedEventArgs<T> : EventArgs
    {
        public T Entity { get; set; }

        /// <summary>
        /// returns the state of the entity before it was saved
        /// </summary>
        public EntityState PreviousEntityState { get; set; }
    }

    /// <summary>
    /// receives a type and a context provider and tracks all entities of the given type
    /// in the ContextProvider and raises an event after each change
    /// </summary>
    public class ContextProviderChangeNotifier<T>
    {
        public ContextProviderChangeNotifier(ContextProvider contextProvider)
        {
            var type = typeof (T);
            List<EntityInfo> addedEntities = null, deletedEntities = null, modifiedEntities = null;

            contextProvider.BeforeSaveEntitiesDelegate += dictionary =>
            {
                if (dictionary.ContainsKey(type))
                {
                    var entities = dictionary[type];
                    addedEntities = entities.Where(entity => entity.EntityState == EntityState.Added).ToList();
                    deletedEntities = entities.Where(entity => entity.EntityState == EntityState.Deleted).ToList();
                    modifiedEntities = entities.Where(entity => entity.EntityState == EntityState.Modified).ToList();
                }
                return dictionary;
            };

            contextProvider.AfterSaveEntitiesDelegate += (dictionary, list) =>
            {
                if (dictionary.ContainsKey(type))
                {
                    foreach (var entity in addedEntities)
                    {
                        OnEntityStateChanged(new EntityStateChangedEventArgs<T>
                        {
                            Entity = (T)entity.Entity,
                            PreviousEntityState = EntityState.Added
                        });
                    }

                    foreach (var entity in deletedEntities)
                    {
                        OnEntityStateChanged(new EntityStateChangedEventArgs<T>
                        {
                            Entity = (T)entity.Entity,
                            PreviousEntityState = EntityState.Deleted
                        });
                    }

                    foreach (var entity in modifiedEntities)
                    {
                        OnEntityStateChanged(new EntityStateChangedEventArgs<T>
                        {
                            Entity = (T)entity.Entity,
                            PreviousEntityState = EntityState.Modified
                        });
                    }
                }
            };
        }

        public event EventHandler<EntityStateChangedEventArgs<T>> EntityStateChanged = delegate { };

        protected virtual void OnEntityStateChanged(EntityStateChangedEventArgs<T> e)
        {
             EntityStateChanged(this, e);
        }
    }
}
