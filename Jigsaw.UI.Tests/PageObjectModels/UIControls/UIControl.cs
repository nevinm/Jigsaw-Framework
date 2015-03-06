using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Jigsaw.UI.Tests.PageObjectModels.UIControls
{
    public class UIControl
    {
        private String uiControlName;
        private int uiControlId;

        public String UiControlName
        {
            get { return uiControlName; }
            set { uiControlName = value; }
        }


        public int UiControlId
        {
            get { return uiControlId; }
            set { uiControlId = value; }
        }

    } // end of public class UIControl
} // end of namespace Jigsaw.UI.Tests.PageObjectModels.UIControls
