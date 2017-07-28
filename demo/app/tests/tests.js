var YourPlugin = require("nativescript-yourplugin").YourPlugin;
var yourPlugin = new YourPlugin();

describe("greet function", function() {
    it("exists", function() {
        expect(yourPlugin.greet).toBeDefined();
    });

    it("returns a string", function() {
        expect(yourPlugin.greet()).toEqual("Hello, NS");
    });
});