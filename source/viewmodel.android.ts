import observable = require("data/observable");
import imagesource = require("image-source");
import application = require("application");

var Intent = android.content.Intent;
var Activity = android.app.Activity;
var MediaStore = android.provider.MediaStore;
var BitmapFactory = android.graphics.BitmapFactory;

export class SelectedAsset extends observable.Observable {
    private _uri: android.net.Uri;
    private _thumb: imagesource.ImageSource;
    private _thumbRequested: boolean;

    constructor(uri: android.net.Uri) {
        super();
        this._uri = uri;
        this._thumbRequested = false;
    }

    data(): Thenable<any> {
        return Promise.reject(new Error("Not implemented."));
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
        var filePathColumn = [MediaStore.MediaColumns.DATA];
        var cursor = this.getContentResolver().query(this._uri, filePathColumn, null, null, null);
        var filePath;

        try {
            var columnIndex = cursor.getColumnIndexOrThrow(filePathColumn[0]);
            cursor.moveToFirst();
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

        return void 0;
    }

    private decodeThumbUri(): void {
        // Decode image size
        var boundsOptions = new BitmapFactory.Options();
        boundsOptions.inJustDecodeBounds = true;
        BitmapFactory.decodeStream(this.getContentResolver().openInputStream(this._uri), null, boundsOptions);

        var REQUIRED_SIZE = 100;

        // Find the correct scale value. It should be the power of 2.
        var outWidth = boundsOptions.outWidth;
        var outHeight = boundsOptions.outHeight;
        var scale = 1;
        while (true) {
            if (outWidth / 2 < REQUIRED_SIZE
                || outHeight / 2 < REQUIRED_SIZE) {
                break;
            }
            outWidth /= 2;
            outHeight /= 2;
            scale *= 2;
        }

        // Decode with scale
        var downsampleOptions = new BitmapFactory.Options();
        downsampleOptions.inSampleSize = scale;
        var bitmap = BitmapFactory.decodeStream(this.getContentResolver().openInputStream(this._uri), null, downsampleOptions);

        this._thumb = new imagesource.ImageSource();
        this._thumb.setNativeSource(bitmap);
        this.notifyPropertyChanged("thumb", this._thumb);
    }

    private getContentResolver(): android.content.ContentResolver {
        return application.android.nativeApp.getContentResolver();
    }

    protected notifyPropertyChanged(propertyName: string, value: any) {
        this.notify({ object: this, eventName: observable.Observable.propertyChangeEvent, propertyName: propertyName, value: value });
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

                        } catch(e) {
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
