using System.Collections.Generic;
using System.Security.Principal;
using System.Web.Mvc;
using System.Web.Security;
using Jigsaw.Server.Infrastructure;
using Jigsaw.Server.Model;
using WebMatrix.WebData;
using Jigsaw.Filters;
using Jigsaw.Models;

namespace Jigsaw.Controllers
{
    [Authorize]
    [InitializeSimpleMembership]
    public class AccountController : Controller
    {
        private readonly IUserPreferencesStorage _userPreferencesStorage;

        public AccountController(IUserPreferencesStorage userPreferencesStorage)
        {
            _userPreferencesStorage = userPreferencesStorage;
        }

        [AllowAnonymous]
        public ActionResult Login(string returnUrl)
        {
            ViewBag.ReturnUrl = returnUrl;
            return View();
        }

        [HttpPost]
        [AllowAnonymous]
        //[ValidateAntiForgeryToken]
        public ActionResult Login(LoginModel model, string returnUrl)
        {
            bool success = false;
            if (ModelState.IsValid)
            {
                if (model.UserName == "Demo" && model.Password == "Demo" && !WebSecurity.UserExists("Demo"))
                {
                    WebSecurity.CreateUserAndAccount("Demo", "Demo");
                }

                success = WebSecurity.Login(model.UserName, model.Password, persistCookie: model.RememberMe);
            }

            if (Request.IsAjaxRequest())
            {
                if (success)
                {
                    // TODO consider returning more info like privileges
                    return Json(new
                                    {
                                        success=true,
                                        modules="",
                                        preferences = _userPreferencesStorage[model.UserName]
                                    });
                }
                else 
                {
                    return Json(new
                                {
                                    success,
                                    errors =new[] {"The user name or password provided is incorrect."}
                                });
                }
            }
            else
            {
                // If we got this far, something failed, redisplay form
                if (!success)
                    ModelState.AddModelError("", "The user name or password provided is incorrect.");
                return View(model);
            }
        }

        /// <summary>
        /// stores preferences for the current user
        /// </summary>
        /// <param name="preferences"></param>
        /// <returns></returns>
        [HttpPost]
        public ActionResult Preferences(UserPreferences preferences)
        {
            _userPreferencesStorage[User.Identity.Name] = preferences;

            return Json(true);
        }

        /// <summary>
        /// log out and update user preferences
        /// </summary>
        /// <param name="preferences"></param>
        /// <returns></returns>
        [HttpPost]
        public ActionResult LogOff(UserPreferences preferences)
        {
            // store user preferences...
            _userPreferencesStorage[User.Identity.Name] = preferences;

            WebSecurity.Logout();

            return Json(new
                            {
                                success = true,
                                preferences
                            });
        }
        
        [AllowAnonymous]
        public ActionResult Register()
        {
            return View();
        }
        
        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public ActionResult Register(RegisterModel model)
        {
            if (ModelState.IsValid)
            {
                // Attempt to register the user
                try
                {
                    WebSecurity.CreateUserAndAccount(model.UserName, model.Password);
                    WebSecurity.Login(model.UserName, model.Password);
                    return RedirectToAction("Index", "Home");
                }
                catch (MembershipCreateUserException e)
                {
                    ModelState.AddModelError("", ErrorCodeToString(e.StatusCode));
                }
            }

            // If we got this far, something failed, redisplay form
            return View(model);
        }

        #region Helpers

        private static string ErrorCodeToString(MembershipCreateStatus createStatus)
        {
            // See http://go.microsoft.com/fwlink/?LinkID=177550 for
            // a full list of status codes.
            switch (createStatus)
            {
                case MembershipCreateStatus.DuplicateUserName:
                    return "User name already exists. Please enter a different user name.";

                case MembershipCreateStatus.DuplicateEmail:
                    return "A user name for that e-mail address already exists. Please enter a different e-mail address.";

                case MembershipCreateStatus.InvalidPassword:
                    return "The password provided is invalid. Please enter a valid password value.";

                case MembershipCreateStatus.InvalidEmail:
                    return "The e-mail address provided is invalid. Please check the value and try again.";

                case MembershipCreateStatus.InvalidAnswer:
                    return "The password retrieval answer provided is invalid. Please check the value and try again.";

                case MembershipCreateStatus.InvalidQuestion:
                    return "The password retrieval question provided is invalid. Please check the value and try again.";

                case MembershipCreateStatus.InvalidUserName:
                    return "The user name provided is invalid. Please check the value and try again.";

                case MembershipCreateStatus.ProviderError:
                    return "The authentication provider returned an error. Please verify your entry and try again. If the problem persists, please contact your system administrator.";

                case MembershipCreateStatus.UserRejected:
                    return "The user creation request has been canceled. Please verify your entry and try again. If the problem persists, please contact your system administrator.";

                default:
                    return "An unknown error occurred. Please verify your entry and try again. If the problem persists, please contact your system administrator.";
            }
        }

        #endregion
    }
}
