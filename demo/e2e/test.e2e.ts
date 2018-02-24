import { AppiumDriver, createDriver, SearchOptions } from "nativescript-dev-appium";
import { isSauceLab, runType, capabilitiesName } from "nativescript-dev-appium/lib/parser";
import { expect } from "chai";

const isSauceRun = isSauceLab;
const isAndroid: string = runType.includes("android");

describe("Imagepicker", async function () {
    const imagesFolderName = "Images";
    const imagesFolderNameIos = "Camera Roll";
    const doneButtonText = "Done";
    let isOlderEmulator;
    let driver: AppiumDriver;

    before(async () => {
        driver = await createDriver();
        driver.defaultWaitTime = 10000;
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

    it("should pick one image", async function () {
        //await driver.driver.resetApp();
        const pickSingleButtonText = "Pick Single";
        let confirmButtonText = isAndroid ? "Allow" : "OK";
        let uploadPicVerification;
        if (isAndroid) {
            uploadPicVerification = isSauceRun ? "sauce_logo.png" : "pic1.jpeg";
        } else {
            uploadPicVerification = "IMG_0001.JPG";
        }

        const pickSingleButton = await driver.findElementByText(pickSingleButtonText, SearchOptions.contains);
        await pickSingleButton.click();
        const confirmButton = await driver.findElementByText(confirmButtonText);
        await confirmButton.click();
        
        if (isAndroid) {
            var imagesFolderXpath = await driver.elementHelper.getXPathByText(imagesFolderName, SearchOptions.contains);
            await driver.driver.sleep(3000);
            const imagesFolder = await driver.driver.elementByXPathIfExists(imagesFolderXpath, 10000);

            if (isSauceRun && imagesFolder) {
                isOlderEmulator = true;
                await imagesFolder.click();
                const downloadFolder = await driver.findElementByClassName(driver.locators.image);
                await downloadFolder.click();
            }
        } else {
            const cameraRollFolder = await driver.findElementByText(imagesFolderNameIos);
            await cameraRollFolder.click();
        }
        
        const pickedImage = await driver.findElementByClassName(driver.locators.image);
        await pickedImage.click();

        if (!isAndroid) {
            const doneButton = await driver.findElementByText(doneButtonText);
            await doneButton.click();
        }

        const result = await driver.findElementByText(uploadPicVerification, SearchOptions.contains);
        expect(result).to.exist;
    });

    it("should pick multiple images", async function () {
        let openImagesButtonText = isAndroid ? "Open" : doneButtonText;
        let uploadPicVerification;
        let uploadPicVerification2;

        if (isAndroid) {
            uploadPicVerification = isSauceRun ? "sauce_logo_red.png" : "pic2.jpeg";
            uploadPicVerification2 = isSauceRun ? "sauce_logo.png" : "pic3.jpeg";
        } else {
            uploadPicVerification = "IMG_0001.JPG";
            uploadPicVerification2 = "IMG_0002.JPG";
        }

        const pickMultipleButtonText = "Pick Multiple";
        const pickMultipleButton = await driver.findElementByText(pickMultipleButtonText, SearchOptions.contains);
        await pickMultipleButton.click();

        if (!isAndroid) {
            const cameraRollFolder = await driver.findElementByText(imagesFolderNameIos);
            await cameraRollFolder.click();
        }

        const allImages = await driver.findElementsByClassName(driver.locators.image);

        if (isAndroid) {
            await allImages[8].hold(); //third image
            await allImages[4].click(); //second image
        } else {
            await allImages[0].click(); //first image
            await allImages[1].click(); //second image
        }

        const openImagesButton = await driver.findElementByText(openImagesButtonText, SearchOptions.contains);
        await openImagesButton.click();
        const img = await driver.findElementByText(uploadPicVerification, SearchOptions.contains);
        expect(img).to.exist;

        if(isOlderEmulator){
            uploadPicVerification2 = "saucelabs_sauce.png";
        }

        const img1 = await driver.findElementByText(uploadPicVerification2, SearchOptions.contains);
        expect(img1).to.exist;
    });
});