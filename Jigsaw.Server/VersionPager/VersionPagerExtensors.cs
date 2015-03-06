using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Data.Entity;

namespace Jigsaw.Server.VersionPager
{
    public static class VersionPagerExtensors
    {
        public static IQueryable<TVersionTracker> IncludeVersions<TEntity, TVersion, TVersionTracker>(this IQueryable<TVersionTracker> set) 
            where TVersionTracker:VersionTracker<TEntity, TVersion>
            where TVersion : Version<TEntity>, new()
        {
            return set
                .Include(x => x.Current.Entity)
                .Include(x => x.Current.Approval)
                .Include(x => x.Historical.Select(y => y.Entity))
                .Include(x => x.Historical.Select(y => y.Approval))
                .Include(x => x.Pending.Select(y => y.Entity))
                .Include(x => x.Pending.Select(y => y.Approval));
        }
    }
}
