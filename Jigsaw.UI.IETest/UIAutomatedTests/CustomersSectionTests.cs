using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using System.Windows.Input;
using System.Windows.Forms;
using System.Drawing;
using Microsoft.VisualStudio.TestTools.UITesting;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Microsoft.VisualStudio.TestTools.UITest.Extension;
using Keyboard = Microsoft.VisualStudio.TestTools.UITesting.Keyboard;


namespace Jigsaw.UI.IETest.UIAutomatedTests
{
    /// <summary>
    /// Summary description for CustomersPageTests
    /// </summary>
    [CodedUITest]
    public class CustomersSectionTests
    {

        public Uri url;
        public CustomersSectionTests()
        {
        }

        [TestMethod]
        public void Test_Add_A_Single_Customer_With_Internet_Explorer()
        {
            // To generate code for this test, select "Generate Code for Coded UI Test" from the shortcut menu and select one of the menu items.
            // For more information on generated code, see http://go.microsoft.com/fwlink/?LinkId=179463
            url = new Uri("http://localhost:2816/");
            BrowserWindow brwsWin = BrowserWindow.Launch(url);
            brwsWin.Maximized = true;
            JsUIPage jsUIpge = new JsUIPage();
            Dictionary<String, String> cstCntDetailsDctnry = new Dictionary<string, string>();
            cstCntDetailsDctnry.Add("contactName", "Mr. John Doe");
            cstCntDetailsDctnry.Add("contactTitle", "Hospital Administrator");
            cstCntDetailsDctnry.Add("companyName", "Apollo Hospitals");
            cstCntDetailsDctnry.Add("phone", "4938383");
            cstCntDetailsDctnry.Add("fax", "8534678");
            cstCntDetailsDctnry.Add("city", "Hyderabad");
            cstCntDetailsDctnry.Add("address", "39 Rohit Road");
            cstCntDetailsDctnry.Add("postalCode", "E4F9499");

            // (Reference: http://www.dotnetcurry.com/showarticle.aspx?ID=1055 )
            // The instance creation requires an argument where we can 
            //provide the container for locating the control.
            //In this case, the parent of the control to be located
            // is the browser itself.
            jsUIpge.CustLink = new UITestControl(brwsWin);
            jsUIpge.CustLink.TechnologyName = "Web";
            jsUIpge.CustLink.SearchProperties.Add("Id", "Image62");

          //  brwsWin.
            //BrowserWindow.
        }

        #region Additional test attributes

        // You can use the following additional attributes as you write your tests:

        ////Use TestInitialize to run code before running each test 
        //[TestInitialize()]
        //public void MyTestInitialize()
        //{        
        //    // To generate code for this test, select "Generate Code for Coded UI Test" from the shortcut menu and select one of the menu items.
        //    // For more information on generated code, see http://go.microsoft.com/fwlink/?LinkId=179463
        //}

        ////Use TestCleanup to run code after each test has run
        //[TestCleanup()]
        //public void MyTestCleanup()
        //{        
        //    // To generate code for this test, select "Generate Code for Coded UI Test" from the shortcut menu and select one of the menu items.
        //    // For more information on generated code, see http://go.microsoft.com/fwlink/?LinkId=179463
        //}

        #endregion

        /// <summary>
        ///Gets or sets the test context which provides
        ///information about and functionality for the current test run.
        ///</summary>
        public TestContext TestContext
        {
            get
            {
                return testContextInstance;
            }
            set
            {
                testContextInstance = value;
            }
        }
        private TestContext testContextInstance;
    }
}
