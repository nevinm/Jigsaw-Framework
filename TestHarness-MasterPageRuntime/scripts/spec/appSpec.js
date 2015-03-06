/**
 *  @fileoverview Specs defined for the Core libraries
 *  @author Nishin
 */

define([], function (app) {
    'use strict';    
    
    describe("Core libraries", function () {       
        it("jQUery should be defined", function () {
            expect(window.$).toBeDefined();
        });
        it("Breeze should be defined", function () {
            expect(window.breeze).toBeDefined()
        });
        it("Knockout should be defined", function () {
            expect(window.ko).not.toEqual(undefined);
        });
        it("Kendo should be defined", function () {
            expect(window.kendo).not.toEqual(undefined);
        });
    });
});