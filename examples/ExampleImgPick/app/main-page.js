var frame = require("ui/frame");
var imagepicker = require("imagepicker");

var list;

function pageLoaded(args) {
	var page = args.object;
	list = page.getViewById("urls-list");
}
exports.pageLoaded = pageLoaded;

function onSelectImagesTap(args) {
	var context = imagepicker.create();
	context
		.authorize()
		.then(function() {
			list.items = [];
			return context.present();
		})
		.then(function(urls) {
			console.log("Selection done:");
			urls.forEach(function(url) {
				console.log(" - " + url);
			});
			list.items = urls.map(function(url) {
				return url.substring(url.lastIndexOf("/"));
			});
		}).catch(function (e) {
			console.log(e);
		});
}
exports.onSelectImagesTap = onSelectImagesTap;
