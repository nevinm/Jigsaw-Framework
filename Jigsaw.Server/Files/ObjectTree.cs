using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Jigsaw.Server.Files
{
    public interface IPropertyItem
    {
        string Name { get; set; }

        string Declaration();

        string Output();

        string RootOutput();
    }

    public abstract class PropertyItem : IPropertyItem
    {
        public string Name { get; set; }

        public virtual string TypeValue()
        {
            return null;
        }

        protected abstract string ContentValue();

        public string Declaration()
        {
            return string.Format("var {0}:{1};", Name, TypeValue() ?? "any");
        }

        public string Output()
        {
            return Name + ":" + ContentValue() + ",";
        }

        public string RootOutput()
        {
            return "exports." + Name + " = " + ContentValue() + ";";
        }
    }

    /// <summary>
    /// represents an property with the given content
    /// </summary>
    public class ValuePropertyItem : PropertyItem
    {
        public string Type { get; set; }

        public string Content { get; set; }

        public override string TypeValue()
        {
            return Type;
        }

        protected override string ContentValue()
        {
            return Content;
        }
    }

    /// <summary>
    /// object declaration on a module or object
    /// </summary>
    public class NamedElement
    {
        public string Name { get; set; }

        public Element Element { get; set; }

        public string Declaration()
        {
            return string.Format("module {0} {{ \n{1} \n}}", Name, Helpers.Ident(Element.Declaration()));
        }

        public string Output()
        {
            return Name + ": {"
                    + Helpers.Ident(Element.Output())
                    + "}";
        }

        public string RootOutput()
        {
            return "exports." + Name + " = { \n"
                    + Helpers.Ident(Element.Output())
                    + "\n};";
        }
    }

    /// <summary>
    /// object, with properties and more objects inside
    /// </summary>
    public class Element
    {
        public IEnumerable<IPropertyItem> Items { get; set; }

        public IEnumerable<NamedElement> Elements { get; set; }

        public Element()
        {
            this.Items = Enumerable.Empty<IPropertyItem>();
            this.Elements = Enumerable.Empty<NamedElement>();
        }

        public string Declaration()
        {
            return string.Join("\n", Items.Select(x => x.Declaration()))
                    + "\n"
                    + string.Join("\n", Elements.Select(x => x.Declaration()));
        }

        public string Output()
        {
            return string.Join("\n", Items.Select(x => x.Output()))
                    + "\n"
                    + string.Join("\n", Elements.Select(x => x.Output()));
        }

        public string RootOutput()
        {
            return string.Join("\n", Items.Select(item => item.RootOutput()))
                    + "\n"
                    + string.Join("\n", Elements.Select(item => item.RootOutput()));
        }

        private IEnumerable<IPropertyItem> ExtendItems(IEnumerable<IPropertyItem> parentItems)
        {
            var items = new List<string>();
            foreach (var item in Items)
            {
                items.Add(item.Name);
                yield return item;
            }

            foreach (var parentItem in parentItems)
            {
                if (!items.Contains(parentItem.Name))
                {
                    yield return parentItem;
                }
            }
        }

        private IEnumerable<NamedElement> ExtendNamedElements(IEnumerable<NamedElement> parentElements)
        {
            var items = Elements.ToDictionary(x => x.Name);
            var parentItems = parentElements.ToDictionary(x => x.Name);

            foreach (var element in Elements.Concat(parentElements))
            {
                // if the element is present in both dictionaries then return an extended element
                if (items.ContainsKey(element.Name) && items[element.Name] == element)
                {
                    if (parentItems.ContainsKey(element.Name))
                    {
                        yield return new NamedElement
                        {
                            Name = element.Name,
                            Element = items[element.Name].Element.Extend(parentItems[element.Name].Element)
                        };
                    }
                    else
                    {
                        yield return element;
                    }
                }
                else if (parentItems.ContainsKey(element.Name) && parentItems[element.Name] == element)
                {
                    if (!items.ContainsKey(element.Name))
                    {
                        // element present only on the parent
                        yield return element;
                    }
                }
                else
                {
                    yield return element;
                }
            }
        }

        public Element Extend(Element parent)
        {
            return new Element()
            {
                Items = ExtendItems(parent.Items),
                Elements = ExtendNamedElements(parent.Elements)
            };
        }
    }

    public class Module
    {
        public string Name { get; set; }

        public Element Element { get; set; }

        protected virtual string TemplateHelpers()
        {
            return "";
        }

        public string Declaration(string namePrepend)
        {
            return string.Format("declare module \"{0}{1}\" {{ \n{2} \n}}", namePrepend, Name, Helpers.Ident(Element.Declaration()));
        }

        public string Output()
        {
            return "define([\"require\", \"exports\"], function(require, exports) { \n"
                    + Helpers.Ident(TemplateHelpers())
                    + "\n"
                    + Helpers.Ident(Element.RootOutput())
                    + "\n});";
        }

    }

    public static class ObjectTreeHelpers
    {
        /// <summary>
        /// computes the definition file content for a set of modules
        /// </summary>
        /// <param name="modules"></param>
        /// <param name="moduleNamePrepend">append this string before each module name in the declaration file</param>
        /// <param name="definitionHelpers">may contain types used later on the definition, this get's added before
        /// enumerating the definitions</param>
        /// <returns></returns>
        public static string DefinitionFile(this IEnumerable<Module> modules, string moduleNamePrepend = "", string definitionHelpers = "")
        {
            var definition = string.Join("\n", modules.Select(m => m.Declaration(moduleNamePrepend)));
            return definitionHelpers + "\n" + definition;
        }

        /// <summary>
        /// Generates a definition file named "definitions.d.ts" on the target directory from a set of modules.
        /// Also generates a javascript file with each module output.
        /// </summary>
        /// <param name="modules"></param>
        /// <param name="targetDirectory"></param>
        /// <param name="moduleNamePrepend"></param>
        /// <param name="definitionHelpers"></param>
        public static void Generate(this IEnumerable<Module> modules, string targetDirectory = null, string moduleNamePrepend = "", string definitionHelpers = "")
        {
            string definitionFileName = Path.Combine(targetDirectory, "definitions.d.ts");
            Helpers.CreateFile(definitionFileName, modules.DefinitionFile(moduleNamePrepend, definitionHelpers));

            foreach (var module in modules)
            {
                string moduleFileName = Path.Combine(targetDirectory, module.Name + ".js");
                Helpers.CreateFile(moduleFileName, module.Output());
            }
        }
    }

}
