let frame = require("ui/frame");
let platform = require("platform");
import * as imagepicker from "nativescript-imagepicker";

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
}