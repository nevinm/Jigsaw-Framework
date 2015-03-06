using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Reflection;
using System.Web.Compilation;
using Breeze.ContextProvider;
using Newtonsoft.Json.Linq;

namespace Jigsaw.Server.Helpers
{
    public static class MetadataHelper
    {
        public static string ExtendedMetadata(this ContextProvider contextProvider)
        {
            return ExtendMetadata(contextProvider.Metadata());
        }

        /// <summary>
        /// thanks to http://stackoverflow.com/q/16733251
        /// </summary>
        /// <param name="metadataString"></param>
        /// <returns></returns>
        public static string ExtendMetadata(string metadataString)
        {
            JObject metadata = JObject.Parse(metadataString);
            string efNameSpace = metadata["schema"]["namespace"].ToString();
            string typeNameSpaces = metadata["schema"]["cSpaceOSpaceMapping"].ToString();
            typeNameSpaces = "{" + typeNameSpaces.Replace("],[", "]|[").Replace("[", "").Replace("]", "").Replace(",", ":").Replace("|", ",") + "}";
            JObject jTypeNameSpaces = JObject.Parse(typeNameSpaces);

            foreach (var entityType in metadata["schema"]["entityType"])
            {
                string typeName = entityType["name"].ToString();
                string defaultTypeNameSpace = efNameSpace + "." + typeName;
                string entityTypeNameSpace = jTypeNameSpaces[defaultTypeNameSpace].ToString();
                Type type = BuildManager.GetType(entityTypeNameSpace, false);

                IEnumerable<JToken> metaProperties = entityType["property"].Type == JTokenType.Object 
                    ? new[] { entityType["property"] } 
                    : entityType["property"].AsEnumerable();

                var props = from metaProperty in metaProperties
                            let propertyName = metaProperty["name"].ToString()
                            let property = type.GetProperties().SingleOrDefault(prop => prop.Name == propertyName)
                            where property != null
                            from attr in property.CustomAttributes
                            where attr.AttributeType == typeof(DisplayAttribute)
                            let attribute = property.GetCustomAttribute<DisplayAttribute>()
                            select new
                            {
                                Prop = metaProperty, 
                                DisplayName = attribute.Name,
                                Description = attribute.Description
                            };
                
                foreach (var p in props)
                {
                    p.Prop["custom"] = JObject.FromObject(new
                    {
                        displayName = p.DisplayName,
                        description = p.Description
                    }); 
                }
            }

            return metadata.ToString();
        }
    }
}