/**
 *  @fileoverview Specs defined for the Global Error Catching
 *  @author Nishin
 */

define(['modules/core/global-error-catching'], function (GlobalErrorCatching) {
    'use strict';
    describe("Global Error Catching", function () {
        beforeEach(function () {
            
        });
        it("Error handler should be defined", function () {
            expect(window.onerror).not.toBeNull();;
        });
        it("and error handler should be function", function () {
            expect(typeof (window.onerror)).toEqual('function');
        });
    });
});