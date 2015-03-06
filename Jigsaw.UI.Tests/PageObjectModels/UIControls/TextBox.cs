using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Jigsaw.UI.Tests.PageObjectModels.UIControls
{
    public class TextBox : UIControl
    {
        private String addonText;
        private String fieldType;
        private String label;
        private String placeholder;
        private String defaultValue;
        private String instructionsText;
        private int maxLength;
        private int minLength;
        private String content;

        private int isRequired;
        private int size;
        private int visibilityRules;

        public String InstructionsText
        {
            get { return instructionsText; }
            set { instructionsText = value; }
        }

        public String DefaultValue
        {
            get { return defaultValue; }
            set { defaultValue = value; }
        }
        public String Placeholder
        {
            get { return placeholder; }
            set { placeholder = value; }
        }

        public String Label
        {
            get { return label; }
            set { label = value; }
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

        public String Content
        {
            get { return content; }
            set { content = value; }
        }

        public int MinLength
        {
            get { return minLength; }
            set { minLength = value; }
        }

        public int MaxLength
        {
            get { return maxLength; }
            set { maxLength = value; }
        }


    } // end of public class TextBox : UIControl
} // end of namespace Jigsaw.UI.Tests.PageObjectModels.UIControls
