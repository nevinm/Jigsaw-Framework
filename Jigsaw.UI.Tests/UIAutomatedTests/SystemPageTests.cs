using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Data.Common;

using OpenQA.Selenium.Remote;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Firefox;
using OpenQA.Selenium.Support.UI;
using OpenQA.Selenium.Interactions;
using OpenQA.Selenium.Interactions.Internal;
using NUnit.Framework;
using Jigsaw.UI.Tests.PageObjectModels;
using System.IO;
using System.Threading;
using Jigsaw.UI.Tests.PageObjectModels.Fragments;


namespace Jigsaw.UI.Tests.UIAutomatedTests
{
    [TestFixture]
    public class SystemPageTests
    {

        public Uri url;
        public IWebDriver driver;
        //public IWait<IWebDriver> wait;
        [TestFixtureSetUp]
        public void InitialSetup()
        {

        } // end of public void InitialSetup()

        [TearDown]
        public void TearDown()
        {
            url = null;
          //  SingletonWebDriver.QuitDriver();
        } // end of public void TearDown()


        [SetUp]
        public void SetUp()
        {
            ChromeOptions options = new ChromeOptions();
            options.AddArgument("--start-maximized");
            options.AddArgument("--disable-extensions");
            //  driver = new ChromeDriver(@"D:\EMIS\JigsawCUITChrome\JigsawCUITChrome\SeleniumConfigFiles\", options);
            //    //Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "SeleniumConfigFiles");
            driver = new ChromeDriver(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, @"..\..\SeleniumConfigFiles"), options);
     
           // SingletonWebDriver.instantiateWebDriver(typeof(ChromeDriver));
          //  ChromeOptions options = new ChromeOptions();
          //  options.AddArgument("--start-maximized");
         //   options.AddArgument("--disable-extensions");
            //  driver = new ChromeDriver(@"D:\EMIS\JigsawCUITChrome\JigsawCUITChrome\SeleniumConfigFiles\", options);
            //Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "SeleniumConfigFiles");
          //  driver = new ChromeDriver(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, @"..\..\SeleniumConfigFiles"), options);
        } // end of public void SetUp()


        [Test]
        public void Test_Change_Very_First_Form_Template_Form_Title()
        {
            url = new Uri("http://localhost:2816/");

            driver.Manage().Window.Maximize();

            driver.Navigate().GoToUrl(url);
            IWait<IWebDriver> wait = new OpenQA.Selenium.Support.UI.WebDriverWait(driver, TimeSpan.FromSeconds(30.00));
            // Thread.Sleep(threadSleepTime);

            wait.Until(driver1 => ((IJavaScriptExecutor)driver).ExecuteScript("return       document.readyState").Equals("complete"));
            //          wait2.Until(drv => drv.FindElement(By.LinkText("System")));
            //  waitArg.Until(ExpectedConditions.DoesElementNotExist( By.CssSelector("div.loading-screen")))); // Added wait here for the loading element to go away
            wait.Until(ExpectedConditions.DoesElementNotExist(By.CssSelector("div.loading-screen")));
            wait.Until(ExpectedConditions.DoesElementNotExist(By.XPath("//div[@class='loading-screen']")));

            driver.Manage().Window.Maximize();

            driver.Navigate().GoToUrl(url);

       
           // LandingPage lanPage = new LandingPage(driver, true, url, wait, 3000);
            wait.Until(driver1 => ((IJavaScriptExecutor)driver).ExecuteScript("return       document.readyState").Equals("complete"));
            //          wait2.Until(drv => drv.FindElement(By.LinkText("System")));
            //  waitArg.Until(ExpectedConditions.DoesElementNotExist( By.CssSelector("div.loading-screen")))); // Added wait here for the loading element to go away
            wait.Until(ExpectedConditions.DoesElementNotExist(By.CssSelector("div.loading-screen")));
            wait.Until(ExpectedConditions.DoesElementNotExist(By.XPath("//div[@class='loading-screen']")));
            JsUIPage jsUIpge = new JsUIPage(driver, true, url, wait, 3000);
            jsUIpge.SysTabSec = new SystemTabSection(driver, wait, 3000, By.XPath("//a[text()='System']"));
            jsUIpge.SysTabSec.FrmBldSec = new FormBuilderSection(driver, wait, 3000, By.XPath("//a/descendant::p[text()='Builder']"));
          //  "//*[@id='grid-container']/descendant::/table/tbody/tr[1]"
            //*[@id="grid-container"]/descendant::div[@class='k-grid-content']/table/tbody/tr
            jsUIpge.SysTabSec.FrmBldSec.FrmTmpltCollSec = new FormTemplatesCollectionSection(driver, wait, 3000, By.XPath("//*[@id='grid-container']/descendant::div[@class='k-grid-content']/table/tbody/tr"));
            jsUIpge.SysTabSec.FrmBldSec.FrmTmpltCollSec.getAllFormTemplateRows(wait, By.XPath("//*[@id='grid-container']/descendant::div[@class='k-grid-content']/table/tbody/tr"));
           //new JsUIPage(IWebDriver drvArg, bool shouldItBeMax, Uri urlArg, IWait<IWebDriver> waitArg, int threadSleepTime)
        } // 


    } // end of public class SystemPageTests
}
