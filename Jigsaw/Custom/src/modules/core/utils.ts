/* Module : Utils */

/** remove the given element from the array */
export function remove<T>(array: T[], item: T): void {
    var index = _.indexOf(array, item);
    if (index >= 0) {
        array.splice(index, 1);
    }
}

/* executes the given function asynchronously */
export function async(expr: Function) {
    if (window.setImmediate) { window.setImmediate(expr); }
    else { window.setTimeout(expr, 0); }
}