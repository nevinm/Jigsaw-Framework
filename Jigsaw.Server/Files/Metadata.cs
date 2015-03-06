using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;

namespace Jigsaw.Server.Files
{
    public class Metadata
    {
        private string TargetDirectory { get; set; }

        private string RootDirectory { get; set; }

        List<Module> _modules = new List<Module>();

        private Metadata(string targetDirectory, string rootDirectory)
        {
            this.TargetDirectory = targetDirectory;
            RootDirectory = rootDirectory;
        }

        public static Metadata Create(string targetDirectory, string rootDirectory)
        {
            return new Metadata(targetDirectory, rootDirectory);
        }

        private string ExtractName<T>(Expression<Func<T, string>> expression)
        {
            var methodCall = expression.Body as MethodCallExpression;
            if (methodCall != null)
            {
                return methodCall.Method.Name;
            }

            throw new ArgumentException();
        }

        private string camelCase(string name)
        {
            return char.ToLower(name[0]) + name.Substring(1);
        }

        private string GetTypeForItem(object content)
        {
            if (content is string)
            {
                return "string";
            }
            else
            {
                return "any";
            }
        }

        private string GetContentForItem(object content)
        {
            if (content is string)
            {
                return HttpUtility.JavaScriptStringEncode(content.ToString(), true);
            }

            throw new Exception();
        }

        public Metadata With<TController>(params Expression<Func<TController, string>>[] parameters)
            where TController: new()
        {
            _modules.Add(new Module
            {
                Name = camelCase(typeof(TController).Name.Replace("Controller", "")),
                Element = new Element
                {
                    Items = parameters.Select(expression =>
                    {
                        var target = new TController();
                        var compiled = expression.Compile();
                        var content = compiled(target);

                        return new ValuePropertyItem
                        {
                            Name = camelCase(ExtractName(expression)), 
                            Type = GetTypeForItem(content),
                            Content = GetContentForItem(content)
                        };
                    }).ToList()
                }
            });

            return this;
        }

        public void Generate()
        {
            _modules.Generate(TargetDirectory, RootDirectory);
        }
    }
}
