// Apple example: https://developer.apple.com/library/ios/samplecode/UsingPhotosFramework/Listings/SamplePhotosApp_AAPLRootListViewController_m.html
import data_observable = require("tns-core-modules/data/observable");
import data_observablearray = require("tns-core-modules/data/observable-array");

import ui_frame = require("tns-core-modules/ui/frame");
import { Page } from "tns-core-modules/ui/page";
import { ActionBar, NavigationButton, ActionItems, ActionItem } from "tns-core-modules/ui/action-bar";
import { ListView } from "tns-core-modules/ui/list-view";
import { Label } from "tns-core-modules/ui/label";

import { ImagePicker } from "./imagepicker.ios";

let imagesModule;

if (global.TNS_WEBPACK) {
    imagesModule = require("./images.ios");

    require("bundle-entry-points");
} else {
    imagesModule = require("./images");
}

let page;
let goingToAlbum: boolean = false;

export function onAlbumsItemTap(args) {
    let list = args.object;
    let topmost = ui_frame.topmost();
    goingToAlbum = true;
    topmost.navigate({
        create: imagesModule.imagesPageFactory,
        context: list.items.getItem(args.index)
    });
}

export function pageLoaded(args) {
    page = args.object;
    let list = page.getViewById("albums-list");

    list.on(ListView.itemLoadingEvent, function(args) {
        if (args.ios) {
            args.ios.accessoryType = UITableViewCellAccessoryType.DisclosureIndicator;
        }
    });

    if (page.navigationContext) {
        page.bindingContext = page.navigationContext;
    }
}

export function navigatedFrom(args) {
    if (!goingToAlbum) {
        page.bindingContext.cancel();
    }
    goingToAlbum = false;
}

export function done(args) {
    let topmost = ui_frame.topmost();
    topmost.goBack();
    page.bindingContext.done();
}

export function albumsPageFactory(): Page {
    // <Page xmlns="http://www.nativescript.org/tns.xsd" loaded="pageLoaded" navigatedFrom="navigatedFrom">
    let page = new Page();
    page.on(Page.loadedEvent, pageLoaded);
    page.on(Page.navigatedFromEvent, navigatedFrom);

    // <ActionBar title="{{ albumsText }}">
    let actionBar = new ActionBar();
    actionBar.bind({ targetProperty: "title", sourceProperty: "albumsText", twoWay: false });
    // <ActionBar.navigationButton>
    //    <NavigationButton text="{{ cancelText }}" />
    // </ActionBar.navigationButton>
    let navigationButton = new NavigationButton();
    navigationButton.bind({ targetProperty: "text", sourceProperty: "cancelText", twoWay: false });
    actionBar.navigationButton = navigationButton;
    // <ActionBar.actionItems>
    //    <!-- enabled="{{ selection.length > 0 }}" -->
    //    <ActionItem text="{{ selection.length, doneText + (mode === 'single' ? '' : ' (' + selection.length + ')') }}" ios.position="right" tap="done" />
    // </ActionBar.actionItems>
    let actionItems = new ActionItems();
    let item = new ActionItem();
    item.bind({ targetProperty: "text", sourceProperty: "selection.length", twoWay: false,
        expression: "doneText + (mode === 'single' ? '' : ' (' + selection.length + ')')" });
    item.ios.position = "right";
    item.on("tap", done);
    actionBar.actionItems.addItem(item);
    page.actionBar = actionBar;

    // <ListView id="albums-list" items="{{ albums }}" itemTap="onAlbumsItemTap">
    let listView = new ListView();
    listView.id = "albums-list";
    listView.bind({ targetProperty: "items", sourceProperty: "albums", twoWay: false });
    listView.on(ListView.itemTapEvent, onAlbumsItemTap);
    listView.itemTemplate = "<GridLayout rows=\"*, *\" columns=\"auto, *\" backgroundCount=\"red\"> \
			<Image rowSpan=\"2\" src=\"{{ thumbAsset }}\" width=\"80\" height=\"80\" margin=\"2\" /> \
			<Label row=\"0\" col=\"1\" text=\"{{ title}}\" verticalAlignment=\"bottom\" fontSize=\"16\" margin=\"0 12\" /> \
			<Label row=\"1\" col=\"1\" text=\"{{ assets.length }}\" verticalAlignment=\"top\" fontSize=\"13\" margin=\"0 12\" /> \
		</GridLayout>";

    page.content = listView;

    return page;
}
