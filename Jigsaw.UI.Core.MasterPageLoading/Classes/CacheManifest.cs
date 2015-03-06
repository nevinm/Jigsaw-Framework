using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;

namespace Jigsaw.UI.Core.MasterPageLoading
{
    public class CacheManifest
    {
        private static List<string> cacheManifestFiles = new List<string>();
        private static object cacheManifestFileLock = new object();

        internal static List<string> CacheManifestFiles
        {
            get { return cacheManifestFiles; }
        }

        public static void AddFile(string path)
        {
            AddFileToCacheManifest(path);
        }

        public static void AddFolder(string path, bool recursive = false)
        {
            AddFolderFilesToCacheManifest(path, FileFilterEnum.All, recursive);
        }

        public static void AddFolder(string path, FileFilterEnum fileFilter, bool recursive = false)
        {
            AddFolderFilesToCacheManifest(path, fileFilter, recursive);
        }

        private static void AddFileToCacheManifest(string path)
        {
            if (!cacheManifestFiles.Contains(path))
            {
                lock (cacheManifestFileLock)
                {
                    if (!cacheManifestFiles.Contains(path))
                    {
                        cacheManifestFiles.Add(path);
                    }
                }
            }
        }

        private static void AddFolderFilesToCacheManifest(string path, FileFilterEnum fileFilter, bool recursive)
        {
            List<string> fileExtensions = GetFileExtensionsFromEnum(fileFilter);
            ServerFileHelpers.EnumerateAllFilesInDirectory(HttpContext.Current.Server.MapPath(path), recursive)
                .Where(file =>
                {
                    return fileExtensions.Any(extension => extension==Path.GetExtension(file));
                })
                .ToList()
                .ForEach(file => AddFileToCacheManifest(file));
        }

        private static List<string> GetFileExtensionsFromEnum(FileFilterEnum fileFilter)
        {
            List<string> fileExtensions = new List<string>();
            if((fileFilter & FileFilterEnum.Images)==FileFilterEnum.Images)
                fileExtensions.AddRange(new string[]{".png",".jpg",".gif"}.ToList());
            if ((fileFilter & FileFilterEnum.JS) == FileFilterEnum.JS)
                fileExtensions.Add(".js");
            if((fileFilter & FileFilterEnum.CSS) == FileFilterEnum.CSS)
                fileExtensions.Add(".css");
            if((fileFilter & FileFilterEnum.Video) == FileFilterEnum.Video)
                fileExtensions.Add(".mp4");
            if ((fileFilter & FileFilterEnum.Html) == FileFilterEnum.Html)
                fileExtensions.AddRange(new string[]{".htm",".html"}.ToList());
            if ((fileFilter & FileFilterEnum.Audio) == FileFilterEnum.Audio)
                fileExtensions.Add(".mp3");
            if ((fileFilter & FileFilterEnum.Data) == FileFilterEnum.Data)
                fileExtensions.AddRange(new string[]{".json",".xml"}.ToList());
            return fileExtensions;
        }
    }

    [Flags]
    public enum FileFilterEnum
    {
        Images=1,
        JS=2,
        CSS=4,
        Html=8,
        Audio=16,
        Video=32,
        Data=64,
        All=255
    }
}