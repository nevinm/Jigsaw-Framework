using System.Data.Entity;
using System.Web;
using System.Web.Hosting;
using System.Web.Mvc;
using System.Web.Optimization;
using System.Web.Routing;
using Jigsaw.App_Start;
using Jigsaw.Controllers;
using Jigsaw.Server.Core;
using JigsawApplication = Jigsaw.Server.JigsawApplication;
using Jigsaw.Data.Task;
using CodeEffects.Rule.Common;

namespace Jigsaw
{
    // Note: For instructions on enabling IIS6 or IIS7 classic mode, 
    // visit http://go.microsoft.com/?LinkId=9394801

    public class MvcApplication : HttpApplication
    {
        protected void Application_Start()
        {
            AreaRegistration.RegisterAllAreas();

            FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);

            RouteConfig.RegisterRoutes(RouteTable.Routes);

            BundleConfig.RegisterBundles(BundleTable.Bundles);

            CacheManifestTable.DefaultTheme = "Smart-Admin";
            BundleConfig.RegisterThemes(CacheManifestTable.Themes);

            JigsawApplication.Start();
            JigsawApplication.GenerateTemplateFiles(HostingEnvironment.MapPath("~/scripts/src/templates"), "templates/");

            JigsawApplication.Metadata(HostingEnvironment.MapPath("~/scripts/src/metadata"), "metadata/")
                .With<TaskController>(x => x.Metadata())
                .With<NorthwindController>(x => x.Metadata(), 
                    x => x.LoadCodeRuleCustomerSearchSettings(ThemeType.None, false),
                    x => x.LoadCodeRuleEmployeeSearchSettings(ThemeType.None, false),
                    x => x.LoadCodeRuleSupplierSearchSettings(ThemeType.None, false))
                .Generate();
        }
    }
}