import { EventData } from 'tns-core-modules/data/observable';
import { Page } from 'tns-core-modules/ui/page';
import { isAndroid } from "tns-core-modules/platform";
import * as imagepicker from "nativescript-imagepicker";

let list;

export function pageLoaded(args: EventData) {
    let page = <Page>args.object;
    list = page.getViewById("urls-list");
}

export function onSelectMultipleTap(args) {
    let context = imagepicker.create({ mode: "multiple" });
    startSelection(context);
}

export function onSelectSingleTap(args) {
    let context = imagepicker.create({ mode: "single" });
    startSelection(context);
}

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