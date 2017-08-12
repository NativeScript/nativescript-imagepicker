var path = require("path"),
    fs = require("fs"),
    projectPackageJsonFilename = path.join(__dirname, "..", "..", "..", "package.json"),
    projectPackageJson;

// ignore the remainder of the script if for some reason no package.json exists
try { projectPackageJson = require(projectPackageJsonFilename); } catch (ignore) { return; };

// check if either nativescript-telerik-ui or nativescript-telerik-ui-pro are installed
var telerikui = projectPackageJson.dependencies["nativescript-telerik-ui"];
var telerikuipro = projectPackageJson.dependencies["nativescript-telerik-ui-pro"];

// if neither are installed, add nativescript-telerik-ui to the project package.json as a dependency,
// so the user can always later decide to upgrade to nativescript-telerik-ui-pro.
if (telerikui === undefined && telerikuipro === undefined) {

  // we want to install the same version this plugin is tested with, so grab it from the devDependencies.
  var pluginPackageJson = require(path.join(__dirname, "..", "package.json"));
  var telerikuiversion = pluginPackageJson.devDependencies["nativescript-telerik-ui"];

  projectPackageJson.dependencies["nativescript-telerik-ui"] = telerikuiversion;
  fs.writeFileSync(projectPackageJsonFilename, JSON.stringify(projectPackageJson, null, 2));

  console.log("The nativescript-imagepicker plugin added the nativescript-telerik-ui@" + telerikuiversion + " dependency to your app's package.json.");
}