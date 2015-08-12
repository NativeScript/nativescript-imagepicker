import data_observable = require("data/observable");
import data_observablearray = require("data/observable-array");

import image_source = require("image-source");

export function create(): ImagePicker {
    if (true /* iOS8+ */) {
        return new ImagePickerPH();
    }
}

export class ObservableBase extends data_observable.Observable {
    protected notifyPropertyChanged(propertyName: string, value: any) {
        this.notify({ object: this, eventName: data_observable.Observable.propertyChangeEvent, propertyName: propertyName, value: value });
    }
}

export var selectionEvent: string = "selection";

export interface SelectionData extends data_observable.EventData {
    urls: string[];
}

export class ImagePicker extends ObservableBase {
    private _selection: data_observablearray.ObservableArray<Asset>;
    private _albums: data_observablearray.ObservableArray<Album>;

    constructor() {
        super();
        this._selection = new data_observablearray.ObservableArray<Asset>();
        this._albums = new data_observablearray.ObservableArray<Album>();
    }

    authorize(): Thenable<void> {
        return Promise.reject(new Error("Not implemented"));
    }

    get albums() {
        return this._albums;
    }

    get selection() {
        return this._selection;
    }

    get doneText() {
        return "Done";
    }

    get cancelText() {
        return "Cancel";
    }

    get albumsText() {
        return "Albums";
    }

    done() {
        console.log("Done!");
    }

    protected notifySelection(urls: string[]) {
        this.notify({ eventName: selectionEvent, object: this, urls: urls });
    }
}

export class Album extends ObservableBase {

    private _imagePicker: ImagePicker;
    private _assets: data_observablearray.ObservableArray<Asset>;
    private _title: string;
    private _thumb: image_source.ImageSource;

    constructor(imagePicker: ImagePicker, title: string) {
        super();
        this._imagePicker = imagePicker;
        this._title = title;
        this._assets = new data_observablearray.ObservableArray<Asset>();
    }

    get imagePicker(): ImagePicker {
        return this._imagePicker;
    }

    get title() {
        return this._title;
    }

    get assets() {
        return this._assets;
    }

    get thumb() {
        return this._thumb;
    }

    protected setThumb(value: image_source.ImageSource) {
        this._thumb = value;
        this.notifyPropertyChanged("thumb", value);
    }
}

export class Asset extends ObservableBase {

    private _selected: boolean;
    private _album: Album;

    private _thumb: image_source.ImageSource;
    private _thumbRequested: boolean;

    constructor(album: Album) {
        super();
        this._album = album;
    }

    get album(): Album {
        return this._album;
    }

    get thumb(): image_source.ImageSource {
        if (!this._thumbRequested) {
            this._thumbRequested = true;
            this.onThumbRequest();
        }
        return this._thumb;
    }

    get selected(): boolean {
        return !!this._selected;
    }

    set selected(value: boolean) {
        if (!!value == this.selected) return;
        var index = this.album.imagePicker.selection.indexOf(this);
        if (value) {
            this._selected = true;
            if (index < 0) {
                this.album.imagePicker.selection.push(this);
            }
        } else {
            delete this._selected;
            if (index >= 0) {
                this.album.imagePicker.selection.splice(index, 1);
            }
        }
        // TODO: Push in the image picker selected items array...
        this.notifyPropertyChanged("selected", this.selected);
    }

    toggleSelection(args) {
        this.selected = !this.selected;
    }

    protected setThumb(value: image_source.ImageSource) {
        this._thumb = value;
        this.notifyPropertyChanged("thumb", this._thumb);
    }

    protected onThumbRequest() {
    }
}

class ImagePickerPH extends ImagePicker {

    private _thumbRequestOptions: PHImageRequestOptions;
    private _thumbRequestSize: CGSize;

    constructor() {
        super();

        // iOS8+ Photo framework based view model implementation...
        this._thumbRequestOptions = PHImageRequestOptions.alloc().init();
        this._thumbRequestOptions.resizeMode = PHImageRequestOptionsResizeMode.PHImageRequestOptionsResizeModeExact;
        this._thumbRequestOptions.synchronous = false;
        this._thumbRequestOptions.deliveryMode = PHImageRequestOptionsDeliveryMode.PHImageRequestOptionsDeliveryModeOpportunistic;
        this._thumbRequestOptions.normalizedCropRect = CGRectMake(0, 0, 1, 1);

        this._thumbRequestSize = CGSizeMake(80, 80);

        var smart = PHAssetCollection.fetchAssetCollectionsWithTypeSubtypeOptions(PHAssetCollectionType.PHAssetCollectionTypeSmartAlbum, PHAssetCollectionSubtype.PHAssetCollectionSubtypeAlbumRegular, null);
        this.addAlbumsForFetchResult(smart);

        var user = PHCollection.fetchTopLevelUserCollectionsWithOptions(null);
        this.addAlbumsForFetchResult(user);
    }

    // TODO: Return a promise...
    authorize(): Thenable<void> {
        return new Promise<void>((resolve, reject) => {
            PHPhotoLibrary.requestAuthorization(function(result) {
                if (result === PHAuthorizationStatus.PHAuthorizationStatusAuthorized) {
                    resolve();
                    console.log("Resolve! " + resolve);
                } else {
                    console.log("Reject!");
                    reject(new Error("Authorization failed. Status: " + PHAuthorizationStatus[result]));
                }
            });
        });
    }

    addAlbumsForFetchResult(result: PHFetchResult) {
        for (var i = 0; i < result.count; i++) {
            var item = result.objectAtIndex(i);
            if (item.isKindOfClass(PHAssetCollection)) {
                this.addAlbumForAssetCollection(<PHAssetCollection>item);
            } else {
                console.log("Ignored result: " + item);
            }
        }
    }

    addAlbumForAssetCollection(assetCollection: PHAssetCollection) {
        var album = new AlbumPH(this, assetCollection.localizedTitle);
        var pfAssets = PHAsset.fetchAssetsInAssetCollectionOptions(assetCollection, null);
        album.addAssetsForFetchResult(pfAssets);
        if (album.assets.length > 0) {
            this.albums.push(album);
        }
    }

    createPHImageThumb(target, asset: PHAsset) {
        PHImageManager.defaultManager().requestImageForAssetTargetSizeContentModeOptionsResultHandler(asset, this._thumbRequestSize, PHImageContentMode.PHImageContentModeAspectFill, this._thumbRequestOptions, function(target, uiImage, info) {
            var imageSource = new image_source.ImageSource();
            imageSource.setNativeSource(uiImage);
            target.setThumb(imageSource);
        }.bind(this, target));
    }

    done() {
        var r = PHImageRequestOptions.alloc().init();
        r.synchronous = true;
        var urls = [];
        this.selection.forEach(item => {
            PHImageManager.defaultManager().requestImageDataForAssetOptionsResultHandler((<any>item)._phAsset, r, (data, uti, orientation, info) => {
                var url = info.objectForKey("PHImageFileURLKey");
                if (url) {
                    urls.push(url);
                }
            });
        });
        this.notifySelection(urls);
    }
}

class AlbumPH extends Album {
    private _setThumb: boolean;

    constructor(imagePicker: ImagePicker, title: string) {
        super(imagePicker, title);
        this._setThumb = false;
    }

    addAssetsForFetchResult(result: PHFetchResult) {
        for (var i = 0; i < result.count; i++) {
            var asset = result.objectAtIndex(i);
            if (asset.isKindOfClass(PHAsset)) {
                this.addAsset(<PHAsset>asset);
            } else {
                console.log("Ignored asset: " + asset);
            }
        }
    }

    addAsset(asset: PHAsset) {
        var item = new AssetPH(this, asset);
        if (!this._setThumb) {
            this._setThumb = true;
            (<ImagePickerPH>this.imagePicker).createPHImageThumb(this, asset);
        }
        this.assets.push(item);
    }
}

class AssetPH extends Asset {
    private _phAsset: PHAsset;

    constructor(album: AlbumPH, phAsset: PHAsset) {
        super(album);
        this._phAsset = phAsset;
    }

    protected onThumbRequest() {
        super.onThumbRequest();
        (<ImagePickerPH>(<AlbumPH>this.album).imagePicker).createPHImageThumb(this, this._phAsset);
    }
}




