using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Jigsaw.Data.Northwind
{
    [AttributeUsage(AttributeTargets.Class)]
    public class SupplierValidator : ValidationAttribute
    {
        public override Boolean IsValid(Object value)
        {
            var supplier = value as Supplier;
            if (supplier != null && (supplier.CompanyName.ToLower() == "error" || supplier.ContactName.ToLower() == "error"))
            {
                ErrorMessage = "This Supplier is not valid!";
                return false;
            }
            return true;
        }
    }

    [AttributeUsage(AttributeTargets.Property)]
    public class NotEqualValidator : ValidationAttribute
    {
        public string Value { get; set; }

        public NotEqualValidator(string value)
        {
            this.Value = value;
        }

        public override Boolean IsValid(Object value)
        {
            try
            {
                var val = (string)value;
                if (!string.IsNullOrEmpty(val) && val == Value)
                {
                    ErrorMessage = "{0} equal the word " + Value;
                    return false;
                }
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }
    }
}
