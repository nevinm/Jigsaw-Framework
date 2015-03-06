using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Data.Common;
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
using NUnit.Framework;
using Jigsaw.UI.Tests.PageObjectModels;
using System.IO;
using System.Threading;


namespace Jigsaw.UI.Tests.UIAutomatedTests
{
    [TestFixture]
    public class SignInPageTests  
    {

        public Uri url;
        public IWebDriver driver;
        [TestFixtureSetUp]
        public void InitialSetup()
        {

        } // end of public void InitialSetup()

        [TearDown]
        public void TearDown()
        {
            url = null;
            driver.Dispose();
            driver.Quit();
      //      SingletonWebDriver.QuitDriver();
         //   SingletonWebDriver.QuitDriver();
        } // end of public void TearDown()

        [SetUp]
        public void SetUp()
        {
            // driver = new FirefoxDriver();
          //  SingletonWebDriver.instantiateWebDriver(typeof(ChromeDriver));
         //   if (driver != null)
          //  {
                // 
           //     driver.Quit();
          //  } // if (driver != null)

            ChromeOptions options = new ChromeOptions();
           options.AddArgument("--start-maximized");
            options.AddArgument("--disable-extensions");
         //  driver = new ChromeDriver(@"D:\EMIS\JigsawCUITChrome\JigsawCUITChrome\SeleniumConfigFiles\", options);
        //    //Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "SeleniumConfigFiles");
            driver = new ChromeDriver(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, @"..\..\SeleniumConfigFiles"), options);
        //    SingletonWebDriver.getIWebDriver(typeof(ChromeDriver));
            //   driver = new ChromeDriver( @"..\..\..\JigsawCUITChrome\SeleniumConfigFiles", options);
            // driver.Navigate().GoToUrl("http://localhost:2816/");
          //  typeof(ChromeDriver).Name;
        } // end of public void SetUp()



        [Test]
        public void Test_SignIn_With_Wrong_Credentials()
        {
            url = new Uri("http://localhost:2816/");
            IWait<IWebDriver> wait = new OpenQA.Selenium.Support.UI.WebDriverWait(driver, TimeSpan.FromSeconds(30.00));

            LandingPage lanPage = new LandingPage(driver, true, url, wait, 3000);


            wait.Until(driver1 => ((IJavaScriptExecutor)driver).ExecuteScript("return       document.readyState").Equals("complete"));
            //          wait2.Until(drv => drv.FindElement(By.LinkText("System")));
            //  waitArg.Until(ExpectedConditions.DoesElementNotExist( By.CssSelector("div.loading-screen")))); // Added wait here for the loading element to go away
            wait.Until(ExpectedConditions.DoesElementNotExist(By.CssSelector("div.loading-screen")));
            wait.Until(ExpectedConditions.DoesElementNotExist(By.XPath("//div[@class='loading-screen']")));

           // SignInPage snPge = lanPage.GoToSignInPage(driver, wait, 1000);
            wait.Until(ExpectedConditions.DoesElementExist(By.XPath("//a[@class='btn txt-color-white']/descendant::p[text()='Sign in']")));
            wait.Until(ExpectedConditions.ElementIsVisible(By.XPath("//a[@class='btn txt-color-white']/descendant::p[text()='Sign in']")));
            wait.Until(ExpectedConditions.ElementIsClickable(By.XPath("//a[@class='btn txt-color-white']/descendant::p[text()='Sign in']")));
            //  var btn = drvArg.FindElement(by);

            IWebElement btn = wait.Until<IWebElement>((d) =>
            {
                try
                {
                    return d.FindElement(By.XPath("//a[@class='btn txt-color-white']/descendant::p[text()='Sign in']"));
                }
                catch
                {
                    return null;
                }
            });

            wait.Until(driver1 => ((IJavaScriptExecutor)driver).ExecuteScript("return       document.readyState").Equals("complete"));
            //          wait2.Until(drv => drv.FindElement(By.LinkText("System")));
            //  waitArg.Until(ExpectedConditions.DoesElementNotExist( By.CssSelector("div.loading-screen")))); // Added wait here for the loading element to go away
            wait.Until(ExpectedConditions.DoesElementNotExist(By.CssSelector("div.loading-screen")));
            wait.Until(ExpectedConditions.DoesElementNotExist(By.XPath("//div[@class='loading-screen']")));
            wait.Until(ExpectedConditions.ElementIsNotClickable(By.CssSelector("div.loading-screen")));
            wait.Until(ExpectedConditions.ElementIsNotClickable(By.XPath("//div[@class='loading-screen']")));

            wait.Until(ExpectedConditions.ElementIsClickable(By.XPath("//a[@class='btn txt-color-white']/descendant::p[text()='Sign in']")));

            btn.Click();
            SignInPage snPge = (SignInPage)Activator.CreateInstance(typeof(SignInPage), new object[2] { driver, wait });
            snPge.enterLoginCredentials(driver, wait, "johnDoe@nowhere.com", "nothing");

          //  wait.Until(ExpectedConditions.DoesElementExist(By.XPath("//div[@id='smallbox1']/descendant::p[text()='UserName']")));
          //  wait.Until(ExpectedConditions.ElementIsClickable(By.XPath("//div[@id='smallbox1']/descendant::p[text()='UserName']")));


            //wait.Until(ExpectedConditions.DoesElementExist(By.XPath("//div[@id='divSmallBoxes']/descendant::p[contains(translate(text(), "
            //                                           + " 'ABCDEFGHJIKLMNOPQRSTUVWXYZ',"
            //                                                 + "'abcdefghjiklmnopqrstuvwxyz')"
            //                                                       + ", 'The user name or password provided is incorrect')   ]")));
            Assert.AreEqual(true, wait.Until(ExpectedConditions.ElementIsClickable(By.XPath("//div[@id='divSmallBoxes']"))));
            //Assert.AreEqual(true, wait.Until(ExpectedConditions.ElementIsClickable(By.XPath("//div[@id='divSmallBoxes']/descendant::p[contains(translate(text(), "
            //                                           + " 'ABCDEFGHJIKLMNOPQRSTUVWXYZ',"
            //                                                 + "'abcdefghjiklmnopqrstuvwxyz')"
            //                                                       + ", 'The user name or password provided is incorrect')   ]"))));

            Assert.AreEqual(true, wait.Until(ExpectedConditions.ElementIsClickable(By.XPath("//p[contains(text(),'The user name or password provided is incorrect')]"))));

            //Assert.AreEqual(true, wait.Until(ExpectedConditions.ElementIsClickable(By.XPath("//p[contains(translate(text(), "
            //                                            + " 'ABCDEFGHJIKLMNOPQRSTUVWXYZ',"
            //                                                  + "'abcdefghjiklmnopqrstuvwxyz')"
            //                                                        + ",  'incorrect')]"))));
            
            //class="k-button k-button-icontext k-grid-edit"

            //Assert();

        } // end of public void Test_SignIn_With_Wrong_Credentials()


    } // end of public class SignInPageTests

} // end of namespace Jigsaw.UI.Tests.UIAutomatedTests
