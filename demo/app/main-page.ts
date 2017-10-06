import { EventData } from 'tns-core-modules/data/observable';
import { Page } from 'tns-core-modules/ui/page';
import { isAndroid } from "tns-core-modules/platform";
import * as imagepicker from "nativescript-imagepicker";

let list;
let imageSrc;

export function pageLoaded(args: EventData) {
    let page = <Page>args.object;
    list = page.getViewById("urls-list");
    imageSrc = page.getViewById("imageSrc");
}

export function onSelectMultipleTap(args) {
    let context = imagepicker.create({ mode: "multiple" });
    startSelection(context, false);
}

export function onSelectSingleTap(args) {
    let context = imagepicker.create({ mode: "single" });
    startSelection(context, true);
}

function startSelection(context, isSingle) {
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
                if(isSingle){
                    selected.getImage({ maxWidth: 200, maxHeight: 200, iosAspectRatio: 'fit' })
                    .then((imageSource) => {
                        imageSrc.src = imageSource;
                    });
                } else {
                    imageSrc.visibility = 'hidden';
                }
            });
            list.items = selection;
        }).catch(function (e) {
            console.log(e);
        });
}