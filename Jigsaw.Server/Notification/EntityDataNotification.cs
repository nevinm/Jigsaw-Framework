using Breeze.ContextProvider;

namespace Jigsaw.Server.Notification
{
    public class EntityDataNotification<T>: NotificationBase
    {
        public T Entity { get; set; }

        /// <summary>
        /// Returns the EntityState before saving the entity
        /// </summary>
        public EntityState PreviousEntityState { get; set; }
    }
}
