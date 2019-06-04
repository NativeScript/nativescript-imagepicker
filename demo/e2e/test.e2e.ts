import { AppiumDriver, createDriver, SearchOptions } from "nativescript-dev-appium";
import { isSauceLab, runType } from "nativescript-dev-appium/lib/parser";
import { expect } from "chai";
const fs = require('fs');
const addContext = require('mochawesome/addContext');
const rimraf = require('rimraf');

const isSauceRun = isSauceLab;
const isAndroid: boolean = runType.includes("android");

describe("Imagepicker", async function () {
    const imagesFolderName = "Images";
    const imagesFolderNameIos = "Camera Roll";
    const doneButtonText = "Done";
    let driver: AppiumDriver;

    before(async () => {
        driver = await createDriver();
        driver.defaultWaitTime = 10000;
        let dir = "mochawesome-report";
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        rimraf('mochawesome-report/*', function () { });
    });

    after(async () => {
        if (isSauceRun) {
            driver.sessionId().then(function (sessionId) {
                console.log("Report: https://saucelabs.com/beta/tests/" + sessionId);
            });
        }
        await driver.quit();
        console.log("Driver quits!");
    });

    afterEach(async function () {
        if (this.currentTest.state && this.currentTest.state === "failed") {
            let png = await driver.logScreenshot(this.currentTest.title);
            fs.copyFile(png, './mochawesome-report/' + this.currentTest.title + '.png', function (err) {
                if (err) {
                    throw err;
                }
                console.log('Screenshot saved.');
            });
            addContext(this, './' + this.currentTest.title + '.png');
        }
    });

    it("should pick one image", async function () {
        // await driver.driver.resetApp();
        const pickSingleButtonText = "Pick Single";
        let confirmButtonText = isAndroid ? "Allow" : "OK";

        let pickSingleButton = await driver.findElementByText(pickSingleButtonText, SearchOptions.contains);
        await pickSingleButton.click();
        const confirmButton = await driver.findElementByText(confirmButtonText);
        await confirmButton.click();

        if (isAndroid) {
            const imagesFolderXpath = await driver.elementHelper.getXPathByText(imagesFolderName, SearchOptions.contains);
            await driver.driver.sleep(3000);
            let imagesFolder = await driver.driver.elementByXPathIfExists(imagesFolderXpath, 10000);

            if (isSauceRun && imagesFolder) {
                await imagesFolder.click();
                imagesFolder = await driver.findElementByClassName(driver.locators.image);
                await imagesFolder.click();
            }
        } else {
            const cameraRollFolder = await driver.findElementByAccessibilityId(imagesFolderNameIos);
            await cameraRollFolder.click();
        }

        const imageLocator =  isAndroid ? "android.widget.ImageView" : "XCUIElementTypeCell";
        const image = await driver.findElementByClassName(imageLocator);
        await image.tap();

        pickSingleButton = await driver.findElementByText(pickSingleButtonText, SearchOptions.contains);
        expect(pickSingleButton).to.exist;

        const result = await driver.findElementByClassName(driver.locators.image);
        expect(result).to.exist;
    });

    it("should pick multiple images", async function () {
        let openImagesButtonText = isAndroid ? "Open" : doneButtonText;
        let uploadPicVerification = "image 0";
        let uploadPicVerification2 = "image 1";

        const pickMultipleButtonText = "Pick Multiple";
        const pickMultipleButton = await driver.findElementByText(pickMultipleButtonText, SearchOptions.contains);
        await pickMultipleButton.click();

        if (!isAndroid) {
            const cameraRollFolder = await driver.findElementByText(imagesFolderNameIos);
            await cameraRollFolder.click();
        }

        if (isAndroid) {
            const allImages = await driver.findElementsByClassName("android.widget.ImageView");
            await allImages[5].hold(); // second Image
            await allImages[2].click(); // first image
        } else {
            const allImages = await driver.findElementsByClassName("XCUIElementTypeCell");
            await allImages[0].click(); // first image
            await allImages[1].click(); // second image
        }

        const openImagesButton = await driver.findElementByText(openImagesButtonText, SearchOptions.contains);
        await openImagesButton.click();
        const img = await driver.findElementByText(uploadPicVerification, SearchOptions.contains);
        expect(img).to.exist;
        const img1 = await driver.findElementByText(uploadPicVerification2, SearchOptions.contains);
        expect(img1).to.exist;
    });
});
