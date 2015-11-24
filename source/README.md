# Image Picker for the NativeScript framework
An image picker control that supports multiple selection.

For iOS it supports iOS8+ (read: it does not work for iOS7). It is implemented using the [Photos Framework](https://developer.apple.com/library/prerelease/ios//documentation/Photos/Reference/Photos_Framework/index.html) backed up by UI implemented using the NativeScript UI modules.

On Android it uses Intents to open the stock image or file pickers. 

 - [Source](https://github.com/NativeScript/nativescript-imagepicker)
 - [Issues](https://github.com/NativeScript/nativescript-imagepicker/issues)
 - [Example](https://github.com/NativeScript/nativescript-imagepicker/tree/release/examples/ExampleImgPick/app)

# How-to Pick Multiple Images
```
var imagepicker = require("nativescript-imagepicker");

function selectImages() {
	var context = imagepicker.create({
		mode: "multiple"
	});
	
	context
		.authorize()
		.then(function() {
			return context.present();
		})
		.then(function(selection) {
			console.log("Selection done:");
			selection.forEach(function(selected) {
				console.log(" - " + selected.uri);
			});
		}).catch(function (e) {
			console.log(e);
		});
}
```
