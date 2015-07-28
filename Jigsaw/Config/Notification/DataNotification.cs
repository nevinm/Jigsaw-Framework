using System;
using Jigsaw.Data.Northwind;
using Jigsaw.Server.Notification;
using WebMatrix.WebData;

namespace Jigsaw.Notification
{
    public class DataNotification<T> : EntityDataNotification<T>
    {
        public DataNotification(EntityStateChangedEventArgs<T> e)
        {
            PreviousEntityState = e.PreviousEntityState;
            
            Entity = e.Entity;

            Author = WebSecurity.CurrentUserName;

            Level = NotificationLevel.Success;

            TimeStamp = DateTime.Now;
        }
    }
}