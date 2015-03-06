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
    });
});