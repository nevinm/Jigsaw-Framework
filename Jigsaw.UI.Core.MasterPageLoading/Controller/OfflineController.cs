using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web.Mvc;

namespace Jigsaw.UI.Core.MasterPageLoading
{
    public class OfflineController : Controller
    {
        public OfflineController()
        { }

        public ActionResult Index()
        {
            // IMPORTANT: ALL ENTRIES IN THE CACHE MAINFEST ARE CASE SENSITIVE
            // OTHERWISE IT WILL FAIL!!!
            
            return new AppCacheResult(CacheManifest.CacheManifestFiles,
                                      networkAssets: new[]{ "*" },
                                      fingerprint: User.Identity.Name);
        }
    }
}