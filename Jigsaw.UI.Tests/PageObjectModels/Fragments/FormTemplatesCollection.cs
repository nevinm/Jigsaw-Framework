using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using OpenQA.Selenium;
using OpenQA.Selenium.Support.UI;

namespace Jigsaw.UI.Tests.PageObjectModels.Fragments
{
    public class FormTemplatesCollectionSection
    {
        List<FormTemplateRow> allFrmTmpltsRows;

        public FormTemplatesCollectionSection(IWebDriver drvArg, IWait<IWebDriver> waitArg, int threadSleepTimeArg, By by)
        {
            
           Thread.Sleep(threadSleepTimeArg);
            // //*[@id="grid-container"]/div[1]/div[2]/table/tbody/tr[1]
            //<div class="k-grid-content"><table role="grid" tabindex="0" data-role="selectable" class="k-selectable" aria-activedescendant="aria_active_cell"><colgroup><col><col><col><col><col><col><col style="width:80px"></colgroup><tbody><tr data-uid="c5f4158b-9bb9-4bdb-8821-00be8eee382b" role="row" class="" aria-selected="false"><td role="gridcell">formName0</td><td role="gridcell"></td><td role="gridcell" id="aria_active_cell" class=""></td><td role="gridcell"></td><td role="gridcell">Mon Jan 01 1900 00:00:00 GMT-0500 (Eastern Standard Time)</td><td role="gridcell">Mon Jan 01 1900 00:00:00 GMT-0500 (Eastern Standard Time)</td><td role="gridcell"><a class="k-button k-button-icontext k-grid-edit" href="#"><span class="k-icon k-edit"></span>Edit</a></td></tr><tr class="k-alt" data-uid="6aba1477-de3e-4068-9ab4-6419f1be68e5" role="row"><td role="gridcell">formName1</td><td role="gridcell"></td><td role="gridcell"></td><td role="gridcell"></td><td role="gridcell">Mon Jan 01 1900 00:00:00 GMT-0500 (Eastern Standard Time)</td><td role="gridcell">Mon Jan 01 1900 00:00:00 GMT-0500 (Eastern Standard Time)</td><td role="gridcell"><a class="k-button k-button-icontext k-grid-edit" href="#"><span class="k-icon k-edit"></span>Edit</a></td></tr><tr data-uid="7b9b6a99-f269-44e4-b2a7-5cbeba3d78be" role="row"><td role="gridcell">formName2</td><td role="gridcell"></td><td role="gridcell"></td><td role="gridcell"></td><td role="gridcell">Mon Jan 01 1900 00:00:00 GMT-0500 (Eastern Standard Time)</td><td role="gridcell">Mon Jan 01 1900 00:00:00 GMT-0500 (Eastern Standard Time)</td><td role="gridcell"><a class="k-button k-button-icontext k-grid-edit" href="#"><span class="k-icon k-edit"></span>Edit</a></td></tr><tr class="k-alt" data-uid="8548d1a9-0a89-44ed-9b07-f0515723fc94" role="row"><td role="gridcell">formName3</td><td role="gridcell"></td><td role="gridcell"></td><td role="gridcell"></td><td role="gridcell">Mon Jan 01 1900 00:00:00 GMT-0500 (Eastern Standard Time)</td><td role="gridcell">Mon Jan 01 1900 00:00:00 GMT-0500 (Eastern Standard Time)</td><td role="gridcell"><a class="k-button k-button-icontext k-grid-edit" href="#"><span class="k-icon k-edit"></span>Edit</a></td></tr><tr data-uid="04f6d2b7-c1d2-412e-889f-f25dd8160ca3" role="row"><td role="gridcell">formName4</td><td role="gridcell"></td><td role="gridcell"></td><td role="gridcell"></td><td role="gridcell">Mon Jan 01 1900 00:00:00 GMT-0500 (Eastern Standard Time)</td><td role="gridcell">Mon Jan 01 1900 00:00:00 GMT-0500 (Eastern Standard Time)</td><td role="gridcell"><a class="k-button k-button-icontext k-grid-edit" href="#"><span class="k-icon k-edit"></span>Edit</a></td></tr><tr class="k-alt" data-uid="6e2c222e-53e0-426c-859c-364ca1d2146b" role="row"><td role="gridcell">formName5</td><td role="gridcell"></td><td role="gridcell"></td><td role="gridcell"></td><td role="gridcell">Mon Jan 01 1900 00:00:00 GMT-0500 (Eastern Standard Time)</td><td role="gridcell">Mon Jan 01 1900 00:00:00 GMT-0500 (Eastern Standard Time)</td><td role="gridcell"><a class="k-button k-button-icontext k-grid-edit" href="#"><span class="k-icon k-edit"></span>Edit</a></td></tr><tr data-uid="ac0e30ac-238b-44e3-aff8-160e62cda761" role="row"><td role="gridcell">formName6</td><td role="gridcell"></td><td role="gridcell"></td><td role="gridcell"></td><td role="gridcell">Mon Jan 01 1900 00:00:00 GMT-0500 (Eastern Standard Time)</td><td role="gridcell">Mon Jan 01 1900 00:00:00 GMT-0500 (Eastern Standard Time)</td><td role="gridcell"><a class="k-button k-button-icontext k-grid-edit" href="#"><span class="k-icon k-edit"></span>Edit</a></td></tr><tr class="k-alt" data-uid="d960903a-fa7e-45c1-b16d-8bf0c157b268" role="row"><td role="gridcell">formName7</td><td role="gridcell"></td><td role="gridcell"></td><td role="gridcell"></td><td role="gridcell">Mon Jan 01 1900 00:00:00 GMT-0500 (Eastern Standard Time)</td><td role="gridcell">Mon Jan 01 1900 00:00:00 GMT-0500 (Eastern Standard Time)</td><td role="gridcell"><a class="k-button k-button-icontext k-grid-edit" href="#"><span class="k-icon k-edit"></span>Edit</a></td></tr><tr data-uid="a7cc05b6-6afc-4b21-93c8-1b1701664d6e" role="row"><td role="gridcell">formName8</td><td role="gridcell"></td><td role="gridcell"></td><td role="gridcell"></td><td role="gridcell">Mon Jan 01 1900 00:00:00 GMT-0500 (Eastern Standard Time)</td><td role="gridcell">Mon Jan 01 1900 00:00:00 GMT-0500 (Eastern Standard Time)</td><td role="gridcell"><a class="k-button k-button-icontext k-grid-edit" href="#"><span class="k-icon k-edit"></span>Edit</a></td></tr><tr class="k-alt k-state-selected" data-uid="1f1e3890-d49c-4338-816e-903825e57ae3" role="row" aria-selected="true"><td role="gridcell">formName9</td><td role="gridcell"></td><td role="gridcell"></td><td role="gridcell"></td><td role="gridcell">Mon Jan 01 1900 00:00:00 GMT-0500 (Eastern Standard Time)</td><td role="gridcell">Mon Jan 01 1900 00:00:00 GMT-0500 (Eastern Standard Time)</td><td role="gridcell"><a class="k-button k-button-icontext k-grid-edit" href="#"><span class="k-icon k-edit"></span>Edit</a></td></tr></tbody></table></div>
            //*[@id="grid-container"]/descendant::div[@class='k-grid-content']/table/tbody/tr

        } // end of public 


        public IList<IWebElement> getAllFormTemplateRows(IWait<IWebDriver> waitArg, By by)
        {
            waitArg.Until(ExpectedConditions.ElementIsClickable( by));
            //  var btn = drvArg.FindElement(by);

            IWebElement webElementBody = waitArg.Until<IWebElement>((d) =>
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

            String testGarbage;
            IList<IWebElement> ElementCollectionBody = webElementBody.FindElements(by);
            IList<IWebElement> cells;
            IWebElement editLink = null;
            foreach (IWebElement item in ElementCollectionBody)
            {
                // string[] arr = new string[4];
                cells = item.FindElements(By.XPath(".//*[local-name(.)='th' or local-name(.)='td']"));
                foreach (IWebElement aSingleCell in cells)
                {
                    //editLink = aSingleCell.FindElement(By.XPath("//a[@class='k-button k-button-icontext k-grid-edit' and contains(lower-case(text()), 'edit')]"));
                    //editLink = aSingleCell.FindElement(By.XPath("//a[@class='k-button k-button-icontext k-grid-edit' and contains(text(), 'Edit')]"));
                    editLink = aSingleCell.FindElement(By.XPath("//a[contains(translate(text(), "
                                                                           + " 'ABCDEFGHJIKLMNOPQRSTUVWXYZ',"
                                                                                 + "'abcdefghjiklmnopqrstuvwxyz')"
                                                                                       + ", 'edit')]"));
                        //class="k-button k-button-icontext k-grid-edit"
                } // end of foreach (IWebElement aSingleCell in cells)
            }
            editLink.Click();
            return null;
        }

        /// <summary>
        /// An expectation for checking whether an element is visible.
        /// </summary>
        /// <param name="locator">The locator used to find the element.</param>
        /// <returns>The <see cref="IWebElement"/> once it is located, visible and clickable.</returns>
        public static bool isClickable(IWebDriver drvArg, By locator)
        {
            //return driver =>
            //{
            //    var element = driver.FindElement(locator);
            //    return (element != null && element.Displayed && element.Enabled) ? element : null;
            //};
            var element = drvArg.FindElement(locator);
            if (element != null && element.Displayed && element.Enabled)
            {

                return true;
            }
            return false;
        }

    } // end of public class FormTemplatesCollection
} // end of namespace Jigsaw.UI.Tests.PageObjectModels.Fragments
