/* Module : Ajax */

/// <reference path="../../definitions/signalr.d.ts" />

/** low level functions to control network */

    function retrieveFromServer(func: () => JQueryXHR) {
        return Q(func())
            .fail(e => {
                // if the server is offline desconnect the application
                if (isOfflineError(e)) {
                    connection.disconnect();
                }

                return Q.reject(e);
            });
    }

    export function get(url: string, data?): Q.Promise<any> {
        return retrieveFromServer(() => $.get(url, data));
    }

    export function post(url: string, data?): Q.Promise<any> {
        // WebApi doesn't support native jquery parameter encode on the server,
        // thanks to http://weblog.west-wind.com/posts/2012/May/08/Passing-multiple-POST-parameters-to-Web-API-Controller-Methods
        return retrieveFromServer(() => {
            return $.ajax(
                {
                    url: url,
                    type: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(data),
                });
        });
    }

    export function fileDownload(url: string, data?): Q.Promise<any> {
        // for now uses the jquery fileDownload plugin
        return Q(<any>$.fileDownload(url, { data: data }))
            .fail(e => {
                // if the server is offline desconnect the application
                if (isOfflineError(e)) {
                    connection.disconnect();
                }

                return Q.reject(e);
            });
    }

    /** returns tru if the given error was returned from a request where the server
    was offline */
    export function isOfflineError(error) {
        return error.status === 0 || error.status === 404;
    }


    /* Module : Ajax.Connection */

    export module connection {

        /** when true the application will act as offline, even if the server is available */
        export var forceOffline = ko.observable(false);

        /** This class can be used to track throught it's single instance if the application is online or not */
        var disconected = ko.observable(false);
        var _reconectingPromise: Q.Promise<boolean> = null;

        export var isOnline = ko.computed(() => !forceOffline() && !disconected());

        export function online(ping: boolean = false): Q.Promise<boolean> {
            if (forceOffline()) {
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

        export function disconnect(): void {
            disconected(true);
            signalR.ping.stop();
        }

        export function reconnect(): Q.Promise<boolean> {
            if (!_reconectingPromise) {
                _reconectingPromise = Q($.get('ping.js'))
                    .then(() => {
                        disconected(false);
                        return true;
                    })
                    .fail(() => {
                        disconected(true);
                        signalR.ping.stop();
                        return false;
                    })
                    .finally(() => _reconectingPromise = null);
            }

            return _reconectingPromise;
        }

        /* add some additional code to detect when the application goes offline using SignalR,
        also tries to reconnect every 1min */
        module signalR {
            export var ping = $.connection('ping');

            ping
                .disconnected(() => {
                    disconected(true);

                    setTimeout(() => {
                        _reconectingPromise = Q(ping.start())
                            .then(() => {
                                disconected(false);
                                return true;
                            })
                            .fail(() => {
                                disconected(true);
                                return false;
                            })
                            .finally(() => _reconectingPromise = null);

                    }, 60000); // try to reconnect in one minute
                })
                .start();
        }

    }
