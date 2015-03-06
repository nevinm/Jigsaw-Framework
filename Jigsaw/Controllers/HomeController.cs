using System.Web.Mvc;
using Jigsaw.Server.Helpers;
using Jigsaw.Server.Infrastructure;
using Newtonsoft.Json;
using System.Linq;
using System.IO;
using System.Web.Optimization;

namespace Jigsaw.Controllers
{
    public class HomeController : Controller
    {
        private readonly ICacheManifestService _cacheManifestService;

        public HomeController(ICacheManifestService cacheManifestService)
        {
            _cacheManifestService = cacheManifestService;
        }

        private object GetThemeConfigOption()
        {
            var result = from theme in _cacheManifestService.AvailableThemes()
                    let styles = from file in _cacheManifestService.GetThemeFiles(theme)
                                 where file.EndsWith(".css")
                                 select file
                    let scripts = from file in _cacheManifestService.GetThemeFiles(theme)
                                 where file.EndsWith(".js")
                                 select file
                    select new
                               {
                                   Name = theme,
                                   Styles = styles.ToArray(),
                                   Scripts = scripts.ToArray()
                               };

            return result.ToArray();
        }

        private bool IsMobile(int? m)
        {
            return (m.HasValue && m.Value > 0) || Request.Browser.IsMobileDevice;
        }

        private string JigsawConfig(int? m)
        {
            bool isMobile = IsMobile(m);
            var availableModules = isMobile
                                       ? new[] { 
                                           "app-mobile", 
                                           "modules/betaModule", 
                                           
                                           "modules/smartadmin/js/bootstrap", 

                                           "modules/customers/js/customers-mobile" ,
                                           "modules/orders/js/orders-mobile", 
                                           "modules/employees/js/employees-mobile", 
                                           "modules/task/js/tasks-mobile", 
                                       }
                                       : new[] {
                                           "modules/smartadmin/js/bootstrap", 
                                           "modules/betaModule", 
                                           "modules/testModule", 

                                           "modules/orders/js/orders-desktop", 
                                           "modules/employees/js/employees", 
                                           "modules/supplier/js/supplier",
                                           "modules/task/js/tasks",
                                           
                                           "modules/chatbox/js/chatbox-module", 
                                           "modules/customers/js/customers-desktop", 
                                           "modules/formeditor/js/forms"
                                       };

            return JsonConvert.SerializeObject(new
            {
                FingerPrint = BundleTable.Bundles.FingerprintsOf("~/allscripts", "~/allstyles"),
                InitialUserAutorized = User.Identity.IsAuthenticated,
                AvailableModules = availableModules,
                DefaultTheme = _cacheManifestService.AvailableThemes().First(),
                Themes = GetThemeConfigOption(),
                Mobile = isMobile
            });
        }

        public ActionResult Index(int? m)
        {
            ViewBag.JigsawConfig = JigsawConfig(m);
            ViewBag.Mobile = IsMobile(m);

            return View();
        }

        public ActionResult IndexMin(int? m)
        {
            ViewBag.JigsawConfig = JigsawConfig(m);
            ViewBag.Mobile = IsMobile(m);

            return View();
        }

        public ActionResult Test()
        {
            ViewBag.JigsawConfig = JsonConvert.SerializeObject(new
            {
                InitialUserAutorized = User.Identity.IsAuthenticated,
                AvailableModules = new object[0],
                DefaultTheme = "",
                Themes = new object[0],
                Mobile = false
            });

            // scan all the spec files (files which name ends with "-spec.js") to run all them automatically on the server side
            var files = from file in ServerFileHelpers.EnumerateAllFilesInDirectory(Server.MapPath("~/scripts/src/spec"))
                        where file.EndsWith("-spec.js")
                        select file.Substring(1).Remove(file.Length-4);
            ViewBag.Specs = JsonConvert.SerializeObject(files.ToArray());

            return View();
        }
    }
}

