using System;
using System.Collections.Generic;

namespace Jigsaw.Server.Notification
{
    public class NotificationAddedEventArgs : EventArgs
    {
        public NotificationBase Notification { get; set; }
    }

    public interface INotificationService
    {
        IEnumerable<NotificationBase> Notifications { get; }

        void Add(NotificationBase notification);

        event EventHandler<NotificationAddedEventArgs> NotificationAdded;
    }

    public class NotificationService: INotificationService
    {
        private readonly List<NotificationBase> _notifications = new List<NotificationBase>();

        public IEnumerable<NotificationBase> Notifications { get { return _notifications; } }

        public void Add(NotificationBase notification)
        {
            _notifications.Add(notification);
            OnNotificationAdded(notification);
        }

        public event EventHandler<NotificationAddedEventArgs> NotificationAdded = delegate { };

        protected void OnNotificationAdded(NotificationBase notification)
        {
            NotificationAdded(this, new NotificationAddedEventArgs() { Notification = notification });
        }
    }
}