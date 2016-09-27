"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var observable = require("data/observable");
var imagesource = require("image-source");
var application = require("application");
var Intent = android.content.Intent;
var Activity = android.app.Activity;
var MediaStore = android.provider.MediaStore;
var DocumentsContract = android.provider.DocumentsContract;
var BitmapFactory = android.graphics.BitmapFactory;
var StaticArrayBuffer = ArrayBuffer;
var SelectedAsset = (function (_super) {
    __extends(SelectedAsset, _super);
    function SelectedAsset(uri) {
        _super.call(this);
        this._uri = uri;
        this._thumbRequested = false;
    }
    SelectedAsset.prototype.data = function () {
        return Promise.reject(new Error("Not implemented."));
    };
    SelectedAsset.prototype.getImage = function (options) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                resolve(_this.decodeUri(_this._uri, options));
            }
            catch (ex) {
                reject(ex);
            }
        });
    };
    SelectedAsset.prototype.getImageData = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                if (!_this._data) {
                    var bb = _this.getByteBuffer(_this._uri);
                    _this._data = StaticArrayBuffer.from(bb);
                }
                resolve(_this._data);
            }
            catch (ex) {
                reject(ex);
            }
        });
    };
    Object.defineProperty(SelectedAsset.prototype, "thumb", {
        get: function () {
            if (!this._thumbRequested) {
                this.decodeThumbUri();
            }
            return this._thumb;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SelectedAsset.prototype, "uri", {
        get: function () {
            return this._uri.toString();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SelectedAsset.prototype, "fileUri", {
        get: function () {
            if (!this._fileUri) {
                this._fileUri = this._calculateFileUri();
            }
            return this._fileUri;
        },
        enumerable: true,
        configurable: true
    });
    SelectedAsset.prototype._calculateFileUri = function () {
        var _this = this;
        var isKitKat = android.os.Build.VERSION.SDK_INT >= 19;
        if (isKitKat && DocumentsContract.isDocumentUri(application.android.context, this._uri)) {
            if (_this.isExternalStorageDocument(this._uri)) {
                var docId = DocumentsContract.getDocumentId(this._uri);
                var id = docId.split(":")[1];
                var type = docId.split(":")[0];
                if ("primary" === type.toLowerCase()) {
                    return android.os.Environment.getExternalStorageDirectory() + "/" + id;
                }
            }
            else if (_this.isDownloadsDocument(this._uri)) {
                var id = DocumentsContract.getDocumentId(this._uri);
                var contentUri = android.content.ContentUris.withAppendedId(android.net.Uri.parse("content://downloads/public_downloads"), long(id));
                return _this.getDataColumn(contentUri, null, null);
            }
            else if (_this.isMediaDocument(this._uri)) {
                var docId = DocumentsContract.getDocumentId(this._uri);
                var split = docId.split(":");
                var type = split[0];
                var id = split[1];
                var contentUri = null;
                if ("image" === type) {
                    contentUri = MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
                }
                else if ("video" === type) {
                    contentUri = MediaStore.Video.Media.EXTERNAL_CONTENT_URI;
                }
                else if ("audio" === type) {
                    contentUri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;
                }
                var selection = "_id=?";
                var selectionArgs = [id];
                return _this.getDataColumn(contentUri, selection, selectionArgs);
            }
        }
        else {
            if ("content" === this._uri.getScheme()) {
                return _this.getDataColumn(this._uri, null, null);
            }
            else if ("file" === this._uri.getScheme()) {
                return this._uri.getPath();
            }
        }
        return undefined;
    };
    ;
    SelectedAsset.prototype.getDataColumn = function (uri, selection, selectionArgs) {
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
    ;
    SelectedAsset.prototype.isExternalStorageDocument = function (uri) {
        return "com.android.externalstorage.documents" === uri.getAuthority();
    };
    ;
    SelectedAsset.prototype.isDownloadsDocument = function (uri) {
        return "com.android.providers.downloads.documents" === uri.getAuthority();
    };
    ;
    SelectedAsset.prototype.isMediaDocument = function (uri) {
        return "com.android.providers.media.documents" === uri.getAuthority();
    };
    ;
    SelectedAsset.prototype.decodeThumbUri = function () {
        var REQUIRED_SIZE = {
            maxWidth: 100,
            maxHeight: 100
        };
        this._thumb = this.decodeUri(this._uri, REQUIRED_SIZE);
        this.notifyPropertyChange("thumb", this._thumb);
    };
    SelectedAsset.prototype.getSampleSize = function (uri, options) {
        var boundsOptions = new BitmapFactory.Options();
        boundsOptions.inJustDecodeBounds = true;
        BitmapFactory.decodeStream(this.openInputStream(uri), null, boundsOptions);
        var outWidth = boundsOptions.outWidth;
        var outHeight = boundsOptions.outHeight;
        var scale = 1;
        if (options) {
            var targetSize = options.maxWidth < options.maxHeight ? options.maxWidth : options.maxHeight;
            while (!(this.matchesSize(targetSize, outWidth) ||
                this.matchesSize(targetSize, outHeight))) {
                outWidth /= 2;
                outHeight /= 2;
                scale *= 2;
            }
        }
        return scale;
    };
    SelectedAsset.prototype.matchesSize = function (targetSize, actualSize) {
        return targetSize && actualSize / 2 < targetSize;
    };
    SelectedAsset.prototype.decodeUri = function (uri, options) {
        var downsampleOptions = new BitmapFactory.Options();
        downsampleOptions.inSampleSize = this.getSampleSize(uri, options);
        var bitmap = BitmapFactory.decodeStream(this.openInputStream(uri), null, downsampleOptions);
        var image = new imagesource.ImageSource();
        image.setNativeSource(bitmap);
        return image;
    };
    SelectedAsset.prototype.getByteBuffer = function (uri) {
        var file = null;
        try {
            file = this.getContentResolver().openAssetFileDescriptor(uri, "r");
            var length = file.getLength();
            var buffer = java.nio.ByteBuffer.allocateDirect(length);
            var bytes = buffer.array();
            var stream = file.createInputStream();
            var reader = new java.io.BufferedInputStream(stream, 4096);
            reader.read(bytes, 0, bytes.length);
            return buffer;
        }
        finally {
            if (file) {
                file.close();
            }
        }
    };
    SelectedAsset.prototype.openInputStream = function (uri) {
        return this.getContentResolver().openInputStream(uri);
    };
    SelectedAsset.prototype.getContentResolver = function () {
        return application.android.nativeApp.getContentResolver();
    };
    return SelectedAsset;
}(observable.Observable));
exports.SelectedAsset = SelectedAsset;
var ImagePicker = (function () {
    function ImagePicker(options) {
        this._options = options;
    }
    Object.defineProperty(ImagePicker.prototype, "mode", {
        get: function () {
            return this._options && this._options.mode && this._options.mode.toLowerCase() === 'single' ? 'single' : 'multiple';
        },
        enumerable: true,
        configurable: true
    });
    ImagePicker.prototype.authorize = function () {
        return Promise.resolve();
    };
    ImagePicker.prototype.present = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
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
                            }
                            else {
                                var uri = data.getData();
                                results.push(new SelectedAsset(uri));
                            }
                            application.android.off(application.AndroidApplication.activityResultEvent, onResult);
                            resolve(results);
                            return;
                        }
                        catch (e) {
                            application.android.off(application.AndroidApplication.activityResultEvent, onResult);
                            reject(e);
                            return;
                        }
                    }
                    else {
                        application.android.off(application.AndroidApplication.activityResultEvent, onResult);
                        reject(new Error("Image picker activity result code " + resultCode));
                        return;
                    }
                }
            }
            ;
            var intent = new Intent();
            intent.setType("image/*");
            if (_this.mode === 'multiple') {
                intent.putExtra("android.intent.extra.ALLOW_MULTIPLE", true);
            }
            intent.setAction(Intent.ACTION_GET_CONTENT);
            var chooser = Intent.createChooser(intent, "Select Picture");
            application.android.foregroundActivity.startActivityForResult(intent, RESULT_CODE_PICKER_IMAGES);
        });
    };
    return ImagePicker;
}());
exports.ImagePicker = ImagePicker;
function create(options) {
    return new ImagePicker(options);
}
exports.create = create;
