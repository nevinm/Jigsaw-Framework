using System;
using Jigsaw.Server.VersionPager;
using System.ComponentModel.DataAnnotations;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace Jigsaw.Data.Task
{
    

    public class Task
    {
        [Key]
        public Guid Guid { get; set ; }

        public string Name { get; set; }

        [Display(Name="Description!")]
        public string Description { get; set; }

        public DateTime BeginDate { get; set; }

        public DateTime EndDate { get; set; }

        public bool IsPerformed { get; set; }

        public bool IsSuspended { get; set; }

        [ForeignKey("TaskGuid")]
        public ICollection<TaskTag> TaskTags { get; set; }
    }

    public class Tag
    {
        [Key]
        public int ID { get; set; }

        public string Name { get; set; }
    }

    /// <summary>
    /// The current version of Breeze doesn't support many-to-many relationships, however
    /// the feature is being evaluated and is the one with most votes on the breeze user
    /// voice page (as of 4/4/2014). 
    /// The recommended solution for this is to create an type in between the relation,
    /// to map the corresponding table.
    /// </summary>
    public class TaskTag
    {
        [Key]
        public int TaskTagID { get; set; }

        public Guid TaskGuid { get; set; }

        public int TagID { get; set; }

        [ForeignKey("TagID")]
        public Tag Tag { get; set; }
    }

    public class TaskVersion : Version<Task>
    {
        
    }

    public class TaskVersionTracker : VersionTracker<Task, TaskVersion>
    {
        public TaskVersionTracker()
        {
            
        }

    }
}

