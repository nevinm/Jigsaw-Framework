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
        Dictionary<string, string> scripts = new Dictionary<string, string>();
        Dictionary<string, string> styles = new Dictionary<string, string>();
        /// <summary>
        /// Page Load event.
        /// </summary>
        /// <param name="sender">The page</param>
        /// <param name="e">Event args</param>
        protected void Page_Load(object sender, EventArgs e)
        {
            if (!IsPostBack)
            {
                scripts = GetFilesList("/scripts/lib/current-running-libs/");
                styles = GetFilesList("/content/core-styles/");
                generateCheckBoxes(chklstScripts, scripts);
                generateCheckBoxes(chklstStyles, styles);
            }
        }

        /// <summary>
        /// Basically used to get the file paths.
        /// </summary>
        /// <param name="DirectoryPath">Path to the folder where the files are.</param>
        /// <returns>List of all the files(key value pair)</returns>
        private Dictionary<string, string> GetFilesList(string DirectoryPath)
        {
            Dictionary<string, string> list = new Dictionary<string, string>();
            string[] filePaths = Directory.GetFiles(Server.MapPath("~"+DirectoryPath));
            foreach (string filePath in filePaths)
            {
                list.Add(Path.GetFileName(filePath), DirectoryPath + Path.GetFileName(filePath));
            }
            return list;
        }
           
        /// <summary>
        /// Generate checkboxes for js/css files.
        /// </summary>
        /// <param name="chkbxList">checkbox control</param>
        /// <param name="files">file key and value pair</param>
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
            renderTags();
        }
        
        /// <summary>
        /// CheckBoxList for scripts' SelectedIndexChaged event
        /// </summary>
        /// <param name="sender">chklstScripts</param>
        /// <param name="e">Event Object</param>
        protected void chklstScripts_SelectedIndexChanged(object sender, EventArgs e)
        {
            renderTags();
        }

        /// <summary>
        /// Creates script elements for all js/css files present within the corresponding folder
        /// as pointed by scripts/styles variable.
        /// </summary>
        private void renderTags()
        {
            ltlScriptTags.Text = string.Empty;
            ltlStylesTags.Text = string.Empty;

            foreach (ListItem item in chklstScripts.Items)
            {
                if (item.Selected)
                {
                    ltlScriptTags.Text += @"<script type='text/javascript' src='" +
                            item.Value
                        + "'></script><script>if(typeof(log)=='function'){log('" + item.Text + " has been loaded')}" +
                        "else{console.log('" + item.Text + " has been loaded')}</script>";
                }
                else
                {
                    ltlScriptTags.Text += @"<script>
                    if(typeof(log)=='function'){log('" + item.Text + " has been Unloaded')}" +
                    "else{console.log('" + item.Text + " has been Unloaded')}</script>";
                }
            }
            foreach (ListItem item in chklstStyles.Items)
            {
                if (item.Selected)
                {
                    ltlStylesTags.Text += @"<link rel='stylesheet' type='text/css' href='" +
                            item.Value
                        + "'/><script>if(typeof(log)=='function'){log('" + item.Text + " has been loaded')}" +
                        "else{console.log('" + item.Text + " has been loaded')}</script>";
                }
                else
                {
                    ltlStylesTags.Text += @"<script>"+
                    "if(typeof(log)=='function'){log('" + item.Text + " has been Unloaded')}" +
                    "else {console.log('" + item.Text + " has been Unloaded')}</script>";
                }
            }
        }


    }
}