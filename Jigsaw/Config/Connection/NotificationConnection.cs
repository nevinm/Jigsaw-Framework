using Jigsaw.App_Start;
using Jigsaw.Server.Notification;
using Microsoft.AspNet.SignalR;
using Ninject;

namespace Jigsaw.Connection
{
    public class NotificationConnection : PersistentConnection
    {
        private string _connectionId = "";

        public NotificationConnection()
        {
            var notificationService = NinjectWebCommon.Kernel.Get<INotificationService>();

            // everytime a new notification is added it's broadcasted to all clients
            // this will need to be improved so notifications are only sent to interested users
            // in this case users who have access rights to modules related with the new notification
            notificationService.NotificationAdded += (_, e) =>
            {
                if (Connection != null && !string.IsNullOrEmpty(_connectionId))
                {
                    Connection.Send(_connectionId, e.Notification);
                }
            };
        }

        protected override System.Threading.Tasks.Task OnConnected(IRequest request, string connectionId)
        {
            _connectionId = connectionId;
            return base.OnConnected(request, connectionId);
        }

        protected override System.Threading.Tasks.Task OnDisconnected(IRequest request, string connectionId)
        {
            _connectionId = null;
            return base.OnDisconnected(request, connectionId);
        }
    }
}