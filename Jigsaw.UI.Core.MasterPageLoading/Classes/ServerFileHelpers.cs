using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace Jigsaw.UI.Core.MasterPageLoading
{
    public static class ServerFileHelpers
    {
        public static IEnumerable<string> EnumerateAllFilesInDirectory(string directoryAbsolutePath, bool isRecursive)
        {
            var rootPath = Directory.GetParent(directoryAbsolutePath).ToString();

            return EnumerateAllFilesInDirectoryInternal(directoryAbsolutePath, isRecursive)
                .Select(x => x.Replace(rootPath, "").Replace(Path.DirectorySeparatorChar, '/'));
        }

        private static IEnumerable<string> EnumerateAllFilesInDirectoryInternal(string directoryAbsolutePath, bool isRecursive)
        {
            foreach (var file in Directory.GetFiles(directoryAbsolutePath))
            {
                yield return file;
            }
            if (isRecursive)
            {
                foreach (var files in Directory.GetDirectories(directoryAbsolutePath)
                    .SelectMany(path => EnumerateAllFilesInDirectoryInternal(path, isRecursive)))
                {
                    yield return files;
                }
            }
        }
    }
}