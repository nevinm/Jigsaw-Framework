using System.Collections.Generic;
using System.Linq;
using HtmlAgilityPack;
using System.Text.RegularExpressions;

namespace Jigsaw.Server.Export
{
    public static class ViewbarTemplateParser
    {
        /// <summary>
        /// Parse a Knockout template and returns the structure of the document
        /// </summary>
        /// <note>
        /// Selects the Tabs with their Titles, each tab title is returned from the Tab header text InnerText('ul li span')
        /// For each tab get the corresponding content which is divided into groups on the Tab content.
        /// Each Group (all under a '.field-set' element) has a header text (InnerText('header')), and a number of fields.
        /// Each field can have different types depending on the property or Element type, and a target property
        /// that can be obtained parsing the element's data-binding attribute. 
        /// For example, the element <div data-bind="field: CompanyName"></div> when parsed should return the property CompanyName
        /// and with a type <see cref="FieldType.Input"/>
        /// </note>
        /// <param name="htmlTemplate"></param>
        /// <returns></returns>
        public static IEnumerable<Tab> Parse(string htmlTemplate)
        {
            var html = new HtmlDocument();
            html.LoadHtml(htmlTemplate);

            var tab = html.DocumentNode.SelectSingleNode("//ul").ParentNode;

            return tab.SelectNodes("ul/li").Select((x, i) =>
            {
                var tabContent = tab.SelectNodes("div/div")[i];
                return new Tab
                {
                    Title = x.InnerText,
                    Groups = tabContent.SelectNodes("div")
                        .Select(content => // .field-set
                        {
                            return new Group
                            {
                                Title = content.Element("header").InnerText,
                                Fields = content.Elements("div")
                                    .Select(field =>
                                    {
                                        var result = new Field();

                                        var fieldElement = field.ChildNodes.Count > 0
                                            ? field.ChildNodes.First(
                                                node =>
                                                    node.GetAttributeValue("data-bind", null) != null &&
                                                    node.OriginalName != "label")
                                            : field;

                                        switch (fieldElement.OriginalName)
                                        {
                                            case "input":
                                                result.FieldType = FieldType.Input;
                                                break;
                                            case "span":
                                                result.FieldType = FieldType.Span;
                                                break;
                                            case "img":
                                                result.FieldType = FieldType.Image;
                                                break;
                                            case "textarea":
                                                result.FieldType = FieldType.Textarea;
                                                break;
                                            default:
                                                break;
                                        }
                                        
                                        result.Property = fieldElement.KnockoutValueBinding().Value;
                                        return result;
                                    })
                            };
                        })
                };
            });

        }

        public static KnockoutBindingSpec KnockoutValueBinding(this HtmlNode node)
        {
            return new KnockoutBindingSpec
            {
                BindingName = "field",
                Value = Regex.Match(node.GetAttributeValue("data-bind", "field: "), @"((field)|(imgSrc)): (\w+)").Groups[4].Value
                
            };
        }

        public class KnockoutBindingSpec
        {
            public string BindingName { get; set; }
            public string Value { get; set; }
        }

        public class Tab
        {
            public string Title { get; set; }
            public IEnumerable<Group> Groups { get; set; }
        }

        public class Group
        {
            public string Title { get; set; }
            public IEnumerable<Field> Fields { get; set; }
        }

        public enum FieldType
        {
            Input, Image, Textarea, Span
        }

        public class Field
        {
            public string Title { get; set; }
            public string Property { get; set; }
            public FieldType FieldType { get; set; }
        }
    }
}