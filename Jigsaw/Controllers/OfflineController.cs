using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web.Mvc;
using System.Web.Optimization;
using Jigsaw.Server.ActionResult;
using Jigsaw.Server.Helpers;
using Jigsaw.Server.Infrastructure;

namespace Jigsaw.Controllers
{
    public class OfflineController : Controller
    {
        private readonly ICacheManifestService _cacheManifestService;

        public OfflineController(ICacheManifestService cacheManifestService)
        {
            _cacheManifestService = cacheManifestService;
        }

        public ActionResult Index()
        {
            // IMPORTANT: ALL ENTRIES IN THE CACHE MAINFEST ARE CASE SENSITIVE
            // OTHERWISE IT WILL FAIL!!!
            
            return new AppCacheResult(_cacheManifestService.GetCachedResources(Url, User.Identity, Server),
                                      networkAssets: new[]{ "/ping.js", "*" },
                                      fingerprint: User.Identity.Name + "|" + BundleTable.Bundles.FingerprintsOf("~/allscripts", "~/allstyles"));
        }
    }
}