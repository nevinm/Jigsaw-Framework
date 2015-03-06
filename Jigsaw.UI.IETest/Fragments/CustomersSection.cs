using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using System.Windows.Input;
using System.Windows.Forms;
using System.Drawing;
using Microsoft.VisualStudio.TestTools.UITesting;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Microsoft.VisualStudio.TestTools.UITest.Extension;
using Keyboard = Microsoft.VisualStudio.TestTools.UITesting.Keyboard;


namespace Jigsaw.UI.IETest.Fragments
{
    public class CustomersSection
    {
        private HtmlElement _plusSgnlnk;

        public HtmlElement plusSgnlnk
        {
            
            set { this.plusSgnlnk = value; }
             
            get { return this.plusSgnlnk; }
        } // end of public HtmlElement plusSgnlnk




    } // end of public class CustomersSection
}
