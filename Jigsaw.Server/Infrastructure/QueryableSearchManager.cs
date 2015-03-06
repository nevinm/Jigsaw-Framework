using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Web.Http.OData.Query;
using CodeEffects.Rule.Common;
using Jigsaw.Server.VersionPager;

namespace Jigsaw.Server.Infrastructure
{
    /// <summary>
    /// This is the object returned to the client after a JumpTo operation, contains the indext of the requested element
    /// and wether the search can be repeated in some direction.
    /// </summary>
    public class NextItemArgs
    {
        public NextItemArgs()
        {
            Index = -1;
            HasPrevious = false;
            HasNext = false;
        }

        /// <summary>
        /// returns the index of the element
        /// </summary>
        public int Index { get; set; }

        public bool HasPrevious { get; set; }
        
        public bool HasNext { get; set; }
    }

    public class QueryableSearchManager<T>
    {
        private WebRuleManager<T> _customerWebRuleManager = new WebRuleManager<T>();
        Func<IQueryable<T>> _queryable;
        Func<string, Expression<Func<T, bool>>> _simpleSearchExpressionBuilder;

        public QueryableSearchManager(Func<IQueryable<T>> queryable, Func<string, Expression<Func<T, bool>>> simpleSearchExpressionBuilder)
        {
            _queryable = queryable;
            this._simpleSearchExpressionBuilder = simpleSearchExpressionBuilder;
        }

        public IQueryable<T> Search(string simpleSearch = null, string webRule = null)
        {
            if (!string.IsNullOrEmpty(simpleSearch))
            {
                // simple search
                Expression<Func<T, bool>> filter = _simpleSearchExpressionBuilder(simpleSearch);
                return this._queryable().Where(filter);
            }
            else if (!string.IsNullOrEmpty(webRule))
            {
                // advanced search
                return this._customerWebRuleManager.Search(this._queryable(), webRule);
            }
            else
            {
                return this._queryable();
            }
        }

        public string LoadCodeRuleSearchSettings(ThemeType theme = ThemeType.Gray, bool help = false)
        {
            return this._customerWebRuleManager.LoadSettings(theme, help);
        }

        public IQueryable<T> Query(ODataQueryOptions<T> query, string simpleSearch = null, string webRule = null)
        {
            return query.ApplyTo(this.Search(simpleSearch, webRule)).Cast<T>();
        }

        public NextItemArgs Next(int selectedIndex,  IDictionary<string, string> terms, ODataQueryOptions<T> query, string simpleSearch = null, string webRule = null, bool forward = true)
        {
            int index;
            var items = Query(query, simpleSearch, webRule).ToList();
            if (forward)
            {
                index = FindNext(items.Skip(selectedIndex + 1), terms);
                if (index >= 0)
                {
                    return new NextItemArgs
                    {
                        Index = selectedIndex + 1 + index,
                        HasNext = FindNext(items.Skip(selectedIndex + index + 2), terms) >= 0,
                        HasPrevious = FindNext(items.Take(selectedIndex + index + 1).Reverse(), terms) >= 0
                    };
                }
                else 
                {
                    return new NextItemArgs();
                }
            }
            else
            {
                index = FindNext(items.Take(selectedIndex).Reverse(), terms);
                if (index >= 0)
                {
                    return new NextItemArgs
                    {
                        Index = selectedIndex - 1 - index,
                        HasNext = FindNext(items.Skip(selectedIndex - index), terms) >= 0,
                        HasPrevious = FindNext(items.Take(selectedIndex - index - 1).Reverse(), terms) >= 0
                    };
                }
                else
                {
                    return new NextItemArgs();
                }
            }
        }

        private static int FindNext(IEnumerable<T> items, IDictionary<string, string> terms)
        {
            var properties = terms.Keys.Select(property => typeof(T).GetProperty(property))
                .ToDictionary(property => property.Name);

            var indexes = items.Select((item, i) =>
            {
                var condition = properties.Keys.All(property =>
                {
                    var value = properties[property].GetValue(item);
                    var term = System.Web.HttpUtility.UrlDecode(terms[property]);

                    if (value == null)
                    {
                        return false;
                    }
                    else if (value is string)
                    {
                        return ((string)value).StartsWith(term);
                    }
                    else if (value is Guid)
                    {
                        return ((Guid)value) == Guid.Parse(term);
                    }
                    else
                    {
                        try
                        {
                            var deserialized = Newtonsoft.Json.JsonConvert.DeserializeObject(term, properties[property].PropertyType);
                            return value.Equals(deserialized);
                        }
                        catch
                        {
                            return false;
                        }
                    }
                });
                return condition ? i : -1;
            });

            foreach (var index in indexes)
            {
                if (index >= 0)
                {
                    return index;
                }
            }

            return -1;
        }


    }

}