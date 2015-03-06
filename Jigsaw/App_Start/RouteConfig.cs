using System.Web.Mvc;
using System.Web.Routing;

namespace Jigsaw.App_Start
{
    public class RouteConfig
    {
        public static void RegisterRoutes(RouteCollection routes)
        {
            routes.IgnoreRoute("{resource}.axd/{*pathInfo}");


            routes.MapRoute(
                name: "appcache",
                url: "offline",
                defaults: new { controller = "Offline", action = "Index" });

            routes.MapRoute(
                name: "HomeRoute",
                url: "{action}",
                defaults: new { controller = "Home" }
            );

            routes.MapRoute(
                name: "Default",
                url: "{controller}/{action}/{id}",
                defaults: new { controller = "Home", action = "Index", id = UrlParameter.Optional }
            );

        }

        public static void RegisterConnections(RouteCollection routes)
        {
        }
    }
}