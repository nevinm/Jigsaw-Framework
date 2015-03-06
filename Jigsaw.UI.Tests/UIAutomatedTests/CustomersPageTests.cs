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

namespace Jigsaw.UI.Tests.UIAutomatedTests
{
    [TestFixture]
    public class CustomersPageTests
    {

        public IWebDriver driver;
        public Uri url;
        //public IWait<IWebDriver> wait;
        [TestFixtureSetUp]
        public void InitialSetup()
        {

        } // end of public void InitialSetup()

        [TearDown]
        public void TearDown()
        {
            url = null;
         //   SingletonWebDriver.QuitDriver();
            driver.Dispose();
            driver.Quit();
         //   driver = null;
        } // end of public void TearDown()

        [SetUp]
        public void SetUp()
        {
            //SingletonWebDriver.instantiateWebDriver(typeof(ChromeDriver));
          //  driver = new FirefoxDriver();
            ChromeOptions options = new ChromeOptions();
            options.AddArgument("--start-maximized");
            options.AddArgument("--disable-extensions");
        //      driver = new ChromeDriver(@"D:\EMIS\JigsawCUITChrome\JigsawCUITChrome\SeleniumConfigFiles\", options);
            //Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "SeleniumConfigFiles");
            driver = new ChromeDriver(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, @"..\..\SeleniumConfigFiles"), options);

        } // end of public void SetUp()

        [Test]
        public void Test_Add_A_Single_Customer()
        {
            url = new Uri("http://localhost:2816/");
            IWait<IWebDriver> wait = new OpenQA.Selenium.Support.UI.WebDriverWait(driver, TimeSpan.FromSeconds(30.00));
            LandingPage lanPage = new LandingPage(driver, true, url, wait, 3000);

            Dictionary<String, String> cstCntDetailsDctnry = new Dictionary<string, string>();
            cstCntDetailsDctnry.Add("contactName", "Mr. John Doe");
            cstCntDetailsDctnry.Add("contactTitle", "Hospital Administrator");
            cstCntDetailsDctnry.Add("companyName", "Apollo Hospitals");
            cstCntDetailsDctnry.Add("phone", "4938383");
            cstCntDetailsDctnry.Add("fax", "8534678");
            cstCntDetailsDctnry.Add("city", "Hyderabad");
            cstCntDetailsDctnry.Add("address", "39 Rohit Road");
            cstCntDetailsDctnry.Add("postalCode", "E4F9499");

            CustomersPage cstPge = lanPage.GoToCustomersPage(driver, wait, 1500);
          //  Thread.Sleep(1000);
         //   cstPge.addASingleCustomer(driver, cstCntDetailsDctnry, wait);
        } // end of public void Test()

        [Test]
        public void Test_View_First_Customer_In_Listing_Of_Customer()
        {
            url = new Uri("http://localhost:2816/");

            IWait<IWebDriver> wait = new OpenQA.Selenium.Support.UI.WebDriverWait(driver, TimeSpan.FromSeconds(30.00));

            LandingPage lanPage = new LandingPage(driver, true, url, wait, 3000);
            CustomersPage cstPge = lanPage.GoToCustomersPage(driver, wait, 1000);

            cstPge.viewFirstCustomerInListingOfCustomers(driver, wait, 1000);
        
        } // end of public void Test_View_The()



    } // end of public class CustomersPageTests
} // end of namespace Jigsaw.UI.Tests.UIAutomatedTests
