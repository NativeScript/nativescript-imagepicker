import * as application from "tns-core-modules/application";
import * as imageAssetModule from "tns-core-modules/image-asset";
import * as permissions from "nativescript-permissions";

class UriHelper {
    public static _calculateFileUri(uri: android.net.Uri) {
        let DocumentsContract = (<any>android.provider).DocumentsContract;
        let isKitKat = android.os.Build.VERSION.SDK_INT >= 19; // android.os.Build.VERSION_CODES.KITKAT

        if (isKitKat && DocumentsContract.isDocumentUri(application.android.context, uri)) {
            let docId, id, type;
            let contentUri: android.net.Uri = null;

            // ExternalStorageProvider
            if (UriHelper.isExternalStorageDocument(uri)) {
                docId = DocumentsContract.getDocumentId(uri);
                id = docId.split(":")[1];
                type = docId.split(":")[0];
                let storageDefinition: string;

                if ("primary" === type.toLowerCase()) {
                    return android.os.Environment.getExternalStorageDirectory() + "/" + id;
                } else {
                    if (android.os.Environment.isExternalStorageRemovable()) {
                        storageDefinition = "EXTERNAL_STORAGE";
                    } else {
                        storageDefinition = "SECONDARY_STORAGE";
                    }
                    return java.lang.System.getenv(storageDefinition) + "FORWARD_SLASH" + id;
                }
            }
            // DownloadsProvider
            else if (UriHelper.isDownloadsDocument(uri)) {
                id = DocumentsContract.getDocumentId(uri);

                // Since Oreo the downloads id may be a raw string,
                // containing the file path:
                if (id.indexOf("raw:") !== -1) {
                    return id.substring(4, id.length);
                }
                contentUri = android.content.ContentUris.withAppendedId(
                android.net.Uri.parse("content://downloads/public_downloads"), long(id));
                let resolvedPath: string = UriHelper.getDataColumn(contentUri, null, null);
                if (resolvedPath != undefined) {
                    return resolvedPath;
                } else {
                    return uri.toString();
                }
            }
            // MediaProvider
            else if (UriHelper.isMediaDocument(uri)) {
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

                return UriHelper.getDataColumn(contentUri, selection, selectionArgs);
            }
        }
        else {
            // MediaStore (and general)
            if ("content" === uri.getScheme()) {
                return UriHelper.getDataColumn(uri, null, null);
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

    present(): Promise<imageAssetModule.ImageAsset[]> {
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
                                            let selectedAsset = new imageAssetModule.ImageAsset(UriHelper._calculateFileUri(uri));
                                            results.push(selectedAsset);
                                        }
                                    }
                                }
                            } else {
                                let uri = data.getData();
                                let selectedAsset = new imageAssetModule.ImageAsset(UriHelper._calculateFileUri(uri));
                                results.push(selectedAsset);
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

            intent.putExtra(android.content.Intent.EXTRA_LOCAL_ONLY, true);
            intent.setAction("android.intent.action.OPEN_DOCUMENT");
            let chooser = Intent.createChooser(intent, "Select Picture");
            application.android.foregroundActivity.startActivityForResult(intent, RESULT_CODE_PICKER_IMAGES);
        });
    }
}

export function create(options?): ImagePicker {
    return new ImagePicker(options);
}
