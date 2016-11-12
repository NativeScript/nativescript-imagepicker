import { Component, ChangeDetectorRef } from "@angular/core";
import { ListView } from "ui/list-view";

let imagepicker = require("nativescript-imagepicker");

@Component({
    selector: "my-app",
    templateUrl: "app.component.html",
})
export class AppComponent {

    items = [];

    constructor(private _changeDetectionRef: ChangeDetectorRef) {
    }

    onSelectMultipleTap() {
        let context = imagepicker.create({
            mode: "multiple"
        });
        this.startSelection(context);
    }

    onSelectSingleTap() {
        let context = imagepicker.create({
            mode: "single"
        });
        this.startSelection(context);
    }

    startSelection(context) {
        context
            .authorize()
            .then(() => {
                this.items = [];
                return context.present();
            })
            .then((selection) => {
                console.log("Selection done:");
                selection.forEach(function(selected) {
                    console.log("----------------");
                    console.log("uri: " + selected.uri);
                    console.log("fileUri: " + selected.fileUri);
                });
                this.items = selection;
                this._changeDetectionRef.detectChanges();
            }).catch(function (e) {
                console.log(e);
            });
    }
}
