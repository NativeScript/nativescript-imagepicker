declare module "imagepicker" {

    import observable = require("data/observable");
    import imagesource = require("image-source");

    export class SelectedAsset extends observable.Observable {
        /**
         * A 100x100 pixels thumb of the selected image.
         * This property will be initialized on demand. The first access will return undefined or null.
         * It will trigger an async load and when the thumb is obtained, a property changed notification will occur.
         */
        thumb: imagesource.ImageSource;

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
         * For iOS Returns a promise with NSData representation of the asset.
         * Note that in future versions it should return ArrayBuffer.
         */
        data(): Thenable<any>;
    }

    export class ImagePicker {
        /**
         * Call this before 'present' to request any additional permissions that may be necessary.
         * In case of failed authorization consider notifying the user for degraded functionality.
         */
        authorize(): Thenable<void>;

        /**
         * Present the image picker UI.
         * The result will be an array of SelectedAsset instances provided when the promise is fulfiled. 
         */
        present(): Thenable<SelectedAsset[]>;
    }

    /**
     * Provide options for the image picker.
     */
    interface Options {
        /**
         * Set the picker mode. Supported modes: "single" or "multiple" (default).
         */
        selectionMode?: string;
    }

    export function create(options?: Options): ImagePicker;
}
