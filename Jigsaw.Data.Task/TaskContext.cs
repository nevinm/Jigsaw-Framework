using System.Data.Entity;

namespace Jigsaw.Data.Task
{
    public class TaskContext:DbContext
    {
        public static string ContextName { get { return "TaskContext"; } }

        public TaskContext(): base(ContextName)
        {
            // Disable proxy creation and lazy loading; not wanted in this service context.
            Configuration.ProxyCreationEnabled = false;
            Configuration.LazyLoadingEnabled = false;
        }

        public DbSet<TaskVersionTracker> TaskVersion { get; set; }
    }
}