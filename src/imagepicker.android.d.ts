import { ImageAsset } from "@nativescript/core";
import { Options } from "./imagepicker.common";
export * from "./imagepicker.common";
export declare class ImagePicker {
    private _options;
    constructor(options: Options);
    get mode(): string;
    get mediaType(): string;
    get mimeTypes(): any;
    authorize(): Promise<void>;
    present(): Promise<ImageAsset[]>;
}
export declare function create(options?: Options): ImagePicker;
