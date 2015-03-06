using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Principal;
using System.Web;
using System.Web.Mvc;
using Jigsaw.Server.Core;
using Jigsaw.Server.Helpers;

namespace Jigsaw.Server.Infrastructure
{
    public interface ICacheManifestService
    {
        IEnumerable<string> GetCachedResources(UrlHelper url, IIdentity user, HttpServerUtilityBase server);
        IEnumerable<string> AvailableThemes();
        IEnumerable<string> GetThemeFiles(string themeName = "");
    }

    public partial class CacheManifestService : ICacheManifestService
    {
        private readonly IUserPreferencesStorage _userPreferences;

        public CacheManifestService(IUserPreferencesStorage userPreferences)
        {
            _userPreferences = userPreferences;
        }

        public IEnumerable<string> AvailableThemes()
        {
            return CacheManifestTable.Themes.Select(theme => theme.Name);
        }

        public IEnumerable<string> GetThemeFiles(string theme)
        {
            return CacheManifestTable.Themes[theme];
        }

        private IEnumerable<string> CommonEntries(UrlHelper url, IIdentity user)
        {
            return new[]
                       {
                           // application files
                           //url.Content("~/scripts/src/main.js"),
                           //url.Content("~/scripts/src/entry_point.js"),
                           //url.Content("~/scripts/src/templates/_core.js"),
                           //url.Content("~/scripts/src/app.js"),
                           //url.Content("~/scripts/src/templates/beta.js"),
                           //url.Content("~/scripts/src/modules/betaModule.js"),

                           //url.Content("~/scripts/src/templates/test.js"),
                           //url.Content("~/scripts/src/modules/testModule.js"),

                           // application CSS files
                           url.Content("~/content/modules/core.css"),

                           url.Content("~/content/modules/core-mobile.css"),
                           url.Content("~/content/kendo.mobile/kendo.mobile.all.min.css"),

                           // base libraries
                           //url.Content("~/scripts/require.js"),
                           //url.Content("~/scripts/jquery-1.9.1.js"),
                           //url.Content("~/scripts/Q.js"),
                           //url.Content("~/scripts/underscore.js"),
                           //url.Content("~/scripts/backbone.js"),
                           //url.Content("~/scripts/backbone.marionette.js"),
                           //url.Content("~/scripts/knockout-2.2.1.js"),
                           //url.Content("~/scripts/kendo/kendo.web.js"),
                           //url.Content("~/scripts/knockout-kendo.js"),
                           //url.Content("~/scripts/screenfull.js"),
                       };
        }

        private IEnumerable<string> ThemeEntries(UrlHelper url, IIdentity user)
        {
            // common file for all kendo themes
            if (user.IsAuthenticated)
            {
                return GetThemeFiles(_userPreferences[user.Name].Theme);
            }
            else
            {
                // return the default theme files
                return GetThemeFiles(CacheManifestTable.DefaultTheme);
            }
        }

        private IEnumerable<string> AditionalEntries(HttpServerUtilityBase server)
        {
            return ServerFileHelpers.EnumerateAllImagesInDirectory(server.MapPath("/images"));
        }

        private IEnumerable<string> DirtyEntries(HttpServerUtilityBase server)
        {
            return ServerFileHelpers.EnumerateAllFilesInDirectory(server.MapPath("/scripts"))
                .Where(file =>
                {
                    var extension = Path.GetExtension(file);
                    return extension == ".js";
                });
        }

        public IEnumerable<string> GetCachedResources(UrlHelper url, IIdentity user, HttpServerUtilityBase server)
        {
            return DirtyEntries(server)
                .Concat(CommonEntries(url, user))
                .Concat(ThemeEntries(url, user))
                .Concat(AditionalEntries(server));
        }


    }

}