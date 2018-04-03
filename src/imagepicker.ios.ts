import * as data_observable from "tns-core-modules/data/observable";
import * as frame from "tns-core-modules/ui/frame";
import * as imageAssetModule from "tns-core-modules/image-asset";

interface ImagePickerOptions {
    mode?: string;
    maxImagesToPick?: number;
    showSelectedImagesCount?: boolean;
}

export class SelectedAsset extends imageAssetModule.ImageAsset {
    constructor(phAsset: PHAsset, options?) {
        super(phAsset);

        // this fixes the image aspect ratio in tns-core-modules version < 4.0
        if (!this.options) {
            this.options = { keepAspectRatio: true };
        }
    }
}

export class ImagePicker extends data_observable.Observable {
    _imagePickerController: QBImagePickerController;
    _imagePickerControllerDelegate: ImagePickerControllerDelegate;

    constructor(options: ImagePickerOptions) {
        super();

        this._imagePickerControllerDelegate = new ImagePickerControllerDelegate();

        let imagePickerController = QBImagePickerController.alloc().init();
        imagePickerController.delegate = this._imagePickerControllerDelegate;
        imagePickerController.allowsMultipleSelection = options.mode === 'multiple';
        imagePickerController.maximumNumberOfSelection = options.maxImagesToPick || 0;
        imagePickerController.showsNumberOfSelectedAssets = options.showSelectedImagesCount || true;

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

            frame.topmost().ios.controller.presentViewControllerAnimatedCompletion(this._imagePickerController, true, null);
        });
    }
}

export class ImagePickerControllerDelegate extends NSObject implements QBImagePickerControllerDelegate {
    _resolve: any;

    qb_imagePickerControllerDidCancel?(imagePickerController: QBImagePickerController): void {
        imagePickerController.dismissViewControllerAnimatedCompletion(true, null);
    }

    qb_imagePickerControllerDidFinishPickingAssets?(imagePickerController: QBImagePickerController, iosAssets: NSArray<any>): void {
        let assets = [];

        for (let i = 0; i < iosAssets.count; i++) {
            let asset = new SelectedAsset(iosAssets[i]);
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

export function create(options?: ImagePickerOptions): ImagePicker {
    return new ImagePicker(options);
}

