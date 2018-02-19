# Development Workflow

<!-- TOC depthFrom:2 -->

- [Running locally](#running-locally)
    - [Prerequisites](#prerequisites)
    - [Install dependencies](#install-dependencies)
    - [Run the demo app](#run-the-demo-app)
    - [Run the demo-angular app](#run-the-demo-angular-app)
- [Run UI Tests](#run-ui-tests)
- [Developer workflow](#developer-workflow)

<!-- /TOC -->

## Running locally

### Prerequisites

* Install your native toolchain and NativeScript as [described in the docs](https://docs.nativescript.org/plugins/plugins)

* Review [NativeScript plugins documentation](https://docs.nativescript.org/plugins/plugins) for more details on plugins development


### Install dependencies

```
$ cd nativescript-imagepicker/src
$ npm install
```

### Run the demo app
From the `src` folder
```
$ npm run demo.ios 
$ npm run demo.android
```

### Run the demo-angular app
```
$ cd nativescript-imagepicker/demo-angular
$ tns run ios 
$ tns run android

```

## Run UI Tests

1. Navigate to `demo/e2e`
    ``` bash
    cd demo/e2e
    ```

2. Make sure to have an emulator set up or connect a physical Android/iOS device.

3. Build the app for Android or iOS
    ```bash
    tns run android/ios
    ```

4. Install [appium](http://appium.io/) globally.
    ``` bash
    npm install -g appium
    ```

5. Follow the instructions in the [nativescript-dev-appium](https://github.com/nativescript/nativescript-dev-appium#custom-appium-capabilities) plugin to add an appium capability for your device inside `appium.capabilities.json`.

7. Run the automated tests. The value of the `runType` argument should match the name of the capability that you just added.
    ``` bash
    npm run e2e -- --runType capabilityName
    ```

## Developer workflow

1. Make changes to the plugin or the demo
2. Run the UI tests or any of the demos as shown above.
Having any of the demos running, the changes made to the plugin will be automatically applied in the demo. 

For details on plugins development workflow, read [NativeScript plugins documentation](https://docs.nativescript.org/plugins/building-plugins#step-2-set-up-a-development-workflow) covering that topic.