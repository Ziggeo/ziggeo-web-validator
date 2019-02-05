const GetOpt = require("node-getopt");
const AATT = require("aatt");
const RequestPromise = require('request-promise-native');
const FS = require('fs');
const Xml2JS = require('xml2js');
const Util = require('util');

var parsedArgs = GetOpt.create([
    ["h", "help", "shows help"],
    ["u", "url=URL", "check url"],
    ["s", "sitemap=URL", "check sitemap"],
    ["e", "errorlevel=ERRORLEVEL", "error level"],
    ["l", "level=LEVEL", "level"]
]).bindHelp().parseSystem();


const requestHelper = async function (url) {
    if (url.indexOf("file://") === 0)
        return FS.readFileSync(url.substring("file://".length)) + "";
    return RequestPromise(url);
};

const requestSitemap = async function (url) {
    return (await Util.promisify(Xml2JS.parseString)(await requestHelper(url))).urlset.url.map(function (route) {
        return route.loc[0];
    });
};

const checkUrl = async function (url) {
    console.log("Check", url);
    var result = await AATT.evaluate({
        source: await requestHelper(url),
        output: "json",
        engine: "htmlcs",
        errLevel: parsedArgs.options.errorlevel ? parseInt(parsedArgs.options.errorlevel, 10) : 2,
        level: parsedArgs.options.level || "WCAG2AAA"
    });
    console.log(JSON.parse(result));
    console.log("----");
};

const checkUrls = async function (urls) {
    for (var i = 0; i < urls.length; ++i)
        await checkUrl(urls[i]);
};


(async function () {
    var urls = parsedArgs.options.url ? [parsedArgs.options.url] : [];
    if (parsedArgs.options.sitemap)
        urls = await requestSitemap(parsedArgs.options.sitemap);

    await checkUrls(urls);

})();