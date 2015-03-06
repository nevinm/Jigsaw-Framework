using System;
using System.Web.Mvc;

namespace Jigsaw.UI.TestHarness.Base.Controllers
{
    public class JasmineController : Controller
    {
        public ViewResult Run()
        {
            return View("SpecRunner");
        }
    }
}
