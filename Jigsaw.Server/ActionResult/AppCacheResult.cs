using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.Mvc;

namespace Jigsaw.Server.ActionResult
{
    public class AppCacheResult : System.Web.Mvc.ActionResult
    {
        public AppCacheResult(IEnumerable<string> cacheAssets, IEnumerable<string> networkAssets = null,
                              IDictionary<string, string> fallbackAssets = null,
                              string fingerprint = null)
        {
            if (cacheAssets == null)
            {
                throw new ArgumentNullException("cacheAssets");
            }

            CacheAssets = cacheAssets.ToList();

            if (!CacheAssets.Any())
            {
                throw new ArgumentException(
                    "Cached url cannot be empty.", "cacheAssets");
            }

            NetworkAssets = networkAssets ?? new List<string>();
            FallbackAssets = fallbackAssets ?? new Dictionary<string, string>();
            Fingerprint = fingerprint;
        }

        protected IEnumerable<string> CacheAssets { get; private set; }

        protected IEnumerable<string> NetworkAssets { get; private set; }

        protected IDictionary<string, string> FallbackAssets { get; private set; }

        protected string Fingerprint { get; private set; }

        public override void ExecuteResult(ControllerContext context)
        {
            if (context == null)
            {
                throw new ArgumentNullException("context");
            }

            HttpResponseBase response = context.HttpContext.Response;

            response.Cache.SetMaxAge(TimeSpan.Zero);
            response.ContentType = "text/cache-manifest";
            response.ContentEncoding = Encoding.UTF8; //  needs to be utf-8
            response.Write(GenerateContent());
        }

        protected virtual string GenerateHeader()
        {
            return "CACHE MANIFEST" + Environment.NewLine;
        }

        protected virtual string GenerateFingerprint()
        {
            return string.IsNullOrWhiteSpace(Fingerprint)
                       ? string.Empty
                       : Environment.NewLine +
                         "# " + Fingerprint +
                         Environment.NewLine;
        }

        protected virtual string GenerateCache()
        {
            var result = new StringBuilder();

            result.AppendLine();
            result.AppendLine("CACHE:");
            CacheAssets.ToList().ForEach(a => result.AppendLine(a));

            return result.ToString();
        }

        protected virtual string GenerateNetwork()
        {
            var result = new StringBuilder();

            result.AppendLine();
            result.AppendLine("NETWORK:");

            List<string> networkAssets = NetworkAssets.ToList();

            if (networkAssets.Any())
            {
                networkAssets.ForEach(a => result.AppendLine(a));
            }
            else
            {
                result.AppendLine("*");
            }

            return result.ToString();
        }

        protected virtual string GenerateFallback()
        {
            if (!FallbackAssets.Any())
            {
                return string.Empty;
            }

            var result = new StringBuilder();

            result.AppendLine();
            result.AppendLine("FALLBACK:");

            foreach (var pair in FallbackAssets)
            {
                result.AppendLine(pair.Key + " " + pair.Value);
            }

            return result.ToString();
        }

        private string GenerateContent()
        {
            var content = new StringBuilder();

            content.Append(GenerateHeader());
            content.Append(GenerateFingerprint());
            content.Append(GenerateCache());
            content.Append(GenerateNetwork());
            content.Append(GenerateFallback());

            string result = content.ToString();

            return result;
        }
    }
}