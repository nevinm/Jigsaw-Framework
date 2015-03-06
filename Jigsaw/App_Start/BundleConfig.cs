using System.Web.Optimization;
using Jigsaw.Server.Core;

namespace Jigsaw.App_Start
{
    public class BundleConfig
    {
        // For more information on Bundling, visit http://go.microsoft.com/fwlink/?LinkId=254725
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new ScriptBundle("~/coreframework/base").Include(
                "~/scripts/libs/moment.js",

                "~/scripts/libs/jquery-{version}.js",
                "~/scripts/libs/jquery.fileDownload.js",
                "~/scripts/libs/jquery.signalR-{version}.js",
                "~/scripts/libs/jquery.cookie.js",
                //jquery-ui loaded
                "~/scripts/smartadmin/libs/jquery-ui-1.10.3.min.js",
                "~/scripts/libs/splitter.js",

                "~/scripts/libs/q.js",
                "~/scripts/libs/underscore.js",

                "~/scripts/libs/knockout-{version}.debug.js",
                
                "~/scripts/kendo/kendo.web.js",
                "~/scripts/libs/knockout-kendo.js",

                // following scripts are only for the data modules
                "~/scripts/libs/knockout.mapping.js",
                "~/scripts/libs/knockout.validation.js",
                "~/scripts/libs/knockout-projections.js",
                
                "~/scripts/libs/breeze.debug.js",

                "~/scripts/libs/idangerous.swiper.js",
                "~/scripts/smartadmin/bootstrap/bootstrap.js",
                "~/scripts/libs/knockout-bootstrap.js",

                // SmartAdmin plugins
                "~/scripts/smartadmin/notification/SmartNotification.js"
            ));
            
            bundles.Add(new StyleBundle("~/content/css").Include("~/content/site.css", "~/content/base.css"));

            // these are used to get fingerprints and mark the cache every time a script or a style is updated
            bundles.Add(new ScriptBundle("~/allscripts").IncludeDirectory("~/scripts/src","*.js", true));
            bundles.Add(new StyleBundle("~/allstyles").IncludeDirectory("~/content","*.css", true));
        }

        public static void RegisterThemes(ThemeSpecCollection themes)
        {
            //themes.Theme("Outlook")
            //    .File("content/themes/kendo.outlook.css")
            //    .Folder("content/kendo/Default");

            //themes.Theme("Black")
            //    .File("content/themes/kendo.black.css")
            //    .Folder("content/kendo/Black");

            //themes.Theme("Metro")
            //    .File("content/themes/kendo.metro.css")
            //    .Folder("content/kendo/Metro");

            //themes.Theme("Bootstrap")
            //    .File("content/themes/kendo.bootstrap.css")
            //    .Folder("content/kendo/Default");

            themes.Theme("Smart-Admin")
                .File("content/themes/smartadmin.css", "content/smartadmin/smartadmin-production.css",
                "content/smartadmin/library/fontawesome/font-awesome.css")
                .Folder("content/kendo/Default");

            //themes.Theme("Outlook", "content/kendo")
            //    .File("kendo.outlook.css", "kendo.common.css")
            //    .Folder("Default");

            //themes.Theme("Cerulean")
            //    .File("content/bootstrap/bootstrap.cerulean.css", "content/themes/kendo.outlook.css")
            //    .Folder("content/kendo/Default", "content/kendo/Default");

            // Other Kendo UI Themes

            //themes.Theme("Blue Opal", "content/kendo")
            //    .File("kendo.blueopal.css", "kendo.common.css")
            //    .Folder("BlueOpal");

            //themes.Theme("Default", "content/kendo")
            //  .File("kendo.default.css", "kendo.common.css")
            //  .Folder("Default");

            //themes.Theme("High Contrast", "content/kendo")
            //  .File("kendo.highcontrast.css", "kendo.common.css")
            //  .Folder("HighContrast");

            //themes.Theme("Metro Black", "content/kendo")
            //  .File("kendo.metroblack.css", "kendo.common.css")
            //  .Folder("MetroBlack");

            //themes.Theme("Moonlight", "content/kendo")
            //  .File("kendo.moonlight.css", "kendo.common.css")
            //  .Folder("Moonlight");

            //themes.Theme("Silver", "content/kendo")
            //  .File("kendo.silver.css", "kendo.common.css")
            //  .Folder("Silver");

            //themes.Theme("Uniform", "content/kendo")
            //  .File("kendo.uniform.css", "kendo.common.css")
            //  .Folder("Uniform");
        }
    }

}

