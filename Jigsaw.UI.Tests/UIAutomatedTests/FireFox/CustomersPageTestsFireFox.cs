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

namespace Jigsaw.UI.Tests.UIAutomatedTests.FireFox
{
    [TestFixture]
    public class CustomersPageTestsFireFox
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
            driver.Dispose();
            driver.Quit();
           // SingletonWebDriver.QuitDriver();
            //SingletonWebDriver.QuitDriver();
        } // end of public void TearDown()

        [SetUp]
        public void SetUp()
        {
           driver = new FirefoxDriver();
            //SingletonWebDriver.instantiateWebDriver(typeof(FirefoxDriver));
        } // end of public void SetUp()

        [Test]
        public void Test_Add_A_Single_Customer_Using_FireFox()
        {

            url = new Uri("http://localhost:2816/");
            IWait<IWebDriver> wait = new OpenQA.Selenium.Support.UI.WebDriverWait(driver, TimeSpan.FromSeconds(150.00));

            LandingPage lanPage = new LandingPage(driver, true, url, wait, 1);
     
            Dictionary<String, String> cstCntDetailsDctnry = new Dictionary<string, string>();
            cstCntDetailsDctnry.Add("contactName", "Mr. John Doe");
            cstCntDetailsDctnry.Add("contactTitle", "Hospital Administrator");
            cstCntDetailsDctnry.Add("companyName", "Apollo Hospitals");
            cstCntDetailsDctnry.Add("phone", "4938383");
            cstCntDetailsDctnry.Add("fax", "8534678");
            cstCntDetailsDctnry.Add("city", "Hyderabad");
            cstCntDetailsDctnry.Add("address", "39 Rohit Road");
            cstCntDetailsDctnry.Add("postalCode", "E4F9499");

            CustomersPage cstPge = lanPage.GoToCustomersPage(driver, wait, 1);
            cstPge.addASingleCustomer(driver, cstCntDetailsDctnry, wait);
        } // end of public void Test_Add_A_Single_Customer_Using_FireFox()


        [Test]
        public void Test_View_First_Customer_In_Listing_Of_Customer_Using_FireFox()
        {
            url = new Uri("http://localhost:2816/");
            IWait<IWebDriver> wait = new OpenQA.Selenium.Support.UI.WebDriverWait(driver, TimeSpan.FromSeconds(150.00));
            LandingPage lanPage = new LandingPage(driver, true, url, wait, 1);
            CustomersPage cstPge = lanPage.GoToCustomersPage(driver, wait, 1);

            cstPge.viewFirstCustomerInListingOfCustomers(driver, wait, 1);

        } // end of public void Test_View_The()



    } // end of public class CustomersPageTestsFireFox
} // end of namespace Jigsaw.UI.Tests.UIAutomatedTests
