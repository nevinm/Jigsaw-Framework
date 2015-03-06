define(["exports"], function (exports) {
    // Some of this is from 
    // Eric Bidelman's Article "A Beginner's Guide to Using the Application Cache"
    // http://www.html5rocks.com/en/tutorials/appcache/beginner/
    // also this: http://www.whatwg.org/specs/web-apps/current-work/

    exports.ReportProgress = (function () {
        function Module(ReportProgress) {
            reportProgress = ReportProgress;
            //Checking for appStatus is idle/updateReady or not. If idle, nothing to update.
            if (localStorage.getItem('cachedStatus') == '1' || localStorage.getItem('cachedStatus') == '4') {
                noUpdateEvent();
            }
        }
        return Module;
    })();

    // appcahce stuff
    var appCache = window.applicationCache;
    var cacheProg = 0;
    var reportProgress;

    // fires every time a file is loaded
    function progressEvent(e) {

        // update the percent
        totalfiles = Number(e.total);
        cacheProg = cacheProg + 1;
        var progWidth = Math.round(cacheProg / totalfiles * 100);

        if (progWidth >= 100)
            progWidth = 100;

        reportProgress != null ? reportProgress.Show(progWidth) : null;

        // when it's done, run the loading done function
        if (cacheProg >= totalfiles) {
            reportProgress != null ? reportProgress.Show(100) : null;
        }
    }

    function noUpdateEvent(e) {
        reportProgress != null ? reportProgress.Show(100) : null;
    }

    appCache.addEventListener('progress', progressEvent, false);
    appCache.addEventListener('cached', noUpdateEvent, false);
    appCache.addEventListener('noupdate', noUpdateEvent, false);
    localStorage.setItem("cachedStatus", appCache.status);
});