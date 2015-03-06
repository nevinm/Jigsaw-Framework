using System;
using System.Linq;
using Breeze.ContextProvider;
using Breeze.ContextProvider.EF6;
using Jigsaw.Server.Helpers;
using Newtonsoft.Json.Linq;

namespace Jigsaw.Data.Northwind
{
    /// <summary>
    ///     Repository (a "Unit of Work" really) of Northwind models.
    /// </summary>
    public class NorthwindRepository
    {
        private const string _guestUserSessionIdName = "12345678-9ABC-DEF0-1234-56789ABCDEF0";
        private static readonly Guid _guestUserSessionId = new Guid(_guestUserSessionIdName);
        private readonly EFContextProvider<NorthwindContext> _contextProvider;
        private Guid _userSessionId = _guestUserSessionId;

        public NorthwindRepository()
        {
            _contextProvider = new EFContextProvider<NorthwindContext>();
        }

        public string Metadata
        {
            get
            {
                // Returns metadata from a dedicated DbContext that is different from
                // the DbContext used for other operations
                // See NorthwindMetadataContext for more about the scenario behind this.
//                var metaContextProvider = new EFContextProvider<NorthwindMetadataContext>();
//                return metaContextProvider.Metadata();
                return _contextProvider.ExtendedMetadata();
            }
        }

        public IQueryable<Customer> Customers
        {
            get { return ForCurrentUser(Context.Customers); }
        }

        public IQueryable<Supplier> Suppliers
        {
            get { return ForCurrentUser(Context.Suppliers); }
        }

        public IQueryable<Order> Orders
        {
            get { return ForCurrentUser(Context.Orders); }
        }

        public IQueryable<Employee> Employees
        {
            get { return ForCurrentUser(Context.Employees); }
        }

        public IQueryable<Product> Products
        {
            get { return Context.Products; }
        }

        public IQueryable<Category> Categories
        {
            get { return Context.Categories; }
        }

        public IQueryable<Region> Regions
        {
            get { return Context.Regions; }
        }

        public IQueryable<Territory> Territories
        {
            get { return Context.Territories; }
        }

        private NorthwindContext Context
        {
            get { return _contextProvider.Context; }
        }

        /// <summary>
        ///     The current user's UserSessionId, typically set by the controller
        /// </summary>
        /// <remarks>
        ///     If requested, it must exist and be a non-Empty Guid
        /// </remarks>
        public Guid UserSessionId
        {
            get { return _userSessionId; }
            set { _userSessionId = (value == Guid.Empty) ? _guestUserSessionId : value; }
        }

        public EFContextProvider<NorthwindContext> ContextProvider
        {
            get { return _contextProvider; }
        }

        public SaveResult SaveChanges(JObject saveBundle)
        {
            return _contextProvider.SaveChanges(saveBundle);
        }

        public string Reset(string options)
        {
            // If full reset, delete all additions to the database
            // else delete additions made during this user's session
            string where = options.Contains("fullreset")
                ? "IS NOT NULL"
                : ("= '" + UserSessionId + "'");

            string deleteSql;
            deleteSql = "DELETE FROM [CUSTOMER] WHERE [USERSESSIONID] " + where;
            Context.Database.ExecuteSqlCommand(deleteSql);
            deleteSql = "DELETE FROM [EMPLOYEE] WHERE [USERSESSIONID] " + where;
            Context.Database.ExecuteSqlCommand(deleteSql);
            deleteSql = "DELETE FROM [ORDERDETAIL] WHERE [USERSESSIONID] " + where;
            Context.Database.ExecuteSqlCommand(deleteSql);
            deleteSql = "DELETE FROM [INTERNATIONALORDER] WHERE [USERSESSIONID] " + where;
            Context.Database.ExecuteSqlCommand(deleteSql);
            deleteSql = "DELETE FROM [ORDER] WHERE [USERSESSIONID] " + where;
            Context.Database.ExecuteSqlCommand(deleteSql);
            deleteSql = "DELETE FROM [USER] WHERE [USERSESSIONID] " + where;
            Context.Database.ExecuteSqlCommand(deleteSql);
            return "reset";
        }

        private IQueryable<T> ForCurrentUser<T>(IQueryable<T> query) where T : class, ISaveable
        {
            return query.Where(x => x.UserSessionId == null || x.UserSessionId == UserSessionId);
        }
    }
}