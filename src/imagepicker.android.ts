import * as observable from "tns-core-modules/data/observable";
import * as imagesource from "tns-core-modules/image-source";
import * as application from "tns-core-modules/application";
import * as platform from "tns-core-modules/platform";
import * as imageAssetModule from "tns-core-modules/image-asset";
import * as permissions from "nativescript-permissions";

interface ArrayBufferStatic extends ArrayBufferConstructor {
    from(buffer: java.nio.ByteBuffer): ArrayBuffer;
}

export class SelectedAsset extends imageAssetModule.ImageAsset {
    private _uri: android.net.Uri;
    private _thumbAsset: imageAssetModule.ImageAsset;
    private _fileUri: string;
    private _data: ArrayBuffer;

    constructor(uri: android.net.Uri) {
        super(SelectedAsset._calculateFileUri(uri));
        this._uri = uri;
    }

    data(): Promise<any> {
        return Promise.reject(new Error("Not implemented."));
    }

    getImage(options?: { maxWidth: number, maxHeight: number }): Promise<imagesource.ImageSource> {
        return new Promise<imagesource.ImageSource>((resolve, reject) => {
            try {
                resolve(this.decodeUri(this._uri, options));
            } catch (ex) {
                reject(ex);
            }
        });
    }

    getImageData(): Promise<ArrayBuffer> {
        return new Promise<ArrayBuffer>((resolve, reject) => {
            try {
                if (!this._data) {
                    let bb = this.getByteBuffer(this._uri);
                    this._data = (<ArrayBufferStatic>ArrayBuffer).from(bb);
                }
                resolve(this._data);
            } catch (ex) {
                reject(ex);
            }
        });
    }

    get thumbAsset(): imageAssetModule.ImageAsset {
        return this._thumbAsset;
    }

    protected setThumbAsset(value: imageAssetModule.ImageAsset): void {
        this._thumbAsset = value;
        this.notifyPropertyChange("thumbAsset", value);
    }

    get uri(): string {
        return this._uri.toString();
    }

    get fileUri(): string {
        if (!this._fileUri) {
            this._fileUri = SelectedAsset._calculateFileUri(this._uri);
        }
        return this._fileUri;
    }

    private static _calculateFileUri(uri: android.net.Uri) {
        let DocumentsContract = (<any>android.provider).DocumentsContract;
        let isKitKat = android.os.Build.VERSION.SDK_INT >= 19; // android.os.Build.VERSION_CODES.KITKAT

        if (isKitKat && DocumentsContract.isDocumentUri(application.android.context, uri)) {
            let docId, id, type;
            let contentUri: android.net.Uri = null;

            // ExternalStorageProvider
            if (SelectedAsset.isExternalStorageDocument(uri)) {
                docId = DocumentsContract.getDocumentId(uri);
                id = docId.split(":")[1];
                type = docId.split(":")[0];

                if ("primary" === type.toLowerCase()) {
                    return android.os.Environment.getExternalStorageDirectory() + "/" + id;
                }

                // TODO handle non-primary volumes
            }
            // DownloadsProvider
            else if (SelectedAsset.isDownloadsDocument(uri)) {
                id = DocumentsContract.getDocumentId(uri);
                contentUri = android.content.ContentUris.withAppendedId(
                    android.net.Uri.parse("content://downloads/public_downloads"), long(id));

                return SelectedAsset.getDataColumn(contentUri, null, null);
            }
            // MediaProvider
            else if (SelectedAsset.isMediaDocument(uri)) {
                docId = DocumentsContract.getDocumentId(uri);
                let split = docId.split(":");
                type = split[0];
                id = split[1];

                if ("image" === type) {
                    contentUri = android.provider.MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
                } else if ("video" === type) {
                    contentUri = android.provider.MediaStore.Video.Media.EXTERNAL_CONTENT_URI;
                } else if ("audio" === type) {
                    contentUri = android.provider.MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;
                }

                let selection = "_id=?";
                let selectionArgs = [id];

                return SelectedAsset.getDataColumn(contentUri, selection, selectionArgs);
            }
        }
        else {
            // MediaStore (and general)
            if ("content" === uri.getScheme()) {
                return SelectedAsset.getDataColumn(uri, null, null);
            }
            // FILE
            else if ("file" === uri.getScheme()) {
                return uri.getPath();
            }
        }

        return undefined;
    }

    private static getDataColumn(uri: android.net.Uri, selection, selectionArgs) {

        let cursor = null;
        let columns = [android.provider.MediaStore.MediaColumns.DATA];
        let filePath;

        try {
            cursor = this.getContentResolver().query(uri, columns, selection, selectionArgs, null);
            if (cursor != null && cursor.moveToFirst()) {
                let column_index = cursor.getColumnIndexOrThrow(columns[0]);
                filePath = cursor.getString(column_index);
                if (filePath) {
                    return filePath;
                }
            }
        }
        catch (e) {
            console.log(e);
        }
        finally {
            if (cursor) {
                cursor.close();
            }
        }

        return undefined;
    }

    private static isExternalStorageDocument(uri: android.net.Uri) {
        return "com.android.externalstorage.documents" === uri.getAuthority();
    }

    private static isDownloadsDocument(uri: android.net.Uri) {
        return "com.android.providers.downloads.documents" === uri.getAuthority();
    }

    private static isMediaDocument(uri: android.net.Uri) {
        return "com.android.providers.media.documents" === uri.getAuthority();
    }

    private decodeThumbAssetUri(): void {
        // Decode image size
        let REQUIRED_SIZE = {
            maxWidth: 100,
            maxHeight: 100
        };

        // Decode with scale
        this._thumbAsset = this.decodeUriForImageAsset(this._uri, REQUIRED_SIZE);
        this.notifyPropertyChange("thumbAsset", this._thumbAsset);
    }

    /**
     * Discovers the sample size that a BitmapFactory.Options object should have
     * to scale the retrieved image to the given max size.
     * @param uri The URI of the image that should be scaled.
     * @param options The options that should be used to produce the correct image scale.
     */
    private getSampleSize(uri: android.net.Uri, options?: { maxWidth: number, maxHeight: number }): number {
        let boundsOptions = new android.graphics.BitmapFactory.Options();
        boundsOptions.inJustDecodeBounds = true;
        android.graphics.BitmapFactory.decodeStream(this.openInputStream(uri), null, boundsOptions);

        // Find the correct scale value. It should be the power of 2.
        let outWidth = boundsOptions.outWidth;
        let outHeight = boundsOptions.outHeight;
        let scale = 1;
        if (options) {
            // TODO: Refactor to accomodate different scaling options
            //       Right now, it just selects the smallest of the two sizes
            //       and scales the image proportionally to that.
            let targetSize = !options.maxWidth && options.maxHeight ? options.maxHeight :
                (!options.maxHeight && options.maxWidth ? options.maxWidth :
                    (options.maxWidth < options.maxHeight ? options.maxWidth : options.maxHeight));
            if (targetSize) {
                while (!(this.matchesSize(targetSize, outWidth) ||
                    this.matchesSize(targetSize, outHeight))) {
                    outWidth /= 2;
                    outHeight /= 2;
                    scale *= 2;
                }
            }
        }
        return scale;
    }

    private matchesSize(targetSize: number, actualSize: number): boolean {
        return targetSize && actualSize / 2 < targetSize;
    }

    /**
     * Decodes the given URI using the given options.
     * @param uri The URI that should be decoded into an ImageSource.
     * @param options The options that should be used to decode the image.
     */
    private decodeUri(uri: android.net.Uri, options?: { maxWidth: number, maxHeight: number }): imagesource.ImageSource {
        let downsampleOptions = new android.graphics.BitmapFactory.Options();
        downsampleOptions.inSampleSize = this.getSampleSize(uri, options);
        let bitmap = android.graphics.BitmapFactory.decodeStream(this.openInputStream(uri), null, downsampleOptions);
        let image = new imagesource.ImageSource();
        image.setNativeSource(bitmap);
        return image;
    }

    /**
     * Decodes the given URI using the given options.
     * @param uri The URI that should be decoded into an ImageAsset.
     * @param options The options that should be used to decode the image.
     */
    private decodeUriForImageAsset(uri: android.net.Uri, options?: { maxWidth: number, maxHeight: number }): imageAssetModule.ImageAsset {
        let downsampleOptions = new android.graphics.BitmapFactory.Options();
        downsampleOptions.inSampleSize = this.getSampleSize(uri, options);
        let bitmap = android.graphics.BitmapFactory.decodeStream(this.openInputStream(uri), null, downsampleOptions);
        return new imageAssetModule.ImageAsset(bitmap);
    }

    /**
     * Retrieves the raw data of the given file and exposes it as a byte buffer.
     */
    private getByteBuffer(uri: android.net.Uri): java.nio.ByteBuffer {
        let file: android.content.res.AssetFileDescriptor = null;
        try {
            file = SelectedAsset.getContentResolver().openAssetFileDescriptor(uri, "r");

            // Determine how many bytes to allocate in memory based on the file length
            let length: number = file.getLength();
            let buffer: java.nio.ByteBuffer = java.nio.ByteBuffer.allocateDirect(length);
            let bytes = buffer.array();
            let stream = file.createInputStream();

            // Buffer the data in 4KiB amounts
            let reader = new java.io.BufferedInputStream(stream, 4096);
            reader.read(bytes, 0, bytes.length);
            return buffer;
        } finally {
            if (file) {
                file.close();
            }
        }
    }

    private openInputStream(uri: android.net.Uri): java.io.InputStream {
        return SelectedAsset.getContentResolver().openInputStream(uri);
    }

    private static getContentResolver(): android.content.ContentResolver {
        return application.android.nativeApp.getContentResolver();
    }
}

export class ImagePicker {
    private _options;

    constructor(options) {
        this._options = options;
    }

    get mode(): string {
        return this._options && this._options.mode && this._options.mode.toLowerCase() === 'single' ? 'single' : 'multiple';
    }

    authorize(): Promise<void> {
        if ((<any>android).os.Build.VERSION.SDK_INT >= 23) {
            return permissions.requestPermission([(<any>android).Manifest.permission.READ_EXTERNAL_STORAGE]);
        } else {
            return Promise.resolve();
        }
    }

    present(): Promise<SelectedAsset[]> {
        return new Promise((resolve, reject) => {

            // WARNING: If we want to support multiple pickers we will need to have a range of IDs here:
            let RESULT_CODE_PICKER_IMAGES = 9192;

            let application = require("application");
            application.android.on(application.AndroidApplication.activityResultEvent, onResult);

            function onResult(args) {

                let requestCode = args.requestCode;
                let resultCode = args.resultCode;
                let data = args.intent;

                if (requestCode === RESULT_CODE_PICKER_IMAGES) {
                    if (resultCode === android.app.Activity.RESULT_OK) {

                        try {
                            let results = [];

                            let clip = data.getClipData();
                            if (clip) {
                                let count = clip.getItemCount();
                                for (let i = 0; i < count; i++) {
                                    let clipItem = clip.getItemAt(i);
                                    if (clipItem) {
                                        let uri = clipItem.getUri();
                                        if (uri) {
                                            results.push(new SelectedAsset(uri));
                                        }
                                    }
                                }
                            } else {
                                let uri = data.getData();
                                results.push(new SelectedAsset(uri));
                            }

                            application.android.off(application.AndroidApplication.activityResultEvent, onResult);
                            resolve(results);
                            return;

                        } catch (e) {
                            application.android.off(application.AndroidApplication.activityResultEvent, onResult);
                            reject(e);
                            return;

                        }
                    } else {
                        application.android.off(application.AndroidApplication.activityResultEvent, onResult);
                        reject(new Error("Image picker activity result code " + resultCode));
                        return;
                    }
                }
            }

            let Intent = android.content.Intent;
            let intent = new Intent();
            intent.setType("image/*");

            // TODO: Use (<any>android).content.Intent.EXTRA_ALLOW_MULTIPLE
            if (this.mode === 'multiple') {
                intent.putExtra("android.intent.extra.ALLOW_MULTIPLE", true);
            }

            intent.setAction(Intent.ACTION_GET_CONTENT);

            let chooser = Intent.createChooser(intent, "Select Picture");
            application.android.foregroundActivity.startActivityForResult(intent, RESULT_CODE_PICKER_IMAGES);
        });
    }
}

export function create(options?): ImagePicker {
    return new ImagePicker(options);
}
