/**
 *  @fileoverview Entry point of the TestHaress Javascript.
 *  Require JS will load this file first and excute this.
 *  @author Nishin
 */

(function () {
    'use strict';

    // Configure RequireJS to shim Jasmine
    require.config({
        baseUrl: '/scripts/src',
        paths: {
            'jasmine': '../lib/jasmine-2.0.0/jasmine',
            'jasmine-html': '../lib/jasmine-2.0.0/jasmine-html',
            'boot': '../lib/jasmine-2.0.0/boot'
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
    var specs = [
      '../spec/appSpec',
      '../spec/globalErrorCatchingSpec'
    ], audioElement;

    require(['boot', 'modules/core/global-error-catching'], function (boot, GlobalErrorCatching) {

        /**
        *   binding click event for the Force Error button.
        */
        document.getElementById('btn_force_error').onclick = function () {
            var e = new Error("This error is intentionally raised.");            
            throw e;
        };

        /**
        *   Initializing the Global Error Catching module for Test Harness.
        */
        initializeGlobalErrorCatching(GlobalErrorCatching);

        /**
        *   Loads Js/Css files
        *   @param filename Name of the file being loaded.
        *   @param filetype type of the file being loaded (css/js).
        */
        function loadJsCss(filename, filetype) {
            if (filetype == "js") { //if filename is a external JavaScript file
                var fileref = document.createElement('script')
                fileref.setAttribute("type", "text/javascript")
                fileref.setAttribute("src", filename)
            }
            else if (filetype == "css") { //if filename is an external CSS file
                var fileref = document.createElement("link")
                fileref.setAttribute("rel", "stylesheet")
                fileref.setAttribute("type", "text/css")
                fileref.setAttribute("href", filename)
            }
            if (typeof fileref != "undefined")
                document.getElementsByTagName("head")[0].appendChild(fileref)
        }

        /**
        *   Unloads Js/Css files
        *   @param filename Name of the file being unloaded.
        *   @param filetype type of the file being unloaded (css/js).
        */
        function removeJsCss(filename, filetype) {
            var targetelement = (filetype == "js") ? "script" : (filetype == "css") ? "link" : "none" //determine element type to create nodelist from
            var targetattr = (filetype == "js") ? "src" : (filetype == "css") ? "href" : "none" //determine corresponding attribute to test for
            var allsuspects = document.getElementsByTagName(targetelement)
            for (var i = allsuspects.length; i >= 0; i--) { //search backwards within nodelist for matching elements to remove
                if (allsuspects[i] && allsuspects[i].getAttribute(targetattr) != null && allsuspects[i].getAttribute(targetattr).indexOf(filename) != -1)
                    allsuspects[i].parentNode.removeChild(allsuspects[i]) //remove element by calling parentNode.removeChild()
            }
        }

        /**
        *   invoke load or unload files function checking the value of the checkbox
        *   @param e Event
        */
        var toggleScripts = function (e) {
            var checkbox = e.currentTarget;
            var url = checkbox.getAttribute("data-location");
            var varName = checkbox.getAttribute("data-variable");
            var isLoaded = checkbox.getAttribute("data-loaded");
            if (isLoaded == true || isLoaded == "true") {
                removeJsCss(url, 'css');
                checkbox.setAttribute("data-loaded", "false");
            } else {
                loadJsCss(url, 'css');
                checkbox.setAttribute("data-loaded", "true");
            }

        }
        /**
        *   Binding onchange event for the style checkboxes 
        */
        var checkboxScripts = document.getElementsByClassName('js-styles');
        for (var i = 0; i < checkboxScripts.length; i++) {
            var checkbox = checkboxScripts[i];
            checkbox.onchange = toggleScripts;
        }

        /**
        *   Binding onclick event for the style checkboxes.
        *   onclick, sample page will be loaded via Ajax
        */
        document.getElementById('btn_load_sample').onclick = function () {
            var demo_file = '/scripts/samplepage/typography.html';
            AjaxRequest.get({
                'url': demo_file,
                'onSuccess': function (req) {
                    document.getElementById('content-div').innerHTML = req.responseText;
                }
            });
        };

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

        /**
        *   Initializing the Global Error Catching module for Test Harness.
        */
        document.getElementById('btn_run_specs').onclick = function () {
            localStorage.setItem("jasmineRan", "true");
            location.reload();
        };
    });


    /**
    *   Initializing the Global Error Catching module for Test Harness.
    */
    function initializeGlobalErrorCatching(GlobalErrorCatching) {
        // dummy call back and Message module objects for Global Error Catching module.
        log('Mocked Messages.MessageLevel.Error');
        var Messages = {
            MessageLevel: {
                Error: 0
            }
        };
        log('Mocked CoreViewModel.messageQueue');
        var MessageQueue = {
            add: function (error) {
                log(error.body);
                if (document.getElementById('chk_alert_error').checked == true)
                    alert(error.body);
            }
        }

        var globalErrorCatching = new GlobalErrorCatching.Module(MessageQueue, Messages);
    }


    //Sound Element addition
    function soundFileAdd() {
        audioElement = $("#sound-container audio")[0];
        $("#SoundList").change(function () {
            $("#content-div").html("");
            $("#sound-container").css({
                "display": "table"
            });
            $("#sound-name").html("Play "+ $(this).find('option:selected')[0].text);
            audioElement.src = ($(this).find('option:selected')[0].value) + ".mp3";
            $("#sound-container audio").on("error", function (e) {
                audioElement.src = ($(this).find('option:selected')[0].value) + ".ogg";
            });
            audioElement.play();
        });
    }
    soundFileAdd();

    //Redirecting to glimpse page.
    $("#btn_glimpse").click(function () {
        window.location = document.URL +"Glimpse.axd";
    })
})();