using System;
using System.Linq;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.Controllers;
using Breeze.ContextProvider;
using Breeze.WebApi2;
using Jigsaw.App_Start;
using Jigsaw.Data.Northwind;
using Jigsaw.Server.Export;
using Jigsaw.Server.Filters;
using Jigsaw.Server.Helpers;
using Jigsaw.Server.Infrastructure;
using Newtonsoft.Json.Linq;
using System.Web.Http.OData.Query;
using System.Collections.Generic;
using CodeEffects.Rule.Common;
using Ninject;
using Jigsaw.Server.Files;

namespace Jigsaw.Controllers
{
    [BreezeController]
    public class NorthwindController : ApiController
    {
        private readonly NorthwindRepository _repository;

        public NorthwindController()
        {
            _repository = NinjectWebCommon.Kernel.Get<NorthwindRepository>();

            _customerSearchManager = new QueryableSearchManager<Customer>(() => _repository.Customers, 
                x => term => term.ContactTitle.Contains(x));
            _employeeSearchManager = new QueryableSearchManager<Employee>(() => _repository.Employees, 
                term => employee => employee.FirstName.Contains(term));
            _suppliersSearchManager = new QueryableSearchManager<Supplier>(() => _repository.Suppliers, 
                term => supplier => supplier.ContactName.Contains(term));

            _orderSearchManager = new QueryableSearchManager<Order>(() => _repository.Orders, x => term => term.ShipName.Contains(x));

        }

        protected override void Initialize(HttpControllerContext controllerContext)
        {
            base.Initialize(controllerContext);
            _repository.UserSessionId = getUserSessionId();
        }

        // ~/api/northwind/Metadata 
        [HttpGet]
        public string Metadata()
        {
            return _repository.Metadata;
        }

        // ~/api/northwind/SaveChanges
        [HttpPost]
        public SaveResult SaveChanges(JObject saveBundle)
        {
            return _repository.SaveChanges(saveBundle);
        }

        #region Orders

        private readonly QueryableSearchManager<Order> _orderSearchManager;

        [HttpGet]
        public IQueryable<Order> Orders(string simpleSearch = null, string webRule = null)
        {
            return _orderSearchManager.Search(simpleSearch, webRule);
        }

        [HttpGet]
        public NextItemArgs NextOrder(int selectedIndex, [FromUri] IDictionary<string, string> terms,
            ODataQueryOptions<Order> query, string simpleSearch = null, string webRule = null, bool forward = true)
        {
            return _orderSearchManager.Next(selectedIndex, terms, query, simpleSearch, webRule, forward);
        }

        #endregion Orders

        #region Customers

        private readonly QueryableSearchManager<Customer> _customerSearchManager;

        [HttpGet]
        public IQueryable<Customer> Customers(string simpleSearch = null, string webRule = null)
        {
            return _customerSearchManager.Search(simpleSearch, webRule);
        }

        [HttpGet]
        public string LoadCodeRuleCustomerSearchSettings(ThemeType theme = ThemeType.None, bool help = false)
        {
            return this._customerSearchManager.LoadCodeRuleSearchSettings(theme, help);
        }

        [HttpGet]
        public NextItemArgs NextCustomer(int selectedIndex, [FromUri] IDictionary<string, string> terms, 
            ODataQueryOptions<Customer> query, string simpleSearch = null, string webRule = null, bool forward=true)
        {
            return this._customerSearchManager.Next(selectedIndex, terms, query, simpleSearch, webRule, forward);
        }

        [HttpGet, FileDownload]
        public HttpResponseMessage ExcelExportCustomers(ODataQueryOptions<Customer> query, [FromUri] string[] columns,
            string simpleSearch = null, string webRule = null, bool includeHeaders = true)
        {
            //Get the data representing the current grid state - page, sort and filter
            var customers = _customerSearchManager.Query(query, simpleSearch, webRule);
            var allColumns = new[] {
                new ColumnSpec("ContactName"){ Width=30*256, Title="Contact Name" },
                new ColumnSpec("ContactTitle"){ Width=30*256, Title="Contact Title" },
                new ColumnSpec("City"){ Width=30*256 },
                new ColumnSpec("Country"){ Width=30*256 },
                new ColumnSpec("Phone"){ Width=30*256 },
                new ColumnSpec("Fax"){ Width=30*256 },
            };
            var activeColumns = columns!=null && columns.Length>0? allColumns.Where(c=>columns.Contains(c.PropertyName)).ToArray(): allColumns;

            var array = EntityExport.CollectionToExcelDocument(customers, activeColumns, includeHeaders);

            if (query.Top != null)
            {
                int page = query.Skip != null ? query.Skip.Value / query.Top.Value + 1 : 1;
                return this.File(array, "application/vnd.ms-excel", "Customer_PAGE_" + page + "_" + Environment.TickCount + ".xls");
            }

            return this.File(array, "application/vnd.ms-excel", "Customers_ALL_" + Environment.TickCount + ".xls");
        }

        private string _customerMeta = "";

        [HttpGet]
        public string CustomerMetaBuilder()
        {
            return _customerMeta;
        }

        [HttpPost]
        public bool CustomerMetaBuilder(string meta)
        {
            _customerMeta = meta;
            return true;
        }

        private readonly Dictionary<Guid, string> _customerMetaStorage = new Dictionary<Guid, string>();

        [HttpGet]
        public string CustomerMeta([FromUri] Guid customerId)
        {
            if (!_customerMetaStorage.ContainsKey(customerId))
            {
                _customerMetaStorage.Add(customerId, "");
            }
            return _customerMetaStorage[customerId];
        }

        [HttpPost]
        public void CustomerMeta([FromUri] Guid customerId, string metadata)
        {
            if (!_customerMetaStorage.ContainsKey(customerId))
            {
                _customerMetaStorage.Add(customerId, metadata);
            }
            else
            {
                _customerMetaStorage[customerId] = metadata;
            }
        }

        #endregion

        #region Employees

        private readonly QueryableSearchManager<Employee> _employeeSearchManager;

        [HttpGet]
        public IQueryable<Employee> Employees(string simpleSearch = null, string webRule = null)
        {
            return _employeeSearchManager.Search(simpleSearch, webRule);
        }

        [HttpGet]
        public string LoadCodeRuleEmployeeSearchSettings(ThemeType theme = ThemeType.Gray, bool help = false)
        {
            return this._employeeSearchManager.LoadCodeRuleSearchSettings(theme, help);
        }

        [HttpGet]
        public NextItemArgs NextEmployee(int selectedIndex, [FromUri] IDictionary<string, string> terms, 
            ODataQueryOptions<Employee> query, string simpleSearch = null, string webRule = null)
        {
            return this._employeeSearchManager.Next(selectedIndex, terms, query, simpleSearch, webRule);
        }

        [HttpGet, FileDownload]
        public HttpResponseMessage ExcelExportEmployees(ODataQueryOptions<Employee> query, [FromUri] string[] columns, string simpleSearch = null, string webRule = null)
        {
            //Get the data representing the current grid state - page, sort and filter
            var employees = _employeeSearchManager.Query(query, simpleSearch, webRule);
            var allColumns = new[] {
                new ColumnSpec("Title"){ Width=30*256 },
                new ColumnSpec("FirstName"){ Width=30*256, Title="First Name" },
                new ColumnSpec("LastName"){ Width=30*256,Title="Last Name" },
                new ColumnSpec("Country"){ Width=30*256 },
                new ColumnSpec("City"){ Width=30*256 },
                new ColumnSpec("HomePhone"){ Width=30*256, Title="Home Phone" },
            };
            var activeColumns = columns != null && columns.Length > 0 ? allColumns.Where(c => columns.Contains(c.PropertyName)).ToArray() : allColumns;
            
            var array = EntityExport.CollectionToExcelDocument(employees, activeColumns);

            if (query.Top != null)
            {
                int page = query.Skip!=null ? query.Skip.Value / query.Top.Value + 1: 1;
                return this.File(array, "application/vnd.ms-excel", "Employee_PAGE_" + page + "_" + Environment.TickCount + ".xls");
            }
            
            return this.File(array, "application/vnd.ms-excel", "Employee_ALL_" + Environment.TickCount + ".xls");
        }

        #endregion

        #region Suppliers

        private readonly QueryableSearchManager<Supplier> _suppliersSearchManager;

        [HttpGet]
        public IQueryable<Supplier> Suppliers(string simpleSearch = null, string webRule = null)
        {
            return _suppliersSearchManager.Search(simpleSearch, webRule);
        }

        [HttpGet]
        public string LoadCodeRuleSupplierSearchSettings(ThemeType theme = ThemeType.Gray, bool help = false)
        {
            return _suppliersSearchManager.LoadCodeRuleSearchSettings(theme, help);
        }

        [HttpGet]
        public NextItemArgs NextSupplier(int selectedIndex, [FromUri] IDictionary<string, string> terms,
            ODataQueryOptions<Supplier> query, string simpleSearch = null, string webRule = null)
        {
            return _suppliersSearchManager.Next(selectedIndex, terms, query, simpleSearch, webRule);
        }

        [HttpGet, FileDownload]
        public HttpResponseMessage ExcelExportSupplier(ODataQueryOptions<Supplier> query, 
            string simpleSearch = null, string webRule = null)
        {
            //Get the data representing the current grid state - page, sort and filter
            var employees = _suppliersSearchManager.Query(query, simpleSearch, webRule);

            var array = EntityExport.CollectionToExcelDocument(employees, new[] {
                new ColumnSpec("CompanyName"){ Width=30*256, Title="Company Name" },
                new ColumnSpec("ContactName"){ Width=30*256, Title="Contact Name" },
                new ColumnSpec("ContactTitle"){ Width=30*256,Title="Contact Title" },
                new ColumnSpec("Address"){ Width=30*256 },
                new ColumnSpec("City"){ Width=30*256 },
                new ColumnSpec("Phone"){ Width=30*256 },
            });

            return this.File(array, "application/vnd.ms-excel", "Supplier.xls");
        }

        #endregion Suppliers

        // ~/breeze/northwind/reset - clears the current user's changes
        // ~/breeze/Northwind/reset/?options=fullreset - clear out all user changes; back to base state.
        [HttpPost]
        public string Reset(string options = "")
        {
            return _repository.Reset(options);
        }

        /// <summary>
        /// Get the UserSessionId from value in the request header
        /// </summary>
        private Guid getUserSessionId()
        {
            try
            {
                var id = Request.Headers.GetValues("X-UserSessionId").First();
                return Guid.Parse(id);
            }
            catch  {
                return Guid.Empty;
            }
        }
    }
}