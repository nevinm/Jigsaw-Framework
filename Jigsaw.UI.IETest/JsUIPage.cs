using Jigsaw.UI.IETest.Fragments;
using Microsoft.VisualStudio.TestTools.UITesting;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Jigsaw.UI.IETest
{
    public class JsUIPage
    {
        private CustomersSection custSec;
        private UITestControl custLink;

        public UITestControl CustLink
        {
            get { return custLink; }
            set { custLink = value; }
        }
        public CustomersSection CustSec
        {
            get { return custSec; }
            set { custSec = value; }
        } // end of public CustomersSection CustSec




    }
}
