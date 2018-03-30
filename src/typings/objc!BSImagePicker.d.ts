
declare var BSImagePickerVersionNumber: number;

declare var BSImagePickerVersionString: interop.Reference<number>;

declare class BSImagePickerViewController extends UINavigationController {

	static alloc(): BSImagePickerViewController; // inherited from NSObject

	static new(): BSImagePickerViewController; // inherited from NSObject

	albumButton: UIButton;

	cancelButton: UIBarButtonItem;

	cellsPerRow: (p1: UIUserInterfaceSizeClass, p2: UIUserInterfaceSizeClass) => number;

	defaultSelections: PHFetchResult<PHAsset>;

	doneButton: UIBarButtonItem;

	fetchResults: NSArray<PHFetchResult<PHAssetCollection>>;

	maxNumberOfSelections: number;

	selectionFillColor: UIColor;

	selectionShadowColor: UIColor;

	selectionStrokeColor: UIColor;

	selectionTextAttributes: NSDictionary<string, any>;

	takePhotoIcon: UIImage;

	takePhotos: boolean;
}
