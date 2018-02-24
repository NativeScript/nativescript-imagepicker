import * as data_observable from "tns-core-modules/data/observable";
import * as data_observablearray from "tns-core-modules/data/observable-array";
import * as frame from "tns-core-modules/ui/frame";
import * as imageAssetModule from "tns-core-modules/image-asset";
import * as image_source from "tns-core-modules/image-source";

let albumsModule;
if (global.TNS_WEBPACK) {
    albumsModule = require("./albums.ios");

    require("bundle-entry-points");
} else {
    albumsModule = require("./albums");
}

const IMAGE_WIDTH = 80;
const IMAGE_HEIGHT = 80;

interface ImageOptions {
    maxWidth?: number;
    maxHeight?: number;
    aspectRatio?: "fill" | "fit";
}

export function create(options?): ImagePicker {
    return new ImagePickerPH(options);
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
            return Promise.reject(new Error("Selection is already in progress..."));
        } else {
            return new Promise<SelectedAsset[]>((resolve, reject) => {
                this._resolve = resolve;
                this._reject = reject;
                frame.topmost().navigate({
                    create: albumsModule.albumsPageFactory,
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
        return this._options && this._options.doneText ? this._options.doneText : "Done";
    }

    get cancelText(): string {
        return this._options && this._options.cancelText ? this._options.cancelText : "Cancel";
    }

    get albumsText(): string {
        return this._options && this._options.albumsText ? this._options.albumsText : "Albums";
    }

    get mode(): string {
        return this._options && this._options.mode && this._options.mode.toLowerCase() === 'single' ? 'single' : 'multiple';
    }

    get newestFirst(): boolean {
        return this._options && !!this._options.newestFirst;
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
    private _thumbAsset: imageAssetModule.ImageAsset;

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

    get thumbAsset(): imageAssetModule.ImageAsset {
        return this._thumbAsset;
    }

    protected setThumbAsset(value: imageAssetModule.ImageAsset): void {
        this._thumbAsset = value;
        this.notifyPropertyChange("thumbAsset", value);
    }
}

export class SelectedAsset extends imageAssetModule.ImageAsset {
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

    private _image: image_source.ImageSource;

    constructor(album: Album, asset: PHAsset | UIImage) {
        super(asset);
        this._album = album;
        this._image = null;
    }

    get album(): Album {
        return this._album;
    }

    get selected(): boolean {
        return !!this._selected;
    }

    set selected(value: boolean) {
        if (!!value === this.selected) return;
        let index = this.album.imagePicker.selection.indexOf(this);
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
        this._thumbRequestOptions.networkAccessAllowed = true; // needed for retrieving iCloud images
        this._thumbRequestOptions.normalizedCropRect = CGRectMake(0, 0, 1, 1);

        this._thumbRequestSize = CGSizeMake(80, 80);
        this._options = options;

        this._initialized = false;
    }

    authorize(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            let runloop = CFRunLoopGetCurrent();
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
        for (let i = 0; i < result.count; i++) {
            let item = result.objectAtIndex(i);
            if (item.isKindOfClass(PHAssetCollection)) {
                this.addAlbumForAssetCollection(<PHAssetCollection>item);
            } else {
                console.log("Ignored result: " + item);
            }
        }
    }

    addAlbumForAssetCollection(assetCollection: PHAssetCollection): void {
        let album = new AlbumPH(this, assetCollection.localizedTitle);
        let pfAssets = PHAsset.fetchAssetsInAssetCollectionOptions(assetCollection, null);
        album.addAssetsForFetchResult(pfAssets);
        if (album.assets.length > 0) {
            this.albums.push(album);
        }
    }

    createPHImageThumbAsset(target, asset: PHAsset): void {
        PHImageManager.defaultManager().requestImageForAssetTargetSizeContentModeOptionsResultHandler(asset, this._thumbRequestSize, PHImageContentMode.AspectFill,
            this._thumbRequestOptions, function (target, uiImage, info) {
                let imageAsset = new imageAssetModule.ImageAsset(uiImage);
                imageAsset.options = {
                    width: this._options.maxWidth && this._options.maxWidth < IMAGE_WIDTH ? this._options.maxWidth : IMAGE_WIDTH,
                    height: this._options.maxHeight && this._options.IMAGE_HEIGHT < 80 ? this._options.IMAGE_HEIGHT : IMAGE_HEIGHT,
                    keepAspectRatio: true
                };
                target.setThumbAsset(imageAsset);
            }.bind(this, target));
    }

    /**
     * Creates a new ImageSource from the given image, using the given sizing options.
     * @param image   The image asset that should be put into an ImageSource.
     * @param options The options that should be used to create the ImageSource.
     */
    createPHImage(image: PHAsset, options?: ImageOptions): Promise<image_source.ImageSource> {
        return new Promise<image_source.ImageSource>((resolve, reject) => {
            let size: CGSize = options ? CGSizeMake(options.maxWidth, options.maxHeight) : PHImageManagerMaximumSize;
            let resizeMode = PHImageRequestOptions.alloc().init();
            let aspectRatio = (options && options.aspectRatio && options.aspectRatio === 'fill') ? PHImageContentMode.AspectFill : PHImageContentMode.AspectFit;

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
                aspectRatio,
                resizeMode,
                (createdImage, data) => {
                    if (createdImage) {
                        let imageSource = new image_source.ImageSource();
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
        let result = [];
        for (let i = 0; i < this.selection.length; ++i) {
            result.push(this.selection.getItem(i));
        }
        this.notifySelection(result);
    }

    private initialize(): void {
        if (this._initialized) {
            return;
        }

        this._initialized = true;

        let smart = PHAssetCollection.fetchAssetCollectionsWithTypeSubtypeOptions(PHAssetCollectionType.SmartAlbum, PHAssetCollectionSubtype.AlbumRegular, null);
        this.addAlbumsForFetchResult(smart);

        let user = PHCollection.fetchTopLevelUserCollectionsWithOptions(null);
        this.addAlbumsForFetchResult(user);
    }
}

class AlbumPH extends Album {
    private _setThumb: boolean;
    private _options: ImageOptions;

    constructor(imagePicker: ImagePicker, title: string, options?: ImageOptions) {
        super(imagePicker, title);
        this._setThumb = false;
        this._options = options;
    }

    addAssetsForFetchResult(result: PHFetchResult<any>): void {
        for (let i = 0; i < result.count; i++) {
            let asset = result.objectAtIndex(i);
            if (asset.isKindOfClass(PHAsset)) {
                this.addAsset(<PHAsset>asset);
            } else {
                console.log("Ignored asset: " + asset);
            }
        }
    }

    addAsset(asset: PHAsset): void {
        let imagePicker = <ImagePickerPH>this.imagePicker;
        let item = new AssetPH(this, asset, this._options);

        if (!this._setThumb && imagePicker) {
            this._setThumb = true;
            imagePicker.createPHImageThumbAsset(this, asset);

        }
        if (this.imagePicker.newestFirst) {
            this.assets.unshift(item);
        } else {
            this.assets.push(item);
        }
    }
}

class AssetPH extends Asset {
    private _phAsset: PHAsset;
    private static _uriRequestOptions: PHImageRequestOptions;

    constructor(album: AlbumPH, phAsset: PHAsset, options?: ImageOptions) {
        super(album, phAsset);
        this._phAsset = phAsset;
        this._initializeOptions(options);
    }

    /**
     * Gets the underlying iOS PHAsset instance.
     */
    public get ios(): any {
        return this._phAsset;
    }

    get uri(): string {
        return this._phAsset.localIdentifier.toString();
    }

    private _initializeOptions(options: ImageOptions): void {
        if (options) {
            this.options = {
                width: options.maxWidth && options.maxWidth < IMAGE_WIDTH ? options.maxWidth : IMAGE_WIDTH,
                height: options.maxHeight && options.maxHeight < IMAGE_HEIGHT ? options.maxHeight : IMAGE_HEIGHT,
                keepAspectRatio: true
            };
        } else {
            this.options = {
                width: IMAGE_WIDTH,
                height: IMAGE_HEIGHT,
                keepAspectRatio: true
            };
        }
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

        let uri;
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
            let runloop = CFRunLoopGetCurrent();
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
