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
using Newtonsoft.Json;


using System.Web.UI.WebControls;
using Newtonsoft.Json.Linq;

namespace TestHarness_LoadingMasterPageLoading2
{
    public partial class Default : System.Web.UI.Page
    {
        #region Properties

        /// <summary>
        /// Dictionary used to store scripts files to be loaded. Key-File name with extension, Value-Relative file path.
        /// </summary>
        Dictionary<string, string> scripts = new Dictionary<string, string>();

        /// <summary>
        /// Holds the JSON generated for the files
        /// </summary>
        public string FilesJson;

        /// <summary>
        /// Array of the files
        /// </summary>
        JArray filesJArray = new JArray();

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
             GenerateFilesJSON();
        }
        #endregion

        #endregion

        #region Private Methods

        #region GenerateFilesJSON
        /// <summary>
        /// Generates the JSON Array for the resource files.
        /// Also generates the total size for each category.
        /// </summary>
        private void GenerateFilesJSON()
        {
            JObject allFiles = new JObject();
            long core = GetFilesJson("*.js", "~\\resources\\core-files\\", "SCRIPT","core");
            long module = GetFilesJson("*.js", "~\\resources\\module-files\\", "SCRIPT","module");
            long theme = GetFilesJson("*.css", "~\\resources\\theme-files\\", "CSS","theme");
            long data = GetFilesJson("*.png", "~\\resources\\data-files\\", "IMAGE","data");
            JObject arrayWrapper = new JObject();
            arrayWrapper["size_core_files"] = core;
            arrayWrapper["size_data_files"] = data;
            arrayWrapper["size_theme_files"] = theme;
            arrayWrapper["size_module_files"] = module;
            arrayWrapper["files"] = filesJArray;
            FilesJson += arrayWrapper.ToString();
        }
        #endregion

        #region GetFilesJson
        /// <summary>
        /// Generates JSON array for a passed directory, recursively.
        /// </summary>
        /// <param name="ExtPattern">Patter for the extension to be searched</param>
        /// <param name="DirectoryPath">Directory to be searched</param>
        /// <param name="Type"></param>
        /// <returns>JSON array for the given resource direcoty</returns>
        private long GetFilesJson(string ExtPattern, string DirectoryPath, string Type,string Category)
        {
            long TotalSize = 0;
            String[] files;
            if (Type == "IMAGE")
            {
                files = Directory.GetFiles(Server.MapPath(DirectoryPath), "*.*", SearchOption.AllDirectories)
                    .Where(file => (file.ToLower().EndsWith(".png")
                        || file.ToLower().EndsWith(".jpg")
                        || file.ToLower().EndsWith(".mp3")
                        || file.ToLower().EndsWith(".jpeg")
                        ))
                    .ToArray<string>();
            }
            else
            {
                files = Directory.GetFiles(Server.MapPath(DirectoryPath), ExtPattern, SearchOption.AllDirectories);
            }
            foreach (String file in files)
            {
                JObject fileJObject = new JObject();
                FileInfo info = new FileInfo(file);

                fileJObject["type"] = Type;
                fileJObject["source"] = getFileUrl(DirectoryPath, info.FullName);
                fileJObject["size"] = info.Length;
                fileJObject["category"] = Category;
                if (Type == "SCRIPT")
                    fileJObject["stopExecution"] = true;
                TotalSize += info.Length;
                filesJArray.Add(fileJObject);
            }
            return TotalSize;
        }
        #endregion

        #region getFileUrl
        /// <summary>
        /// Creates a proper relative path for the files.
        /// </summary>
        /// <param name="DirectoryPath">Path of the resource directory</param>
        /// <param name="FileFullPath">Files location in the server. ex D:\server\file\location\...</param>
        /// <returns>The proper file url, relative to the root.</returns>
        private string getFileUrl(string DirectoryPath, string FileFullPath)
        {
            string splitter = DirectoryPath.Substring(1);
            int startIndex = FileFullPath.IndexOf(splitter);
            return FileFullPath.Substring(startIndex);
        }
        #endregion


        

        

        
        #endregion
    }
}