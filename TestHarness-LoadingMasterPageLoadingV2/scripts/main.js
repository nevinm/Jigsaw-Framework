/**
 *  @fileoverview Entry point of the TestHaress Javascript.
 *  Require JS will load this file first and excute this.
 *  @author Nishin
 */

(function () {
    'use strict';

    /*
    *   jQuery is needed for loading resources, ensuring jquerying is loaded or not.
    **/
    if ($ && typeof ($.ajax) == 'function') {
        loadResources();
    } else {
        alert("jQuery is required for loading files.");
        log("jQuery is required for loading files.");
    }

    /*
    *   Initiate the download process using html5Loader library.
    **/
    function loadResources() {
        // library used for loading files.
        if ($.html5Loader && typeof ($.html5Loader) == 'function') {
            $.html5Loader({
                filesToLoad: files, // this could be a JSON or simply a javascript object
                onBeforeLoad: function () {
                    log('Starting dowload process.');
                },
                onComplete: function () {
                    log('Completed dowload process.');
                    $('#fileLoadingStatus').html("All resources have been downloaded.");
                    $('#fileNameLoading').html("");
                },
                onElementLoaded: updateProgressBar,
                onUpdate: function (percentage) {
                    setProgress('#overall-progress', percentage);
                }
            });
        } else {
            alert("Html5Loader is required for loading files.");
            log("Html5Loader is required for loading files.");
        }
    }
    /*
    *   Calculate the progress and invokes  setFileNameBeingDownloaded & setProgress to make the changes in the UI.
    *   @param obj returned from the library, html5Loader.js
    *   @param elm basically this will the response text from the server for each request.
    **/
    function updateProgressBar(obj, elm) {
        var selector = '#' + obj.category + '-files-progress';
        var downloadedSize = $(selector).data('downloaded-size');
        downloadedSize += obj.size;
        $(selector).data('downloaded-size', downloadedSize);
        var updatedProgress = Math.ceil((downloadedSize / eval("files.size_" + obj.category + "_files")) * 100);
        setProgress(selector, updatedProgress);
        setFileNameBeingDownloaded(obj);
    }
    /*
    *   Updates the file name of file being downloaded now.
    *   @param obj returned from the library, html5Loader.js
    **/
    function setFileNameBeingDownloaded(obj) {
        var fileName = obj.source.substring(obj.source.lastIndexOf('\\') + 1);;
        $('#fileNameLoading').html(fileName);
    }
    /*
    *   Updates the progress in the UI.
    *   @param selector jQuery selector of the progress bar, here it is the ID.
    *   @param updatedProgress updated progress value.
    **/
    function setProgress(selector, updatedProgress) {
        $(selector).html(parseInt(updatedProgress) + "%")
        $(selector).css({ "width": (updatedProgress + "%") });
        $(selector).attr("aria-valuenow", updatedProgress);
        $(selector).attr("aria-valuetransitiongoal", updatedProgress);
    }

   

})();