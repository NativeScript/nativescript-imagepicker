import * as observable from "data/observable";
import * as imagesource from "image-source";
import * as application from "application";
import * as platform from "platform";
import * as imageAssetModule from "image-asset";
import * as fs from "tns-core-modules/file-system"

interface ArrayBufferStatic extends ArrayBufferConstructor {
    from(buffer: java.nio.ByteBuffer): ArrayBuffer;
}

var Intent = android.content.Intent;
var Activity = android.app.Activity;
var MediaStore = android.provider.MediaStore;
var DocumentsContract = (<any>android.provider).DocumentsContract;
var BitmapFactory = android.graphics.BitmapFactory;
var StaticArrayBuffer = <ArrayBufferStatic>ArrayBuffer;

export class SelectedAsset extends imageAssetModule.ImageAsset {
    private _uri: android.net.Uri;
    private _thumb: imagesource.ImageSource;
    private _thumbRequested: boolean;
    private _thumbAsset: imageAssetModule.ImageAsset;
    private _fileUri: string;
    private _data: ArrayBuffer;
    private _mediaType: string;

    constructor(uri: android.net.Uri) {
        super(SelectedAsset._calculateFileUri(uri));
        this._uri = uri;
        this._thumbRequested = false;
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
                    var bb = this.getByteBuffer(this._uri);
                    this._data = StaticArrayBuffer.from(bb);
                }
                resolve(this._data);
            } catch (ex) {
                reject(ex);
            }
        });
    }

    //[Deprecated. Please use thumbAsset instead.]
    get thumb(): imagesource.ImageSource {
        if (!this._thumbRequested) {
            this.decodeThumbUri();
        }
        return this._thumb;
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

    get mediaType(): string {
        return this._mediaType;
    }
    protected setMediaType(value: string): void {
        this._mediaType = value;
        this.notifyPropertyChange("mediaType", value);
    }

    private static _calculateFileUri(uri : android.net.Uri) {
        var isKitKat = android.os.Build.VERSION.SDK_INT >= 19;//android.os.Build.VERSION_CODES.KITKAT

        if (isKitKat && DocumentsContract.isDocumentUri(application.android.context, uri)) {
            // ExternalStorageProvider
            if (SelectedAsset.isExternalStorageDocument(uri)) {
                var docId = DocumentsContract.getDocumentId(uri);
                var id = docId.split(":")[1];
                var type = docId.split(":")[0];

                if ("primary" === type.toLowerCase()) {
                    return android.os.Environment.getExternalStorageDirectory() + "/" + id;
                }

                // TODO handle non-primary volumes
            }
            // DownloadsProvider
            else if (SelectedAsset.isDownloadsDocument(uri)) {
                var id = DocumentsContract.getDocumentId(uri);
                var contentUri = android.content.ContentUris.withAppendedId(
                    android.net.Uri.parse("content://downloads/public_downloads"), long(id));

                return SelectedAsset.getDataColumn(contentUri, null, null);
            }
            // MediaProvider
            else if (SelectedAsset.isMediaDocument(uri)) {
                var docId = DocumentsContract.getDocumentId(uri);
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
                var selectionArgs = [id];

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
    };

    private static getDataColumn(uri: android.net.Uri, selection, selectionArgs) {

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

        return undefined;
    };

    private static isExternalStorageDocument(uri: android.net.Uri) {
        return "com.android.externalstorage.documents" === uri.getAuthority();
    };
    private static isDownloadsDocument(uri: android.net.Uri) {
        return "com.android.providers.downloads.documents" === uri.getAuthority();
    };
    private static isMediaDocument(uri: android.net.Uri) {
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

    private decodeThumbAssetUri(): void {
        // Decode image size
        var REQUIRED_SIZE = {
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
            while (!(this.matchesSize(targetSize, outWidth) || this.matchesSize(targetSize, outHeight))) {
                outWidth /= 2;
                outHeight /= 2;
                scale *= 2;
            }
        }
        return scale;
    }

    private matchesSize(targetSize: number, actualSize: number): boolean {
        //return targetSize && actualSize / 2 < targetSize;
        return targetSize && actualSize < targetSize;
    }

    /**
     * Decodes the given URI using the given options.
     * @param uri The URI that should be decoded into an ImageSource.
     * @param options The options that should be used to decode the image.
     */
    private decodeUri(uri: android.net.Uri, options?: { maxWidth: number, maxHeight: number }): imagesource.ImageSource {
        var downsampleOptions = new BitmapFactory.Options();
        downsampleOptions.inSampleSize = this.getSampleSize(uri, options);

        console.log('options.maxWidth', options.maxWidth);
        console.log('options.maxHeight', options.maxHeight);
        console.log('inSampleSize', downsampleOptions.inSampleSize);

        var bitmap = BitmapFactory.decodeStream(this.openInputStream(uri), null, downsampleOptions);
        var image = new imagesource.ImageSource();
        image.setNativeSource(bitmap);
        return image;
    }

    /**
     * Decodes the given URI using the given options.
     * @param uri The URI that should be decoded into an ImageAsset.
     * @param options The options that should be used to decode the image.
     */
    private decodeUriForImageAsset(uri: android.net.Uri, options?: { maxWidth: number, maxHeight: number }): imageAssetModule.ImageAsset {
        var downsampleOptions = new BitmapFactory.Options();
        downsampleOptions.inSampleSize = this.getSampleSize(uri, options);
        var bitmap = BitmapFactory.decodeStream(this.openInputStream(uri), null, downsampleOptions);
        return new imageAssetModule.ImageAsset(bitmap);
    }

    /**
     * Retrieves the raw data of the given file and exposes it as a byte buffer.
     */
    private getByteBuffer(uri: android.net.Uri): java.nio.ByteBuffer {
        var file: android.content.res.AssetFileDescriptor = null;
        try {
            file = SelectedAsset.getContentResolver().openAssetFileDescriptor(uri, "r");

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
        return SelectedAsset.getContentResolver().openInputStream(uri);
    }

    private static getContentResolver(): android.content.ContentResolver {
        return application.android.nativeApp.getContentResolver();
    }

    saveAssetToFile(saveToFolder, saveWithFilename, newWidth, newHeight): Promise<any>  {
        console.log('saveAssetToFile()');
        console.log('saveToFolder', saveToFolder);
        console.log('saveWithFilename', saveWithFilename);
        console.log('newWidth', newWidth);
        console.log('newHeight', newHeight);
        console.log('mediaType', this.mediaType);

        const documents = fs.knownFolders.documents();
        let folder = documents.getFolder(saveToFolder);
        var newFilename;
        //var fileManager = NSFileManager.defaultManager;


        if (this.mediaType == 'image') {
            return new Promise((resolve, reject) => {
                 // = newFileName ? newFileName : "notification_img_" + Date.now() + ".png";    

                var REQUIRED_SIZE = {
                    maxWidth: 1000,
                    maxHeight: 1000
                };

                var REQUIRED_THUMB_SIZE = {
                    maxWidth: 400,
                    maxHeight: 400
                };

                if (saveWithFilename) {
                    newFilename = saveWithFilename;
                } else {
                    newFilename = "notification_img_" + Date.now() + ".png"
                }

                console.log(saveWithFilename);

                var path = fs.path.join(folder.path, newFilename);
                console.log('got path', path);
        
                // var imageAsset = this.decodeUriForImageAsset(this._uri, REQUIRED_SIZE);
                // console.log('decoded uri for image asset', this._uri.toString());

                this.getImage({maxWidth: 1200, maxHeight: 1200}).then(function(imageSource) {

                    console.log('imageSource.width', imageSource.width);
                    console.log('imageSource.height', imageSource.height);

                    let saved = imageSource.saveToFile(
                        path,
                        'jpg'
                    );

                    if (saved) {
                        console.log('image was saved');

                        var thumbFileName = saveWithFilename.substring(0, saveWithFilename.length-4) + '.jpg';
                        var thumbFolder = folder.getFolder('thumbs');
                        var thumbPath = fs.path.join(thumbFolder.path, thumbFileName);

                        var resizedBitmap = android.graphics.Bitmap.createScaledBitmap(imageSource.android, 400, 400, true);
                        let thumb_image = imagesource.fromNativeSource(resizedBitmap);

                        let saved = thumb_image.saveToFile(
                            thumbPath,
                            'jpg'
                        );

                        if (saved) {
                            console.log('thumb was saved');
                        } else {
                            console.log('thumbs was not saved');
                        }

                    } else {
                        console.log('image was not saved');
                    }

                });

                /* WORKS */
                // console.log('fileUri', this.fileUri);

                // var image = imagesource.fromFile(this.fileUri);             

                // let saved = image.saveToFile(
                //     path,
                //     'jpg'
                // );

                // if (saved) {
                //     console.log('image was saved');

                //     //## Create thumbnail image
                //     var thumbFileName = saveWithFilename.substring(0, saveWithFilename.length-4) + '.jpg';
                //     var thumbFolder = folder.getFolder('thumbs');
                //     var thumbPath = fs.path.join(thumbFolder.path, thumbFileName);

                //     var thumb = android.graphics.Bitmap.createScaledBitmap(image.android, REQUIRED_THUMB_SIZE.maxWidth, REQUIRED_THUMB_SIZE.maxHeight, true);

                //     var thumbImage = new imagesource.ImageSource();
                //     thumbImage.setNativeSource(thumb);
    
                //     let saved = thumbImage.saveToFile(
                //         thumbPath,
                //         'jpeg'
                //     );
    
                //     if (saved) {
                //         console.log('thumb was saved');
                //     } else {
                //         console.log('thumb was not saved');
                //     }
                // } else {
                //     console.log('image was not saved');
                // }
                
                /* end WORKS */

                resolve(newFilename.toString());

                // debugger;

                // imagesource.fromAsset(imageAsset)
                // .then(imageSource => {
                //     console.log('got imageSource from imageAsset');

                //     // let saved = imageSource.saveToFile(
                //     //     path,
                //     //     'jpg'
                //     // );

                //     // if (saved) {
                //     //     console.log('image was saved');
                //     // } else {
                //     //     console.log('image was not saved');
                //     // }

                //     //  // ## Create thumbnail image
                //     // var thumbFolder = folder.getFolder('thumbs');
                //     // var thumbPath = fs.path.join(thumbFolder.path, newFilename); 

                //     // imageAsset = this.decodeUriForImageAsset(this._uri, REQUIRED_THUMB_SIZE);

                //     // imagesource.fromAsset(imageAsset)
                //     // .then(imageSource => {
                //     //     imageSource.saveToFile(path, "jpg");

                //     //     resolve(newFilename.toString());
                //     // });
                  
                // });

            });
        } else { // ## VIDEO
            return new Promise((resolve, reject) => {

                // ## Copy video to documents folder
                if (saveWithFilename) {
                    newFilename = saveWithFilename;
                } else {
                    newFilename = "notification_img_" + Date.now() + ".mp4"
                }

                var path = fs.path.join(folder.path, newFilename);

                var error;

                var currentPath = this.fileUri;
                console.log('currentPath', currentPath);

                var sourceFile = fs.File.fromPath(currentPath)
                console.log('got source file');

                var destinationFile = fs.File.fromPath(path); //fs.knownFolders.documents().getFile(newFilename);
                console.log('got destination file');

                var source = sourceFile.readSync(e=> { error = e; });
                console.log('read source file');

                destinationFile.writeSync(source, e=> { error = e; });
                console.log('wrote destination file');

                // ## Create thumbnail image
                var thumbFileName = saveWithFilename.substring(0, saveWithFilename.length-4) + '.jpg';
                var thumbFolder = folder.getFolder('thumbs');
                var thumbPath = fs.path.join(thumbFolder.path, thumbFileName);      
                
                var destinationThumbFile = fs.File.fromPath(thumbPath);
                console.log('got destination thumb file');

                console.log('thumbPath', thumbPath);

                var thumb = android.media.ThumbnailUtils.createVideoThumbnail(path, MediaStore.Images.Thumbnails.MINI_KIND);    

                var thumbImage = new imagesource.ImageSource();
                thumbImage.setNativeSource(thumb);

                let saved = thumbImage.saveToFile(
                    thumbPath,
                    'jpeg'
                );

                if (saved) {
                    console.log('thumb was saved');
                } else {
                    console.log('thumb was not saved');
                }

                resolve(newFilename.toString());

            });
        }
        
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

    get mediaType(): string {
        return this._options && this._options.mediaType && this._options.mediaType.toLowerCase() === 'image' ? 'image' : 'video';
    }

    authorize(): Promise<void> {
        return Promise.resolve();
    }

    present(): Promise<SelectedAsset[]> {
        return new Promise((resolve, reject) => {

            console.log('present() this.mode', this.mode);
            console.log('present() this.mediaType', this.mediaType);

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

            var intent = new Intent(Intent.ACTION_GET_CONTENT);
            //intent.setType("image/*");

            if (this.mediaType === 'video') {
                intent.setType("video/*");
            } else {
                intent.setType("image/*");
            }

            // TODO: Use (<any>android).content.Intent.EXTRA_ALLOW_MULTIPLE
            if (this.mode === 'multiple') {
                console.log('multiple mode selected. Setting intent');
                intent.putExtra("android.intent.extra.ALLOW_MULTIPLE", true);
                //intent.putExtra(Intent.actio)
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
