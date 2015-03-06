using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace Jigsaw.Server.Helpers
{
    public static class ServerFileHelpers
    {
        public static IEnumerable<string> EnumerateAllFilesInDirectory(string directoryAbsolutePath)
        {
            var rootPath = Directory.GetParent(directoryAbsolutePath).ToString();

            return EnumerateAllFilesInDirectoryInternal(directoryAbsolutePath)
                .Select(x => x.Replace(rootPath, "").Replace(Path.DirectorySeparatorChar, '/'));
        }

        private static IEnumerable<string> EnumerateAllFilesInDirectoryInternal(string directoryAbsolutePath)
        {
            foreach (var file in Directory.GetFiles(directoryAbsolutePath))
            {
                yield return file;
            }

            foreach (var files in Directory.GetDirectories(directoryAbsolutePath)
                .SelectMany(EnumerateAllFilesInDirectoryInternal))
            {
                yield return files;
            }
        }

        public static IEnumerable<string> ImageFiles(IEnumerable<string> files)
        {
            return files.Where(file => file.EndsWith(".png") || file.EndsWith(".jpg") || file.EndsWith(".gif"));
        }

        public static IEnumerable<string> EnumerateAllImagesInDirectory(string directoryAbsolutePath)
        {
            return ImageFiles(EnumerateAllFilesInDirectory(directoryAbsolutePath));
        }
    }
}