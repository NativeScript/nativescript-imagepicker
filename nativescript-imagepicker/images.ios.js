"use strict";
var ui_frame = require("ui/frame");
var application = require("application");
var platform = require("platform");
var page;
var list;
var album;
function pageLoaded(args) {
    page = args.object;
    page.bindingContext = page.navigationContext;
    list = page.getViewById("images-list");
    list.listViewLayout.spanCount = Math.floor(platform.screen.mainScreen.widthDIPs / 80);
    application.on("orientationChanged", function (e) {
        var currentPageWidth = platform.screen.mainScreen.heightDIPs;
        console.log(currentPageWidth);
        console.log(currentPageWidth);
        list.listViewLayout.spanCount = Math.floor(currentPageWidth / 80);
    });
}
exports.pageLoaded = pageLoaded;
function done(args) {
    var topmost = ui_frame.topmost();
    topmost.goBack();
    topmost.goBack();
    page.bindingContext.imagePicker.done();
}
exports.done = done;
