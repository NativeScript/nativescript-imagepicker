import ui_frame = require("ui/frame");
import application = require("application");
import platform = require("platform");

var page;
var list;
var album;

export function pageLoaded(args) {
    page = args.object;
    page.bindingContext = page.navigationContext;
    list = page.getViewById("images-list");

    // Get the current Size, and then adjust the number of columns based on it...
    list.listViewLayout.spanCount = Math.floor(platform.screen.mainScreen.widthDIPs/80);

    application.on("orientationChanged", function(e:application.OrientationChangedEventData){
            var currentPageWidth = platform.screen.mainScreen.heightDIPs
            console.log(currentPageWidth);
            console.log(currentPageWidth);
            list.listViewLayout.spanCount = Math.floor(currentPageWidth/80);
    });
}

export function done(args) {
    var topmost = ui_frame.topmost();
    topmost.goBack();
    topmost.goBack();

    page.bindingContext.imagePicker.done();
}