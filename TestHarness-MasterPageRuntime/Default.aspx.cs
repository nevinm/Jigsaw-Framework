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
        /// Dictionary used to store scripts files to be loaded.
        /// Key     :   File name with extension
        /// Value   :   Relative file path
        /// </summary>
        Dictionary<string, string> scripts = new Dictionary<string, string>();

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
                getCoreScripts();
                generateCheckBoxes(chklstScripts,scripts);
                getRunningScripts();
                getSounds();
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
        /// <summary>
        /// Get all the sound files.
        /// </summary>
        #region getSounds
        private void getSounds()
        {
            string[] filePaths = Directory.GetFiles(Server.MapPath("~/content/sounds/"));
            foreach (string filePath in filePaths)
            {
                string FileName = Path.GetFileName(filePath);
                FileName = FileName.Substring(0, FileName.LastIndexOf('.'));
                ListItem Item = SoundList.Items.FindByText(FileName);
                if (Item == null)
                    SoundList.Items.Add(new ListItem(FileName, "/content/sounds/" + FileName));
            }
        }
        #endregion
        #region getCoreScripts

        /// <summary>
        /// Fetches all script files in the given directory
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
        /// Creates script elements for all js files present within the corresponding folder
        /// as pointed by scripts variable.
        /// </summary>
        private void renderScriptTags()
        {
            ltlScriptTags.Text = string.Empty;
            foreach (ListItem item in chklstScripts.Items)
            {
                if (item.Selected)
                {
                    ltlScriptTags.Text += @"<script type='text/javascript' src='" +
                            item.Value
                        + "'></script><script>log('" + item.Text + " has been loaded')</script>";
                }
                else
                {
                    ltlScriptTags.Text += @"<script>log('" + item.Text + " has been Unloaded')</script>";
                }
            }
        }
        #endregion

        #endregion
    }
}