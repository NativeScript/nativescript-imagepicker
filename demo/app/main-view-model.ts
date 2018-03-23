import { Observable } from 'tns-core-modules/data/observable';
import { isAndroid } from "tns-core-modules/platform";
import * as imagepicker from "nativescript-imagepicker";
import { ObservableArray } from 'tns-core-modules/data/observable-array/observable-array';

export class MainViewModel extends Observable {
    constructor() {
        super();
    }

    private _imageSrc: any;
    private _imageAssets: Array<any>;

    get imageSrc(): any {
        return this._imageSrc;
    }

    set imageSrc(value: any) {
        if (this._imageSrc !== value) {
            this._imageSrc = value;
            this.notifyPropertyChange('imageSrc', value);
        }
    }

    get imageAssets(): any {
        return this._imageAssets;
    }

    set imageAssets(value: any) {
        if (this._imageAssets !== value) {
            this._imageAssets = value;
            this.notifyPropertyChange('imageAssets', value);
        }
    }

    public onSelectMultipleTap(args) {
        let context = imagepicker.create({ mode: "multiple" });
        this.startSelection(context, false);
    }

    public onSelectSingleTap(args) {
        let context = imagepicker.create({ mode: "single" });
        this.startSelection(context, true);
    }

    private startSelection(context, isSingle) {
        context
            .authorize()
            .then(() => {
                this.imageAssets = [];
                this.imageSrc = null;
                return context.present();
            })
            .then((selection) => { // returns SelectedAsset[]
                this.imageSrc = isSingle && selection.length > 0 ? selection[0] : null;
                this.imageAssets = selection;

                console.log("Selection done:");
                selection.forEach((selected) => {
                    console.log("----------------");
                    console.log("uri: " + selected.uri);
                });
            }).catch(function (e) {
                console.log(e);
            });
    }
}