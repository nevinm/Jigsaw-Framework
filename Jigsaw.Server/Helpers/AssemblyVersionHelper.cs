using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Jigsaw.Helpers
{
    public static class AssemblyVersionHelper
    {
        public static string AssemblyVersion(this HtmlHelper helper)
        {
            return System.Reflection.Assembly.GetExecutingAssembly()
                         .GetName().Version.ToString();
        }
    }
}