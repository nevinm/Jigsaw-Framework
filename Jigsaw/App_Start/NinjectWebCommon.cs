using Jigsaw.Controllers;
using Jigsaw.Data.Northwind;
using Jigsaw.Notification;
using Jigsaw.Server.Infrastructure;
using Jigsaw.Server.Notification;

[assembly: WebActivator.PreApplicationStartMethod(typeof(Jigsaw.App_Start.NinjectWebCommon), "Start")]
[assembly: WebActivator.ApplicationShutdownMethodAttribute(typeof(Jigsaw.App_Start.NinjectWebCommon), "Stop")]

namespace Jigsaw.App_Start
{
    using System;
    using System.Web;

    using Microsoft.Web.Infrastructure.DynamicModuleHelper;

    using Ninject;
    using Ninject.Web.Common;

    public static class NinjectWebCommon 
    {
        private static readonly Bootstrapper bootstrapper = new Bootstrapper();

        public static IKernel Kernel;

        /// <summary>
        /// Starts the application
        /// </summary>
        public static void Start()
        {
            
            DynamicModuleUtility.RegisterModule(typeof(OnePerRequestHttpModule));
            DynamicModuleUtility.RegisterModule(typeof(NinjectHttpModule));
            bootstrapper.Initialize(CreateKernel);

            // todo: find a way to access ninject type builder from a webapi controller
            Kernel = bootstrapper.Kernel;
        }
        
        /// <summary>
        /// Stops the application.
        /// </summary>
        public static void Stop()
        {
            bootstrapper.ShutDown();
        }
        
        /// <summary>
        /// Creates the kernel that will manage your application.
        /// </summary>
        /// <returns>The created kernel.</returns>
        private static IKernel CreateKernel()
        {
            var kernel = new StandardKernel();
            try
            {
                kernel.Bind<Func<IKernel>>().ToMethod(ctx => () => new Bootstrapper().Kernel);
                kernel.Bind<IHttpModule>().To<HttpApplicationInitializationHttpModule>();

                RegisterServices(kernel);
                return kernel;
            }
            catch
            {
                kernel.Dispose();
                throw;
            }
        }

        /// <summary>
        /// Load your modules or register your services here!
        /// </summary>
        /// <param name="kernel">The kernel.</param>
        private static void RegisterServices(IKernel kernel)
        {
            kernel.Bind<IUserPreferencesStorage>().To<UserPreferencesStorage>().InSingletonScope();
            kernel.Bind<ICacheManifestService>().To<CacheManifestService>().InSingletonScope();

            kernel.Bind<INotificationService>().To<NotificationService>().InSingletonScope();

            kernel.Bind<NorthwindRepository>().To<NorthwindNotificationRepository>();
        }
    }
}
