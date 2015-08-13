var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var data_observable = require("data/observable");
var data_observablearray = require("data/observable-array");
var frame = require("ui/frame");
var image_source = require("image-source");
function create() {
    if (true) {
        return new ImagePickerPH();
    }
}
exports.create = create;
var ObservableBase = (function (_super) {
    __extends(ObservableBase, _super);
    function ObservableBase() {
        _super.apply(this, arguments);
    }
    ObservableBase.prototype.notifyPropertyChanged = function (propertyName, value) {
        this.notify({ object: this, eventName: data_observable.Observable.propertyChangeEvent, propertyName: propertyName, value: value });
    };
    return ObservableBase;
})(data_observable.Observable);
exports.ObservableBase = ObservableBase;
var ImagePicker = (function (_super) {
    __extends(ImagePicker, _super);
    function ImagePicker() {
        _super.call(this);
        this._selection = new data_observablearray.ObservableArray();
        this._albums = new data_observablearray.ObservableArray();
    }
    ImagePicker.prototype.authorize = function () {
        return Promise.reject(new Error("Not implemented"));
    };
    ImagePicker.prototype.present = function () {
        var _this = this;
        if (this._resolve || this._reject) {
            return Promise.reject(new Error("Selection is allready in progress..."));
        }
        else {
            return new Promise(function (resolve, reject) {
                _this._resolve = resolve;
                _this._reject = reject;
                frame.topmost().navigate({
                    moduleName: "./tns_modules/imagepicker/albums",
                    context: _this
                });
            });
        }
    };
    Object.defineProperty(ImagePicker.prototype, "albums", {
        get: function () {
            return this._albums;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ImagePicker.prototype, "selection", {
        get: function () {
            return this._selection;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ImagePicker.prototype, "doneText", {
        get: function () {
            return "Done";
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ImagePicker.prototype, "cancelText", {
        get: function () {
            return "Cancel";
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ImagePicker.prototype, "albumsText", {
        get: function () {
            return "Albums";
        },
        enumerable: true,
        configurable: true
    });
    ImagePicker.prototype.cancel = function () {
        this.notifyCanceled();
    };
    ImagePicker.prototype.done = function () {
        this.notifySelection([]);
    };
    ImagePicker.prototype.notifyCanceled = function () {
        if (this._reject) {
            this._reject(new Error("Selection canceled."));
        }
    };
    ImagePicker.prototype.notifySelection = function (urls) {
        if (this._resolve) {
            this._resolve(urls);
        }
    };
    return ImagePicker;
})(ObservableBase);
exports.ImagePicker = ImagePicker;
var Album = (function (_super) {
    __extends(Album, _super);
    function Album(imagePicker, title) {
        _super.call(this);
        this._imagePicker = imagePicker;
        this._title = title;
        this._assets = new data_observablearray.ObservableArray();
    }
    Object.defineProperty(Album.prototype, "imagePicker", {
        get: function () {
            return this._imagePicker;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Album.prototype, "title", {
        get: function () {
            return this._title;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Album.prototype, "assets", {
        get: function () {
            return this._assets;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Album.prototype, "thumb", {
        get: function () {
            return this._thumb;
        },
        enumerable: true,
        configurable: true
    });
    Album.prototype.setThumb = function (value) {
        this._thumb = value;
        this.notifyPropertyChanged("thumb", value);
    };
    return Album;
})(ObservableBase);
exports.Album = Album;
var Asset = (function (_super) {
    __extends(Asset, _super);
    function Asset(album) {
        _super.call(this);
        this._album = album;
    }
    Object.defineProperty(Asset.prototype, "album", {
        get: function () {
            return this._album;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Asset.prototype, "thumb", {
        get: function () {
            if (!this._thumbRequested) {
                this._thumbRequested = true;
                this.onThumbRequest();
            }
            return this._thumb;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Asset.prototype, "selected", {
        get: function () {
            return !!this._selected;
        },
        set: function (value) {
            if (!!value == this.selected)
                return;
            var index = this.album.imagePicker.selection.indexOf(this);
            if (value) {
                this._selected = true;
                if (index < 0) {
                    this.album.imagePicker.selection.push(this);
                }
            }
            else {
                delete this._selected;
                if (index >= 0) {
                    this.album.imagePicker.selection.splice(index, 1);
                }
            }
            this.notifyPropertyChanged("selected", this.selected);
        },
        enumerable: true,
        configurable: true
    });
    Asset.prototype.toggleSelection = function (args) {
        this.selected = !this.selected;
    };
    Asset.prototype.setThumb = function (value) {
        this._thumb = value;
        this.notifyPropertyChanged("thumb", this._thumb);
    };
    Asset.prototype.onThumbRequest = function () {
    };
    return Asset;
})(ObservableBase);
exports.Asset = Asset;
var ImagePickerPH = (function (_super) {
    __extends(ImagePickerPH, _super);
    function ImagePickerPH() {
        _super.call(this);
        this._thumbRequestOptions = PHImageRequestOptions.alloc().init();
        this._thumbRequestOptions.resizeMode = PHImageRequestOptionsResizeMode.PHImageRequestOptionsResizeModeExact;
        this._thumbRequestOptions.synchronous = false;
        this._thumbRequestOptions.deliveryMode = PHImageRequestOptionsDeliveryMode.PHImageRequestOptionsDeliveryModeOpportunistic;
        this._thumbRequestOptions.normalizedCropRect = CGRectMake(0, 0, 1, 1);
        this._thumbRequestSize = CGSizeMake(80, 80);
        this._initialized = false;
    }
    ImagePickerPH.prototype.authorize = function () {
        return new Promise(function (resolve, reject) {
            var runloop = CFRunLoopGetCurrent();
            PHPhotoLibrary.requestAuthorization(function (result) {
                if (result === PHAuthorizationStatus.PHAuthorizationStatusAuthorized) {
                    invokeOnRunLoop(runloop, resolve);
                }
                else {
                    invokeOnRunLoop(runloop, function () {
                        reject(new Error("Authorization failed. Status: " + PHAuthorizationStatus[result]));
                    });
                }
            });
        });
    };
    ImagePickerPH.prototype.present = function () {
        this.initialize();
        return _super.prototype.present.call(this);
    };
    ImagePickerPH.prototype.addAlbumsForFetchResult = function (result) {
        for (var i = 0; i < result.count; i++) {
            var item = result.objectAtIndex(i);
            if (item.isKindOfClass(PHAssetCollection)) {
                this.addAlbumForAssetCollection(item);
            }
            else {
                console.log("Ignored result: " + item);
            }
        }
    };
    ImagePickerPH.prototype.addAlbumForAssetCollection = function (assetCollection) {
        var album = new AlbumPH(this, assetCollection.localizedTitle);
        var pfAssets = PHAsset.fetchAssetsInAssetCollectionOptions(assetCollection, null);
        album.addAssetsForFetchResult(pfAssets);
        if (album.assets.length > 0) {
            this.albums.push(album);
        }
    };
    ImagePickerPH.prototype.createPHImageThumb = function (target, asset) {
        PHImageManager.defaultManager().requestImageForAssetTargetSizeContentModeOptionsResultHandler(asset, this._thumbRequestSize, PHImageContentMode.PHImageContentModeAspectFill, this._thumbRequestOptions, function (target, uiImage, info) {
            var imageSource = new image_source.ImageSource();
            imageSource.setNativeSource(uiImage);
            target.setThumb(imageSource);
        }.bind(this, target));
    };
    ImagePickerPH.prototype.done = function () {
        var r = PHImageRequestOptions.alloc().init();
        r.synchronous = true;
        var urls = [];
        this.selection.forEach(function (item) {
            PHImageManager.defaultManager().requestImageDataForAssetOptionsResultHandler(item._phAsset, r, function (data, uti, orientation, info) {
                var url = info.objectForKey("PHImageFileURLKey");
                if (url) {
                    urls.push(url.toString());
                }
            });
        });
        this.notifySelection(urls);
    };
    ImagePickerPH.prototype.initialize = function () {
        if (this._initialized) {
            return;
        }
        this._initialized = true;
        var smart = PHAssetCollection.fetchAssetCollectionsWithTypeSubtypeOptions(PHAssetCollectionType.PHAssetCollectionTypeSmartAlbum, PHAssetCollectionSubtype.PHAssetCollectionSubtypeAlbumRegular, null);
        this.addAlbumsForFetchResult(smart);
        var user = PHCollection.fetchTopLevelUserCollectionsWithOptions(null);
        this.addAlbumsForFetchResult(user);
    };
    return ImagePickerPH;
})(ImagePicker);
var AlbumPH = (function (_super) {
    __extends(AlbumPH, _super);
    function AlbumPH(imagePicker, title) {
        _super.call(this, imagePicker, title);
        this._setThumb = false;
    }
    AlbumPH.prototype.addAssetsForFetchResult = function (result) {
        for (var i = 0; i < result.count; i++) {
            var asset = result.objectAtIndex(i);
            if (asset.isKindOfClass(PHAsset)) {
                this.addAsset(asset);
            }
            else {
                console.log("Ignored asset: " + asset);
            }
        }
    };
    AlbumPH.prototype.addAsset = function (asset) {
        var item = new AssetPH(this, asset);
        if (!this._setThumb) {
            this._setThumb = true;
            this.imagePicker.createPHImageThumb(this, asset);
        }
        this.assets.push(item);
    };
    return AlbumPH;
})(Album);
var AssetPH = (function (_super) {
    __extends(AssetPH, _super);
    function AssetPH(album, phAsset) {
        _super.call(this, album);
        this._phAsset = phAsset;
    }
    AssetPH.prototype.onThumbRequest = function () {
        _super.prototype.onThumbRequest.call(this);
        this.album.imagePicker.createPHImageThumb(this, this._phAsset);
    };
    return AssetPH;
})(Asset);
var defaultRunLoopMode = NSString.stringWithString(kCFRunLoopCommonModes);
function invokeOnRunLoop(runloop, func) {
    CFRunLoopPerformBlock(runloop, defaultRunLoopMode, func);
    CFRunLoopWakeUp(runloop);
}
