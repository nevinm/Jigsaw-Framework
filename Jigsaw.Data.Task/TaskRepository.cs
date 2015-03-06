using System.Data.Entity;
using System.Linq;
using Breeze.ContextProvider.EF6;
using Jigsaw.Server.Helpers;
using Newtonsoft.Json.Linq;
using Breeze.ContextProvider;
using Jigsaw.Server.VersionPager;

namespace Jigsaw.Data.Task
{
    public class TaskRepository
    {
        private readonly EFContextProvider<TaskContext> _contextProvider;

        static TaskRepository()
        {
            Database.SetInitializer(new TaskDatabaseInitializer());
        }

        public TaskRepository()
        {
            _contextProvider = new EFContextProvider<TaskContext>();
        }

        public string Metadata
        {
            get
            {
                return _contextProvider.ExtendedMetadata();
            }
        }

        private TaskContext Context { get { return _contextProvider.Context; } }

        public IQueryable<TaskVersionTracker> TaskVersion
        {
            get
            {
                return Context.TaskVersion
                    .IncludeVersions<Task, TaskVersion, TaskVersionTracker>()
                    .Include(x => x.Current.Entity.TaskTags.Select(y=>y.Tag))
                    .Include(x => x.Historical.Select(y => y.Entity.TaskTags.Select(z => z.Tag)))
                    .Include(x => x.Pending.Select(y => y.Entity.TaskTags.Select(z => z.Tag)));
            }
        }

        public IQueryable<Task> Task
        {
            get { return Context.TaskVersion.Select(x => x.Current.Entity); }
        }

        public void SaveChanges()
        {
            Context.SaveChanges();
        }

        public SaveResult SaveChanges(JObject saveBundle)
        {
            return _contextProvider.SaveChanges(saveBundle);
        }

        
    }
}