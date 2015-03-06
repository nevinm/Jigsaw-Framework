using System.Web.Mvc;
using Jigsaw.Server.Model;

namespace Jigsaw.Server.Helpers
{
    public static class HtmlHelpers
    {
        public static MvcHtmlString JigsawTextBox(this HtmlHelper<ViewbarTemplateModel> htmlHelper, string property)
        {
            if (htmlHelper.ViewData.Model!= null && htmlHelper.ViewData.Model.ReadOnly)
            {
                var tag = new TagBuilder("span");
                tag.Attributes.Add("data-bind", "text: " + property);
                return new MvcHtmlString(tag.ToString());
            }
            else
            {
                var tag = new TagBuilder("input");
                tag.Attributes.Add("data-bind", "value: " + property);
                return new MvcHtmlString(tag.ToString());
            }
        }

        public static MvcHtmlString JigsawTextArea(this HtmlHelper<ViewbarTemplateModel> htmlHelper, string property, int rows = 3)
        {
            if (htmlHelper.ViewData.Model != null && htmlHelper.ViewData.Model.ReadOnly)
            {
                var tag = new TagBuilder("span");
                tag.Attributes.Add("data-bind", "text: " + property);
                return new MvcHtmlString(tag.ToString());
            }
            else
            {
                var tag = new TagBuilder("textarea");
                tag.Attributes.Add("data-bind", "value: " + property);
                tag.Attributes.Add("rows", rows.ToString());
                return new MvcHtmlString(tag.ToString());
            }
        }
    }
}