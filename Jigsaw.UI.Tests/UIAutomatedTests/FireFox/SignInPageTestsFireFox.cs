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
    public class SignInPageTestsFireFox
    {
        
        public IWebDriver driver;
        public Uri url;

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
        public void Test_SignIn_With_Wrong_Credentials_using_FireFox()
        {

            url = new Uri("http://localhost:2816/");

            IWait<IWebDriver> wait = new OpenQA.Selenium.Support.UI.WebDriverWait(driver, TimeSpan.FromSeconds(150.00));
            LandingPage lanPage = new LandingPage(driver, true, url, wait, 1);

            SignInPage snPge = lanPage.GoToSignInPage(driver, wait, 1);
     
            snPge.enterLoginCredentials(driver, wait, "johnDoe@nowhere.com", "nothing");

        } // end of public void Test_SignIn_With_Wrong_Credentials_using_FireFox()


    } // end of public class SignInPageTestsFireFox
} // end of namespace Jigsaw.UI.Tests.UIAutomatedTests
