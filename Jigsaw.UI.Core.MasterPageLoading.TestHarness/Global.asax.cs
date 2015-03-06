using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;

namespace Jigsaw.UI.Core.MasterPageLoading.TestHarness
{
    public class MvcApplication : System.Web.HttpApplication
    {
        protected void Application_Start()
        {
            AreaRegistration.RegisterAllAreas();
            RouteConfig.RegisterRoutes(RouteTable.Routes);

            CacheManifest.AddFolder("~\\scripts", false);
            CacheManifest.AddFolder("~\\html", FileFilterEnum.Html, true);
        }
    }
}
