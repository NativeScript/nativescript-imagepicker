require("./bundle-config");
var application = require("application");

application.cssFile = "./app.css";
application.start({ moduleName: "main-page" });
