var frame = require("ui/frame");
var platform = require("platform");

var page;
var list;
var selection;

function pageLoaded(args) {
	page = args.object;
	list = page.getViewById("urls-list");
}
exports.pageLoaded = pageLoaded;

function onSelectImagesTap(args) {
	var imagepicker = require("imagepicker");
	var context = imagepicker.create();
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
exports.onSelectImagesTap = onSelectImagesTap;

function onUploadTap(args) {
	if (!selection || selection.length <= 0) {
		return;
	}

	var bghttp = require("background-http");

	var session = bghttp.session("com.daycare.admin:upload");

	selection.forEach(function(asset) {
		
		var name = asset.fileUri.split("/").pop();
		console.log(" - (" + name + ") " + asset.fileUri);
		
		var request = {
			// url: "http://localhost:8282",
			url: "http://posttestserver.com/post.php",
			method: "POST",
			headers: {
				"Content-Type": "application/octet-stream",
				"File-Name": name
			},
			description: "Uploading " + name,
		};

		var task = session.uploadFile(asset.fileUri, request);
		asset.task = task;
		// We do not support bindings such as {{ task.upload }} yet so we will get the progress from the task and set it on the asset.
		task.on("propertyChange", function(args) {
			if (args.propertyName == "upload" || args.propertyName == "totalUpload") {
				asset.set(args.propertyName, args.value);
			}
		});
	});
}
exports.onUploadTap = onUploadTap;


