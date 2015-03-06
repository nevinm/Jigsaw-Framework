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
using OpenQA.Selenium.Support.UI;
using OpenQA.Selenium.Interactions;
using OpenQA.Selenium.Interactions.Internal;
using System.Threading;
using System.IO;
using NUnit.Framework;

namespace Jigsaw.UI.Tests.PageObjectModels
{
    public class SignInPage : JsUIPage
    {
        public SignInPage() : base()
        {

        } // end of public SignInPage()

        public SignInPage(IWebDriver drvArg)
            : base(drvArg)
        {

        } // end of public 


        public SignInPage(IWebDriver drvArg, IWait<IWebDriver> waitArg)
            : base(drvArg, waitArg)
        {

        } // end of public 


        public JsUIPage enterLoginCredentials(IWebDriver drvArg, IWait<IWebDriver> waitArg, String loginName, String password)
        {
            // UserName

            //  By.XPath("//div[@class='modal-body']/descendant::input[@id='UserName']")

            waitArg.Until(ExpectedConditions.DoesElementExist( By.XPath("//div[@class='modal-body']/descendant::input[@id='UserName']")));
            waitArg.Until(ExpectedConditions.ElementIsClickable( By.XPath("//div[@class='modal-body']/descendant::input[@id='UserName']")));




          //  IWebElement lgNmInputTextBox = waitArg.Until(ExpectedConditions.ElementIsClickable(By.XPath("//div[@class='modal-body']/descendant::input[@id='UserName']")));
            IWebElement lgNmInputTextBox = waitArg.Until<IWebElement>((d) =>
            {
                try
                {
                    return d.FindElement(By.XPath("//div[@class='modal-body']/descendant::input[@id='UserName']"));
                }
                catch
                {
                    return null;
                }
            });


            lgNmInputTextBox.Click();
            lgNmInputTextBox.SendKeys(loginName);

           // Thread.Sleep(1000);
            //div[@class='modal-body']/descendant::input[@id='Password']
            waitArg.Until(ExpectedConditions.DoesElementExist( By.XPath("//div[@class='modal-body']/descendant::input[@id='Password']")));
            waitArg.Until(ExpectedConditions.ElementIsClickable( By.XPath("//div[@class='modal-body']/descendant::input[@id='Password']")));

            //IWebElement psWdInputTextBox = drvArg.FindElement(By.XPath("//input[@id='Password']"));
          //  IWebElement psWdInputTextBox = waitArg.Until(ExpectedConditions.ElementIsClickable(By.XPath("//div[@class='modal-body']/descendant::input[@id='Password']")));
            IWebElement psWdInputTextBox = waitArg.Until<IWebElement>((d) =>
            {
                try
                {
                    return d.FindElement(By.XPath("//div[@class='modal-body']/descendant::input[@id='Password']"));
                }
                catch
                {
                    return null;
                }
            });


            psWdInputTextBox.Click();
            psWdInputTextBox.SendKeys(password);
           // Thread.Sleep(750);
          //  Sign in
          // <button class="btn btn-primary" data-bind="enable: !processingForm()" type="submit"> Sign in </button>
        //    IWebElement signInSubtBtn = waitArg.Until(ExpectedConditions.ElementIsClickable(By.XPath("//button[@type='submit' and contains(@class,'btn btn-primary')]")));
            IWebElement signInSubtBtn = waitArg.Until<IWebElement>((d) =>
            {
                try
                {
                    return d.FindElement(By.XPath("//button[@type='submit' and contains(@class,'btn btn-primary')]"));
                }
                catch
                {
                    return null;
                }
            });


            signInSubtBtn.Click();

           // Thread.Sleep(9000);
           // Assert.IsTrue(drvArg.IsTextPresent("Selenium IDE"));
            return null;
        } // end of 

    } // end of public class SignInPage : JsUIPage
} // end of namespace Jigsaw.UI.Tests.PageObjectModels
