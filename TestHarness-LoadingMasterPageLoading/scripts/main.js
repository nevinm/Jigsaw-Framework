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

    // Define all of your specs here. These are RequireJS modules.
    var specs = [
      '../spec/appSpec'
    ];
    var disabledCheckBox = [];
    // Load Jasmine - This will still create all of the normal Jasmine browser globals unless `boot.js` is re-written to use the
    // AMD or UMD specs. `boot.js` will do a bunch of configuration and attach it's initializers to `window.onload()`. Because
    // we are using RequireJS `window.onload()` has already been triggered so we have to manually call it again. This will
    // initialize the HTML Reporter and execute the environment.
    require(['boot'], function (boot) {
        var jasmineRan, currentProgress = 0, updatedProgress,
            totalCheckedJS = $('#chklstScripts :checkbox:checked').length, totalStylesheetIncluded,
            totalFilesLoaded = 0, fileName, fileNameElem, updatedThemeProgress, currentthemeProgress;
        window.onerror = function (e) {
            log(e);
        }
       
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

        function removeJsCss(filename, filetype) {
            var targetelement = (filetype == "js") ? "script" : (filetype == "css") ? "link" : "none" //determine element type to create nodelist from
            var targetattr = (filetype == "js") ? "src" : (filetype == "css") ? "href" : "none" //determine corresponding attribute to test for
            var allsuspects = document.getElementsByTagName(targetelement)
            for (var i = allsuspects.length; i >= 0; i--) { //search backwards within nodelist for matching elements to remove
                if (allsuspects[i] && allsuspects[i].getAttribute(targetattr) != null && allsuspects[i].getAttribute(targetattr).indexOf(filename) != -1)
                    allsuspects[i].parentNode.removeChild(allsuspects[i]) //remove element by calling parentNode.removeChild()
            }
        }

        var toggleScripts = function (e) {
            var checkbox = e.currentTarget;
            var url = checkbox.getAttribute("data-location");
            var varName = checkbox.getAttribute("data-variable");
            if (checkbox.checked == false) {
                removeJsCss(url, 'css');
            } else {
                loadJsCss(url, 'css');
            }
        }

        var checkboxScripts = document.getElementsByClassName('js-styles');
        for (var i = 0; i < checkboxScripts.length; i++) {
            var checkbox = checkboxScripts[i];
            checkbox.onchange = toggleScripts;
        }

        if (localStorage.getItem("jasmineRan") == "true") {
            require(specs, function () {
                // Initialize the HTML Reporter and execute the environment (setup by `boot.js`)
                boot.htmlReporter.initialize();
                boot.env.execute();
                localStorage.removeItem("jasmineRan");
            });
        }

        //For checking if the required files are checked/nonchecked, give an alert.
        var checkBoxElementParent = document.getElementById("chklstScripts"),
        checkBoxElement = checkBoxElementParent.getElementsByTagName("input");
        function EnableDisableToolTip(e) {
            if (e.currentTarget.checked) {
            }
            else {
                alert("These files are required to maintain functionality for this project.")
            }
        }
        for (i = 0; i < checkBoxElement.length; i++) {
            checkBoxElement[i].addEventListener("click", EnableDisableToolTip);
        }

        //Function to update the progressbar.
        function updateProgressBar(currentElem, fileName,totalChecked) {
            updatedProgress = $("#" + currentElem).attr("data-updated-progress");
            updatedProgress = parseInt(updatedProgress) + (100 / totalChecked);
            $("#" + currentElem).html((updatedProgress).toFixed(2) + "%")
            $("#" + currentElem).css({ "width": (updatedProgress + "%") });
            $("#" + currentElem).css({ "aria-valuenow": (updatedProgress + "%") });
            $("#" + currentElem).attr({ "aria-valuetransitiongoal": (updatedProgress) });
            $("#" + currentElem).attr("data-updated-progress", updatedProgress);
        }

        //Progress Bar checking for the loaded files.
        function scriptLoadCheck() {
            var repeatedProgressChecking = setInterval(function () {
                var testFunction;
                for (i = 0; i < totalCheckedJS; i++) {
                    fileNameElem = $('#chklstScripts :checkbox:checked').parent().find("label");
                    fileName = fileNameElem[i].innerHTML;
               
                    switch (fileName) {
                        case "breeze.min.js":
                            testFunction = breeze;
                            break;
                        case "jquery-2.0.3.js":
                            testFunction = $;
                            break;
                        case "kendo.all.js":
                            testFunction = kendo;
                            break;
                        case "knockout-3.1.0.js":
                            testFunction = ko;
                            break;
                        case "q.js":
                            testFunction = Q;
                            break;
                        case "underscore.js":
                            testFunction = _;
                            break;
                        case "consolelog.js":
                            testFunction = log;
                            break;
                        default:
                            testFunction = false;
                            break;
                    }
                    if (testFunction) {
                        updateProgressBar("core-files-progress", fileName, totalCheckedJS);
                        totalFilesLoaded++;
                        totalProgressUpdate();
                    }
                    else {
                        log(testFunction+" is not defined, please add the corresponding file needed.")
                    }
                    var updatedJSProgress = $("#core-files-progress").attr("data-updated-progress");
                    if (Math.ceil(updatedJSProgress) >= 100) {
                        clearInterval(repeatedProgressChecking);
                        $("#core-files-progress").html("100%");
                        $("#fileNameStatus").html("");
                        $("#fileNameLoading").html("Completed Loading " + totalCheckedJS + " files.");
                    }
                    //No js files selected.
                    if (!totalCheckedJS) {
                        $("#fileNameStatus").html("");
                        $("#fileNameLoading").html("Nothing to load");
                    }
                }
            },200)
        };

        //Function to check the stylesheet loading.
        function styleSheetLoadCheck() {
                var i, styleSheetName, styleSheetPath, styleSheetLoaded, styleSheetNameTotal = [],
                styleSheetLoadedTotal = [], cssChecked = [];
                totalStylesheetIncluded = $('#chklstStyles :checkbox:checked').parent().length;
            //Checking of checked stylesheets
            for (i = 0; i < totalStylesheetIncluded; i++) {
                var styleSheetElem = $('#chklstStyles :checkbox:checked')
                styleSheetName = styleSheetElem[i].value.split('/').pop();
                styleSheetNameTotal[styleSheetName] = styleSheetName;
            }

            //Checking of loaded stylesheets to DOM
            for (i = 0; i < document.styleSheets.length; i++) {
                styleSheetPath = document.styleSheets[i].href;
                styleSheetLoaded = styleSheetPath.split('/').pop();
                if (styleSheetNameTotal[styleSheetLoaded + ""]) {
                    updateProgressBar("core-themes-progress", styleSheetLoaded, totalStylesheetIncluded);
                    totalFilesLoaded++;
                    totalProgressUpdate();
                }
            }
            updatedThemeProgress = $("#core-themes-progress").attr("data-updated-progress");
            if (Math.ceil(updatedThemeProgress) >= 100) {
                $("#core-themes-progress").html("100%");
                $("#themeNameStatus").html("");
                $("#themeNameLoading").html("Completed Loading " + totalStylesheetIncluded + " files.");
            }
            //No Style sheets selected.
            if (!totalStylesheetIncluded) {
                $("#themeNameStatus").html("");
                $("#themeNameLoading").html("Nothing to load");
            }
        }

        //Function to update the totalProgress bar simultaneously
        function totalProgressUpdate() {
            var totalFiles = totalCheckedJS + totalStylesheetIncluded,
            totalProgressPercent = $("#overall-progress").attr("data-updated-progress");
            totalProgressPercent = parseInt(totalProgressPercent) + (100 / totalFiles);
            $("#overall-progress").html((totalProgressPercent).toFixed(2) + "%")
            $("#overall-progress").css({ "width": (totalProgressPercent + "%") });
            $("#overall-progress").css({ "aria-valuenow": (totalProgressPercent + "%") });
            $("#overall-progress").attr({ "aria-valuetransitiongoal": (totalProgressPercent) });
            $("#overall-progress").attr("data-updated-progress", totalProgressPercent);
            totalProgressPercent = $("#overall-progress").attr("data-updated-progress");
            if (Math.ceil(totalProgressPercent) >= 100) {
                $("#overall-progress").html("100%");
                $("#overall-progress").css("width", "100%");
                $("#finalStatus").css({
                    "display": "none"
                });
                $("#finalLoading").css({
                    "display": "block"
                });
            }
        }
    styleSheetLoadCheck();
    scriptLoadCheck();
    });
})();