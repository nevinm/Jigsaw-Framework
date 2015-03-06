using System;

namespace Jigsaw.Server.Notification
{
    public enum NotificationLevel {
        Success=0, Warning=1, Error=2
    }

    public abstract class NotificationBase
    {
        /// <summary>
        /// Key identifing this notification in the collection, indicating to which module it belongs to
        /// </summary>
        public string Owner { get; set; }

        /// <summary>
        /// user that throwed this notification, could be a more specific type
        /// </summary>
        public string Author { get; set; }

        public DateTime TimeStamp { get; set; }

        public NotificationLevel Level { get; set; }
    }
}
