using System;
using System.Linq;
using CodeEffects.Rule.Common;
using CodeEffects.Rule.Core;
using CodeEffects.Rule.Models;
using CodeEffects.Rule.Mvc;
using Newtonsoft.Json;

namespace Jigsaw.Server.Infrastructure
{
    public class InvalidRuleException : Exception
    {
        public InvalidRuleException(string clientData): base(clientData)
        {

        }
    }

    public class WebRuleManager<T>
    {
        public string LoadSettings(ThemeType theme = ThemeType.Gray, bool help = true)
        {
            // Create the filter control based on the selected entity
            // (which is control's source object)
            RuleEditor editor = this.GetFilter();

            // Set the UI values selected by the user
            editor.ShowHelpString = help;
            editor.Theme = theme;

            // Get the actual UI settings
            return editor.GetClientSettings();
        }

        public RuleEditor GetFilter()
        {
            // The ID here must be the same ID set in the view
            RuleEditor editor = new RuleEditor("filterControl");

            // Don't forget to set it as client-only control - this is an Ajax view
            editor.ClientOnly = true;

            // Tell Web Rule that we want it to use data filtering-related UI messages and settings
            editor.Mode = CodeEffects.Rule.Common.RuleType.Filter;

            // Create an instance of the rule model, passing it the source object (current entity)
            editor.Rule = RuleModel.Create(typeof(T));

            return editor;
        }

        public IQueryable<T> Search(IQueryable<T> collection, string clientData)
        {
            // Get the filter control
            RuleEditor filter = this.GetFilter();

            // Load client's data (the actual filter) into the control
            filter.LoadClientData(clientData);

            // Check if the filter is empty
            if (filter.Rule.IsEmpty())
            {
                return collection;
            }
            else if (!filter.Rule.IsValid())
            {
                var message = JsonConvert.SerializeObject(new { 
                    ClientInvalidData = filter.GetClientInvalidData()
                });
                throw new InvalidRuleException(message);
                // this should be passed to the client's ui in case the rule is invalid
                // result.ClientInvalidData = filter.GetClientInvalidData();
            }
            else
            {
                // Get filter's XML (called Rule XML)
                string xml = filter.Rule.GetRuleXml();

                // Perform the search
                return collection.Filter(xml);
            }

        }
    }
}