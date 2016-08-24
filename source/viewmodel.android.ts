import observable = require("data/observable");
import imagesource = require("image-source");
import application = require("application");

interface ArrayBufferStatic extends ArrayBufferConstructor {
    from(buffer: java.nio.ByteBuffer): ArrayBuffer;
}

var Intent = android.content.Intent;
var Activity = android.app.Activity;
var MediaStore = android.provider.MediaStore;
var DocumentsContract = (<any>android.provider).DocumentsContract;
var BitmapFactory = android.graphics.BitmapFactory;
var StaticArrayBuffer = <ArrayBufferStatic>ArrayBuffer;

export class SelectedAsset extends observable.Observable {
    private _uri: android.net.Uri;
    private _thumb: imagesource.ImageSource;
    private _thumbRequested: boolean;
    private _fileUri: string;
    private _data: ArrayBuffer;

    constructor(uri: android.net.Uri) {
        super();
        this._uri = uri;
        this._thumbRequested = false;
    }

    data(): Thenable<any> {
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
                    var bb = this.getByteBuffer(this._uri);
                    this._data = StaticArrayBuffer.from(bb);
                }
                resolve(this._data);
            } catch (ex) {
                reject(ex);
            }
        });
    }

    get thumb(): imagesource.ImageSource {
        if (!this._thumbRequested) {
            this.decodeThumbUri();
        }
        return this._thumb;
    }

    get uri(): string {
        return this._uri.toString();
    }

    get fileUri(): string {
        if (!this._fileUri) {
            this._fileUri = this._calculateFileUri();
        }
        return this._fileUri;
    }

  private _calculateFileUri() {
        var _this = this;

        var isKitKat = android.os.Build.VERSION.SDK_INT >= 19;//android.os.Build.VERSION_CODES.KITKAT

        if (isKitKat && DocumentsContract.isDocumentUri(application.android.context, this._uri)) {
            // ExternalStorageProvider
            if (_this.isExternalStorageDocument(this._uri)) {
                var docId = DocumentsContract.getDocumentId(this._uri);
                var id = docId.split(":")[1];
                var type = docId.split(":")[0];

                if ("primary" === type.toLowerCase()) {
                    return android.os.Environment.getExternalStorageDirectory() + "/" + id;
                }

            // TODO handle non-primary volumes
            }
                // DownloadsProvider
                else if (_this.isDownloadsDocument(this._uri)) {

                    var id = DocumentsContract.getDocumentId(this._uri);
                    var contentUri = android.content.ContentUris.withAppendedId(
                            android.net.Uri.parse("content://downloads/public_downloads"), id);

                    return _this.getDataColumn( contentUri, null, null);
                }
                // MediaProvider
                else if (_this.isMediaDocument(this._uri)) {
                    var docId = DocumentsContract.getDocumentId(this._uri);
                    var split = docId.split(":");
                    var type = split[0];
                    var id = split[1];

                    var contentUri: android.net.Uri = null;
                    if ("image" === type) {
                        contentUri = MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
                    } else if ("video" === type) {
                        contentUri = MediaStore.Video.Media.EXTERNAL_CONTENT_URI;
                    } else if ("audio" === type) {
                        contentUri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;
                    }

                    var selection = "_id=?";
                    var selectionArgs = [ id ];

                    return _this.getDataColumn(contentUri, selection, selectionArgs);
                }
        }
        else {
            // MediaStore (and general)
            if ("content" === this._uri.getScheme()) {
                return _this.getDataColumn(this._uri, null, null);
            }
            // FILE
            else if ("file" === this._uri.getScheme()) {
                return this._uri.getPath();
            }
        }

        return undefined;
    };

    private getDataColumn( uri: android.net.Uri, selection, selectionArgs) {

        var cursor = null;
        var columns = [MediaStore.MediaColumns.DATA];
 
        var filePath;

        try {
            cursor = this.getContentResolver().query(uri, columns, selection, selectionArgs, null);
            if (cursor != null && cursor.moveToFirst()) {
                var column_index = cursor.getColumnIndexOrThrow(columns[0]);
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

        try {
            filePath = this._uri.getPath();
            if (filePath) {
                return filePath;
            }
        }
        catch (e) {
            console.log(e);
        }

        return undefined;
   };

    private isExternalStorageDocument(uri: android.net.Uri) {
        return "com.android.externalstorage.documents" === uri.getAuthority();
    };
    private isDownloadsDocument(uri: android.net.Uri) {
        return "com.android.providers.downloads.documents" === uri.getAuthority();
    };
    private isMediaDocument(uri: android.net.Uri) {
        return "com.android.providers.media.documents" === uri.getAuthority();
    };

    private decodeThumbUri(): void {
        // Decode image size
        var REQUIRED_SIZE = {
            maxWidth: 100,
            maxHeight: 100
        };

        // Decode with scale
        this._thumb = this.decodeUri(this._uri, REQUIRED_SIZE);
        this.notifyPropertyChange("thumb", this._thumb);
    }

    /**
     * Discovers the sample size that a BitmapFactory.Options object should have
     * to scale the retrieved image to the given max size.
     * @param uri The URI of the image that should be scaled.
     * @param options The options that should be used to produce the correct image scale.
     */
    private getSampleSize(uri: android.net.Uri, options?: { maxWidth: number, maxHeight: number }): number {
        var boundsOptions = new BitmapFactory.Options();
        boundsOptions.inJustDecodeBounds = true;
        BitmapFactory.decodeStream(this.openInputStream(uri), null, boundsOptions);

        // Find the correct scale value. It should be the power of 2.
        var outWidth = boundsOptions.outWidth;
        var outHeight = boundsOptions.outHeight;
        var scale = 1;
        if (options) {
            // TODO: Refactor to accomodate different scaling options
            //       Right now, it just selects the smallest of the two sizes
            //       and scales the image proportionally to that.
            var targetSize = options.maxWidth < options.maxHeight ? options.maxWidth : options.maxHeight;
            while (!(this.matchesSize(targetSize, outWidth) ||
                this.matchesSize(targetSize, outHeight))) {
                outWidth /= 2;
                outHeight /= 2;
                scale *= 2;
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
        var downsampleOptions = new BitmapFactory.Options();
        downsampleOptions.inSampleSize = this.getSampleSize(uri, options);
        var bitmap = BitmapFactory.decodeStream(this.openInputStream(uri), null, downsampleOptions);
        var image = new imagesource.ImageSource();
        image.setNativeSource(bitmap);
        return image;
    }

    /**
     * Retrieves the raw data of the given file and exposes it as a byte buffer.
     */
    private getByteBuffer(uri: android.net.Uri): java.nio.ByteBuffer {
        var file: android.content.res.AssetFileDescriptor = null;
        try {
            file = this.getContentResolver().openAssetFileDescriptor(uri, "r");

            // Determine how many bytes to allocate in memory based on the file length
            var length: number = file.getLength();
            var buffer: java.nio.ByteBuffer = java.nio.ByteBuffer.allocateDirect(length);
            var bytes = buffer.array();
            var stream = file.createInputStream();

            // Buffer the data in 4KiB amounts
            var reader = new java.io.BufferedInputStream(stream, 4096);
            reader.read(bytes, 0, bytes.length);
            return buffer;
        } finally {
            if (file) {
                file.close();
            }
        }
    }

    private openInputStream(uri: android.net.Uri): java.io.InputStream {
        return this.getContentResolver().openInputStream(uri);
    }

    private getContentResolver(): android.content.ContentResolver {
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

    authorize(): Thenable<void> {
        return Promise.resolve<void>();
    }

    present(): Thenable<SelectedAsset[]> {
        return new Promise((resolve, reject) => {

            // WARNING: If we want to support multiple pickers we will need to have a range of IDs here:
            var RESULT_CODE_PICKER_IMAGES = 9192;

            var application = require("application");
            application.android.on(application.AndroidApplication.activityResultEvent, onResult);

            function onResult(args) {

                var requestCode = args.requestCode;
                var resultCode = args.resultCode;
                var data = args.intent;

                if (requestCode == RESULT_CODE_PICKER_IMAGES) {
                    if (resultCode == Activity.RESULT_OK) {

                        try {
                            var results = [];

                            var clip = data.getClipData();
                            if (clip) {
                                var count = clip.getItemCount();
                                for (var i = 0; i < count; i++) {
                                    var clipItem = clip.getItemAt(i);
                                    if (clipItem) {
                                        var uri = clipItem.getUri();
                                        if (uri) {
                                            results.push(new SelectedAsset(uri));
                                        }
                                    }
                                }
                            } else {
                                var uri = data.getData();
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
            };

            var intent = new Intent();
            intent.setType("image/*");

            // TODO: Use (<any>android).content.Intent.EXTRA_ALLOW_MULTIPLE
            if (this.mode === 'multiple') {
                intent.putExtra("android.intent.extra.ALLOW_MULTIPLE", true);
            }

            intent.setAction(Intent.ACTION_GET_CONTENT);

            var chooser = Intent.createChooser(intent, "Select Picture");
            application.android.foregroundActivity.startActivityForResult(intent, RESULT_CODE_PICKER_IMAGES);
        });
    }
}

export function create(options?): ImagePicker {
    return new ImagePicker(options);
}
