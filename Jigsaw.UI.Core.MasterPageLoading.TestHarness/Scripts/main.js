/**
 *  @fileoverview Entry point of the TestHaress Javascript.
 *  Require JS will load this file first and excute this.
 */

(function () {
    'use strict';

    // Configure RequireJS to shim Jasmine
    require.config({
        baseUrl: '/scripts',
        paths: {
            'jasmine': 'jasmine/jasmine',
            'jasmine-html': 'jasmine/jasmine-html',
            'boot': 'jasmine/boot'
        },
        shim: {
            'jasmine': {
                exports: 'window.jasmineRequire'
            },
            'jasmine-html': {
                deps: ['jasmine'],
                exports: 'window.jasmineRequire'
            },
            'boot': {
                deps: ['jasmine', 'jasmine-html'],
                exports: 'window.jasmineRequire'
            }
        }
    });

    /**
    *   Define all of your specs here. These are RequireJS modules.
    */
    var specs = [];


    require(['boot', 'Core/appcache'], function (boot, AppCache) {

        /**
        *   Initializing the App Cache module for Test Harness.
        */
        initializeAppCache(AppCache);

        /**
        *   Jasmine runs only once per page load.
        *   on cliking again of the "Run Tests" button leads to spec duplication.
        *   To overcome this, Reloads the page after setting a flag variable.
        *   On page load, Jasmine will be ran, if the flag is set in the localStorage.
        */
        if (localStorage.getItem("jasmineRan") == "true") {
            require(specs, function () {
                // Initialize the HTML Reporter and execute the environment (setup by `boot.js`)
                boot.htmlReporter.initialize();
                boot.env.execute();
                localStorage.removeItem("jasmineRan");
            });
        }
    });


    /**
    *   Initializing the App Cache module for Test Harness.
    */
    function initializeAppCache(AppCache) {
        var ReportProgress = {
            Show: function (progWidth) {
                var progressBar = document.getElementById("overall-progress");
                var fileLoadingStatus = document.getElementById("fileLoadingStatus");
                var finalStatus = document.getElementById("finalStatus");
                progressBar.setAttribute("style", "width:" + progWidth + "%");
                progressBar.innerHTML = progWidth + "%";
                if (progWidth >= 100) {
                    progWidth = 100;
                    fileLoadingStatus.setAttribute("style", "visibility:hidden");
                    finalStatus.setAttribute("style", "visibility:visible");
                }
            }
        }
        var appCache = new AppCache.ReportProgress(ReportProgress);        
    }

})();