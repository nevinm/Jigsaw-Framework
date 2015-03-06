/// <summary>
/// Date        : 06/02/2015
/// Author      : Nishin
/// Description : Default page for the Test Harness    
/// </summary>

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TestHarness
{
    public partial class Default : System.Web.UI.Page
    {
        #region Properties

        /// <summary>
        /// Creating config object for that will be used in client side.
        /// </summary>
        public TestHarnessConfig Config = TestHarnessConfig.Instance;

        #endregion

        #region Page Events

        #region Page_Load
        /// <summary>
        /// Page Load event.
        /// </summary>
        /// <param name="sender">The page</param>
        /// <param name="e">Event args</param>
        protected void Page_Load(object sender, EventArgs e)
        {
            if (!IsPostBack)
            {
                Config.Env = ddlEnvironment.Items[0].Value;
            }
        }
        #endregion

        #region ddlEnvironment_SelectedIndexChanged
        /// <summary>
        /// Dropdownlist changed evend used for environment variable setting/unsetting.
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        protected void ddlEnvironment_SelectedIndexChanged(object sender, EventArgs e)
        {
            Config.Env = ddlEnvironment.SelectedValue;
            ScriptManager.RegisterStartupScript(this, this.GetType(), "Logs", "log('Environment variable set: " + Config.Env + "')", true);
        }

        #endregion

        #endregion


    }
}