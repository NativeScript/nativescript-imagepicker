import { AppiumDriver } from "nativescript-dev-appium";

export async function findAndroidImages(driver: AppiumDriver) {
    const sidedrawer = await driver.findElementByAccessibilityId("Show roots");
            await sidedrawer.click();
            const images = await driver.findElementByText("Images");
            await images.click();
            const dcimFolder = await driver.findElementByText("DCIM");
            await dcimFolder.click();
}