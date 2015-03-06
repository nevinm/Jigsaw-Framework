using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using OpenQA.Selenium.Remote;
using OpenQA.Selenium;

using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Support.UI;
using OpenQA.Selenium.Interactions;
using OpenQA.Selenium.Interactions.Internal;
using System.Threading;
using System.IO;

namespace Jigsaw.UI.Tests.PageObjectModels
{
    public class CustomersPage : JsUIPage
    {
        public CustomersPage() : base()
        {

        } // end of public CustomersPage() : base()

        public CustomersPage(IWebDriver drvArg, IWait<IWebDriver> waitArg)
            : base(drvArg)
        {
           // waitArg = new OpenQA.Selenium.Support.UI.WebDriverWait(drvArg, TimeSpan.FromSeconds(30.00));
            waitArg.Until(driver1 => ((IJavaScriptExecutor)drvArg).ExecuteScript("return       document.readyState").Equals("complete"));

        } // end of public CustomersPage(IWebDriver drvArg)






        public JsUIPage addASingleCustomer(IWebDriver drvArg, Dictionary<String, String> cstCntDetailsDctnryArg, IWait<IWebDriver> waitArg)
        {
            // UserName

        //    Thread.Sleep(7000);
//           wait.Until(ExpectedConditions.DoesElementNotExist( By.XPath("//div[@class='jarviswidget jarviswidget-sortable']/descendant::a[@class='btn btn-primary btn-xs']"))));
      //      wait.Until(ExpectedConditions.ElementIsClickable( By.XPath("//div[@class='jarviswidget jarviswidget-sortable']/descendant::a[@class='btn btn-primary btn-xs']")));
     //       IWebElement addCustomerLink = drvArg.FindElement(By.XPath("//div[@class='jarviswidget jarviswidget-sortable']/descendant::a[@class='btn btn-primary btn-xs']"));
            //var wait = new WebDriverWait(driver, TimeSpan.FromMinutes(1));
    //        var waitTwo = new WebDriverWait(drvArg, TimeSpan.FromMinutes(1));
    //        var addCustomerLinkTwo = waitTwo.Until(ExpectedConditions.ExpectedConditions.ElementIsClickable(By.XPath("//div[@class='jarviswidget jarviswidget-sortable']/descendant::a[@class='btn btn-primary btn-xs']")));


         //   wait.Until(ExpectedConditions.DoesElementNotExist( By.XPath("//header[@role='heading']"))));


          //  wait.Until(ExpectedConditions.DoesElementNotExist( By.XPath("//header[@role='heading']/descendant::h2"))));

        //    wait.Until(ExpectedConditions.DoesElementNotExist( By.XPath("//header[@role='heading']/descendant::h2/strong[text()='Customers']/../a[contains(@data-bind,'addNew')]"))));



            // wait.Until(ExpectedConditions.DoesElementNotExist( By.XPath("//header[@role='heading']/descendant::h2/strong[text()='Customers']/../a[@data-bind=\"click: addNew, keyTips : { key : \'GN\'}\""))));
            waitArg.Until(ExpectedConditions.DoesElementExist( By.XPath("//header[@role='heading']/descendant::h2/strong[text()='Customers']/../a[contains(@data-bind,'addNew')]")));
            waitArg.Until(ExpectedConditions.ElementIsClickable(By.XPath("//header[@role='heading']/descendant::h2/strong[text()='Customers']/../a[contains(@data-bind,'addNew')]")));

          //  IWebElement plusSgnlnk = waitArg.Until(ExpectedConditions.ElementIsClickable(By.XPath("//header[@role='heading']/descendant::h2/strong[text()='Customers']/../a[contains(@data-bind,'addNew')]")));
              IWebElement plusSgnlnk = waitArg.Until<IWebElement>( (d) =>
            {
                try
                {
                    return d.FindElement(By.XPath("//header[@role='heading']/descendant::h2/strong[text()='Customers']/../a[contains(@data-bind,'addNew')]"));
                }
                catch
                {
                    return null;
                }
            });
            plusSgnlnk.Click();
            plusSgnlnk.Click();

            //<a data-bind="tooltip: {title: 'Save',  placement: 'bottom'}, qclick: save, visible: !isReadOnly(), keyTips: { key : 'VS' }" href="javascript:void(0);" class="button-icon"><i class="fa fa-save"></i></a>


            waitArg.Until(ExpectedConditions.DoesElementExist( By.XPath("//input[contains(@data-bind, 'ContactName')]")));
            waitArg.Until(ExpectedConditions.ElementIsClickable(By.XPath("//input[contains(@data-bind, 'ContactName')]")));

            //IWebElement cntNmeInputTextBox = waitArg.Until(ExpectedConditions.ElementIsClickable(By.XPath("//input[contains(@data-bind, 'ContactName')]")));
            IWebElement cntNmeInputTextBox = waitArg.Until<IWebElement>((d) =>
            {
                try
                {
                    return d.FindElement(By.XPath("//input[contains(@data-bind, 'ContactName')]"));
                }
                catch
                {
                    return null;
                }
            });


            //            cstCntDetailsDctnry.Add("contactName", "Mr. John Doe");
            //cstCntDetailsDctnry.Add("contactTitle", "Hospital Administrator");
            //cstCntDetailsDctnry.Add("companyName", "Apollo Hospitals");
            //cstCntDetailsDctnry.Add("phone", "4938383");
            //cstCntDetailsDctnry.Add("fax", "8534678");
            //cstCntDetailsDctnry.Add("city", "Hyderabad");
            //cstCntDetailsDctnry.Add("Address", "39 Rohit Road");
            //cstCntDetailsDctnry.Add("postalCode", "E4F9499");


             cntNmeInputTextBox.SendKeys(cstCntDetailsDctnryArg["contactName"]);
             Thread.Sleep(3000);

             waitArg.Until(ExpectedConditions.DoesElementExist( By.XPath("//input[contains(@data-bind, 'ContactTitle')]")));
             waitArg.Until(ExpectedConditions.ElementIsClickable(By.XPath("//input[contains(@data-bind, 'ContactTitle')]")));

            // IWebElement cntTtlInputTextBox = waitArg.Until(ExpectedConditions.ElementIsClickable(By.XPath("//input[contains(@data-bind, 'ContactTitle')]")));
             IWebElement cntTtlInputTextBox =  waitArg.Until<IWebElement>((d) =>
            {
                try
                {
                    return d.FindElement(By.XPath("//input[contains(@data-bind, 'ContactTitle')]"));
                }
                catch
                {
                    return null;
                }
            });
             cntTtlInputTextBox.SendKeys(cstCntDetailsDctnryArg["contactTitle"]);
             Thread.Sleep(3000);


             waitArg.Until(ExpectedConditions.DoesElementExist( By.XPath("//input[contains(@data-bind, 'CompanyName')]")));
             waitArg.Until(ExpectedConditions.ElementIsClickable(By.XPath("//input[contains(@data-bind, 'CompanyName')]")));

             //IWebElement cmpyNmeInputTextBox = waitArg.Until(ExpectedConditions.ElementIsClickable(By.XPath("//input[contains(@data-bind, 'CompanyName')]")));
             IWebElement cmpyNmeInputTextBox = waitArg.Until<IWebElement>((d) =>
            {
                try
                {
                    return d.FindElement(By.XPath("//input[contains(@data-bind, 'CompanyName')]"));
                }
                catch
                {
                    return null;
                }
            });
             cmpyNmeInputTextBox.SendKeys(cstCntDetailsDctnryArg["companyName"]);
             Thread.Sleep(3000);

             waitArg.Until(ExpectedConditions.DoesElementExist(By.XPath("//input[contains(@data-bind, 'Phone')]")));
             waitArg.Until(ExpectedConditions.ElementIsClickable(By.XPath("//input[contains(@data-bind, 'Phone')]")));
          //   IWebElement phnInputTextBox = waitArg.Until(ExpectedConditions.ElementIsClickable(By.XPath("//input[contains(@data-bind, 'Phone')]")));
             IWebElement phnInputTextBox = waitArg.Until<IWebElement>((d) =>
            {
                try
                {
                    return d.FindElement(By.XPath("//input[contains(@data-bind, 'Phone')]"));
                }
                catch
                {
                    return null;
                }
            });


            phnInputTextBox.SendKeys(cstCntDetailsDctnryArg["phone"]);
             Thread.Sleep(3000);

             waitArg.Until(ExpectedConditions.DoesElementExist(By.XPath("//input[contains(@data-bind, 'Fax')]")));
             waitArg.Until(ExpectedConditions.ElementIsClickable(By.XPath("//input[contains(@data-bind, 'Fax')]")));
           //  IWebElement fxInputTextBox = waitArg.Until(ExpectedConditions.ElementIsClickable(By.XPath("//input[contains(@data-bind, 'Fax')]")));
              IWebElement fxInputTextBox =  waitArg.Until<IWebElement>((d) =>
            {
                try
                {
                    return d.FindElement(By.XPath("//input[contains(@data-bind, 'Fax')]"));
                }
                catch
                {
                    return null;
                }
            });
             fxInputTextBox.SendKeys(cstCntDetailsDctnryArg["fax"]);
             Thread.Sleep(3000);


             waitArg.Until(ExpectedConditions.DoesElementExist(By.XPath("//input[contains(@data-bind, 'City')]")));
             waitArg.Until(ExpectedConditions.ElementIsClickable(By.XPath("//input[contains(@data-bind, 'City')]")));
           //  IWebElement ctyInputTextBox = waitArg.Until(ExpectedConditions.ElementIsClickable(By.XPath("//input[contains(@data-bind, 'City')]")));
              IWebElement ctyInputTextBox =  waitArg.Until<IWebElement>((d) =>
            {
                try
                {
                    return d.FindElement(By.XPath("//input[contains(@data-bind, 'City')]"));
                }
                catch
                {
                    return null;
                }
            });
             ctyInputTextBox.SendKeys(cstCntDetailsDctnryArg["city"]);
             Thread.Sleep(3000);

             waitArg.Until(ExpectedConditions.DoesElementExist(By.XPath("//input[contains(@data-bind, 'Address')]")));
             waitArg.Until(ExpectedConditions.ElementIsClickable(By.XPath("//input[contains(@data-bind, 'Address')]")));
           //  IWebElement adrsInputTextBox = waitArg.Until(ExpectedConditions.ElementIsClickable(By.XPath("//input[contains(@data-bind, 'Address')]")));
             IWebElement adrsInputTextBox =  waitArg.Until<IWebElement>((d) =>
            {
                try
                {
                    return d.FindElement(By.XPath("//input[contains(@data-bind, 'Address')]"));
                }
                catch
                {
                    return null;
                }
            });
             adrsInputTextBox.SendKeys(cstCntDetailsDctnryArg["address"]);
             Thread.Sleep(3000);

             waitArg.Until(ExpectedConditions.DoesElementExist(By.XPath("//input[contains(@data-bind, 'PostalCode')]")));
             waitArg.Until(ExpectedConditions.ElementIsClickable(By.XPath("//input[contains(@data-bind, 'PostalCode')]")));
          //   IWebElement pstalCdeInputTextBox = waitArg.Until(ExpectedConditions.ElementIsClickable(By.XPath("//input[contains(@data-bind, 'PostalCode')]")));
            IWebElement pstalCdeInputTextBox =  waitArg.Until<IWebElement>((d) =>
            {
                try
                {
                    return d.FindElement(By.XPath("//input[contains(@data-bind, 'PostalCode')]"));
                }
                catch
                {
                    return null;
                }
            });
             pstalCdeInputTextBox.SendKeys(cstCntDetailsDctnryArg["postalCode"]);
             Thread.Sleep(3000);

            // <a data-bind="tooltip: {title: 'Save',  placement: 'bottom'}, qclick: save, visible: !isReadOnly(), keyTips: { key : 'VS' }" href="javascript:void(0);" class="button-icon"><i class="fa fa-save"></i></a>
             waitArg.Until(ExpectedConditions.DoesElementExist(By.XPath("//header[@role='heading']/descendant::div[contains(@class,'jarviswidget-ctrls')]/descendant::a[contains(@data-bind,\"tooltip: {title: 'Save',  placement: 'bottom'}, qclick: save, visible: !isReadOnly(), keyTips: { key : 'VS' }\")]")));
             waitArg.Until(ExpectedConditions.ElementIsClickable(By.XPath("//header[@role='heading']/descendant::div[contains(@class,'jarviswidget-ctrls')]/descendant::a[contains(@data-bind,\"tooltip: {title: 'Save',  placement: 'bottom'}, qclick: save, visible: !isReadOnly(), keyTips: { key : 'VS' }\")]")));

          //  IWebElement savBtnlnk = wait.Until(ExpectedConditions.ExpectedConditions.ElementIsClickable(By.XPath("//header[@role='heading']/descendant::div[contains(@class,'jarviswidget-ctrls')]/descendant::a[ contains(@class,'button-icon') and contains(@data-bind,'tooltip: {title: \'Save\',  placement: \'bottom\'}, qclick: save, visible: !isReadOnly(), keyTips: { key : \'VS\' }')]")));
             //IWebElement savBtnlnk = waitArg.Until(ExpectedConditions.ElementIsClickable(By.XPath("//header[@role='heading']/descendant::div[contains(@class,'jarviswidget-ctrls')]/descendant::a[contains(@data-bind,\"tooltip: {title: 'Save',  placement: 'bottom'}, qclick: save, visible: !isReadOnly(), keyTips: { key : 'VS' }\")]")));
            IWebElement savBtnlnk =  waitArg.Until<IWebElement>((d) =>
            {
                try
                {
                    return d.FindElement(By.XPath("//header[@role='heading']/descendant::div[contains(@class,'jarviswidget-ctrls')]/descendant::a[contains(@data-bind,\"tooltip: {title: 'Save',  placement: 'bottom'}, qclick: save, visible: !isReadOnly(), keyTips: { key : 'VS' }\")]"));
                }
                catch
                {
                    return null;
                }
            });
            savBtnlnk.Click();

            return null;
        } // end of 


        public void viewFirstCustomerInListingOfCustomers(IWebDriver drvArg, IWait<IWebDriver> waitArg, int threadSleepTimeArg)
        {
            String find1stLnkXpath   = "//div[@class='jarviswidget jarviswidget-sortable']/descendant::div[@role='content']/descendant::div[@id='grid-container']/descendant::table[@class='k-selectable' and @role='grid']/tbody/tr[1]/td/descendant::a[@class='k-button k-button-icontext k-grid-view']";
            Thread.Sleep(threadSleepTimeArg);
            waitArg.Until(ExpectedConditions.DoesElementExist(By.XPath(find1stLnkXpath)));
            waitArg.Until(ExpectedConditions.ElementIsClickable(By.XPath(find1stLnkXpath)));



            waitArg.Until(ExpectedConditions.DoesElementExist(By.XPath(find1stLnkXpath)));


            // k-button k-button-icontext k-grid-view
            // class="k-selectable" role="grid"
          //  IWebElement viewCustDetlnk = waitArg.Until(ExpectedConditions.ElementIsClickable(By.XPath(find1stLnkXpath)));
              IWebElement viewCustDetlnk = waitArg.Until<IWebElement>((d) =>
            {
                try
                {
                    return d.FindElement(By.XPath(find1stLnkXpath));
                }
                catch
                {
                    return null;
                }
            });
            viewCustDetlnk.Click();
           

//            <div class="all-space overflow-hidden" data-bind="measurePrev: 'top', kendoResize: {}" style="top: 126px;">
//<div class="messageQueue" data-bind="messageQueue: messageQueue"></div>
//<section id="active-content" class="">
//<div class="customer-active-record" data-bind="resizeWhen: queryFilter.parameters,with: queryFilter.parameters().length && queryFilter.parameters()[0]">
//<img class="float-left square40" src="images/users.png">
//<div class="message-item active-record" data-bind="var: { collapsed: ko.observable(true) }">
//<div class="header">
//<div data-bind="visible: collapsed()" style="display: none;">
//More info about
//<span data-bind="text: ContactName">Mr. John Doe</span>
//<a data-bind="click: function() {collapsed(false)}">here</a>

            String hereLnkXpath = "//div[@id='jigsaw-root']/descendant::section[@id='active-content']/descendant::a[text()='here']";

            waitArg.Until(ExpectedConditions.DoesElementExist(By.XPath(hereLnkXpath)));
            waitArg.Until(ExpectedConditions.ElementIsClickable(By.XPath(hereLnkXpath)));



            waitArg.Until(ExpectedConditions.DoesElementExist(By.XPath(hereLnkXpath)));


            // k-button k-button-icontext k-grid-view
            // class="k-selectable" role="grid"
           // IWebElement herelnk = waitArg.Until(ExpectedConditions.ElementIsClickable(By.XPath(hereLnkXpath)));
            IWebElement herelnk = waitArg.Until<IWebElement>((d) =>
            {
                try
                {
                    return d.FindElement(By.XPath(hereLnkXpath));
                }
                catch
                {
                    return null;
                }
            });
            herelnk.Click();

        } // end of public void viewFirstCustomerInListingOfCustomers()

        //<a data-bind="click: addNew, keyTips : { key : 'GN'}" class="btn btn-primary btn-xs"><i class="fa fa-plus"></i></a>
        public JsUIPage addASingleCustomerOld(IWebDriver drvArg, String loginName, String password, IWait<IWebDriver> waitArg)
        {
            // UserName



            Thread.Sleep(6000);

            waitArg.Until(ExpectedConditions.DoesElementExist(By.XPath("//div[@class='jarviswidget jarviswidget-sortable']/descendant::a[@class='btn btn-primary btn-xs']")));
           // wait.Until(ExpectedConditions.DoesElementNotExist( By.XPath("//header[@role='heading']/descendant::h2/strong[text()='Customers']/../a[contains(@data-bind,'click')]"))));
             waitArg.Until(ExpectedConditions.ElementIsClickable( By.XPath("//div[@class='jarviswidget jarviswidget-sortable']/descendant::a[@class='btn btn-primary btn-xs']")));
            var waitTwo = new WebDriverWait(drvArg, TimeSpan.FromMinutes(1));
            var plusSgnlnk = waitTwo.Until(ExpectedConditions.ElementIsClickable(By.XPath("//div[@class='jarviswidget jarviswidget-sortable']/descendant::a[@class='btn btn-primary btn-xs']")));
          //  plusSgnlnk.Click();
            waitArg.Until(ExpectedConditions.DoesElementExist(By.XPath("//header[@role='heading']")));


            waitArg.Until(ExpectedConditions.DoesElementExist(By.XPath("//header[@role='heading']/descendant::h2")));

            waitArg.Until(ExpectedConditions.DoesElementExist(By.XPath("//header[@role='heading']/descendant::h2/strong[text()='Customers']")));

            //  wait.Until(ExpectedConditions.DoesElementNotExist( By.XPath("//a[@data-bind=\"click: addNew, keyTips : { key : \'GN\'}\""))));

            waitArg.Until(ExpectedConditions.DoesElementExist(By.XPath("//a[contains(@data-bind,'addNew')]")));
            waitArg.Until(ExpectedConditions.ElementIsClickable( By.XPath("//a[contains(@data-bind,'addNew')]")));


            // wait.Until(ExpectedConditions.DoesElementNotExist( By.XPath("//header[@role='heading']/descendant::h2/strong[text()='Customers']/../a[@data-bind=\"click: addNew, keyTips : { key : \'GN\'}\""))));
            waitArg.Until(ExpectedConditions.DoesElementExist(By.XPath("//header[@role='heading']/descendant::h2/strong[text()='Customers']/../a[contains(@data-bind,'click')]")));
            waitArg.Until(ExpectedConditions.ElementIsClickable( By.XPath("//header[@role='heading']/descendant::h2/strong[text()='Customers']/../a[contains(@data-bind,'click')]")));

            
           IWebElement plusSgnlnkTwo =  waitArg.Until<IWebElement>(
                 (d) => {
                try
                {
                    return d.FindElement(By.XPath("//a[contains(@data-bind,'addNew')]"));
                }
                catch
                {
                    return null;
                }
            });
            
            plusSgnlnkTwo.Click();
            plusSgnlnkTwo.Click();
            plusSgnlnkTwo.Click();
            return null;
        } // end of 


        //<a data-bind="click: addNew, keyTips : { key : 'GN'}" class="btn btn-primary btn-xs"><i class="fa fa-plus"></i></a>
        //public JsUIPage addASingleCustomerOld(IWebDriver drvArg, String loginName, String password)
        //{
        //    // UserName

        //    Thread.Sleep(6000);
        //    wait.Until(ExpectedConditions.DoesElementNotExist( By.XPath("//div[@class='jarviswidget jarviswidget-sortable']/descendant::a[@class='btn btn-primary btn-xs']"))));
        //    wait.Until(ExpectedConditions.ElementIsClickable( By.XPath("//div[@class='jarviswidget jarviswidget-sortable']/descendant::a[@class='btn btn-primary btn-xs']")));
        //    IWebElement addCustomerLink = drvArg.FindElement(By.XPath("//div[@class='jarviswidget jarviswidget-sortable']/descendant::a[@class='btn btn-primary btn-xs']"));
        //    //var wait = new WebDriverWait(driver, TimeSpan.FromMinutes(1));
        //    var waitTwo = new WebDriverWait(drvArg, TimeSpan.FromMinutes(1));
        //    var addCustomerLinkTwo = waitTwo.Until(ExpectedConditions.ExpectedConditions.ElementIsClickable(By.XPath("//div[@class='jarviswidget jarviswidget-sortable']/descendant::a[@class='btn btn-primary btn-xs']")));
        //    addCustomerLinkTwo.Click();




        //    wait.Until(ExpectedConditions.DoesElementNotExist( By.XPath("//header[@role='heading']"))));


        //    wait.Until(ExpectedConditions.DoesElementNotExist( By.XPath("//header[@role='heading']/descendant::h2"))));

        //    wait.Until(ExpectedConditions.DoesElementNotExist( By.XPath("//header[@role='heading']/descendant::h2/strong[text()='Customers']"))));

        //  //  wait.Until(ExpectedConditions.DoesElementNotExist( By.XPath("//a[@data-bind=\"click: addNew, keyTips : { key : \'GN\'}\""))));

        //    wait.Until(ExpectedConditions.DoesElementNotExist( By.XPath("//a[contains(@data-bind,'addNew')]"))));
        //    wait.Until(ExpectedConditions.ElementIsClickable( By.XPath("//a[contains(@data-bind,'addNew')]")));   


        //   // wait.Until(ExpectedConditions.DoesElementNotExist( By.XPath("//header[@role='heading']/descendant::h2/strong[text()='Customers']/../a[@data-bind=\"click: addNew, keyTips : { key : \'GN\'}\""))));
        //    wait.Until(ExpectedConditions.DoesElementNotExist( By.XPath("//header[@role='heading']/descendant::h2/strong[text()='Customers']/../a[contains(@data-bind,'click')]"))));
        //    wait.Until(ExpectedConditions.ElementIsClickable( By.XPath("//header[@role='heading']/descendant::h2/strong[text()='Customers']/../a[contains(@data-bind,'click')]")));

        //    IWebElement plusSgnlnk =  wait.Until(ExpectedConditions.ExpectedConditions.ElementIsClickable(By.XPath("//a[contains(@data-bind,'addNew')]")));
        //    plusSgnlnk.Click();

        //    return null;
        //} // end of 


    } // end of public class CustomersPage : JsUIPage
} // end of namespace Jigsaw.UI.Tests.PageObjectModels
