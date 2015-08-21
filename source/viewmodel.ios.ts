import data_observable = require("data/observable");
import data_observablearray = require("data/observable-array");
import frame = require("ui/frame");

import image_source = require("image-source");

export function create(options?): ImagePicker {
    if (true /* TODO: iOS8+, consider implementation for iOS7. */) {
        return new ImagePickerPH(options);
    }
}

export class ObservableBase extends data_observable.Observable {
    protected notifyPropertyChanged(propertyName: string, value: any) {
        this.notify({ object: this, eventName: data_observable.Observable.propertyChangeEvent, propertyName: propertyName, value: value });
    }
}

export class ImagePicker extends ObservableBase {
    private _selection: data_observablearray.ObservableArray<Asset>;
    private _albums: data_observablearray.ObservableArray<Album>;

    private _resolve;
    private _reject;

    protected _options;

    constructor(options) {
        super();
        this._selection = new data_observablearray.ObservableArray<Asset>();
        this._albums = new data_observablearray.ObservableArray<Album>();
        this._options = options;
    }

    authorize(): Thenable<void> {
        return Promise.reject(new Error("Not implemented"));
    }

    present(): Thenable<string[]> {
        if (this._resolve || this._reject) {
            return Promise.reject(new Error("Selection is allready in progress..."));
        } else {
            return new Promise<string[]>((resolve, reject) => {
                this._resolve = resolve;
                this._reject = reject;
                frame.topmost().navigate({
                    moduleName: "./tns_modules/imagepicker/albums",
                    context: this
                });
            });
        }
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

    get mode() {
        return this._options && this._options.mode && this._options.mode.toLowerCase() === 'single' ? 'single' : 'multiple';
    }

    cancel() {
        this.notifyCanceled();
    }

    done() {
        this.notifySelection([]);
    }

    protected notifyCanceled() {
        if (this._reject) {
            this._reject(new Error("Selection canceled."));
        }
    }

    protected notifySelection(results: SelectedAsset[]) {
        if (this._resolve) {
            this._resolve(results);
        }
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

export class SelectedAsset extends ObservableBase {
    get thumb(): image_source.ImageSource {
        return null;
    }

    get uri(): string {
        return null;
    }

    get fileUri(): string {
        return null;
    }
}

export class Asset extends SelectedAsset {

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
            if (this.album.imagePicker.mode === "single") {
                if (this.album.imagePicker.selection.length > 0) {
                    this.album.imagePicker.selection.getItem(0).selected = false;
                }
            }
            if (index < 0) {
                this.album.imagePicker.selection.push(this);
            }
        } else {
            delete this._selected;
            if (index >= 0) {
                this.album.imagePicker.selection.splice(index, 1);
            }
        }
        
        this.notifyPropertyChanged("selected", this.selected);
    }

    toggleSelection(args) {
        this.selected = !this.selected;
    }

    data(): Thenable<any> {
        return Promise.reject(new Error("Not implemented."));
    }

    protected setThumb(value: image_source.ImageSource) {
        this._thumb = value;
        this.notifyPropertyChanged("thumb", this._thumb);
    }

    protected onThumbRequest() {
    }
}

// iOS8+ Photo framework based view model implementation...
class ImagePickerPH extends ImagePicker {

    private _thumbRequestOptions: PHImageRequestOptions;
    private _thumbRequestSize: CGSize;

    private _initialized: boolean;

    constructor(options) {
        super(options);

        this._thumbRequestOptions = PHImageRequestOptions.alloc().init();
        this._thumbRequestOptions.resizeMode = PHImageRequestOptionsResizeMode.PHImageRequestOptionsResizeModeExact;
        this._thumbRequestOptions.synchronous = false;
        this._thumbRequestOptions.deliveryMode = PHImageRequestOptionsDeliveryMode.PHImageRequestOptionsDeliveryModeOpportunistic;
        this._thumbRequestOptions.normalizedCropRect = CGRectMake(0, 0, 1, 1);

        this._thumbRequestSize = CGSizeMake(80, 80);

        this._initialized = false;
    }

    authorize(): Thenable<void> {
        return new Promise<void>((resolve, reject) => {
            var runloop = CFRunLoopGetCurrent();
            PHPhotoLibrary.requestAuthorization(function(result) {
                if (result === PHAuthorizationStatus.PHAuthorizationStatusAuthorized) {
                    invokeOnRunLoop(runloop, resolve);
                } else {
                    invokeOnRunLoop(runloop, () => {
                        reject(new Error("Authorization failed. Status: " + PHAuthorizationStatus[result]));
                    });
                }
            });
        });
    }

    present(): Thenable<string[]> {
        this.initialize();
        return super.present();
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
        var result = [];
        for (var i = 0; i < this.selection.length; ++i) {
            result.push(this.selection.getItem(i));
        }
        this.notifySelection(result);
    }

    private initialize() {
        if (this._initialized) {
            return;
        }

        this._initialized = true;

        var smart = PHAssetCollection.fetchAssetCollectionsWithTypeSubtypeOptions(PHAssetCollectionType.PHAssetCollectionTypeSmartAlbum, PHAssetCollectionSubtype.PHAssetCollectionSubtypeAlbumRegular, null);
        this.addAlbumsForFetchResult(smart);

        var user = PHCollection.fetchTopLevelUserCollectionsWithOptions(null);
        this.addAlbumsForFetchResult(user);
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
    private static _uriRequestOptions: PHImageRequestOptions;

    constructor(album: AlbumPH, phAsset: PHAsset) {
        super(album);
        this._phAsset = phAsset;
    }

    protected onThumbRequest() {
        super.onThumbRequest();
        (<ImagePickerPH>(<AlbumPH>this.album).imagePicker).createPHImageThumb(this, this._phAsset);
    }

    get uri(): string {
        return this._phAsset.localIdentifier.toString();
    }

    get fileUri(): string {
        if (!AssetPH._uriRequestOptions) {
            AssetPH._uriRequestOptions = PHImageRequestOptions.alloc().init();
            AssetPH._uriRequestOptions.synchronous = true;
        }

        var uri;
        PHImageManager.defaultManager().requestImageDataForAssetOptionsResultHandler(this._phAsset, AssetPH._uriRequestOptions, (data, uti, orientation, info) => {
            uri = info.objectForKey("PHImageFileURLKey");
        });
        if (uri) {
            return uri.toString();
        }
        return undefined;
    }

    data(): Thenable<any> {
        return new Promise((resolve, reject) => {
            var runloop = CFRunLoopGetCurrent();
            PHImageManager.defaultManager().requestImageDataForAssetOptionsResultHandler(this._phAsset, null, (data, dataUTI, orientation, info) => {
                if (data) {
                    invokeOnRunLoop(runloop, () => {
                        resolve(data);
                    });
                } else {
                    invokeOnRunLoop(runloop, () => {
                        reject(new Error("Failed to get image data."));
                    });
                }
            });
        });
    }
}

var defaultRunLoopMode = NSString.stringWithString(kCFRunLoopCommonModes);

function invokeOnRunLoop(runloop, func) {
    CFRunLoopPerformBlock(runloop, defaultRunLoopMode, func);
    CFRunLoopWakeUp(runloop);
}


