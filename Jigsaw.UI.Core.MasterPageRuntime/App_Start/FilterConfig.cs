using System.Web;
using System.Web.Mvc;

namespace Jigsaw.UI.Core.MasterPageRuntime
{
    public class FilterConfig
    {
        public static void RegisterGlobalFilters(GlobalFilterCollection filters)
        {
            filters.Add(new HandleErrorAttribute());
        }
    }
}