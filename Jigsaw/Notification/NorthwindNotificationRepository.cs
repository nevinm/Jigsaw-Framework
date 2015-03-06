using Jigsaw.Data.Northwind;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Jigsaw.Data.Northwind;
using Jigsaw.Data.Task;
using Jigsaw.Server.Notification;
using WebMatrix.WebData;

namespace Jigsaw.Notification
{
    /// <summary>
    /// Extends the Northwind repository class to add notifications when an entity is changed
    /// </summary>
    public class NorthwindNotificationRepository: NorthwindRepository
    {
        private readonly INotificationService _notificationService;

        readonly ContextProviderChangeNotifier<Customer> _customerNotifications;
        readonly ContextProviderChangeNotifier<Order> _orderNotifications;
        readonly ContextProviderChangeNotifier<Employee> _employeeNotifications;
        readonly ContextProviderChangeNotifier<Supplier> _suplierNotifications;
        readonly ContextProviderChangeNotifier<Task> _taskNotifications;

        public NorthwindNotificationRepository(INotificationService notificationService)
        {
            _notificationService = notificationService;

            _customerNotifications = new ContextProviderChangeNotifier<Customer>(ContextProvider);
            
            _orderNotifications = new ContextProviderChangeNotifier<Order>(ContextProvider);

            _employeeNotifications = new ContextProviderChangeNotifier<Employee>(ContextProvider);

            _suplierNotifications = new ContextProviderChangeNotifier<Supplier>(ContextProvider);

            _taskNotifications = new ContextProviderChangeNotifier<Task>(ContextProvider);



            _customerNotifications.EntityStateChanged += (_, e) => _notificationService.Add(new DataNotification<Customer>(e) { Owner = "customer-data" });

            _orderNotifications.EntityStateChanged += (_, e) => _notificationService.Add(new DataNotification<Order>(e) { Owner = "order-data" });

            _employeeNotifications.EntityStateChanged += (_, e) => _notificationService.Add(new DataNotification<Employee>(e) { Owner = "employee-data" });

            _suplierNotifications.EntityStateChanged += (_, e) => _notificationService.Add(new DataNotification<Supplier>(e) { Owner = "suplier-data" });

            _taskNotifications.EntityStateChanged += (_, e) => _notificationService.Add( new DataNotification<Task>(e) { Owner = "task-data" } );

        }
    }
}