using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Jigsaw.Server.VersionPager
{
    /// <summary>
    /// This class is generic to ensure there's a table per entity
    /// </summary>
    /// <typeparam name="T"></typeparam>
    public class Approval
    {
        [Key]
        public Guid Guid { get; set; }

        /// <summary>
        /// this can reference the actual user that make the approval
        /// </summary>
        public string ApprovedBy { get; set; }

        public DateTime? ApprovedDate { get; set; }

        public Guid? Version { get; set; }

        public int? Step { get; set; }
    }

    public class Version<T>
    {
        [Key]
        public Guid Guid { get; set; }

        public Guid VersionEntity { get; set; }

        [ForeignKey("VersionEntity")]
        public T Entity { get; set; }

        public string ModifiedBy { get; set; }

        public DateTime ModifiedDate { get; set; }

        public Guid? VersionTrackerPending { get; set; }

        public Guid? VersionTrackerHistorical { get; set; }

        /// <summary>
        /// Custom Audit info??? Created, Modified, Pending, ??
        /// </summary>
        public string Audit { get; set; }

        [ForeignKey("Version")]
        public ICollection<Approval> Approval { get; set; }
    }

    public class VersionTracker<TEntity, TVersion> where TVersion : Version<TEntity>, new()
    {
        [Key]
        public Guid Guid { get; set; }

        public Guid VersionTrackerCurrent { get; set; }

        [ForeignKey("VersionTrackerCurrent")]
        public TVersion Current { get; set; }

        [ForeignKey("VersionTrackerPending")]
        public ICollection<TVersion> Pending { get; set; }

        [ForeignKey("VersionTrackerHistorical")]
        public ICollection<TVersion> Historical { get; set; }

        [NotMapped]
        public bool HasPending { get { return this.Pending != null && this.Pending.Count > 0; } }

        /// <summary>
        /// Marks the given version as approved. 
        /// The user who approved it should be setted externally
        /// </summary>
        /// <param name="version"></param>
        public void Approve(TVersion version)
        {
            // 1. Remove pending version
            var removed = Pending.Remove(version);
            
            // if record existed, this is a simple way to check if the version was actually pending
            if (removed)
            {
                // 2. create historical version with current
                Historical.Add(Current);

                // 3. replace current version
                Current = version;
            }
        }

        /// <summary>
        /// removes a version from the pending list
        /// </summary>
        /// <param name="version"></param>
        public void Reject(TVersion version)
        {
            Pending.Remove(version);
        }

        /// <summary>
        /// Reverts the current version to the passed historical one.
        /// This creates a new version referencing the same <see cref="Entity"/>
        /// as the histoical version.
        /// The Approved audit fields must be setted externally on the resulting current version
        /// </summary>
        /// <param name="version"></param>
        public void Revert(TVersion version)
        {
            if (Historical.Contains(version))
            {
                // create a new record with the same entity
                var newVersion = new TVersion()
                {
                    Guid = Guid.NewGuid(),
                    Entity = version.Entity,
                    ModifiedBy = version.ModifiedBy,
                    ModifiedDate = version.ModifiedDate
                };

                // 2. create historical record with current
                Historical.Add(Current);

                // 3. replace current version
                Current = newVersion;
            }
        }

    }
}
