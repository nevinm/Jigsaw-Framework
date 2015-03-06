using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;

namespace Jigsaw.Server.Files
{
    public class TemplateFiles
    {
        /// <summary>
        /// types used on the definitions file
        /// </summary>
        private const string definitionHeader =
@"interface TemplateFunction {
    (rc): string; raw: string;
}";

        public static void Generate(string templateDirectory, string rootPath, string targetDirectory = null)
        {
            if (string.IsNullOrEmpty(targetDirectory))
            {
                targetDirectory = templateDirectory;
            }

            var modules = Directory.EnumerateDirectories(templateDirectory)
                .SelectMany(CreateModules).ToList();

            modules.Generate(targetDirectory, rootPath, definitionHeader);
        }

        /// <summary>
        /// returns true if the given name is of a child module
        /// </summary>
        /// <param name="name"></param>
        /// <returns></returns>
        private static bool IsChildModuleName(string name)
        {
            const string ExtendString = "-";
            return name.StartsWith(ExtendString);
        }

        private static IEnumerable<TemplatePropertyItem> ReadElementItems(string path)
        {
            var extensions = new[] { ".html", ".css" };
            var posibleFiles = from file in Directory.EnumerateFiles(path)
                               let extension = Path.GetExtension(file)
                               where extensions.Contains(extension)
                               select file;

            foreach (var file in posibleFiles)
            {
                var fileName = Path.GetFileNameWithoutExtension(file);
                var extension = Path.GetExtension(file);
                using (var stream = new StreamReader(file))
                {
                    // TODO might be a good idea to minimize html and css files before writing them to the files
                    var contents = stream.ReadToEnd()
                        .Split('\n')
                        .Select(x=>x.Trim());
                    var contentEscaped = string.Join("", contents)
                        .Replace("\"", "\\\"").Replace("\'", "\\\'")
                        //.Replace("  ", "")
                        .Replace("\n", "")
                        .Replace("\r", "");

                    yield return new TemplatePropertyItem
                    {
                        Name = fileName,
                        Content = contentEscaped, //HttpUtility.JavaScriptStringEncode(contents),
                        Extension = extension
                    };
                }
            }
        }

        private static IEnumerable<NamedElement> ReadElements(string path)
        {
            return from directory in Directory.EnumerateDirectories(path)
                   let name = directory.Substring(directory.LastIndexOf("\\") + 1)
                   where !IsChildModuleName(name)
                   select new NamedElement()
                   {
                       Name = name,
                       Element = CreateElement(directory)
                   };
        }

        private static Element CreateElement(string path)
        {
            return new Element()
            {
                Items = ReadElementItems(path).ToList(),
                Elements = ReadElements(path).ToList()
            };
        }

        /// <summary>
        /// Searches a directory and creates a <see cref="TemplateModule"/> from it.
        /// Also checks if there's any directory extending the current one and returns
        /// the corresponding <see cref="TemplateModule"/> for that, using the first
        /// <see cref="TemplateModule"/> as base.
        /// </summary>
        /// <param name="path"></param>
        /// <returns></returns>
        private static IEnumerable<TemplateModule> CreateModules(string path)
        {
            if (Directory.EnumerateFiles(path).Any())
            {
                var name = path.Substring(path.LastIndexOf("\\") + 1);
                var module = new TemplateModule
                {
                    Name = name,
                    Element = CreateElement(path)
                };
                yield return module;

                foreach (var directory in Directory.EnumerateDirectories(path))
                {
                    var childName = directory.Substring(directory.LastIndexOf("\\") + 1);

                    if (IsChildModuleName(childName))
                    {
                        foreach (var childModule in CreateModules(directory))
                        {
                            yield return new TemplateModule
                            {
                                Name = module.Name + childModule.Name,
                                Element = childModule.Element.Extend(module.Element)
                            };
                        }
                    }
                }
            }
        }

        /// <summary>
        /// variable declaration on a module or an object
        /// </summary>
        private class TemplatePropertyItem : PropertyItem
        {
            public string Content { get; set; }

            public string Extension { get; set; }

            private bool NeedsCompile()
            {
                // only precompile underscore templates (stored in html files) that contain 
                // some java-script code
                return Extension == ".html";
            }

            private bool IsUnderscoreTemplate()
            {
                return Content.Contains("<%");
            }

            protected override string ContentValue()
            {
                if (NeedsCompile())
                {
                    if (IsUnderscoreTemplate())
                    {
                        return "__underscore(\"" + Content + "\")";
                    }
                    else
                    {
                        return "function() { return \"" + Content + "\"; }";
                    }
                }
                else
                {
                    return "\"" + Content + "\"";
                }
            }

            public override string TypeValue()
            {
                if (NeedsCompile())
                {
                    if (IsUnderscoreTemplate())
                    {
                        return "TemplateFunction";
                    }
                    else
                    {
                        return "{ (): string; }";
                    }
                }
                else
                {
                    return "string";
                }
            }

        }

        private class TemplateModule: Module
        {
            protected override string TemplateHelpers()
            {
                return 
@"function __underscore(template) {
    var generate = _.template(template);
    generate.raw = template;
    return generate;
}";
            }
        }
    }


}
