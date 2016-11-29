# Image Picker for the NativeScript framework
An image picker control that supports multiple selection.

For iOS it supports iOS8+ (read: it does not work for iOS7). It is implemented using the [Photos Framework](https://developer.apple.com/library/prerelease/ios//documentation/Photos/Reference/Photos_Framework/index.html) backed up by UI implemented using the NativeScript UI modules.

On Android it uses Intents to open the stock image or file pickers. 

 - [Source](https://github.com/NativeScript/nativescript-imagepicker)
 - [Issues](https://github.com/NativeScript/nativescript-imagepicker/issues)

Examples:
 - [Select and Upload](https://github.com/NativeScript/sample-ImageUpload)
 - [ImagePicker](https://github.com/NativeScript/nativescript-imagepicker/tree/master/examples/ExampleImgPick/app)

## Installation

### Install plugin using NativeScript CLI
From the command prompt go to your app's root folder and execute:
```
tns plugin add nativescript-imagepicker
```

### Install plugin using AppBuilder CLI
```
appbuilder plugin add nativescript-imagepicker
```

### Install plugin using AppBuilder IDE
In the Project Navigator, right click your project and choose Manage Packages.
Choose the Plugins Marketplace tab.
Search or browse for a plugin and click Install.

## Usage

For sample application with single and multiple image selection ready for Android and IOS
[follow this link](https://github.com/NativeScript/sample-ImageUpload)

### How-to Pick Multiple Images
```
var imagepickerModule = require("nativescript-imagepicker");

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
### How-to Pick Single Image
```
var context = imagepicker.create({
    mode: "single"
});
```
### How-to Bind Selected Images
#### main-page.xml
```
<ListView id="urls-list">
    <ListView.itemTemplate>
        <GridLayout columns="100, auto" rows="*, *, *">
            <Image rowSpan="3" width="100" height="100" src="{{ thumb }}" />
            <Label col="1" row="0" text="{{ uri }}" textWrap="true"/>
            <Label col="1" row="2" text="{{ fileUri }}" />
        </GridLayout>
    </ListView.itemTemplate>
</ListView>

<Button row="1" text="Pick Multiple Images" tap="onSelectMultipleTap" />
<Button row="2" text="Pick Single Image" tap="onSelectSingleTap" />
```
#### main-page.js
```
var imagepickerModule = require("nativescript-imagepicker");

var page;
var list;

function pageLoaded(args) {
	page = args.object;
	list = page.getViewById("urls-list");
}

function onSelectMultipleTap(args) {	
	var context = imagepickerModule.create({
		mode: "multiple"
	});
	startSelection(context);
}

function onSelectSingleTap(args) {	
	var context = imagepickerModule.create({
		mode: "single"
	});
	startSelection(context);
}

function startSelection(context) {
	context
		.authorize()
		.then(function() {
			list.items = [];
			return context.present();
		})
		.then(function(selection) {
			selection.forEach(function(selected) {
                console.log("uri: " + selected.uri);           
                console.log("fileUri: " + selected.fileUri);
			});
			list.items = selection;
		}).catch(function (e) {
			console.log(e);
		});
}

exports.pageLoaded = pageLoaded;
exports.onSelectMultipleTap = onSelectMultipleTap;
exports.onSelectSingleTap = onSelectSingleTap;
```
