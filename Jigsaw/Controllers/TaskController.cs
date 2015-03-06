using System.Web.Http;
using Breeze.WebApi2;
using Jigsaw.Data.Task;
using System.Linq;
using System;
using WebMatrix.WebData;
using Jigsaw.Server.Files;
using Jigsaw.Server.Infrastructure;
using System.Collections.Generic;
using System.Web.Http.OData.Query;
using Breeze.ContextProvider;
using Newtonsoft.Json.Linq;

namespace Jigsaw.Controllers
{
    [BreezeController]
    public class TaskController: ApiController
    {
        private readonly TaskRepository _repository;

        QueryableSearchManager<TaskVersionTracker> _taskVersionSearchManager;

        public TaskController()
        {
            _repository = new TaskRepository();
            _taskVersionSearchManager = new QueryableSearchManager<TaskVersionTracker>(() => _repository.TaskVersion,
                term => task => task.Current.Entity.Name.Contains(term));
        }

        [HttpGet]
        public string Metadata()
        {
            return _repository.Metadata;
        }

        // ~/api/task/SaveChanges
        [HttpPost]
        public SaveResult SaveChanges(JObject saveBundle)
        {
            return _repository.SaveChanges(saveBundle);
        }

        [HttpGet]
        public IQueryable<TaskVersionTracker> TaskVersion(string simpleSearch = null)
        {
            return _taskVersionSearchManager.Search(simpleSearch);
        }

        [HttpGet]
        public NextItemArgs NextTaskVersion(int selectedIndex, [FromUri] IDictionary<string, string> terms,
            ODataQueryOptions<TaskVersionTracker> query, string simpleSearch = null, string webRule = null)
        {
            return _taskVersionSearchManager.Next(selectedIndex, terms, query, simpleSearch, webRule);
        }

        [HttpGet]
        public IQueryable<Task> Task()
        {
            return _repository.Task;
        }

        private void UpdateApprovedAuditVersionInformationWithCurrentUser(TaskVersion version)
        {
            string userName = string.IsNullOrEmpty(WebSecurity.CurrentUserName) 
                ? "Anonymous" 
                : WebSecurity.CurrentUserName;

            var approval = version.Approval.First();

            approval.ApprovedBy = userName;
            approval.ApprovedDate = DateTime.Now;
        }

        [HttpPost]
        public TaskVersionTracker Approve(VersionTrackerActionModel model)
        {
            var tracker = TaskVersion().Where(t => t.Guid == model.TrackerGuid).First();
            var version = tracker.Pending.Where(v => v.Guid == model.VersionGuid).First();

            tracker.Approve(version);

            UpdateApprovedAuditVersionInformationWithCurrentUser(tracker.Current);

            _repository.SaveChanges();

            return tracker;
        }

        [HttpPost]
        public TaskVersionTracker Reject(VersionTrackerActionModel model)
        {
            var tracker = TaskVersion().Where(t => t.Guid == model.TrackerGuid).First();
            var version = tracker.Pending.Where(v => v.Guid == model.VersionGuid).First();

            tracker.Reject(version);
            _repository.SaveChanges();

            return tracker;
        }

        [HttpPost]
        public TaskVersionTracker Revert(VersionTrackerActionModel model)
        {
            var tracker = TaskVersion().Where(t => t.Guid == model.TrackerGuid).First();
            var version = tracker.Historical.Where(v => v.Guid == model.VersionGuid).First();

            tracker.Revert(version);

            UpdateApprovedAuditVersionInformationWithCurrentUser(tracker.Current);
            _repository.SaveChanges();

            return tracker;

        }
    }

    public class VersionTrackerActionModel
    {
        public Guid TrackerGuid { get; set; }
        public Guid VersionGuid { get; set; }
    }
}