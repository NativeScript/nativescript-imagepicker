import ui_frame = require("ui/frame");

var page;
var list;
var album;

export function pageLoaded(args) {
    page = args.object;
    page.bindingContext = page.navigationContext;
    list = page.getViewById("images-list");
}

export function done(args) {
    var topmost = ui_frame.topmost();
    topmost.goBack();
    topmost.goBack();

    page.bindingContext.imagePicker.done();
}
