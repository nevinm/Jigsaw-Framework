/// <reference path="../definitions/knockout.d.ts" />

import app = require('../app')

export function Qwait(promise: Q.Promise<any>, timeout = 300) {
    var completed = false;
    waitsFor(() => completed, 'promise resolved', timeout);
    return promise.finally(() => completed = true);
}

/** returns a new empty view */
export function view() {
    return new app.Marionette.View({ template: () => '<div>' });
}
