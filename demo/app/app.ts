import "./bundle-config";
import * as application from 'tns-core-modules/application';

application.setCssFileName("./app.css");
application.start({ moduleName: "main-page" });