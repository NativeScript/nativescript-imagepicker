import * as application from 'tns-core-modules/application';

require("./bundle-config");

application.setCssFileName("./app.css");
application.start({ moduleName: "main-page" });