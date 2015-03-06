using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Jigsaw.UI.Core.MasterCommon.TestHarness
{
    public static class TestHarnessHelper
    {
        public static bool PartialExists(this HtmlHelper html, string path)
        {
            bool returnVal = false;
            var controllerContext = html.ViewContext.Controller.ControllerContext;
            ViewEngineResult result = ViewEngines.Engines.FindPartialView(controllerContext, path);
            if (result != null && result.View != null)
                returnVal = true;

            return returnVal;
        }
    }
}