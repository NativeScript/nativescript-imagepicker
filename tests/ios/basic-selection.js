
var target = UIATarget.localTarget();

target.frontMostApp().mainWindow().buttons()["Select Images"].tap();
target.frontMostApp().mainWindow().tableViews()["albums-list"].tapWithOptions({tapOffset:{x:0.31, y:0.07}});
target.frontMostApp().mainWindow().elements()["images-list"].images()[0].tapWithOptions({tapOffset:{x:0.49, y:0.48}});
target.frontMostApp().mainWindow().elements()["images-list"].images()[3].tapWithOptions({tapOffset:{x:0.57, y:0.49}});
target.frontMostApp().navigationBar().rightButton().tap();
target.frontMostApp().mainWindow().tableViews()["urls-list"].tapWithOptions({tapOffset:{x:0.26, y:0.02}});
target.frontMostApp().mainWindow().tableViews()["urls-list"].tapWithOptions({tapOffset:{x:0.25, y:0.06}});
