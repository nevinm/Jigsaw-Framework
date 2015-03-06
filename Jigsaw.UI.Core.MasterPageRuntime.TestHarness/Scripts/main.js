﻿/**
 *  @fileoverview Entry point of the TestHaress Javascript.
 *  Require JS will load this file first and excute this.
 *  @author Nishin
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
    var specs = [
      'Specs/appSpec',
      'Specs/globalErrorCatchingSpec'
    ];


    require(['boot', 'Modules/Core/global-error-catching', 'Modules/Core/messages', 'plugins/smartadmin/SmartNotification'], function (boot, GlobalErrorCatching) {
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
        soundUIReponse(Messages);
        /**
        *   Binding onclick event for the style checkboxes.
        *   onclick, sample page will be loaded via Ajax
        */
        document.getElementById('btn_load_sample').onclick = function () {
            if (window.jQuery) {
                var demo_file = '/scripts/samplepage/typography.html';
                $.ajax({
                    url: demo_file,
                    context: document.body
                }).done(function (response) {
                    log("Sample page loaded.");
                    document.getElementById('content-div').innerHTML = response;
                });
            } else {
                alert("jQuery is required for this action.");
                log("jQuery is required for this action.");
            }
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

        /**
        *   Setting/Unsetting ENV variable onchange event of the select box
        */
        /*document.getElementById('sel_environment').onchange = function (e) {
            window.ENV = e.currentTarget.value;
            log('Environment variable set: '+window.ENV);
        }*/
       

    });


    /**
    *   Initializing the Global Error Catching module for Test Harness.
    */
    function initializeGlobalErrorCatching(GlobalErrorCatching) {
        // dummy call back and Message module objects for Global Error Catching module.
        log('Mocked Messages.MessageLevel.Error.');
        var Messages = {
            MessageLevel: {
                Error: 0
            }
        };
        log('Mocked CoreViewModel.messageQueue.');
        var MessageQueue = {
            add: function (error) {
                log(error.body);
                if (document.getElementById('chk_alert_error').checked == true)
                    alert(error.body);
            }
        }

        var globalErrorCatching = new GlobalErrorCatching.Module(MessageQueue, Messages);
    }

    ////Sound Element addition
    //function soundFileAdd() {
    //    $("#SoundList").prepend("<option value='' disabled selected>Select your option</option>")
    //    audioElement = $("#sound-container audio")[0];
    //    $("#SoundList").change(function () {
    //        $("#content-div").html("");
    //        $("#sound-container").css({
    //            "display": "table"
    //        });
    //        $("#sound-name").html("Play " + $(this).find('option:selected')[0].text);
    //        audioElement.src = ($(this).find('option:selected')[0].value) + ".mp3";
    //        $("#sound-container audio").on("error", function (e) {
    //            audioElement.src = ($(this).find('option:selected')[0].value) + ".ogg";
    //        });
    //        audioElement.play();
    //    });
    //}
    //soundFileAdd();
    function soundUIReponse(Messages) {
        Messages.bigBox({ title: 'From ribbon', body: 'from ribbon', level: Messages.MessageLevel.Error });
    }
    
    //Redirecting to glimpse page.
    $("#btn_glimpse").click(function () {
        window.location = document.URL + "Glimpse.axd";
    })

})();