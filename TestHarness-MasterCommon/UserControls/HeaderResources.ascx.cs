using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TestHarness.UserControls
{
    public partial class HeaderResources : System.Web.UI.UserControl
    {
        #region Properties
        /// <summary>
        /// Dictionary used to store scripts files to be loaded.
        /// Key     :   File name with extension
        /// Value   :   Relative file path
        /// </summary>
        Dictionary<string, string> scripts = new Dictionary<string, string>();

        Literal ltlScriptTags;

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
                ltlScriptTags = (Literal)this.Parent.FindControl("ltlScriptTags");
                getCoreScripts();
                generateCheckBoxes(chklstScripts, scripts);
                getRunningScripts();
            }

        }
        #endregion

        #region chklstScripts_SelectedIndexChanged
        /// <summary>
        /// CheckBoxList for scripts' SelectedIndexChaged event
        /// </summary>
        /// <param name="sender">chklstScripts</param>
        /// <param name="e">Event Object</param>
        protected void chklstScripts_SelectedIndexChanged(object sender, EventArgs e)
        {
            renderScriptTags();
        }
        #endregion

        #endregion

        #region Private Methods

        #region getCoreScripts

        /// <summary>
        /// Fetches all script files in the given directory.
        /// </summary>
        private void getCoreScripts()
        {
            string[] filePaths = Directory.GetFiles(Server.MapPath("~/scripts/lib/core-libs/"));
            foreach (string filePath in filePaths)
            {
                scripts.Add(Path.GetFileName(filePath), "/scripts/lib/core-libs/" + Path.GetFileName(filePath));
            }
        }

        #endregion

        #region getRunningScripts

        /// <summary>
        /// Fetchess scripts required for the Test Harness.
        /// </summary>
        private void getRunningScripts()
        {
            string[] runningFilePaths = Directory.GetFiles(Server.MapPath("~/scripts/lib/current-running-libs/"));
            foreach (string filePath in runningFilePaths)
            {
                chklstScriptsCurrent.Items.Add(Path.GetFileName(filePath));
            }

            for (int i = 0; i < chklstScriptsCurrent.Items.Count; i++)
            {
                chklstScriptsCurrent.Items[i].Selected = true;
                chklstScriptsCurrent.Items[i].Enabled = false;

            }
        }

        #endregion

        #region generateCheckBoxes

        /// <summary>
        /// Generates CheckBoxList for the given list of scripts
        /// </summary>
        /// <param name="chkbxList">CheckBoxList being generated</param>
        /// <param name="files">Dictionary of the script files</param>
        private void generateCheckBoxes(CheckBoxList chkbxList, Dictionary<string, string> files)
        {
            foreach (var file in files)
            {
                chkbxList.Items.Add(new ListItem(file.Key, file.Value));
            }
            for (int i = 0; i < chkbxList.Items.Count; i++)
            {

                chkbxList.Items[i].Selected = true;
            }
            renderScriptTags();
        }

        #endregion

        #region renderScriptTags
        /// <summary>
        /// Inserts script tags in to the dom, for all checked checkboxes.
        /// </summary>
        private void renderScriptTags()
        {
            ltlScriptTags = (Literal)this.Parent.FindControl("ltlScriptTags");
            ltlScriptTags.Text = string.Empty;
            foreach (ListItem item in chklstScripts.Items)
            {
                if (item.Selected)
                {
                    ltlScriptTags.Text += @"<script type='text/javascript' src='" +
                            item.Value
                        + "'></script>";
                    ScriptManager.RegisterStartupScript(this, this.GetType(), "Logs", "log('" + item.Text + " has been loaded')", true);
                }
                else
                {
                    ScriptManager.RegisterStartupScript(this, this.GetType(), "Logs", "log('" + item.Text + " has been unloaded')", true);
                }
            }
        }
        #endregion

        #endregion
    }
}