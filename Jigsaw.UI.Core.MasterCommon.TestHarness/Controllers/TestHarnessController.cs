using Jigsaw.UI.Core.MasterCommon.TestHarness.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Jigsaw.UI.Core.MasterCommon.TestHarness.Controllers
{
    public class TestHarnessController : Controller
    {        
        public ActionResult Index()
        {
            TestHarnessModel model = new TestHarnessModel() 
            { 
                RenderScripts = true, 
                RenderStyles = true 
            };
            SetTempData(model);
            return View(model);
        }

        [HttpPost]
        public ActionResult Index(TestHarnessModel model)
        {
            SetTempData(model);
            return View(model);
        }

        private void SetTempData(TestHarnessModel model)
        {
            TempData["RenderScripts"] = model.RenderScripts;
            TempData["RenderStyles"] = model.RenderStyles;
        }
    }
}