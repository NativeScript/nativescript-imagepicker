import { Observable, View } from "@nativescript/core";
import { Options } from "./imagepicker.common";
export * from "./imagepicker.common";
export declare class ImagePicker extends Observable {
    _imagePickerController: QBImagePickerController;
    _hostView: View;
    _delegate: ImagePickerControllerDelegate;
    get hostView(): View;
    get hostController(): UIViewController;
    constructor(options: Options, hostView: View);
    authorize(): Promise<void>;
    present(): Promise<void>;
    _cleanup(): void;
}
export declare class ImagePickerControllerDelegate extends NSObject implements QBImagePickerControllerDelegate {
    _resolve: any;
    _reject: any;
    owner: WeakRef<ImagePicker>;
    qb_imagePickerControllerDidCancel?(imagePickerController: QBImagePickerController): void;
    qb_imagePickerControllerDidFinishPickingAssets?(imagePickerController: QBImagePickerController, iosAssets: NSArray<any>): void;
    static ObjCProtocols: {
        prototype: QBImagePickerControllerDelegate;
    }[];
    static initWithOwner(owner: ImagePicker, resolve: any, reject: any): ImagePickerControllerDelegate;
}
export declare function create(options?: Options, hostView?: View): ImagePicker;
