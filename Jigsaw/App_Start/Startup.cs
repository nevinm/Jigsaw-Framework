using Jigsaw.Connection;
using Microsoft.Owin;
using Owin;

[assembly: OwinStartup(typeof(Jigsaw.App_Start.Startup))]
namespace Jigsaw.App_Start
{
    public class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            app.MapSignalR<PingConnection>("/ping");
            app.MapSignalR<NotificationConnection>("/notification");
        }
    } 
}