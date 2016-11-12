// Register "dynamically" loaded module that need to be resolved by the
// XML/component builders.

global.registerModule("nativescript-imagepicker/albums", () => require("nativescript-imagepicker/albums"));
global.registerModule("nativescript-imagepicker/images", () => require("nativescript-imagepicker/images"));