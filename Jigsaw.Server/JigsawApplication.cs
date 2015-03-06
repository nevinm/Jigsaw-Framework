using Jigsaw.Server.Files;

namespace Jigsaw.Server
{
    /// <summary>
    /// Entry point for a MVC Jigsaw application
    /// </summary>
    public static class JigsawApplication
    {
        public static void Start()
        {

        }

        public static void GenerateTemplateFiles(string templateDirectory, string rootPath, string targetDirectory = null)
        {
            TemplateFiles.Generate(templateDirectory, rootPath, targetDirectory);
        }

        public static Files.Metadata Metadata(string directory, string rootDirectory)
        {
            return Files.Metadata.Create(directory, rootDirectory);
        }
    }
}
