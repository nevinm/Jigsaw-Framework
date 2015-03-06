using Jigsaw.Server.VersionPager;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Jigsaw.Data.Task
{
    public class TaskDatabaseInitializer : DropCreateDatabaseAlways<TaskContext>
    {
        protected override void Seed(TaskContext context)
        {
            base.Seed(context);
            var redTag = new Tag { ID = 1, Name = "Red" };
            var importantTag = new Tag { ID = 2, Name = "Important" };
            var newTag = new Tag { ID = 3, Name = "New" };
            var versionTracker = new TaskVersionTracker
            {
                Guid = new Guid("10000000-1000-1000-0000-000000000000"),
                Current = new TaskVersion
                {
                    Guid = new Guid("10000000-1000-0000-0000-000000000000"),
                    Entity = new Task
                    {
                        Guid = new Guid("10000000-0000-0000-0000-000000000000"),
                        Description = "a sample task",
                        IsPerformed = false,
                        IsSuspended = false,
                        Name = "Sample",
                        BeginDate = new DateTime(2014, 6, 3),
                        EndDate = new DateTime(2015, 6, 3),
                        TaskTags = new[] { 
                            new TaskTag{ TaskTagID = 1, Tag = redTag},
                            new TaskTag{ TaskTagID = 2, Tag = importantTag}
                        }
                    },
                    ModifiedBy = "Ariel",
                    ModifiedDate = new DateTime(2014, 6, 3),
                    Audit = "Modified",
                    Approval = new List<Approval> {
                            new Approval {
                                Guid = new Guid("10330000-0000-0000-0000-000000300000"),
                                ApprovedBy = "David Weir",
                                ApprovedDate = new DateTime(2014, 6, 4),
                            },
                            new Approval {
                                Guid = new Guid("10330000-0000-0000-4000-000000000700"),
                                ApprovedBy = "Big Boss",
                                ApprovedDate = new DateTime(2014, 7, 4),
                            },
                        }
                },
                Historical = new List<TaskVersion>() { 
                    new TaskVersion
                    {
                        Guid = new Guid("10011000-1000-0000-0000-000000000000"),
                        Entity = new Task
                        {
                            Guid = new Guid("10330000-0000-0000-0000-000000000000"),
                            Description = "a sample task (historical)",
                            IsPerformed = true,
                            IsSuspended = false,
                            Name = "Sample (historical)",
                            BeginDate = new DateTime(2014, 6, 3),
                            EndDate = new DateTime(2015, 6, 3),
                            TaskTags = new[] { 
                                new TaskTag{ TaskTagID = 5, Tag = redTag},
                                new TaskTag{ TaskTagID = 13, Tag = newTag},
                                new TaskTag{ TaskTagID = 6, Tag = importantTag}
                            }
                        },
                        ModifiedBy = "Ariel",
                        ModifiedDate = new DateTime(2014, 6, 4),
                        Audit = "Created",
                        Approval = new List<Approval> {
                            new Approval {
                                Guid = new Guid("10330000-0000-0000-0000-000000007000"),
                                ApprovedBy = "David Weir",
                                ApprovedDate = new DateTime(2014, 6, 4),
                            },
                            new Approval {
                                Guid = new Guid("10330000-0000-0000-0200-004500000000"),
                                ApprovedBy = "Big Boss",
                                ApprovedDate = new DateTime(2014, 7, 4),
                            },
                        }
                    } 
                },
                Pending = new List<TaskVersion>() { 
                    new TaskVersion
                    {
                        Guid = new Guid("10011000-1000-0000-0000-000007800000"),
                        Entity = new Task
                        {
                            Guid = new Guid("10330000-0000-0000-0000-000000890000"),
                            Description = "a sample task (pending)",
                            IsPerformed = true,
                            IsSuspended = false,
                            Name = "Sample (pending)",
                            BeginDate = new DateTime(2014, 6, 3),
                            EndDate = new DateTime(2015, 6, 3),
                            TaskTags = new[] { 
                                new TaskTag{ TaskTagID = 1, Tag = redTag},
                                new TaskTag{ TaskTagID = 3, Tag = newTag}
                            }
                        },
                        ModifiedBy = "Ariel",
                        ModifiedDate = new DateTime(2014, 6, 14),
                        Audit = "Pending",
                        Approval = new List<Approval> {
                            new Approval {
                                Guid = new Guid("10330000-0000-0000-0000-000069000000"),
                                ApprovedBy = "David Weir",
                            },
                            new Approval {
                                Guid = new Guid("10330000-0450-0000-0000-078000000000"),
                                ApprovedBy = "Big Boss",
                            },
                        }
                    } 
                }
            };

            var versionTracker1 = new TaskVersionTracker
            {
                Guid = new Guid("10000000-1000-1000-0000-003400000000"),
                Current = new TaskVersion
                {
                    Guid = new Guid("10000000-1000-0000-0000-004500000000"),
                    Entity = new Task
                    {
                        Guid = new Guid("10000000-0000-0300-0000-000065000000"),
                        Description = "implement the Version Pager",
                        IsPerformed = false,
                        IsSuspended = false,
                        Name = "For Today",
                        BeginDate = new DateTime(2014, 6, 3),
                        EndDate = new DateTime(2015, 6, 3),
                    },
                    ModifiedBy = "Ariel",
                    ModifiedDate = new DateTime(2014, 5, 3),
                    Audit = "Modified",
                    Approval = new List<Approval> {
                            new Approval {
                                Guid = new Guid("10330000-0000-0000-0000-000900008000"),
                                ApprovedBy = "David Weir",
                                ApprovedDate = new DateTime(2014, 6, 4),
                            },
                            new Approval {
                                Guid = new Guid("10330000-0000-0000-0000-180000000000"),
                                ApprovedBy = "Big Boss",
                                ApprovedDate = new DateTime(2014, 7, 4),
                            },
                        }
                },
                Historical = new List<TaskVersion>() { 
                    new TaskVersion
                    {
                        Guid = new Guid("10011000-1000-0430-0000-030000430000"),
                        Entity = new Task
                        {
                            Guid = new Guid("10330000-0000-0000-0430-000300034300"),
                            Description = "implement Something (historical)",
                            IsPerformed = true,
                            IsSuspended = false,
                            Name = "Some Day (historical)",
                            BeginDate = new DateTime(2014, 6, 3),
                            EndDate = new DateTime(2015, 6, 3),
                        },
                        ModifiedBy = "Ariel",
                        ModifiedDate = new DateTime(2014, 6, 4),
                        Audit = "Created",
                        Approval = new List<Approval> {
                            new Approval {
                                Guid = new Guid("10330000-0000-0000-0000-000000400000"),
                                ApprovedBy = "David Weir",
                                ApprovedDate = new DateTime(2014, 6, 4),
                            },
                            new Approval {
                                Guid = new Guid("10330000-0000-0000-0000-000000056000"),
                                ApprovedBy = "Big Boss",
                                ApprovedDate = new DateTime(2014, 7, 4),
                            },
                        }
                    }
                }
            };

            context.TaskVersion.Add(versionTracker);
            context.TaskVersion.Add(versionTracker1);
        }
    }
}