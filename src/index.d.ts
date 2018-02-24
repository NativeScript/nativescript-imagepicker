import { Observable } from "tns-core-modules/data/observable";
import { ImageSource } from "tns-core-modules/image-source";
import { ImageAsset } from "tns-core-modules/image-asset";

export interface ImageOptions {
    /**
     * The maximum width that the image is allowed to be.
     */
    maxWidth?: number;

    /**
     * The maximum height that the image is allowed to be.
     */
    maxHeight?: number;

    /**
     * iOS only. The image aspect ratio. Default value: fit.
     */
    aspectRatio?: "fill" | "fit";
}

export class SelectedAsset extends ImageAsset {
    /**
     * A 100x100 pixels thumb of the selected image.
     * This property will be initialized on demand. The first access will return undefined or null.
     * It will trigger an async load and when the thumb is obtained, a property changed notification will occur.
     */
    thumb: ImageSource;

    /**
     * URI that identifies the image asset.
     * Chances are you do not have permissions to read this uri.
     * The image data should be obtained using the other instance members.
     */
    uri: string;

    /**
     * An URI that identifies the local asset file.
     * Chances are you do not have permissions to read this file.
     * The image data should be obtained using the other instance members.
     */
    fileUri: string;

    /**
     * Asynchronously retrieves an ImageSource object that represents this selected image.
     * Scaled to the given size. (Aspect-ratio is preserved by default)
     */
    getImage(options?: ImageOptions): Promise<ImageSource>;

    /**
     * Asynchronously retrieves an ArrayBuffer that represents the raw byte data from this selected image.
     */
    getImageData(): Promise<ArrayBuffer>;

    /**
     * For iOS Returns a promise with NSData representation of the asset.
     * On Android, Returns a promise with a java.io.InputStream.
     * Note that in future versions it should return ArrayBuffer.
     */
    data(): Promise<any>;
}

export class ImagePicker {
    /**
     * Call this before 'present' to request any additional permissions that may be necessary.
     * In case of failed authorization consider notifying the user for degraded functionality.
     */
    authorize(): Promise<void>;

    /**
     * Present the image picker UI.
     * The result will be an array of SelectedAsset instances provided when the promise is fulfilled.
     */
    present(): Promise<SelectedAsset[]>;
}

/**
 * Provide options for the image picker.
 */
interface Options {
    /**
     * Set the picker mode. Supported modes: "single" or "multiple" (default).
     */
    mode?: string;

    /**
    * Set the text for the done button in iOS
    */
    doneText?: string;

    /**
    * Set the text for the cancel button in iOS
    */
    cancelText?: string;

    /**
    * Set the text for the albums button in iOS
    */
    albumsText?: string;

    android?: {
        /**
         * Provide a reason for permission request to access external storage on api levels above 23.
         */
        read_external_storage?: string;
    };

    /**
     * Indicates images should be sorted newest-first (iOS only, default false).
     */
    newestFirst?: boolean;
}

export function create(options?: Options): ImagePicker;
