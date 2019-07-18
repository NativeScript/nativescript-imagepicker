import { Observable } from "tns-core-modules/data/observable";
import { ImageSource } from "tns-core-modules/image-source";
import { ImageAsset } from "tns-core-modules/image-asset";
import { View } from "tns-core-modules/ui/core/view/view";

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
    present(): Promise<ImageAsset[]>;
}

export declare const enum ImagePickerMediaType {
    Any = 0,
    Image = 1,
    Video = 2
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
    * Set the minumum number of selected assets in iOS
    */
    minimumNumberOfSelection?: number;

    /**
     * Set the maximum number of selected assets in iOS
     */
    maximumNumberOfSelection?: number;

    /**
     * Display the number of selected assets in iOS
     */
    showsNumberOfSelectedAssets?: boolean;

    /**
     * Display prompt text when selecting assets in iOS
     */
    prompt?: string;

    /**
     * Set the number of columns in Portrait in iOS
     */
    numberOfColumnsInPortrait?: number;

    /**
     * Set the number of columns in Landscape in iOS
     */
    numberOfColumnsInLandscape?: number;

    /**
     * Set the media type (image/video/any) to pick
     */
    mediaType?: ImagePickerMediaType;

    android?: {
        /**
         * Provide a reason for permission request to access external storage on api levels above 23.
         */
        read_external_storage?: string;
    };
}

/**
 * @param {Options} [options] - options for the image picker.
 * @param {View} [hostView] - [use in iOS] the view that hosts the image picker (e.g. to use when open from a modal page).
 */
export function create(options?: Options, hostView?: View): ImagePicker;
