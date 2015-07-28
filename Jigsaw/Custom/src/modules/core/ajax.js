/* Module : Ajax */
define(["require", "exports"], function(require, exports) {
    /// <reference path="../../definitions/signalr.d.ts" />
    /** low level functions to control network */
    function retrieveFromServer(func) {
        return Q(func()).fail(function (e) {
            // if the server is offline desconnect the application
            if (exports.isOfflineError(e)) {
                connection.disconnect();
            }

            return Q.reject(e);
        });
    }

    function get(url, data) {
        return retrieveFromServer(function () {
            return $.get(url, data);
        });
    }
    exports.get = get;

    function post(url, data) {
        // WebApi doesn't support native jquery parameter encode on the server,
        // thanks to http://weblog.west-wind.com/posts/2012/May/08/Passing-multiple-POST-parameters-to-Web-API-Controller-Methods
        return retrieveFromServer(function () {
            return $.ajax({
                url: url,
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(data)
            });
        });
    }
    exports.post = post;

    function fileDownload(url, data) {
        // for now uses the jquery fileDownload plugin
        return Q($.fileDownload(url, { data: data })).fail(function (e) {
            // if the server is offline desconnect the application
            if (exports.isOfflineError(e)) {
                connection.disconnect();
            }

            return Q.reject(e);
        });
    }
    exports.fileDownload = fileDownload;

    /** returns tru if the given error was returned from a request where the server
    was offline */
    function isOfflineError(error) {
        return error.status === 0 || error.status === 404;
    }
    exports.isOfflineError = isOfflineError;

    /* Module : Ajax.Connection */
    (function (connection) {
        /** when true the application will act as offline, even if the server is available */
        connection.forceOffline = ko.observable(false);

        /** This class can be used to track throught it's single instance if the application is online or not */
        var disconected = ko.observable(false);
        var _reconectingPromise = null;

        connection.isOnline = ko.computed(function () {
            return !connection.forceOffline() && !disconected();
        });

        function online(ping) {
            if (typeof ping === "undefined") { ping = false; }
            if (connection.forceOffline()) {
                return Q(false);
            } else if (!disconected()) {
                return Q(true);
            } else if (this._reconectingPromise) {
                return _reconectingPromise;
            } else if (ping) {
                return reconnect();
            } else {
                return Q(false);
            }
        }
        connection.online = online;

        function disconnect() {
            disconected(true);
            signalR.ping.stop();
        }
        connection.disconnect = disconnect;

        function reconnect() {
            if (!_reconectingPromise) {
                _reconectingPromise = Q($.get('ping.js')).then(function () {
                    disconected(false);
                    return true;
                }).fail(function () {
                    disconected(true);
                    signalR.ping.stop();
                    return false;
                }).finally(function () {
                    return _reconectingPromise = null;
                });
            }

            return _reconectingPromise;
        }
        connection.reconnect = reconnect;

        /* add some additional code to detect when the application goes offline using SignalR,
        also tries to reconnect every 1min */
        var signalR;
        (function (signalR) {
            signalR.ping = $.connection('ping');

            signalR.ping.disconnected(function () {
                disconected(true);

                setTimeout(function () {
                    _reconectingPromise = Q(signalR.ping.start()).then(function () {
                        disconected(false);
                        return true;
                    }).fail(function () {
                        disconected(true);
                        return false;
                    }).finally(function () {
                        return _reconectingPromise = null;
                    });
                }, 60000); // try to reconnect in one minute
            }).start();
        })(signalR || (signalR = {}));
    })(exports.connection || (exports.connection = {}));
    var connection = exports.connection;
});
