import application = require("application");
import platform = require("platform");

import ui_frame = require("ui/frame");
import { Page } from "ui/page";
import { ActionBar, NavigationButton, ActionItems, ActionItem } from "ui/action-bar";
import { RadListView, ListViewGridLayout } from "nativescript-telerik-ui/listview";

var page;
var list;
var album;

export function pageLoaded(args) {
    page = args.object;
    page.bindingContext = page.navigationContext;
    list = page.getViewById("images-list");

    // Get the current Size, and then adjust the number of columns based on it...
    list.listViewLayout.spanCount = Math.floor(platform.screen.mainScreen.widthDIPs / 80);

    application.on("orientationChanged", function (e: application.OrientationChangedEventData) {
        var currentPageWidth = platform.screen.mainScreen.heightDIPs
        list.listViewLayout.spanCount = Math.floor(currentPageWidth / 80);
    });
}

export function done(args) {
    var topmost = ui_frame.topmost();
    topmost.goBack();
    topmost.goBack();

    page.bindingContext.imagePicker.done();
}

export function imagesPageFactory(): Page {
    //<Page xmlns="http://www.nativescript.org/tns.xsd" loaded="pageLoaded" xmlns:lv="nativescript-telerik-ui/listview">
    let page = new Page();
    page.on(Page.loadedEvent, pageLoaded);
    
    //<ActionBar title="{{ title }}">
    let actionBar = new ActionBar();
    actionBar.bind({ targetProperty: "title", sourceProperty: "title", twoWay: false });
    //<ActionBar.navigationButton>
    //    <NavigationButton text="Albums"/>
    //</ActionBar.navigationButton>
    let navigationButton = new NavigationButton();
    navigationButton.text = "Albums";
    actionBar.navigationButton = navigationButton;
    //<ActionBar.actionItems>
    //    <ActionItem
    //        text="{{ imagePicker.selection.length, imagePicker.doneText + (imagePicker.mode === 'single' ? '' : ' (' + imagePicker.selection.length + ')') }}"
    //        ios.position="right" tap="done"/>
    //</ActionBar.actionItems>
    let actionItems = new ActionItems();
    let item = new ActionItem();
    item.bind({
        targetProperty: "text", sourceProperty: "imagePicker.selection.length", twoWay: false,
        expression: "imagePicker.doneText + (imagePicker.mode === 'single' ? '' : ' (' + imagePicker.selection.length + ')')"
    });
    item.ios.position = "right";
    item.on(ActionItem.tapEvent, done);
    actionBar.actionItems.addItem(item);
    page.actionBar = actionBar;

    //<lv:RadListView id="images-list" items="{{ assets }}" >
    let listView = new RadListView();
    listView.id = "images-list";
    listView.bind({ targetProperty: "items", sourceProperty: "assets", twoWay: false });
    //<lv:RadListView.listViewLayout>
    //    <lv:ListViewGridLayout scrollDirection="Vertical" spanCount="4" itemHeight="80"/>
    //</lv:RadListView.listViewLayout>
    let listViewGridLayout = new ListViewGridLayout();
    listViewGridLayout.scrollDirection = "Vertical";
    listViewGridLayout.spanCount = 4;
    listViewGridLayout.itemHeight = 80;
    listView.listViewLayout = listViewGridLayout;
    listView.itemTemplate =
        "<GridLayout margin=\"1\" rows=\"auto\" tap=\"{{ toggleSelection }}\">" +
        "<Image height=\"78\" width=\"78\" opacity=\"{{ selected ? 0.7 : 1 }}\" src=\"{{ $value }}\"/>" +
        "</GridLayout>";

    page.content = listView;

    return page;
}