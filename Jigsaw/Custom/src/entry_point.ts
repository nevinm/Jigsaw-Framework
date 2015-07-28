/// <reference path="definitions/_definitions.d.ts" />
/// <reference path="definitions/Q.d.ts" />
/// <reference path="definitions/jquery.d.ts" />
/// <reference path="definitions/jqueryui.d.ts" />

/// <reference path="definitions/require.d.ts" />

// Post build commandB
// node "$(ProjectDir)scripts\libs\r.js" - o "$(ProjectDir)scripts\src\_build\build.json"
(function () {

    require.config({
        baseUrl: './scripts/src',
        paths: {
            "text": "../text",

            "codeeffects.control": "../codeeffects/codeeffects.min",
            "jquery-ui": "../smartadmin/libs/jqueryui-ui-1.10.3.min"

            // these libraries are added automatically, so they don't need to be referenced
            //"jquery": '../libs/jquery-2.0.3',
            //"Q": '../Q',
            //"underscore": "../underscore",
            //"backbone": "../backbone",
            //"backbone.marionette": "../backbone.marionette",
            //"knockout": "../knockout-2.2.1",
            //"kendo": "../kendo/kendo.web",
            //"knockoutKendo": "../knockout-kendo",
        },
    });

    define("jquery", [], () => $);

    if (JigsawConfig.Mobile) {
        // If the mobile framework should be loaded then redirect all request to it's modules

        require.config({
            map: {
                '*': {
                    "app-desktop": "app-mobile",
                    "data-desktop": "data-mobile",

                    // template mappings
                    "templates/app": "templates/app-mobile",
                    "templates/data": "templates/data-mobile",
                    'templates/data.customer': 'templates/data.customer-mobile',
                }
            },
        });

    }

    // Configure Underscore templates to use a global variable, instead of using a with
    // block. This should increase the performance.
    // IMPORTANT!! all templates will use the 'rc' variable by default to access the data passed
    _.templateSettings['variable'] = 'rc';

    checkFingerPrints();

    require(['app'].concat(JigsawConfig.AvailableModules), (app) => {
        var modules = _.toArray(arguments);

        _.each(modules, m => {
            if (m['__init__']) {
                m['__init__']();
            }
        });
        
        // initialize the history after all module-files are loaded and initialized
        app.history.start();
    });



    function checkFingerPrints() {
        var FINGERPRINT = 'FingerPrint';
        var fingerPrint = localStorage.getItem(FINGERPRINT);
        if (fingerPrint !== JigsawConfig.FingerPrint) {
            localStorage.clear();
            console.log('application finger print changed, all caches cleared');
        }
        localStorage.setItem(FINGERPRINT, JigsawConfig.FingerPrint);
    }

})();


