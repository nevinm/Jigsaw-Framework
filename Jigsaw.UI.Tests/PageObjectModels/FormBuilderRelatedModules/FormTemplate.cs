using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using OpenQA.Selenium.Remote;
using OpenQA.Selenium;

using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Support.UI;
using OpenQA.Selenium.Interactions;
using OpenQA.Selenium.Interactions.Internal;
using System.Threading;
using System.IO;
using Jigsaw.UI.Tests.PageObjectModels.UIControls;

namespace Jigsaw.UI.Tests.PageObjectModels.Sections
{
    public class FormTemplate
    {
        Dictionary<int, UIControl> uiControlDictionary = new Dictionary<int, UIControl>();

        public Dictionary<int, UIControl> UiControlDictionary
        {
            get { return uiControlDictionary; }
            set { uiControlDictionary = value; }
        }




    } // end of public class FormTemplateSubModule
} // end of namespace Jigsaw.UI.Tests.PageObjectModels.SubModules
