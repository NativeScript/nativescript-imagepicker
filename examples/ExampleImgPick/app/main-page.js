var frame = require("ui/frame");
var platform = require("platform");

var page;
var list;

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
		.then(function(selection) {
			console.log("Selection done:");
			selection.forEach(function(selected) {
				console.log(" - " + selected.uri);
			});
			list.items = selection;
		}).catch(function (e) {
			console.log(e);
		});
}
exports.onSelectImagesTap = onSelectImagesTap;
