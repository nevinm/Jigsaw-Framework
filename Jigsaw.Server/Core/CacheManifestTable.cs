using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web.Hosting;
using System.Web.Optimization;

namespace Jigsaw.Server.Core
{
    public class CacheManifestTable
    {
        public static ThemeSpecCollection Themes { get; private set; }

        public static string DefaultTheme { get; set; }

        static CacheManifestTable()
        {
            Themes = new ThemeSpecCollection();
        }

    }

    public class ThemeSpecCollection:IEnumerable<ThemeSpec>
    {
        readonly List<ThemeSpec> _themes = new List<ThemeSpec>(); 

        public void AddTheme(ThemeSpec theme)
        {
            _themes.Add(theme);
        }

        public ThemeSpec this[string themeName]
        {
            get { return _themes.First(theme => theme.Name == themeName); }
        }

        #region Implementation of IEnumerable

        public IEnumerator<ThemeSpec> GetEnumerator()
        {
            return _themes.GetEnumerator();
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }

        #endregion
    }

    public class ThemeSpec:IEnumerable<string>
    {
        public string Name { get; private set; }
        public string RootPath { get; private set; }

        readonly List<string> _files = new List<string>(); 

        public ThemeSpec(string name, string rootPath="")
        {
            Name = name;
            RootPath = rootPath;
        }

        public void AddFile(string path)
        {
            _files.Add(path.Replace("\\", "/"));
        }

        #region Implementation of IEnumerable

        public IEnumerator<string> GetEnumerator()
        {
            return _files.GetEnumerator();
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }

        #endregion
    }

    public static class ThemeSpecExtensors
    {
        private static readonly string ServerRootPath = HostingEnvironment.MapPath("~").Replace("\\", "/");

        public static ThemeSpec Theme(this ThemeSpecCollection collection, string name, string rootPath = "")
        {
            var theme = new ThemeSpec(name, rootPath);
            collection.AddTheme(theme);
            return theme;
        }

        public static ThemeSpec File(this ThemeSpec theme, params string[] files)
        {
            foreach (var file in files)
            {
                var path = Path.Combine(Path.DirectorySeparatorChar.ToString(), theme.RootPath, file);
                theme.AddFile(path);
            }
            return theme;
        }

        public static ThemeSpec Folder(this ThemeSpec theme, params string[] folders)
        {
            foreach (var folder in folders)
            {
                var directoryPath = Path.Combine(ServerRootPath, theme.RootPath, folder);
                var directory = new DirectoryInfo(directoryPath);

                var extraPath = Path.GetFullPath(ServerRootPath);
                foreach (var file in directory.EnumerateFiles())
                {
                    var filePath = file.FullName.Remove(0, extraPath.Length).Replace("\\", "/");
                    theme.AddFile(filePath);
                }

            }
            return theme;
        }
    }

}