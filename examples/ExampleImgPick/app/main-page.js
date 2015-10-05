var frame = require("ui/frame");
var platform = require("platform");
var fs = require("file-system");

var page;
var list;
var selection;

function pageLoaded(args) {
	page = args.object;
	list = page.getViewById("urls-list");
}
exports.pageLoaded = pageLoaded;

function onSelectMultipleTap(args) {
	var imagepicker = require("imagepicker");
	var context = imagepicker.create({
		mode: "multiple"
	});
	startSelection(context);
}
exports.onSelectMultipleTap = onSelectMultipleTap;

function onSelectSingleTap(args) {
	var imagepicker = require("imagepicker");
	var context = imagepicker.create({
		mode: "single"
	});	
	startSelection(context);
}
exports.onSelectSingleTap = onSelectSingleTap;

function startSelection(context) {
	context
		.authorize()
		.then(function() {
			list.items = [];
			return context.present();
		})
		.then(function(newSelection) {
			console.log("Selection done:");
			newSelection.forEach(function(selected) {
				console.log(" - " + selected.uri);
			});
			selection = newSelection;
			list.items = newSelection;
		}).catch(function (e) {
			console.log(e);
		});
}

function onUploadTap(args) {
	if (!selection || selection.length <= 0) {
		return;
	}

	if (!page.ios) {
		return;
	}

	var bghttp = require("background-http");

	var session = bghttp.session("com.daycare.admin:upload");

	selection.forEach(function(asset) {
		
		var name = asset.fileUri.split("/").pop();

		asset.data()
			.then(function(data) {

				// Saving to temporary, 4 lines iOS only:
				var tempFileURL = NSURL.fileURLWithPath(NSTemporaryDirectory() + "/upload-" + new Date().getTime().toString() + name);
				console.log("Temporary: " + tempFileURL);
				data.writeToURLAtomically(tempFileURL, false);
				tempFileURL = tempFileURL.toString();

				var request = {
					url: "http://localhost:8282",
					// url: "http://posttestserver.com/post.php",
					method: "POST",
					headers: {
						"Content-Type": "application/octet-stream",
						"File-Name": name
					},
					description: "Uploading " + name,
				};

				var task = session.uploadFile(tempFileURL, request);

				asset.task = task;

				// We do not support bindings such as {{ task.upload }} yet so we will get the progress from the task and set it on the asset.
				task.on("propertyChange", function(args) {
					if (args.propertyName == "upload" || args.propertyName == "totalUpload") {
						asset.set(args.propertyName, args.value);
					}
				});
			})
			.catch(function(e) {
				console.log("Failed getting data for " + name + ": " + e);
			});
	});
}
exports.onUploadTap = onUploadTap;


