import data_observable = require("data/observable");
import data_observablearray = require("data/observable-array");
import frame = require("ui/frame");

import image_source = require("image-source");

interface ImageOptions {
    maxWidth?: number;
    maxHeight?: number;
}

export function create(options?): ImagePicker {
    if (true /* TODO: iOS8+, consider implementation for iOS7. */) {
        return new ImagePickerPH(options);
    }
}

export class ImagePicker extends data_observable.Observable {
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

    authorize(): Promise<void> {
        return Promise.reject(new Error("Not implemented"));
    }

    present(): Promise<SelectedAsset[]> {
        if (this._resolve || this._reject) {
            return Promise.reject(new Error("Selection is allready in progress..."));
        } else {
            return new Promise<SelectedAsset[]>((resolve, reject) => {
                this._resolve = resolve;
                this._reject = reject;
                frame.topmost().navigate({
                    moduleName: "./tns_modules/nativescript-imagepicker/albums",
                    context: this
                });
            });
        }
    }

    get albums(): data_observablearray.ObservableArray<Album> {
        return this._albums;
    }

    get selection(): data_observablearray.ObservableArray<Asset> {
        return this._selection;
    }

    get doneText(): string {
        return "Done";
    }

    get cancelText(): string {
        return "Cancel";
    }

    get albumsText(): string {
        return "Albums";
    }

    get mode(): string {
        return this._options && this._options.mode && this._options.mode.toLowerCase() === 'single' ? 'single' : 'multiple';
    }

    cancel(): void {
        this.notifyCanceled();
    }

    done(): void {
        this.notifySelection([]);
    }

    protected notifyCanceled(): void {
        if (this._reject) {
            this._reject(new Error("Selection canceled."));
        }
    }

    protected notifySelection(results: SelectedAsset[]): void {
        if (this._resolve) {
            this._resolve(results);
        }
    }
}

export class Album extends data_observable.Observable {

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

    get title(): string {
        return this._title;
    }

    get assets(): data_observablearray.ObservableArray<Asset> {
        return this._assets;
    }

    get thumb(): image_source.ImageSource {
        return this._thumb;
    }

    protected setThumb(value: image_source.ImageSource): void {
        this._thumb = value;
        this.notifyPropertyChange("thumb", value);
    }
}

export class SelectedAsset extends data_observable.Observable {
    get thumb(): image_source.ImageSource {
        return null;
    }

    get uri(): string {
        return null;
    }

    get fileUri(): string {
        return null;
    }

    getImage(options?: ImageOptions): Promise<image_source.ImageSource> {
        return Promise.reject(new Error("getImage() is not implemented in SelectedAsset. Derived classes should implement it to be fully functional."));
    }

    getImageData(): Promise<ArrayBuffer> {
        return Promise.reject(new Error("getImageData() is not implemented in SelectedAsset. Derived classes should implement it to be fully functional."));
    }
}

export class Asset extends SelectedAsset {

    private _selected: boolean;
    private _album: Album;

    private _thumb: image_source.ImageSource;
    private _image: image_source.ImageSource;
    private _thumbRequested: boolean;

    constructor(album: Album) {
        super();
        this._album = album;
        this._image = null;
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

        this.notifyPropertyChange("selected", this.selected);
    }

    toggleSelection(args): void {
        this.selected = !this.selected;
    }

    data(): Promise<any> {
        return Promise.reject(new Error("Not implemented."));
    }

    protected setThumb(value: image_source.ImageSource): void {
        this._thumb = value;
        this.notifyPropertyChange("thumb", this._thumb);
    }

    protected onThumbRequest(): void {
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
        this._thumbRequestOptions.resizeMode = PHImageRequestOptionsResizeMode.Exact;
        this._thumbRequestOptions.synchronous = false;
        this._thumbRequestOptions.deliveryMode = PHImageRequestOptionsDeliveryMode.Opportunistic;
        this._thumbRequestOptions.normalizedCropRect = CGRectMake(0, 0, 1, 1);

        this._thumbRequestSize = CGSizeMake(80, 80);

        this._initialized = false;
    }

    authorize(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            var runloop = CFRunLoopGetCurrent();
            PHPhotoLibrary.requestAuthorization(function (result) {
                if (result === PHAuthorizationStatus.Authorized) {
                    resolve();
                } else {
                    reject(new Error("Authorization failed. Status: " + result));
                }
            });
        });
    }

    present(): Promise<SelectedAsset[]> {
        this.initialize();
        return super.present();
    }

    addAlbumsForFetchResult(result: PHFetchResult<any>): void {
        for (var i = 0; i < result.count; i++) {
            var item = result.objectAtIndex(i);
            if (item.isKindOfClass(PHAssetCollection)) {
                this.addAlbumForAssetCollection(<PHAssetCollection>item);
            } else {
                console.log("Ignored result: " + item);
            }
        }
    }

    addAlbumForAssetCollection(assetCollection: PHAssetCollection): void {
        var album = new AlbumPH(this, assetCollection.localizedTitle);
        var pfAssets = PHAsset.fetchAssetsInAssetCollectionOptions(assetCollection, null);
        album.addAssetsForFetchResult(pfAssets);
        if (album.assets.length > 0) {
            this.albums.push(album);
        }
    }

    createPHImageThumb(target, asset: PHAsset): void {
        PHImageManager.defaultManager().requestImageForAssetTargetSizeContentModeOptionsResultHandler(asset, this._thumbRequestSize, PHImageContentMode.AspectFill,
            this._thumbRequestOptions, function (target, uiImage, info) {
                var imageSource = new image_source.ImageSource();
                imageSource.setNativeSource(uiImage);
                target.setThumb(imageSource);
            }.bind(this, target));
    }

    /**
     * Creates a new ImageSource from the given image, using the given sizing options.
     * @param image   The image asset that should be put into an ImageSource.
     * @param options The options that should be used to create the ImageSource. 
     */
    createPHImage(image: PHAsset, options?: ImageOptions): Promise<image_source.ImageSource> {
        return new Promise<image_source.ImageSource>((resolve, reject) => {
            var size: CGSize = options ? CGSizeMake(options.maxWidth, options.maxHeight) : PHImageManagerMaximumSize;
            var resizeMode = PHImageRequestOptions.alloc().init();

            // TODO: Decide whether it is benefical to use PHImageRequestOptionsResizeModeFast
            //       Accuracy vs Performance. It is probably best to expose these as iOS specific options.
            resizeMode.resizeMode = PHImageRequestOptionsResizeMode.Exact;
            resizeMode.synchronous = false;

            // TODO: provide the ability to change this setting.
            //       Right now, it is needed to make sure that resolve is not called twice.
            resizeMode.deliveryMode = PHImageRequestOptionsDeliveryMode.HighQualityFormat;
            resizeMode.normalizedCropRect = CGRectMake(0, 0, 1, 1);
            PHImageManager.defaultManager().requestImageForAssetTargetSizeContentModeOptionsResultHandler(
                image,
                size,
                PHImageContentMode.AspectFill,
                resizeMode,
                (createdImage, data) => {
                    if (createdImage) {
                        var imageSource = new image_source.ImageSource();
                        imageSource.setNativeSource(createdImage);
                        
                        // TODO: Determine whether runOnRunLoop is needed
                        //       for callback or not. (See the data() implementation in AssetPH below)
                        resolve(imageSource);
                    } else {
                        reject(new Error("The image could not be created."));
                    }
                }
            );
        });
    }

    done(): void {
        var result = [];
        for (var i = 0; i < this.selection.length; ++i) {
            result.push(this.selection.getItem(i));
        }
        this.notifySelection(result);
    }

    private initialize(): void {
        if (this._initialized) {
            return;
        }

        this._initialized = true;

        var smart = PHAssetCollection.fetchAssetCollectionsWithTypeSubtypeOptions(PHAssetCollectionType.SmartAlbum, PHAssetCollectionSubtype.AlbumRegular, null);
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

    addAssetsForFetchResult(result: PHFetchResult<any>): void {
        for (var i = 0; i < result.count; i++) {
            var asset = result.objectAtIndex(i);
            if (asset.isKindOfClass(PHAsset)) {
                this.addAsset(<PHAsset>asset);
            } else {
                console.log("Ignored asset: " + asset);
            }
        }
    }

    addAsset(asset: PHAsset): void {
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

    /**
     * Gets the underlying iOS PHAsset instance.
     */
    public get ios(): any {
        return this._phAsset;
    }

    protected onThumbRequest(): void {
        super.onThumbRequest();
        (<ImagePickerPH>(<AlbumPH>this.album).imagePicker).createPHImageThumb(this, this._phAsset);
    }

    get uri(): string {
        return this._phAsset.localIdentifier.toString();
    }

    getImage(options?: ImageOptions): Promise<image_source.ImageSource> {
        return (<ImagePickerPH>(<AlbumPH>this.album).imagePicker).createPHImage(this._phAsset, options);
    }

    getImageData(): Promise<ArrayBuffer> {
        return this.data().then((data: NSData) => {
            return (<any>interop).bufferFromData(data);
        });
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

    data(): Promise<any> {
        return new Promise((resolve, reject) => {
            var runloop = CFRunLoopGetCurrent();
            PHImageManager.defaultManager().requestImageDataForAssetOptionsResultHandler(this._phAsset, null, (data, dataUTI, orientation, info) => {
                if (data) {
                    resolve(data);
                } else {
                    reject(new Error("Failed to get image data."));
                }
            });
        });
    }
}
