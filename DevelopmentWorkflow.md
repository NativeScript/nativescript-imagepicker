# Development Workflow

<!-- TOC depthFrom:2 -->

- [Prerequisites](#prerequisites)
- [Develop locally](#develop-locally)
- [Run locally](#run-locally)
    - [Install dependencies](#install-dependencies)
    - [Transpile TypeScript](#transpile-typescript)
    - [Run any of the demo apps](#run-any-of-the-demo-apps)
- [Run UI Tests](#run-ui-tests)

<!-- /TOC -->


## Prerequisites

* Install your native toolchain and NativeScript as [described in the docs](https://docs.nativescript.org/plugins/plugins)

* Review [NativeScript plugins documentation](https://docs.nativescript.org/plugins/plugins) for more details on plugins development


## Develop locally

For local development we recommend using the npm commands provided in the plugin's package.json

Basically executing the commands below will be enough for you to start making changes to the plugin and see them live synced in the demo:

```bash
$ cd nativescript-imagepicker/src
$ npm run demo.ios
$ npm run demo.android
```

After all the changes are done make sure to 
- test them in all the demo apps 
- run the UI tests.

For details on plugins development workflow, read [NativeScript plugins documentation](https://docs.nativescript.org/plugins/building-plugins#step-2-set-up-a-development-workflow) covering that topic.

## Run locally

### Install dependencies

```
$ cd nativescript-imagepicker/src
$ npm install
```

### Transpile TypeScript
```
$ cd nativescript-imagepicker/src
$ npm run tsc
```

### Run any of the demo apps

The plugin has multiple demo apps added. To run any of them use the following commands:
```
$ cd nativescript-imagepicker/<demo-folder>
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
    tns build android
    tns build ios
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

[Read more about UI testing](https://docs.nativescript.org/plugins/ui-tests).