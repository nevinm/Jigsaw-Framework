using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Mvc;

namespace Jigsaw.UI.Core.MasterCommon
{
    public static class JigsawMasterCommonHelper
    {
        private static string jqueryVersion = "-2.1.3";

        public static void RenderCommonScripts(this HtmlHelper htmlHelper, bool render)
        {
            if (render)
            {
                htmlHelper.ViewContext.Writer.Write(
                    string.Format("<script src='{0}' type='text/javascript'></script>",
                    string.Concat("Scripts\\jquery", jqueryVersion, ".js")));
            }
            return;
        }

        public static void RenderCommonStyles(this HtmlHelper htmlHelper, bool render)
        {
            if (render)
            {
                htmlHelper.ViewContext.Writer.Write(
                    string.Format("<link href='{0}' rel='stylesheet'>", "Content\\bootstrap.css"));
            }
            return;
        }
    }
}
