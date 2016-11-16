"use strict";
var ui_frame = require("ui/frame");
var page_1 = require("ui/page");
var action_bar_1 = require("ui/action-bar");
var list_view_1 = require("ui/list-view");
if (global.TNS_WEBPACK) {
    var imagesModule = require("./images.ios");
    require("bundle-entry-points");
}
else {
    var imagesModule = require("./images");
}
var page;
var goingToAlbum = false;
function onAlbumsItemTap(args) {
    var list = args.object;
    var topmost = ui_frame.topmost();
    goingToAlbum = true;
    topmost.navigate({
        create: imagesModule.imagesPageFactory,
        context: list.items.getItem(args.index)
    });
}
exports.onAlbumsItemTap = onAlbumsItemTap;
;
function pageLoaded(args) {
    page = args.object;
    var list = page.getViewById("albums-list");
    list.on(list_view_1.ListView.itemLoadingEvent, function (args) {
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
function albumsPageFactory() {
    var page = new page_1.Page();
    page.on(page_1.Page.loadedEvent, pageLoaded);
    page.on(page_1.Page.navigatedFromEvent, navigatedFrom);
    var actionBar = new action_bar_1.ActionBar();
    actionBar.bind({ targetProperty: "title", sourceProperty: "albumsText", twoWay: false });
    var navigationButton = new action_bar_1.NavigationButton();
    navigationButton.bind({ targetProperty: "text", sourceProperty: "cancelText", twoWay: false });
    actionBar.navigationButton = navigationButton;
    var actionItems = new action_bar_1.ActionItems();
    var item = new action_bar_1.ActionItem();
    item.bind({ targetProperty: "text", sourceProperty: "selection.length", twoWay: false,
        expression: "doneText + (mode === 'single' ? '' : ' (' + selection.length + ')')" });
    item.ios.position = "right";
    item.on(action_bar_1.ActionItem.tapEvent, done);
    actionBar.actionItems.addItem(item);
    page.actionBar = actionBar;
    var listView = new list_view_1.ListView();
    listView.id = "albums-list";
    listView.bind({ targetProperty: "items", sourceProperty: "albums", twoWay: false });
    listView.on(list_view_1.ListView.itemTapEvent, onAlbumsItemTap);
    listView.itemTemplate =
        "<GridLayout rows=\"*, *\" columns=\"auto, *\" backgroundCount=\"red\">" +
            "<Image rowSpan=\"2\" imageSource=\"{{ thumb }}\" width=\"80\" height=\"80\" margin=\"2\" />" +
            "<Label row=\"0\" col=\"1\" text=\"{{ title }}\" verticalAlignment=\"bottom\" fontSize=\"16\" margin=\"0 12\" />" +
            "<Label row=\"1\" col=\"1\" text=\"{{ assets.length }}\" verticalAlignment=\"top\" fontSize=\"13\" margin=\"0 12\" />" +
            "</GridLayout>";
    page.content = listView;
    return page;
}
exports.albumsPageFactory = albumsPageFactory;
