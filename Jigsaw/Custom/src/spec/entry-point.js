/// <reference path="../definitions/require.d.ts" />
/// <reference path="lib/jasmine.d.ts" />
require.config({
    baseUrl: './scripts/src',
    paths: {
        "text": "../text",
        "codeeffects.control": "../codeeffects/codeeffects.min"
    }
});

define("jquery", [], function () {
    return $;
});

_.templateSettings['variable'] = 'rc';


require(Specs, function () {
    var main = [];
    for (var _i = 0; _i < (arguments.length - 0); _i++) {
        main[_i] = arguments[_i + 0];
    }
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
