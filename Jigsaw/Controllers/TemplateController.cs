using System.Web.Mvc;
using Jigsaw.Server.Model;

namespace Jigsaw.Controllers
{
    public class TemplateController : Controller
    {
        public ActionResult EmployeeViewbar(bool readOnly = false)
        {
            return View(new ViewbarTemplateModel() { ReadOnly = readOnly });
        }
    }
}
