var frame = require("ui/frame");
var platform = require("platform");

var page;
var list;

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
		.then(function(selection) {
			console.log("Selection done:");
			selection.forEach(function(selected) {
                console.log("----------------");
				console.log("uri: " + selected.uri);
                console.log("fileUri: " + selected.fileUri);
			});
			list.items = selection;
		}).catch(function (e) {
			console.log(e);
		});
}
