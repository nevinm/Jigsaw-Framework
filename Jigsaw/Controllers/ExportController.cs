using Jigsaw.Data.Northwind;
using System;
using System.Linq;
using System.Web.Mvc;
using Jigsaw.Server.Export;
using Jigsaw.Server.Filters;

namespace Jigsaw.Controllers
{
    public class ExportController : Controller
    {
        private readonly NorthwindRepository _repository = new NorthwindRepository();

        [FileDownload]
        public ActionResult WordExportEmployee(int employeeID)
        {
            var employee = _repository.Employees.First(x => x.EmployeeID == employeeID);

            var template = this.RenderRazorViewToString("~/Views/Template/EmployeeViewbar.cshtml");
            var array = EntityExport.ToWordDocument(employee, template);

            return File(array, "application/msword", "Employee_" + employee.EmployeeID + ".doc");
        }

        [FileDownload]
        public ActionResult PdfExportEmployee(int employeeID)
        {
            var employee = _repository.Employees.First(x => x.EmployeeID == employeeID);

            var template = this.RenderRazorViewToString("~/Views/Template/EmployeeViewbar.cshtml");
            var array = EntityExport.ToPdfDocument(employee, template);

            return File(array, "application/pdf", "Employee_" + employee.EmployeeID + ".pdf");
        }

        [FileDownload]
        public ActionResult WordExportCustomer(Guid customerId)
        {
            var customer = _repository.Customers.First(x => x.CustomerID == customerId);

            var path = EntityExport.ReadStaticTemplate("~/scripts/src/templates/data.customer/CustomerEdit.html");
            var array = EntityExport.ToWordDocument(customer, path);

            return File(array, "application/msword", "Customer_" + customer.CustomerID + ".doc");
        }

        [FileDownload]
        public ActionResult PdfExportCustomer(Guid customerId)
        {
            var customer = _repository.Customers.First(x => x.CustomerID == customerId);

            var template = EntityExport.ReadStaticTemplate("~/scripts/src/templates/data.customer/CustomerEdit.html");
            var array = EntityExport.ToPdfDocument(customer, template);

            return File(array, "application/pdf", "Customer_" + customer.CustomerID + ".pdf");
        }
    }
}
