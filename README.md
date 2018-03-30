SelectedAsset extends imageAssetModule.ImageAsset
- getImage() -> remove, use ImageSource.fromAsset() instead
- getImageData() : ArrayBuffer -> why do we have this?
- data() : any -> iOS only -> why do we have this?


candidates:

- https://github.com/awkward/Tatsi (no cocoa pod)
- https://github.com/mikaoj/BSImagePicker (not very similar to native picker)
- https://github.com/questbeat/QBImagePicker 


# NativeScript Image Picker ![apple](https://cdn3.iconfinder.com/data/icons/picons-social/57/16-apple-32.png) ![android](https://cdn4.iconfinder.com/data/icons/logos-3/228/android-32.png) 


[![npm](https://img.shields.io/npm/v/nativescript-imagepicker.svg)](https://www.npmjs.com/package/nativescript-imagepicker)
[![npm](https://img.shields.io/npm/dm/nativescript-imagepicker.svg)](https://www.npmjs.com/package/nativescript-imagepicker)
[![Build Status](https://travis-ci.org/NativeScript/nativescript-imagepicker.svg?branch=master)](https://travis-ci.org/NativeScript/nativescript-imagepicker)

Imagepicker plugin supporting both single and multiple selection.
<br />Plugin supports **iOS8+** and uses [Photos Framework](https://developer.apple.com/library/prerelease/ios//documentation/Photos/Reference/Photos_Framework/index.html).
<br />For **Android** it uses Intents to open the stock images or file pickers. For Android 6 (API 23) and above the permissions to read file storage should be explicitly required. See demo for implementation details.

<!-- TOC depthFrom:2 -->

- [Installation](#installation)
- [Configuration](#configuration)
- [Migrating from 4.x.x to 5.x.x](#migrating-from-4xx-to-5xx)
- [Migrating from 3.x.x to 4.x.x](#migrating-from-3xx-to-4xx)
- [Usage](#usage)
    - [Import the plugin](#import-the-plugin)
    - [Create imagepicker](#create-imagepicker)
    - [Request permissions, show the images list and process the selection](#request-permissions-show-the-images-list-and-process-the-selection)
- [API](#api)
    - [Methods](#methods)
    - [Properties](#properties)
    - [Image properties](#image-properties)
- [Contribute](#contribute)
- [Get Help](#get-help)

<!-- /TOC -->


## Installation

In Command prompt / Terminal navigate to your application root folder and run:

```
tns plugin add nativescript-imagepicker
tns run
```

## Configuration
No additional configuration required!

## Migrating from 4.x.x to 5.x.x
With version **5.x.x** major update to the plugin there is a related dependency which needs to be updated inside your project. The plugin uses internally the `nativescript-ui-listview` plugin (part of the NativeScript Pro UI components). Recently the monolithic [NativeScript Pro UI plugin was split in multiple plugins](https://www.nativescript.org/blog/professional-components-from-nativescript-ui-the-big-breakup), each of them representing a single component. Now, instead of the monolithic package, nativescript-imagepicker uses only the component it needs. To use version 5.x.x of the plugin, you need to update any dependencies to `nativescript-pro-ui` in your project with the single component alternatives as described in the [migration guide](http://docs.telerik.com/devtools/nativescript-ui/migration).

## Migrating from 3.x.x to 4.x.x
With the **4.x.x** major update to the plugin there is a related dependency which needs to be updated inside your project. The plugin uses internally the `nativescript-pro-ui` plugin (previously known as `nativescript-telerik-ui`) which has bee updated and made 100% free. This means that if your project is using the deprecated `nativescript-telerik-ui`/`pro` plugins adding the latest version of the `nativescript-imagepicker` plugin will cause your project to throw an build error when working with iOS. This is because the `nativescript-imagepicker` has a dependency to the new `nativescript-pro-ui` plugin and when your project also depends on the old `nativescript-telerik-ui` plugin there is a native frameworks collision.

In order to solve this you simply have to update to the latest `nativescript-pro-ui`, more details on how to migrate from `nativescript-telerik-ui`/`pro` to `nativescript-pro-ui` can be found [here](http://docs.telerik.com/devtools/nativescript-ui/migration).

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

* authorize() - request the required permissions.
* present() - show the albums to present the user the ability to select images. Returns an array of the selected images.
* cancel() - cancel selection. iOS only.
* done() - confirm the selection is ready. iOS only.


### Properties
| Property | Default | Description |
| --- | --- | --- |
| selection | null | An array of selected image assets. |
| albums | null | Albums from where the images are picked. |


### Image properties

Once image is picked some options can be applied to it  before it is used:

| Option | Default | Description |
| --- | --- | --- |
| maxWidth | null | Image max width |
| maxHeight | null | Image max height |
| aspectRatio | fit | iOS only. Possible values are `fit` and `fill`. [Read more](https://developer.apple.com/documentation/photos/phimagecontentmode) |

## Contribute
We love PRs! Check out the [contributing guidelines](CONTRIBUTING.md). If you want to contribute, but you are not sure where to start - look for [issues labeled `help wanted`](https://github.com/NativeScript/nativescript-imagepicker/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22).

  
## Get Help 
Please, use [github issues](https://github.com/NativeScript/nativescript-imagepicker/issues) strictly for [reporting bugs](CONTRIBUTING.md#reporting-bugs) or [requesting features](CONTRIBUTING.md#requesting-new-features). For general questions and support, check out the [NativeScript community forum](https://discourse.nativescript.org/) or ask our experts in [NativeScript community Slack channel](http://developer.telerik.com/wp-login.php?action=slack-invitation).
  
![](https://ga-beacon.appspot.com/UA-111455-24/nativescript/nativescript-imagepicker?pixel) 
