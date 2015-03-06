using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Jigsaw.UI.Tests.PageObjectModels.UIControls
{
    public class Button : UIControl
    {
        private String addonText;
        private String fieldType;
        private String label;
        private String placeholder;
        private String defaultValue;
        private String instructionsText;
        private int isRequired;
        private int size;
        private int visibilityRules;


        public int VisibilityRules
        {
            get { return visibilityRules; }
            set { visibilityRules = value; }
        }


        public String AddonText
        {
            get { return addonText; }
            set { addonText = value; }
        }

        public String FieldType
        {
            get { return fieldType; }
            set { fieldType = value; }
        }

        public String Label
        {
            get { return label; }
            set { label = value; }
        }

        public String Placeholder
        {
            get { return placeholder; }
            set { placeholder = value; }
        }

        public String DefaultValue
        {
            get { return defaultValue; }
            set { defaultValue = value; }
        }

        public String InstructionsText
        {
            get { return instructionsText; }
            set { instructionsText = value; }
        }

        public int IsRequired
        {
            get { return isRequired; }
            set { isRequired = value; }
        }


        public int Size
        {
            get { return size; }
            set { size = value; }
        }

    } // end of public class Button : UIControl
} // end of namespace Jigsaw.UI.Tests.PageObjectModels.UIControls
