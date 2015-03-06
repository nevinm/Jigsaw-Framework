using Breeze.ContextProvider;
using Breeze.WebApi2;
using Jigsaw.App_Start;
using Jigsaw.Server.Notification;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using Ninject;
using WebMatrix.WebData;
using Jigsaw.Notification;

namespace Jigsaw.Controllers
{
    [BreezeController]
    public class NotificationController : ApiController
    {
        readonly INotificationService _notificationService;

        public NotificationController() {
            _notificationService = NinjectWebCommon.Kernel.Get<INotificationService>();

            AddFakeNotifications();
        }

        private void AddFakeNotifications()
        {
            if (_notificationService.Notifications.Any()) return;

            for (int i = 0; i < 6; i++)
            {
                _notificationService.Add(new CustomerDataNotification()
                {
                    Author = "Fake-" + i,
                    TimeStamp = DateTime.Now,
                    Entity = new Data.Northwind.Customer()
                    {
                        ContactName = "Fake Name " + i,
                        CustomerID = Guid.NewGuid(),
                    },
                    Level = NotificationLevel.Success,
                    PreviousEntityState = EntityState.Modified,
                    Owner = "customer-data"
                });

                _notificationService.Add(new CustomerDataNotification()
                {
                    Author = "Fake-" + i,
                    TimeStamp = DateTime.Now,
                    Entity = new Data.Northwind.Customer()
                    {
                        ContactName = "Wrong Name " + i,
                        CustomerID = Guid.NewGuid(),
                    },
                    Level = NotificationLevel.Error,
                    PreviousEntityState = EntityState.Added,
                    Owner = "customer-data"
                });

                _notificationService.Add(new CustomerDataNotification()
                {
                    Author = "Fake-" + i,
                    TimeStamp = DateTime.Now,
                    Entity = new Data.Northwind.Customer()
                    {
                        ContactName = "Wrong Name " + i,
                        CustomerID = Guid.NewGuid(),
                    },
                    Level = NotificationLevel.Warning,
                    PreviousEntityState = EntityState.Added,
                    Owner = "customer-data"
                });
            }

            for (int i = 0; i < 4; i++)
            {
                _notificationService.Add(new CustomerDataNotification()
                {
                    Author = "",
                    TimeStamp = DateTime.Now,
                    Entity = new Data.Northwind.Customer()
                    {
                        ContactName = "Fake Name " + i,
                        CustomerID = Guid.NewGuid(),
                    },
                    Level = NotificationLevel.Success,
                    PreviousEntityState = EntityState.Modified,
                    Owner = "customer-data"
                });

                _notificationService.Add(new CustomerDataNotification()
                {
                    Author = "",
                    TimeStamp = DateTime.Now,
                    Entity = new Data.Northwind.Customer()
                    {
                        ContactName = "Wrong Name " + i,
                        CustomerID = Guid.NewGuid(),
                    },
                    Level = NotificationLevel.Error,
                    PreviousEntityState = EntityState.Added,
                    Owner = "customer-data"
                });

                _notificationService.Add(new CustomerDataNotification()
                {
                    Author = "",
                    TimeStamp = DateTime.Now,
                    Entity = new Data.Northwind.Customer()
                    {
                        ContactName = "Wrong Name " + i,
                        CustomerID = Guid.NewGuid(),
                    },
                    Level = NotificationLevel.Warning,
                    PreviousEntityState = EntityState.Added,
                    Owner = "customer-data"
                });
            }

        }

        [HttpGet]
        public IQueryable<NotificationBase> Notifications([FromUri] NotificationLevel level)
        {
            return _notificationService.Notifications
                .OrderBy(notification => Math.Abs((int)notification.Level - (int)level))
                .AsQueryable();
        }

        [HttpGet]
        public IQueryable<NotificationBase> LocalNotifications([FromUri] NotificationLevel level)
        {
            return Notifications(level)
                .Where(notification => notification.Author == WebSecurity.CurrentUserName);
        }

        [HttpGet]
        public IQueryable<NotificationBase> GlobalNotifications([FromUri] NotificationLevel level)
        {
            return Notifications(level)
                .Where(notification => notification.Author != WebSecurity.CurrentUserName);
        }
    }
}
