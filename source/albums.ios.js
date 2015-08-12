var ui_listview = require("ui/list-view");
var ui_frame = require("ui/frame");
var imagePicker;
var page;
exports.viewmodel = require("./viewmodel");
function onAlbumsItemTap(args) {
    var list = args.object;
    var topmost = ui_frame.topmost();
    topmost.navigate({
        moduleName: "tns_modules/imagepicker/images",
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
            args.ios.accessoryType = UITableViewCellAccessoryType.UITableViewCellAccessoryDisclosureIndicator;
        }
    });
    if (page.navigationContext) {
        page.bindingContext = page.navigationContext;
    }
}
exports.pageLoaded = pageLoaded;
function done(args) {
    var topmost = ui_frame.topmost();
    topmost.goBack();
    page.bindingContext.done();
}
exports.done = done;
