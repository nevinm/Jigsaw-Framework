/// <reference path="../definitions/require.d.ts" />
/// <reference path="lib/jasmine.d.ts" />

require.config({
    baseUrl: './scripts/src',
    paths: {
        "text": "../text",

        "codeeffects.control": "../codeeffects/codeeffects.min",
    },
});

define("jquery", [], () => $);

_.templateSettings['variable'] = 'rc';

/** this variable is written by the server on the page, and contains the address of all
the spec modules that should be ran */
declare var Specs: string[];

require(Specs, (...main) => {
    var jasmineEnv = jasmine.getEnv();
    jasmineEnv.updateInterval = 1000;

    //var trivialReporter = new (<any>jasmine).TrivialReporter();
    //jasmineEnv.addReporter(trivialReporter);
    //jasmineEnv.specFilter = trivialReporter.specFilter;

    var htmlReporter = new jasmine.HtmlReporter();
    jasmineEnv.addReporter(htmlReporter);
    jasmineEnv.specFilter = htmlReporter.specFilter;
    //jasmineEnv.addReporter(new jasmine.TapReporter()); // For Testling CI

    jasmineEnv.execute();

});

