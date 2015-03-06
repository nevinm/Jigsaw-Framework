using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using OpenQA.Selenium.Remote;
using OpenQA.Selenium;
using OpenQA.Selenium.Remote;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Firefox;
using OpenQA.Selenium.Support.UI;
using OpenQA.Selenium.Interactions;
using OpenQA.Selenium.Interactions.Internal;
using System.Threading;
using System.IO;
using Jigsaw.UI.Tests.PageObjectModels.Fragments;
namespace Jigsaw.UI.Tests.PageObjectModels
{
    public class JsUIPage
    {
        private SystemTabSection sysTabSec;
        
        public SystemTabSection SysTabSec
        {
            get { return sysTabSec; }
            set { sysTabSec = value; }
        }


        //protected IWebDriver WebDriver
        //{
        //    get { return new ChromeDriver(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, @"..\..\..\..\Jigsaw.UI.Tests\SeleniumConfigFiles"), options); }
        //}

        // public IWebDriver WebDriver = new ChromeDriver(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, @"..\..\..\..\Jigsaw.UI.Tests\SeleniumConfigFiles"), options);

        // https://selenium.googlecode.com/git/docs/api/dotnet/html/M_OpenQA_Selenium_Support_UI_DefaultWait_1_Until__1.htm
        //        DefaultWait<T>.Until<TResult> Method 	WebDriver
        //        Repeatedly applies this instance's input value to the given function until one of the following occurs:

        //    the function returns neither null nor false
        //    the function throws an exception that is not in the list of ignored exception types
        //    the timeout expires


        //        public TResult Until<TResult>(
        //               Func<T, TResult> condition )


        public JsUIPage()
        {
            //chromeOptions = new ChromeOptions();
            //chromeOptions.AddArgument("--start-maximized");
            //chromeOptions.AddArgument("--disable-extensions");
            // Need to base Selenium profile on an existing Firefox profile that has HttpWatch enabled
            // FirefoxProfile defaultProfile = (new FirefoxProfileManager()).GetProfile("default");
            //driver = new ChromeDriver(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, @"..\..\..\Jigsaw.UI.Tests\SeleniumConfigFiles"), chromeOptions);
            IWebDriver driver = new FirefoxDriver();
            IWait<IWebDriver> wait;
            driver.Manage().Window.Maximize();
            driver.Navigate().GoToUrl("http://localhost:2816/");
            wait = new OpenQA.Selenium.Support.UI.WebDriverWait(driver, TimeSpan.FromSeconds(30.00));
            wait.Until(driver1 => ((IJavaScriptExecutor)driver).ExecuteScript("return       document.readyState").Equals("complete"));
            //          wait2.Until(drv => drv.FindElement(By.LinkText("System")));
            wait.Until(ExpectedConditions.DoesElementNotExist(By.CssSelector("div.loading-screen"))); // Added wait here for the loading element to go away
            wait.Until(ExpectedConditions.ElementIsClickable( By.LinkText("System")));
            wait.Until(ExpectedConditions.DoesElementNotExist( By.XPath("//div[@class='loading-screen']")));
        }  // end of public JsUIPage()


        public JsUIPage(IWebDriver drvArg)
        {
            //chromeOptions = new ChromeOptions();
            //chromeOptions.AddArgument("--start-maximized");
            //chromeOptions.AddArgument("--disable-extensions");
            // Need to base Selenium profile on an existing Firefox profile that has HttpWatch enabled
            // FirefoxProfile defaultProfile = (new FirefoxProfileManager()).GetProfile("default");
            //driver = new ChromeDriver(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, @"..\..\..\Jigsaw.UI.Tests\SeleniumConfigFiles"), chromeOptions);
            if (drvArg != null)
            {

            }
            else
            {
                drvArg = new FirefoxDriver();
            }
            drvArg.Manage().Window.Maximize();
            //wait = new OpenQA.Selenium.Support.UI.WebDriverWait(drvArg, TimeSpan.FromSeconds(30.00));
            //wait.Until(driver1 => ((IJavaScriptExecutor)drvArg).ExecuteScript("return       document.readyState").Equals("complete"));
            ////          wait2.Until(drv => drv.FindElement(By.LinkText("System")));
            //wait.Until(ExpectedConditions.DoesElementNotExist( By.CssSelector("div.loading-screen")))); // Added wait here for the loading element to go away
            //wait.Until(ExpectedConditions.ElementIsClickable( By.LinkText("System")));
            //wait.Until(ExpectedConditions.DoesElementNotExist( By.XPath("//div[@class='loading-screen']"))));
        }  // end of public JsUIPage()


        public JsUIPage(IWebDriver drvArg, IWait<IWebDriver> waitArg)
        {
            //chromeOptions = new ChromeOptions();
            //chromeOptions.AddArgument("--start-maximized");
            //chromeOptions.AddArgument("--disable-extensions");
            // Need to base Selenium profile on an existing Firefox profile that has HttpWatch enabled
            // FirefoxProfile defaultProfile = (new FirefoxProfileManager()).GetProfile("default");
            //driver = new ChromeDriver(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, @"..\..\..\Jigsaw.UI.Tests\SeleniumConfigFiles"), chromeOptions);
            if (drvArg != null)
            {
                if (waitArg != null)
                {

                }
                else
                {
                    waitArg = new OpenQA.Selenium.Support.UI.WebDriverWait(drvArg, TimeSpan.FromSeconds(30.00));
                }
            }
            else
            {
                drvArg = new FirefoxDriver();
                waitArg = new OpenQA.Selenium.Support.UI.WebDriverWait(drvArg, TimeSpan.FromSeconds(30.00));
            }
            drvArg.Manage().Window.Maximize();
            //wait = new OpenQA.Selenium.Support.UI.WebDriverWait(drvArg, TimeSpan.FromSeconds(30.00));
            //wait.Until(driver1 => ((IJavaScriptExecutor)drvArg).ExecuteScript("return       document.readyState").Equals("complete"));
            ////          wait2.Until(drv => drv.FindElement(By.LinkText("System")));
            //wait.Until(ExpectedConditions.DoesElementNotExist( By.CssSelector("div.loading-screen")))); // Added wait here for the loading element to go away
            //wait.Until(ExpectedConditions.ElementIsClickable( By.LinkText("System")));
            //wait.Until(ExpectedConditions.DoesElementNotExist( By.XPath("//div[@class='loading-screen']"))));
        }  // end of public JsUIPage()




        public JsUIPage(IWebDriver drvArg, bool shouldItBeMax, Uri urlArg, IWait<IWebDriver> waitArg, int threadSleepTime)
        {
            //chromeOptions = new ChromeOptions();
            //chromeOptions.AddArgument("--start-maximized");
            //chromeOptions.AddArgument("--disable-extensions");
            // Need to base Selenium profile on an existing Firefox profile that has HttpWatch enabled
            // FirefoxProfile defaultProfile = (new FirefoxProfileManager()).GetProfile("default");
            //driver = new ChromeDriver(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, @"..\..\..\Jigsaw.UI.Tests\SeleniumConfigFiles"), chromeOptions);

            if (shouldItBeMax)
            {
                drvArg.Manage().Window.Maximize();
            }
            drvArg.Navigate().GoToUrl(urlArg);

           // Thread.Sleep(threadSleepTime);

            waitArg.Until(driver1 => ((IJavaScriptExecutor)drvArg).ExecuteScript("return       document.readyState").Equals("complete"));
            //          wait2.Until(drv => drv.FindElement(By.LinkText("System")));
          //  waitArg.Until(ExpectedConditions.DoesElementNotExist( By.CssSelector("div.loading-screen")))); // Added wait here for the loading element to go away
            waitArg.Until(ExpectedConditions.DoesElementNotExist(By.CssSelector("div.loading-screen")));
            waitArg.Until(ExpectedConditions.DoesElementNotExist(By.XPath("//div[@class='loading-screen']")));
            //waitArg.Until(ExpectedConditions.DoesElementNotExist( By.XPath("//div[@class='loading-screen']"))));

        }




        //public string Title { get { return driver.Title; } }

        public TPage NavigateTo<TPage>(IWebDriver drvArg, IWait<IWebDriver> waitArg, By by, int threadSleepTimeArg) where TPage : JsUIPage, new()
        {
            // driver.FindElement(by).Click();
          //  Thread.Sleep(threadSleepTimeArg);
            waitArg.Until(ExpectedConditions.DoesElementExist(by));
            waitArg.Until(ExpectedConditions.ElementIsVisible(by));
            waitArg.Until(ExpectedConditions.ElementIsClickable( by ) );
            //  var btn = drvArg.FindElement(by);

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

            waitArg.Until(driver1 => ((IJavaScriptExecutor)drvArg).ExecuteScript("return       document.readyState").Equals("complete"));
            //          wait2.Until(drv => drv.FindElement(By.LinkText("System")));
            //  waitArg.Until(ExpectedConditions.DoesElementNotExist( By.CssSelector("div.loading-screen")))); // Added wait here for the loading element to go away
            waitArg.Until(ExpectedConditions.DoesElementNotExist(By.CssSelector("div.loading-screen")));
            waitArg.Until(ExpectedConditions.DoesElementNotExist(By.XPath("//div[@class='loading-screen']")));
            waitArg.Until(ExpectedConditions.ElementIsNotClickable(By.CssSelector("div.loading-screen")));
            waitArg.Until(ExpectedConditions.ElementIsNotClickable(By.XPath("//div[@class='loading-screen']")));

            waitArg.Until(ExpectedConditions.ElementIsClickable(by));

            btn.Click();

            btn.Click();

            btn.Click();
            
            //          wait2.Until(drv => drv.FindElement(By.LinkText("System")));
            //  waitArg.Until(ExpectedConditions.DoesElementNotExist( By.CssSelector("div.loading-screen")))); // Added wait here for the loading element to go away

            //char[] characters = { 'a', 'b', 'c', 'd', 'e', 'f' };
            //object[][] arguments = new object[3][] { new object[] { characters },
            //                                   new object[] { characters, 1, 4 },
            //                                   new object[] { characters[1], 20 } };

            //for (int ctr = 0; ctr <= arguments.GetUpperBound(0); ctr++)
            //{
            //    object[] args = arguments[ctr];
            //    object result = Activator.CreateInstance(typeof(String), args);
            //    Console.WriteLine("{0}: {1}", result.GetType().Name, result);
            //}

            //return Activator.CreateInstance<TPage>();
            // return (TPage)Activator.CreateInstance(typeof(TPage), new object[1] { drvArg });
            return (TPage)Activator.CreateInstance(typeof(TPage), new object[2] { drvArg, waitArg });
        }

        //public void Execute(IWebDriver drvArg, By by, Action<IWebElement> action)
        //{
        //    var element = drvArg.FindElement(by);
        //    action(element);
        //}

        /// <summary>
        /// An expectation for checking whether an element is visible.
        /// </summary>
        /// <param name="locator">The locator used to find the element.</param>
        /// <returns>The <see cref="IWebElement"/> once it is located, visible and clickable.</returns>
        //public static Func<IWebDriver, IWebElement> ExpectedConditions.ElementIsClickable(By locator)
        //{
        //    return driver =>
        //    {
        //        var element = driver.FindElement(locator);
        //        return (element != null && element.Displayed && element.Enabled) ? element : null;
        //    };
        //}


        //public static bool Exists(IWebDriver drvArg, By locator)
        //{
        //    try
        //    {
        //        drvArg.FindElement(locator);
        //        return true;
        //    }
        //    catch (NoSuchElementException) { return false; }
        //}




        /// <summary>
        /// An expectation for checking whether an element is visible.
        /// </summary>
        /// <param name="locator">The locator used to find the element.</param>
        /// <returns>The <see cref="IWebElement"/> once it is located, visible and clickable.</returns>
        //public static bool isClickable(IWebDriver drvArg, By locator)
        //{
        //    //return driver =>
        //    //{
        //    //    var element = driver.FindElement(locator);
        //    //    return (element != null && element.Displayed && element.Enabled) ? element : null;
        //    //};
        //    var element = drvArg.FindElement(locator);
        //    if (element != null && element.Displayed && element.Enabled)
        //    {

        //        return true;
        //    }
        //    return false;
        //}

    }
}
