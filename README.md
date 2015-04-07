# angular_map.js
angular version of google maps

1. add dist/map.js to your html
2. add 'map' dependency to your module
3. add directive
```html
<map></map
```
or set your own values right away
```html
<map center="{lat:47.605755, lng:-122.335955}" zoom="12" options='{draggable:false}'></map
```

###How is dist/map.js made?
I use webpack to build dist/map.js from lib/*
You can rebuild your own or include the files 1 by 1 (but remove the require calls unless you have some require system)
To use webpack

1. npm install webpack -g
2. run (in the same directory as webpack.config.js)
```html
webpack
```
