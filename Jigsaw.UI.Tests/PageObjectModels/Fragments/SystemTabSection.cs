using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using OpenQA.Selenium;
using OpenQA.Selenium.Support.UI;

namespace Jigsaw.UI.Tests.PageObjectModels.Fragments
{
    public class SystemTabSection
    {
        private FormBuilderSection frmBldSec;

        public SystemTabSection(IWebDriver drvArg, IWait<IWebDriver> waitArg, int threadSleepTimeArg, By by )
        {
            
          // Thread.Sleep(threadSleepTimeArg);
           waitArg.Until(ExpectedConditions.ElementIsClickable( by));

           IWebElement btn = waitArg.Until<IWebElement>((d) =>
           {
               try
               {
                   return d.FindElement(by);
               }
               catch
               {
                   return null;
               }
           });
           waitArg.Until(ExpectedConditions.DoesElementNotExist(By.CssSelector("div.loading-screen")));
           waitArg.Until(ExpectedConditions.DoesElementNotExist(By.XPath("//div[@class='loading-screen']")));
           waitArg.Until(ExpectedConditions.ElementIsNotClickable(By.CssSelector("div.loading-screen")));
           waitArg.Until(ExpectedConditions.ElementIsNotClickable(By.XPath("//div[@class='loading-screen']")));

           btn.Click();



        } // end of public SystemTabSection(IWebDriver drvArg, bool shouldItBeMax, Uri urlArg, IWait<IWebDriver> waitArg, int threadSleepTime)




        public FormBuilderSection FrmBldSec
        {
            get { return frmBldSec; }
            set { frmBldSec = value; }
        } // end of public FormBuilderSection FrmBldSec

        /// <summary>
        /// An expectation for checking whether an element is visible.
        /// </summary>
        /// <param name="locator">The locator used to find the element.</param>
        /// <returns>The <see cref="IWebElement"/> once it is located, visible and clickable.</returns>
        public static bool isClickable(IWebDriver drvArg, By locator)
        {
            //return driver =>
            //{
            //    var element = driver.FindElement(locator);
            //    return (element != null && element.Displayed && element.Enabled) ? element : null;
            //};
            var element = drvArg.FindElement(locator);
            if (element != null && element.Displayed && element.Enabled)
            {

                return true;
            }
            return false;
        }


    } // end of public class SystemTabSection
} // end of namespace Jigsaw.UI.Tests.PageObjectModels.Fragments
