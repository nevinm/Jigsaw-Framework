/// <summary>
/// Date        : 06/02/2015
/// Author      : Nishin
/// Description : Configuration Serverside class
/// </summary>

using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace TestHarness
{
    /// <summary>
    /// Config Object for the TestHarness.
    /// This is designed in Singleton pattern.
    /// </summary>
    public class TestHarnessConfig
    {
        private static TestHarnessConfig instance = new TestHarnessConfig();
        private TestHarnessConfig() { }

        public static TestHarnessConfig Instance
        {
            get
            {
                return instance;
            }
        }

        /// <summary>
        /// This will generate JSON Object for this class. This is used in the Default.aspx file.
        /// </summary>
        /// <returns>The string representation of the JSON object</returns>
        public string ToString()
        {
            return JsonConvert.SerializeObject(instance);
        }

        /// <summary>
        /// Property that indicates the environment currently running.
        /// </summary>
        public string Env { get; set; }

    }
}