var path = require("path"),
    projectPackageJsonFilename = path.join(__dirname, "..", "..", "..", "package.json"),
    projectPackageJson;

// ignore the remainder of the script if for some reason no package.json exists
try { projectPackageJson = require(projectPackageJsonFilename); } catch (ignore) { return; };

if(projectPackageJson.dependencies) {
  // check if either nativescript-telerik-ui or nativescript-telerik-ui-pro are installed
  var telerikui = projectPackageJson.dependencies["nativescript-telerik-ui"];
  var telerikuipro = projectPackageJson.dependencies["nativescript-telerik-ui-pro"];

  // if neither are installed, add nativescript-telerik-ui to the project package.json as a dependency,
  // so the user can always later decide to upgrade to nativescript-telerik-ui-pro.
  if (telerikui === undefined && telerikuipro === undefined) {

    // we want to install the same version this plugin is tested with, so grab it from the devDependencies.
    var pluginPackageJson = require(path.join(__dirname, "..", "package.json"));
    var telerikuiversion = pluginPackageJson.devDependencies["nativescript-telerik-ui"];

    // give the user a bit of feedback as installing this dependency take a while to complete.
    console.log("The nativescript-imagepicker plugin requires nativescript-telerik-ui. Please wait while it's being added to your project...");
    require('child_process').execSync('npm i --save nativescript-telerik-ui@' + telerikuiversion, { cwd: path.join(__dirname, "..", "..")});
    console.log("nativescript-telerik-ui@" + telerikuiversion + " has been successfully installed and was added to your app's package.json.");
  }
}

