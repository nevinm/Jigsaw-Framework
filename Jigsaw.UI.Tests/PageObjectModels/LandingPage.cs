using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using OpenQA.Selenium.Remote;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Firefox;
using OpenQA.Selenium.Support.UI;
using OpenQA.Selenium.Interactions;
using OpenQA.Selenium.Interactions.Internal;
using System.Threading;
using System.IO;

namespace Jigsaw.UI.Tests.PageObjectModels
{
    public class LandingPage : JsUIPage
    {
        //public static LandingPage Initiate()
        //{
        //    var driver = new ChromeDriver(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, @"..\..\..\..\Jigsaw.UI.Tests\SeleniumConfigFiles"), options);
        //    driver.Navigate().GoToUrl(driver.Url);
        //    return new LandingPage();
        //}
        public LandingPage() : base()
        {

        } // end of public LandingPage()

        public LandingPage(IWebDriver drvArg, bool shouldItBeMax, Uri urlArg, IWait<IWebDriver> waitArg, int threadSleepTime)
            : base(drvArg, shouldItBeMax, urlArg, waitArg, threadSleepTime)
        {

     

        } // end of public LandingPage()

        public LandingPage(IWebDriver drvArg, IWait<IWebDriver> waitArg)
            : base(drvArg)
        {
        
            waitArg = new OpenQA.Selenium.Support.UI.WebDriverWait(drvArg, TimeSpan.FromSeconds(30.00));

        } // end of public LandingPage()

        public CustomersPage GoToCustomersPage(IWebDriver drvArg, IWait<IWebDriver> waitArg, int threadSleepTimeArg)
        {
            
            //wait.Until(ExpectedConditions.ElementIsClickable( By.XPath("//a[@class='btn txt-color-white']/descendant::p[text()='Sign in']")));
            //wait.Until(ExpectedConditions.DoesElementNotExist( By.XPath("//div[@class='loading-screen']"))));
            //var btn = drvArg.FindElement(By.XPath("//a[@class='btn txt-color-white']/descendant::p[text()='Sign in']"));
            //btn.Click();
            return NavigateTo<CustomersPage>(drvArg, waitArg, By.XPath("//a/descendant::p[text()='Customers']"), threadSleepTimeArg);
            // return null;
        }


        public SignInPage GoToSignInPage(IWebDriver drvArg, IWait<IWebDriver> waitArg, int threadSleepTimeArg)
        {
            waitArg.Until(driver1 => ((IJavaScriptExecutor)drvArg).ExecuteScript("return       document.readyState").Equals("complete"));
            //          wait2.Until(drv => drv.FindElement(By.LinkText("System")));
            //  waitArg.Until(ExpectedConditions.DoesElementNotExist( By.CssSelector("div.loading-screen")))); // Added wait here for the loading element to go away
            waitArg.Until(ExpectedConditions.DoesElementNotExist(By.CssSelector("div.loading-screen")));
            waitArg.Until(ExpectedConditions.DoesElementNotExist(By.XPath("//div[@class='loading-screen']")));
            //wait.Until(ExpectedConditions.ElementIsClickable( By.XPath("//a[@class='btn txt-color-white']/descendant::p[text()='Sign in']")));
            //wait.Until(ExpectedConditions.DoesElementNotExist( By.XPath("//div[@class='loading-screen']"))));
            //var btn = drvArg.FindElement(By.XPath("//a[@class='btn txt-color-white']/descendant::p[text()='Sign in']"));
            //btn.Click();
            return NavigateTo<SignInPage>(drvArg, waitArg, By.XPath("//a[@class='btn txt-color-white']/descendant::p[text()='Sign in']"), threadSleepTimeArg);
            // return null;
        } // end of public SignInPage GoToSignInPage(IWebDriver drvArg)


    } // end of public class LandingPage : JsUIPage
} // end of namespace Jigsaw.UI.Tests.PageObjectModels
