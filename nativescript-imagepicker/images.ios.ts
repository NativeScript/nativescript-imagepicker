import ui_frame = require("ui/frame");

var page;
var list;
var album;

export function pageLoaded(args) {
    page = args.object;
    page.bindingContext = page.navigationContext;
    list = page.getViewById("images-list");

    // Get the current Size, and then adjust the number of columns based on it...
    var size = iOSProperty(UIScreen, UIScreen.mainScreen).bounds.size.width;
    list.listViewLayout.spanCount = Math.floor(size / 80);

}

export function done(args) {
    var topmost = ui_frame.topmost();
    topmost.goBack();
    topmost.goBack();

    page.bindingContext.imagePicker.done();
}

function iOSProperty(_this, property) {
    if (typeof property === "function") {
        return property.call(_this);
    }
    else {
        return property;
    }
}