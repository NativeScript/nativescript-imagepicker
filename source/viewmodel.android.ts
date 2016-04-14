import observable = require("data/observable");
import imagesource = require("image-source");
import application = require("application");

interface ArrayBufferStatic extends ArrayBufferConstructor {
    from(buffer: java.nio.ByteBuffer): ArrayBuffer;
}

var Intent = android.content.Intent;
var Activity = android.app.Activity;
var MediaStore = android.provider.MediaStore;
var BitmapFactory = android.graphics.BitmapFactory;
var StaticArrayBuffer = <ArrayBufferStatic>ArrayBuffer;

export class SelectedAsset extends observable.Observable {
    private _uri: android.net.Uri;
    private _thumb: imagesource.ImageSource;
    private _image: imagesource.ImageSource;
    private _thumbRequested: boolean;
    private _fileUri: string;
    private _data: ArrayBuffer;

    constructor(uri: android.net.Uri) {
        super();
        this._uri = uri;
        this._thumbRequested = false;
        this._image = null;
    }

    data(): Thenable<any> {
        return Promise.reject(new Error("Not implemented."));
    }

    getImage(options?): Promise<imagesource.ImageSource> {
        return new Promise<imagesource.ImageSource>((resolve, reject) => {
            resolve(this.decodeUri(this._uri, options));
        });
    }

    getImageData(): Promise<ArrayBuffer> {
        return new Promise<ArrayBuffer>((resolve, reject) => {
            if(!this._data) {
                var bb = this.getByteBuffer(this._uri);
                this._data = StaticArrayBuffer.from(bb);
            }
            resolve(this._data);
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

    private _calculateFileUri(): string {
        var cursor: android.database.ICursor;
        var columns = [MediaStore.MediaColumns.DATA];
        if (android.os.Build.VERSION.SDK_INT >= 19) {
            var wholeID: string = (<any>android.provider).DocumentsContract.getDocumentId(this._uri);
            var id = wholeID.split(":")[1];
            cursor = this.getContentResolver().query(android.provider.MediaStore.Images.Media.EXTERNAL_CONTENT_URI, columns, "_id=?", [id], null);
        }
        else {
            cursor = this.getContentResolver().query(this._uri, columns, null, null, null);
        }

        var filePath;

        try {
            cursor.moveToFirst();
            var columnIndex = cursor.getColumnIndexOrThrow(columns[0]);
            filePath = cursor.getString(columnIndex);
            if (filePath) {
                return filePath;
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
    }

    private decodeThumbUri(): void {
        // Decode image size
        var REQUIRED_SIZE = {
            maxWidth: 100,
            maxHeight: 100
        };

        // Decode with scale
        var downsampleOptions = new BitmapFactory.Options();
        downsampleOptions.inSampleSize = this.getSampleSize(this._uri, REQUIRED_SIZE);
        this._thumb = this.decodeUri(this._uri, downsampleOptions);
        this.notifyPropertyChange("thumb", this._thumb);
    }

    /**
     * Discovers the sample size that a BitmapFactory.Options object should have
     * to scale the retrieved image to the given max size.
     * @param uri The URI of the image that should be scaled.
     * @param options The options that should be used to procude the scaled image.
     */
    private getSampleSize(uri: android.net.Uri, options?): number {
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
    private decodeUri(uri: android.net.Uri, options: android.graphics.BitmapFactory.Options): imagesource.ImageSource {
        var bitmap = BitmapFactory.decodeStream(this.openInputStream(uri), null, options);
        var image = new imagesource.ImageSource();
        image.setNativeSource(bitmap);
        return image;
    }
    
    /**
     * Retrieves the raw data of the given file and exposes it as a byte buffer.
     */
    private getByteBuffer(uri: android.net.Uri): java.nio.ByteBuffer {
        var file = this.getContentResolver().openAssetFileDescriptor(uri, "r");
        
        // Determine how many bytes to allocate in memory based on the file length
        var length: number = file.getLength();
        var buffer: java.nio.ByteBuffer = java.nio.ByteBuffer.allocateDirect(length);
        var bytes = buffer.array();
        var stream = file.createInputStream();
        
        // Buffer the data in 4KiB amounts
        var reader = new java.io.BufferedInputStream(stream, 4096);
        reader.read(bytes, 0, bytes.length);
        
        // TODO: Add Proper Cleanup
        reader.close();
        file.close();
        
        return buffer;
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
