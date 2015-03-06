using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Jigsaw.UI.Tests.PageObjectModels.FormBuilderRelatedModules
{
    public class MetaDataFormTemplate
    {
        private String formName;
        private String formTitle;
        private String formDescription;
        private String author;
        private DateTime lastModified;
        private int id;

        public int Id
        {
            get { return id; }
            set { id = value; }
        }

        public DateTime LastModified
        {
            get { return lastModified; }
            set { lastModified = value; }
        }

        public String Author
        {
            get { return author; }
            set { author = value; }
        }

        public String FormDescription
        {
            get { return formDescription; }
            set { formDescription = value; }
        }

        public String FormName
        {
            get { return formName; }
            set { formName = value; }
        }

        public String FormTitle
        {
            get { return formTitle; }
            set { formTitle = value; }
        }



    } // end of public class MetaDataFormTemplateSubModule
} // end of namespace Jigsaw.UI.Tests.PageObjectModels.SubModules
