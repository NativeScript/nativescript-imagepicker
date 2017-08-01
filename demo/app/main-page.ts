import * as frame from "tns-core-modules/ui/frame";
import * as platform from "tns-core-modules/platform";
import * as imagepicker from "nativescript-imagepicker";
import * as permissions from "nativescript-permissions";

let page;
let list;

function pageLoaded(args) {
    page = args.object;
    list = page.getViewById("urls-list");
}
exports.pageLoaded = pageLoaded;

function onSelectMultipleTap(args) {
    let context = imagepicker.create({ mode: "multiple" });
    startSelection(context);
}
exports.onSelectMultipleTap = onSelectMultipleTap;

function onSelectSingleTap(args) {
    let context = imagepicker.create({ mode: "single" });
    startSelection(context);
}
exports.onSelectSingleTap = onSelectSingleTap;

function startSelection(context) {
    requestPermissions()
        .then(function() {
            context
                .authorize()
                .then(function() {
                    list.items = [];
                    return context.present();
                })
                .then(function(selection) {
                    console.log("Selection done:");
                    selection.forEach(function(selected) {
                        console.log("----------------");
                        console.log("uri: " + selected.uri);
                    });
                    list.items = selection;
                }).catch(function (e) {
                    console.log(e);
                });
        }).catch(function (e) {
            console.log(e);
        });
}

function requestPermissions() {
    if (platform.isAndroid && (<any>android).os.Build.VERSION.SDK_INT >= 23) {
        return permissions.requestPermission([(<any>android).Manifest.permission.READ_EXTERNAL_STORAGE]);
    } else {
        return Promise.resolve();
    }
}
exports.requestPermissions = requestPermissions;