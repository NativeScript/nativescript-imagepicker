import * as data_observable from "tns-core-modules/data/observable";
import * as frame from "tns-core-modules/ui/frame";
import * as imageAssetModule from "tns-core-modules/image-asset";
import { Options, ImagePickerMediaType } from ".";
import { View } from "tns-core-modules/ui/core/view/view";

const defaultAssetCollectionSubtypes: NSArray<any> = NSArray.arrayWithArray(<any>[
    PHAssetCollectionSubtype.SmartAlbumRecentlyAdded,
    PHAssetCollectionSubtype.SmartAlbumUserLibrary,
    PHAssetCollectionSubtype.AlbumMyPhotoStream,
    PHAssetCollectionSubtype.SmartAlbumFavorites,
    PHAssetCollectionSubtype.SmartAlbumPanoramas,
    PHAssetCollectionSubtype.SmartAlbumBursts,
    PHAssetCollectionSubtype.AlbumCloudShared,
    PHAssetCollectionSubtype.SmartAlbumSelfPortraits,
    PHAssetCollectionSubtype.SmartAlbumScreenshots,
    PHAssetCollectionSubtype.SmartAlbumLivePhotos
]);

export class ImagePicker extends data_observable.Observable {
    _imagePickerController: QBImagePickerController;
    _imagePickerControllerDelegate: ImagePickerControllerDelegate;
    _hostView: View;

    // lazy-load latest frame.topmost() if _hostName is not used
    get hostView() {
        return this._hostView;
    }

    get hostController() {
        return this.hostView ? this.hostView.viewController : UIApplication.sharedApplication.keyWindow.rootViewController;
    }

    constructor(options: Options = {}, hostView: View) {
        super();

        this._hostView = hostView;
        this._imagePickerControllerDelegate = new ImagePickerControllerDelegate();

        let imagePickerController = QBImagePickerController.alloc().init();
        imagePickerController.assetCollectionSubtypes = defaultAssetCollectionSubtypes;
        imagePickerController.mediaType = options.mediaType ? <QBImagePickerMediaType>options.mediaType.valueOf() : QBImagePickerMediaType.Any;
        imagePickerController.delegate = this._imagePickerControllerDelegate;
        imagePickerController.allowsMultipleSelection = options.mode === 'multiple';
        imagePickerController.minimumNumberOfSelection = options.minimumNumberOfSelection || 0;
        imagePickerController.maximumNumberOfSelection = options.maximumNumberOfSelection || 0;
        imagePickerController.showsNumberOfSelectedAssets = options.showsNumberOfSelectedAssets || true;
        imagePickerController.numberOfColumnsInPortrait = options.numberOfColumnsInPortrait || imagePickerController.numberOfColumnsInPortrait;
        imagePickerController.numberOfColumnsInLandscape = options.numberOfColumnsInLandscape || imagePickerController.numberOfColumnsInLandscape;
        imagePickerController.prompt = options.prompt || imagePickerController.prompt;

        this._imagePickerController = imagePickerController;
    }

    authorize(): Promise<void> {
        console.log("authorizing...");

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

    present() {
        return new Promise<void>((resolve, reject) => {
            this._imagePickerControllerDelegate._resolve = resolve;
            this._imagePickerControllerDelegate._reject = reject;

            this.hostController.presentViewControllerAnimatedCompletion(this._imagePickerController, true, null);
        });
    }
}

export class ImagePickerControllerDelegate extends NSObject implements QBImagePickerControllerDelegate {
    _resolve: any;
    _reject: any;

    qb_imagePickerControllerDidCancel?(imagePickerController: QBImagePickerController): void {
        imagePickerController.dismissViewControllerAnimatedCompletion(true, null);
        this._reject(new Error("Selection canceled."));
    }

    qb_imagePickerControllerDidFinishPickingAssets?(imagePickerController: QBImagePickerController, iosAssets: NSArray<any>): void {
        let assets = [];

        for (let i = 0; i < iosAssets.count; i++) {
            let asset = new imageAssetModule.ImageAsset(iosAssets[i]);

            // this fixes the image aspect ratio in tns-core-modules version < 4.0
            if (!asset.options) {
                asset.options = { keepAspectRatio: true };
            }

            assets.push(asset);
        }

        this._resolve(assets);

        imagePickerController.dismissViewControllerAnimatedCompletion(true, null);
    }

    public static ObjCProtocols = [QBImagePickerControllerDelegate];

    static new(): ImagePickerControllerDelegate {
        return <ImagePickerControllerDelegate>super.new(); // calls new() on the NSObject
    }
}

export function create(options?: Options, hostView?: View): ImagePicker {
    return new ImagePicker(options, hostView);
}

