"use strict";
var ui_listview = require("ui/list-view");
var ui_frame = require("ui/frame");
var page;
var goingToAlbum = false;
function onAlbumsItemTap(args) {
    var list = args.object;
    var topmost = ui_frame.topmost();
    goingToAlbum = true;
    topmost.navigate({
        moduleName: "tns_modules/nativescript-imagepicker/images",
        context: list.items.getItem(args.index)
    });
}
exports.onAlbumsItemTap = onAlbumsItemTap;
;
function pageLoaded(args) {
    page = args.object;
    var list = page.getViewById("albums-list");
    list.on(ui_listview.ListView.itemLoadingEvent, function (args) {
        if (args.ios) {
            args.ios.accessoryType = 1;
        }
    });
    if (page.navigationContext) {
        page.bindingContext = page.navigationContext;
    }
}
exports.pageLoaded = pageLoaded;
function navigatedFrom(args) {
    if (!goingToAlbum) {
        page.bindingContext.cancel();
    }
    goingToAlbum = false;
}
exports.navigatedFrom = navigatedFrom;
function done(args) {
    var topmost = ui_frame.topmost();
    topmost.goBack();
    page.bindingContext.done();
}
exports.done = done;
