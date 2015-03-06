using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Web.Http;

namespace Jigsaw.Server.Helpers
{
    public static class ApiControllerHelpers
    {
        public static HttpResponseMessage File(this ApiController that, byte[] array, string contentType=null, string fileName = null)
        {
            var result = new HttpResponseMessage();
            result.Content = new ByteArrayContent(array);
            result.StatusCode = HttpStatusCode.OK;

            if (!string.IsNullOrEmpty(contentType))
            {
                result.Content.Headers.ContentType = new MediaTypeHeaderValue(contentType);
            }
            
            if (!string.IsNullOrEmpty(fileName))
            {
                result.Content.Headers.Add("content-disposition", "attachment;filename=" + fileName);
            }

            return result;
        }
    }
}