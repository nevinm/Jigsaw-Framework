define([], function (app) {
    'use strict';
    beforeEach(function () {
        
    });
    
    describe("Core libraries", function () {
        it("jQUery should be defined", function () {
            expect(window.$).not.toEqual(undefined);
        });
        it("Breeze should be defined", function () {
            expect(window.breeze).not.toEqual(undefined);
        });
        it("Knockout should be defined", function () {
            expect(window.ko).not.toEqual(undefined);
        });
        it("Kendo should be defined", function () {
            expect(window.kendo).not.toEqual(undefined);
        });
    });
});