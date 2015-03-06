using System.Collections.Generic;
using Jigsaw.Server.Model;

namespace Jigsaw.Server.Infrastructure
{
    public interface IUserPreferencesStorage
    {
        UserPreferences this[string userName] { get; set; }
    }

    public class UserPreferencesStorage : IUserPreferencesStorage
    {
        private readonly Dictionary<string, UserPreferences> _storage = new Dictionary<string, UserPreferences>();

        #region Implementation of IUserPreferencesStorage

        public UserPreferences this[string key]
        {
            get
            {
                if (!_storage.ContainsKey(key))
                {
                    _storage.Add(key, new UserPreferences());
                }

                return _storage[key];
            }
            set { _storage[key] = value; }
        }

        #endregion
    }
}