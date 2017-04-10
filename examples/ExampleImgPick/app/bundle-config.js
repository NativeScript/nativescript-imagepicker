if (global.TNS_WEBPACK) {
    require("bundle-entry-points");

    global.registerModule("main-page", () => require("./main-page") );
}
