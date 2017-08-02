import { EventData } from 'tns-core-modules/data/observable';
import { Page } from 'tns-core-modules/ui/page';
import { isAndroid } from "tns-core-modules/platform";
import * as imagepicker from "nativescript-imagepicker";
import * as permissions from "nativescript-permissions";

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
    if (isAndroid && (<any>android).os.Build.VERSION.SDK_INT >= 23) {
        return permissions.requestPermission([(<any>android).Manifest.permission.READ_EXTERNAL_STORAGE]);
    } else {
        return Promise.resolve();
    }
}
