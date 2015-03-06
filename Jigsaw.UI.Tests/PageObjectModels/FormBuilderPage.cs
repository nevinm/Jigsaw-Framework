using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using OpenQA.Selenium;
using OpenQA.Selenium.Support.UI;

namespace Jigsaw.UI.Tests.PageObjectModels
{
    public class FormBuilderPage : JsUIPage
    {
        public FormBuilderPage() : base()
        {

        } // end of public FormBuilderPage() : base()

        public FormBuilderPage(IWebDriver drvArg, IWait<IWebDriver> waitArg)
            : base(drvArg)
        {
           // waitArg = new OpenQA.Selenium.Support.UI.WebDriverWait(drvArg, TimeSpan.FromSeconds(30.00));
            waitArg.Until(driver1 => ((IJavaScriptExecutor)drvArg).ExecuteScript("return       document.readyState").Equals("complete"));

        } // end of public 

    } // end of public class FormBuilderPage : JsUIPage
} // end of namespace Jigsaw.UI.Tests.PageObjectModels
