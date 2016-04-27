"use strict";
var ui_frame = require("ui/frame");
var page;
var list;
var album;
function pageLoaded(args) {
    page = args.object;
    page.bindingContext = page.navigationContext;
    list = page.getViewById("images-list");
}
exports.pageLoaded = pageLoaded;
function done(args) {
    var topmost = ui_frame.topmost();
    topmost.goBack();
    topmost.goBack();
    page.bindingContext.imagePicker.done();
}
exports.done = done;
