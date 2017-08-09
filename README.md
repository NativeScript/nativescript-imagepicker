# NativeScript Image Picker ![apple](https://cdn3.iconfinder.com/data/icons/picons-social/57/16-apple-32.png) ![android](https://cdn4.iconfinder.com/data/icons/logos-3/228/android-32.png) 


[![npm](https://img.shields.io/npm/v/nativescript-imagepicker.svg)](https://www.npmjs.com/package/nativescript-imagepicker)
[![npm](https://img.shields.io/npm/dm/nativescript-imagepicker.svg)](https://www.npmjs.com/package/nativescript-imagepicker)
[![Build Status](https://travis-ci.org/NativeScript/nativescript-imagepicker.svg?branch=master)](https://travis-ci.org/NativeScript/nativescript-imagepicker)

Imagepicker plugin supporting both single and multiple selection.
<br />Plugin supports **iOS8+** and uses [Photos Framework](https://developer.apple.com/library/prerelease/ios//documentation/Photos/Reference/Photos_Framework/index.html).
<br />For **Android** it uses Intents to open the stock images or file pickers. For Android 6 (API 23) and above the permissions to read file storage should be explicitly required. See demo for implementation details.

## Installation

In Command prompt / Terminal navigate to your application root folder and run:

```
tns plugin add nativescript-imagepicker
```

## Usage 

The best way to explore the usage of the plugin is to inspect both demo apps in the plugin repository. 
In `demo` folder you can find the usage of the plugin for TypeScript non-Angular application. Refer to `demo/app/main-page.ts`.
In `demo-angular` is the usage in an Angular app. Refer to `demo-angular/app/app.component.ts`.

In addition to the plugin usage, both apps are webpack configured.

In short here are the steps:

### Import the plugin

*TypeScript*
``` 
import * as imagepicker from "nativescript-imagepicker";
```

*Javascript*
``` 
var imagepicker = require("nativescript-imagepicker");
```

### Create imagepicker

Create imagepicker in `single` or `multiple` mode to specifiy if the imagepicker will be used for single or multiple selection of images

*TypeScript*
``` 
let context = imagepicker.create({
    mode: "single" // use "multiple" for multiple selection
});
````

*Javascript*
````
var context = imagepicker.create({ mode: "single" }); // use "multiple" for multiple selection
````

### Request permissions, show the images list and process the selection

``` 
context
    .authorize()
    .then(function() {
        return context.present();
    })
    .then(function(selection) {
        selection.forEach(function(selected) {
            // process the selected image
        });
        list.items = selection;
    }).catch(function (e) {
        // process error
    });
```

> **NOTE**: To request permissions for Android 6+ (API 23+) we use [nativescript-permissions](https://www.npmjs.com/package/nativescript-permissions).

## API

### Methods

* create(options) - creates instance of the imagepicker. Possible options are:

| Option | Platform | Default | Description |
| --- |  --- | --- | --- |
| mode | both | multiple | The mode if the imagepicker. Possible values are `single` for single selection and `multiple` for multiple selection. |
| doneText | iOS | Done | The text of the "Done" button on top right. |
| cancelText |  iOS | Cancel | The text of the "Cancel" button on top left. |
| albumsText | iOS | Albums | The title of the "Albums" screen from where the selection of album and images can be done. |
| newestFirst | iOS | false | Set to `true` to sort the images in an album by newest first. |

* authorize() - request iOS specific permissions.
* present() - show the albums to present the user the ability to select images. Returns an array of the selected images.
* cancel() - cancel selection. iOS only.
* done() - confirm the selection is ready. iOS only.


### Properties
| Property | Default | Description |
| --- | --- | --- |
| selection | null | An array of selected image assets. |
| albums | null | Albums from where the images are picked. |


## License

2015, Telerik AD