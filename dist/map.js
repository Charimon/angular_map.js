/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	angular.module('map.common', [])
	angular.module('map.models', ['map.common'])
	angular.module('map.services', ['map.models'])
	angular.module('map.directives', [])

	__webpack_require__(18);
	__webpack_require__(19);

	__webpack_require__(1);
	__webpack_require__(2);
	__webpack_require__(3);
	__webpack_require__(4);
	__webpack_require__(5);
	__webpack_require__(6);
	__webpack_require__(7);


	__webpack_require__(9);
	__webpack_require__(10);
	__webpack_require__(11);


	__webpack_require__(12);
	__webpack_require__(13);
	__webpack_require__(14);
	__webpack_require__(15);
	__webpack_require__(16);
	__webpack_require__(17);


	angular.module('map', ['map.models', 'map.services', 'map.directives']);

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	angular.module('map.models').factory('Coordinate', Coordinate)
	Coordinate.$inject = ['$q'];

	function Coordinate($q){
	  function Coordinate(lat, lng){
	    this.lat = lat;
	    this.lng = lng;
	  }

	  //(data:Object) -> :Promise(:Coordinate|[:Coordinate])
	  Coordinate.promiseFrom = function(data) { return $q(function(resolve, reject) {
	    if(data != null && angular.isFunction(data.then)){ resolve(data.then(Coordinate.promiseFrom)); }
	    else if(data instanceof Coordinate){ resolve(data); }
	    else if(window.google != null && window.google.maps != null && window.google.maps.LatLng != null && data instanceof window.google.maps.LatLng) { resolve(new Coordinate(data.lat(), data.lng())); }
	    else if(angular.isArray(data) && data.length == 2 && angular.isNumber(data[0]) && angular.isNumber(data[1])) {
	      resolve(new Coordinate(data[1], data[0]));
	    }
	    else if(angular.isArray(data)) { resolve($q.all(data.map(Coordinate.promiseFrom))); }
	    else if(angular.isObject(data) && (angular.isNumber(data.lat) || angular.isString(data.lat)) && (angular.isNumber(data.lng) || angular.isString(data.lng))){ resolve(new Coordinate(data.lat, data.lng)); }
	    else { reject("data can't be parsed correctly"); }
	  })};

	  Coordinate.prototype = {
	    toGoogle: function(){
	      if(window.google != null && window.google.maps != null && window.google.maps.LatLng != null){
	        return new google.maps.LatLng(this.lat, this.lng);
	      }
	      return null;
	    },
	    toJson: function(){
	      return {lat:this.lat, lng:this.lng};
	    }
	  };

	  return Coordinate;
	}

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	angular.module('map.models').factory('Marker', Marker);

	Marker.$inject = ['Coordinate', '$q'];

	function Marker(Coordinate, $q){
	  function Marker(position, options){
	    this.position = position;

	    for(var prop in options){
	      if(options.hasOwnProperty(prop) && prop != 'position'){
	        this[prop] = options[prop];
	      }
	    }
	  }

	  //(data:Object) -> :Promise(:Marker|[:Marker])
	  Marker.promiseFrom = function(data) { return $q(function(resolve, reject){
	    if(data != null && angular.isFunction(data.then)){ resolve(data.then(Marker.promiseFrom)); }
	    else if(data instanceof Marker){ resolve(data); }
	    else if(window.google != null && window.google.maps != null && window.google.maps.Marker != null && data instanceof window.google.maps.Marker) { reject("data can't be parsed correctly of type google.maps.Marker"); }
	    else if(angular.isArray(data)) { resolve($q.all(data.map(Marker.promiseFrom))); }
	    else if(angular.isObject(data)){
	      resolve(Coordinate.promiseFrom(data.position).then(function(coordinate){ return new Marker(coordinate, data); }));
	    } else { reject("data can't be parsed correctly"); }
	  })};

	  Marker.prototype = {
	    toGoogle: function(){
	      var result = {};
	      for(var prop in this){
	        if(this.hasOwnProperty(prop)){
	          if(this[prop] == null || this[prop].toGoogle == undefined) result[prop] = this[prop];
	          else result[prop] = this[prop].toGoogle();
	        }
	      }
	      return new google.maps.Marker(result);
	    },
	    fillMap: function(map){
	      if(window.google != null && window.google.maps != null && window.google.maps.Map != null && map instanceof window.google.maps.Map){
	        if(this.mappedObj != null) this.mappedObj.setMap(null);
	        this.mappedObj = this.toGoogle();
	        this.mappedObj.setMap(map);
	      }
	      return this;
	    }
	  };

	  return Marker;

	}


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	String.prototype.capitalize = function() {
	  return this.charAt(0).toUpperCase() + this.slice(1);
	};

	angular.module('map.models')
	  .service('PolygonTransformer', PolygonTransformer)
	  .factory('Polygon', Polygon)

	PolygonTransformer.$inject = [];
	Polygon.$inject = ['$q', 'Coordinate', 'PolygonTransformer', 'UUID', 'Cache'];


	function Polygon($q, Coordinate, PolygonTransformer, UUID, Cache){
	  function Polygon(options){
	    this.uuid = UUID.make();
	    this.options = options;
	  }

	  //(data:Object) -> :Promise(:Polygon|[:Polygon])
	  Polygon.promiseFrom = function(data) { return $q(function(resolve, reject) {
	    if(data != null && angular.isFunction(data.then)){ resolve(data.then(Polygon.promiseFrom)); }
	    else if (data instanceof Polygon) { resolve(data); }
	    else if (window.google != null && window.google.maps != null && window.google.maps.Polygon != null && data instanceof window.google.maps.Polygon) { reject("data can't be parsed correctly of type google.maps.Polygon"); }
	    else if (angular.isArray(data)) { resolve($q.all(data.map(Polygon.promiseFrom))); }
	    else if (angular.isObject(data)) {
	      var validated = PolygonTransformer.transform(data);
	      resolve(Coordinate.promiseFrom(validated.paths).then(function(paths){
	        validated.paths = paths;
	        return new Polygon(validated);
	      }));
	    }
	    else { reject("data can't be parsed correctly"); }
	  })};

	  Polygon.prototype = {
	    toGoogle: function(){
	      var result = {};
	      for(var prop in this.options){
	        if(this.options.hasOwnProperty(prop)){
	          if(this.options[prop] == null || this.options[prop].toGoogle == undefined) result[prop] = this.options[prop];
	          else result[prop] = this.options[prop].toGoogle();
	        }
	      }
	      return new google.maps.Polygon(result);
	    },
	    //() -> [:Coordinates]
	    flattenedCoordinates: function(){
	      var flatCoordinates = []
	      for(var i=0; i<this.options.paths.length; i++) {
	        for(var j=0; j<this.options.paths[i].length; j++) {
	          flatCoordinates.push(this.options.paths[i][j]);
	        }
	      }
	      return flatCoordinates
	    },
	    fillMap: function(map){
	      if(window.google != null && window.google.maps != null && window.google.maps.Map != null && map instanceof window.google.maps.Map){
	        var mappedObj = Cache.get(this.uuid);
	        if(mappedObj != null) mappedObj.setMap(null);
	        
	        mappedObj = this.toGoogle();
	        mappedObj.setMap(map);
	        Cache.put(this.uuid, mappedObj);
	      }
	      return this;
	    },
	    promiseUpdate: function(data) {
	      var self = this;
	      $q(function(resolve,reject){
	        var transformed = PolygonTransformer.transform(data)
	        angular.extend(self.options, transformed);

	        var mappedObj = Cache.get(self.uuid);
	        if(mappedObj != null) mappedObj.setOptions(transformed);
	        resolve(self);
	      });
	    }

	  };

	  return Polygon;
	}

	function PolygonTransformer(){
	  /* white listed properties
	    paths:[[:Object]],
	    fillColor:String,
	    fillOpacity:Number,
	    strokeColor:String,
	    strokeWeight:Number,
	    strokeOpacity:Number,
	    strokePosition:Number
	    draggable:Boolean,
	    clickable:Boolean,
	    editable:Boolean,
	    geodesic:Boolean,
	    visible:Boolean,
	    zIndex:Boolean
	  */

	  //(data:JSON) -> :Promise(:JSON)
	  this.transform = function(data){
	    var _paths,
	        _fillColor,
	        _fillOpacity,
	        _strokeColor,
	        _strokeWeight,
	        _strokeOpacity,
	        _strokePosition,
	        _draggable,
	        _clickable,
	        _editable,
	        _geodesic,
	        _visible,
	        _zIndex = null

	    var setStrokePositionToNumber = function(strokePosition, obj){
	      var validatedStrokePosition = null;

	      if(angular.isString(strokePosition)) {
	        if(strokePosition.toLowerCase() == "center") validatedStrokePosition = 0;
	        else if(strokePosition.toLowerCase() == "inside") validatedStrokePosition = -1;
	        else if(strokePosition.toLowerCase() == "outside") validatedStrokePosition = 1;
	      } else if(strokePosition == 0) {
	        validatedStrokePosition = 0
	      } else if(strokePosition == 1) {
	        validatedStrokePosition = 1
	      } else if(strokePosition == -1) {
	        validatedStrokePosition = -1
	      } 

	      if(validatedStrokePosition != null) obj.strokePosition = validatedStrokePosition;
	    }

	    for(var prop in data){ if(data.hasOwnProperty(prop)) {
	      var v = data[prop];
	      if(prop.toLowerCase() == "zindex" && (angular.isNumber(v) || angular.isString(v))) _zIndex = parseInt(v);
	      if(prop.toLowerCase() == "visible") _visible = !!v;
	      if(prop.toLowerCase() == "geodesic") _geodesic = !!v;
	      if(prop.toLowerCase() == "editable") _editable = !!v;
	      if(prop.toLowerCase() == "clickable") _clickable = !!v;
	      if(prop.toLowerCase() == "draggable") _draggable = !!v;
	      if(prop.toLowerCase() == "strokeposition") _strokePosition = setStrokePositionToNumber(v);
	      if(prop.toLowerCase() == "strokeopacity" && (angular.isNumber(v) || angular.isString(v))) _strokeOpacity = parseFloat(v);
	      if(prop.toLowerCase() == "strokeweight" && (angular.isNumber(v) || angular.isString(v))) _strokeWeight = parseFloat(v);
	      if(prop.toLowerCase() == "strokecolor" && angular.isString(v)) _strokeColor = v;
	      if(prop.toLowerCase() == "fillopacity" && (angular.isNumber(v) || angular.isString(v))) _fillOpacity = parseFloat(v);
	      if(prop.toLowerCase() == "fillcolor" && angular.isString(v)) _fillColor = v;
	      if(prop.toLowerCase() == "stroke"){
	        for(var subProp in data[prop]){ if(data.hasOwnProperty(subProp)) {
	          var v = data[prop][subProp];
	          if(prop.toLowerCase() == "position") _strokePosition = setStrokePositionToNumber(v);
	          if(prop.toLowerCase() == "opacity" && (angular.isNumber(v) || angular.isString(v))) _strokeOpacity = parseFloat(v);
	          if(prop.toLowerCase() == "weight" && (angular.isNumber(v) || angular.isString(v))) _strokeWeight = parseFloat(v);
	          if(prop.toLowerCase() == "color" && angular.isString(v)) _strokeColor = v;
	        }}
	      }
	      if(prop.toLowerCase() == "fill"){
	        for(var subProp in data[prop]){ if(data.hasOwnProperty(subProp)) {
	          var v = data[prop][subProp];
	          if(prop.toLowerCase() == "opacity" && (angular.isNumber(v) || angular.isString(v))) _strokeOpacity = parseFloat(v);
	          if(prop.toLowerCase() == "color" && angular.isString(v)) _strokeColor = v;
	        }}
	      }
	      if(prop.toLowerCase() == "path" || prop.toLowerCase() == "paths" || prop.toLowerCase() == "coordinates") {
	        if(angular.isArray(v) && v.length > 0) {
	          if(angular.isObject(v[0]) && !angular.isArray(v[0])) {
	            //assume we are give 1 path
	            var path = [];
	            for(var i=0; i<v.length; i++){
	              if(angular.isObject(v[i])){ path.push(v[i]); }
	            }
	            _paths = [path];
	          } else {
	            var paths = [];
	            for(var i=0; i<v.length; i++){
	              if(angular.isArray(v[i])){
	                var path = [];
	                for(var j=0; j< v[i].length; j++) {
	                  if(angular.isObject(v[i][j])){
	                    path.push(v[i][j]);
	                  }
	                }
	                paths.push(path);
	              }
	            }
	            _paths = paths;
	          }
	          
	        }
	      }

	    }}

	    var validated = {}
	    if(_paths != null) validated.paths = _paths;
	    if(_fillColor != null) validated.fillColor = _fillColor;
	    if(_fillOpacity != null) validated.fillOpacity = _fillOpacity;
	    if(_strokeColor != null) validated.strokeColor = _strokeColor;
	    if(_strokeWeight != null) validated.strokeWeight = _strokeWeight;
	    if(_strokeOpacity != null) validated.strokeOpacity = _strokeOpacity;
	    if(_strokePosition != null) validated.strokePosition = _strokePosition;
	    if(_draggable != null) validated.draggable = _draggable;
	    if(_clickable != null) validated.clickable = _clickable;
	    if(_editable != null) validated.editable = _editable;
	    if(_geodesic != null) validated.geodesic = _geodesic;
	    if(_visible != null) validated.visible = _visible;
	    if(_zIndex != null) validated.zIndex = _zIndex;

	    return validated;
	  }
	}

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	String.prototype.capitalize = function() {
	  return this.charAt(0).toUpperCase() + this.slice(1);
	};

	angular.module('map.models')
	  .factory('MultiPolygon', MultiPolygon)

	MultiPolygon.$inject = ['$q', 'Polygon'];


	function MultiPolygon($q, Polygon){
	  function MultiPolygon(options){
	    for(var prop in options){
	      if(options.hasOwnProperty(prop) && prop != "fill" && prop != "stroke"){
	        this[prop] = options[prop];
	      } else if(prop == "fill" && options[prop] != null){
	        for(var subProp in options[prop]){
	          if(options[prop].hasOwnProperty(subProp)){
	            this[prop + subProp.capitalize()] = options[prop][subProp];
	          }
	        }
	      } else if(prop == "stroke" && options[prop] != null){
	        for(var subProp in options[prop]){
	          if(options[prop].hasOwnProperty(subProp)){
	            this[prop + subProp.capitalize()] = options[prop][subProp];
	          }
	        }
	      }
	    }
	  }

	  //(data:Object) -> :Promise(:MultiPolygon|[:MultiPolygon])
	  MultiPolygon.promiseFrom = function(data) { return $q(function(resolve, reject) {
	    if(data != null && angular.isFunction(data.then)){ resolve(data.then(MultiPolygon.promiseFrom)); }
	    else if (data instanceof MultiPolygon) { resolve(data); }
	    else if (angular.isArray(data)){ resolve($q.all(data.map(MultiPolygon.promiseFrom))); }
	    else if (angular.isObject(data)) {
	      var result = $q.all(data.coordinates.map(function(coordinates){
	        var data = {coordinates: coordinates, type: "Polygon"};
	        return Polygon.promiseFrom(data);
	      })).then(function(polygons){
	        data.polygons = polygons;
	        return new MultiPolygon(data);
	      });
	        resolve(result);
	    }
	    else { reject("data can't be parsed correctly"); }
	  })};

	  MultiPolygon.prototype = {
	    toGoogle: function(){
	      var result = {};
	      for(var prop in this){
	        if(this.hasOwnProperty(prop)){
	          if(this[prop] == null || this[prop].toGoogle == undefined) result[prop] = this[prop];
	          else result[prop] = this[prop].toGoogle();
	        }
	      }
	      return new google.maps.Polygon(result);
	    },
	    //() -> [:Coordinates]
	    flattenedCoordinates: function(){
	      var _flattenCoords = function(coords) {
	        var flattnedCoords = [];
	        if(angular.isArray(coords)) {
	          for(var i=0; i<coords.length; i++){
	            for(var j=0; j<coords[i].length; j++){
	              for(var j=0; j<coords[i].length; j++){
	                flattnedCoords.push(coords[i][j]);
	              }
	            }
	          }
	        }
	        return flattnedCoords;
	      }
	      return _flattenCoords(this.paths);
	    },
	    fillMap: function(map){
	      if(window.google != null && window.google.maps != null && window.google.maps.Map != null && map instanceof window.google.maps.Map){
	        if(this.mappedObj != null) this.mappedObj.setMap(null);
	        this.mappedObj = this.toGoogle();
	        this.mappedObj.setMap(map);
	      }
	      return this;
	    }

	  };

	  return MultiPolygon;
	}

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	angular.module('map.models').factory('Feature', Feature);
	Feature.$inject = ['$q', 'Coordinate', 'Polygon', 'MultiPolygon', 'Marker', 'UUID'];

	function Feature($q, Coordinate, Polygon, MultiPolygon, Marker, UUID){
	  function Feature(geometry, properties){
	    this.geometry = geometry;
	    this.properties = properties;
	  }

	  //(data:Object) -> :Promise(:Feature|[:Feature])
	  Feature.promiseFrom = function(data) { return $q(function(resolve, reject){
	    if(data != null && angular.isFunction(data.then)){ resolve(data.then(Feature.promiseFrom)); }
	    else if(data instanceof Feature){ resolve(data); }
	    else if(angular.isArray(data)) { resolve($q.all(data.map(Feature.promiseFrom))); }
	    else if(angular.isObject(data) && data.type == "Feature" && angular.isObject(data.geometry) && angular.isObject(data.properties)){
	      if(data.geometry.type == "Polygon"){
	        var feature = Polygon.promiseFrom(data.geometry).then(function(polygon){
	          return new Feature(polygon, data.properties)
	        });
	        resolve(feature);
	      } else if(data.geometry.type == "MultiPolygon"){
	        var feature = MultiPolygon.promiseFrom(data.geometry).then(function(multiPolygon){ return new Feature(multiPolygon, data.properties)});
	        resolve(feature);
	      } else {
	        reject("data can't be parsed correctly");
	      }
	    } else {
	      reject("data can't be parsed correctly");
	    }
	  })};

	  Feature.prototype = {
	    toGoogle: function(){ return this.geometry.toGoogle(); },
	    flattenedCoordinates: function(){ return this.geometry.flattenedCoordinates(); },
	    fillMap: function(map){
	      this.geometry.fillMap(map);
	      return this;
	    }
	  };

	  return Feature;
	}

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	angular.module('map.models').factory('MapOptions', MapOptions)

	MapOptions.$inject = ['Coordinate', '$q'];

	function MapOptions(Coordinate, $q){
	  function MapOptions(zoom, center, styles, rest){
	    this.zoom = zoom;
	    this.center = center;
	    this.styles = styles;

	    for(var prop in rest){
	      if(rest.hasOwnProperty(prop) && prop != 'zoom' && prop != 'center' && prop != 'styles'){
	        this[prop] = rest[prop];
	      }
	    }
	  }

	  //(data:Object) -> :Promise(:MapOptions|[:MapOptions])
	  MapOptions.promiseFrom = function(data) { return $q(function(resolve, reject) {
	    if(data != null && angular.isFunction(data.then)){ resolve(data.then(MapOptions.promiseFrom)); }
	    else if(data instanceof MapOptions) { resolve(data); }
	    else if(window.google != null && window.google.maps != null && window.google.maps.MapOptions != null && data instanceof window.google.maps.MapOptions) { reject("data can't be parsed correctly is of type google.maps.MapOptions"); }
	    else if(angular.isArray(data)) { resolve($q.all(data.map(MapOptions.promiseFrom))); }
	    else if(angular.isObject(data)) {
	      resolve(Coordinate.promiseFrom(data.center).then(function(coordinate){
	        if(data != null && (angular.isNumber(data.zoom) || angular.isString(data.zoom))){
	          return $q.when(new MapOptions(data.zoom, coordinate, data.styles, data.options));
	        } else {
	          return $q.reject("data can't be parsed correctly");
	        }
	      }));
	    }
	    else { reject("data can't be parsed correctly"); }
	  })};

	  MapOptions.prototype = {
	    toGoogle: function(){
	      var result = {}
	      for(var prop in this){
	        if(this.hasOwnProperty(prop) && prop != "center"){
	          if(this[prop] == null || this[prop].toGoogle == undefined) result[prop] = this[prop];
	          else result[prop] = this[prop].toGoogle();
	        }
	      }
	      return result;
	    },
	    //(map:google.maps.Map)
	    fillMap: function(map){
	      map.setOptions(this.toGoogle());

	      if(map.getCenter != null && map.getCenter() != null && !map.getCenter().equals(this.center.toGoogle())){
	        map.panTo(this.center.toGoogle());
	      } else if( map.getCenter != null ||  map.getCenter() != null ){
	        map.setCenter(this.center.toGoogle());
	      }
	    }

	  };

	  return MapOptions;
	}

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	angular.module('map.models').factory('Bounds', Bounds)

	Bounds.$inject = ['Coordinate', '$q'];

	function Bounds(Coordinate, $q){
	  function Bounds(northeast, southwest, center){
	    this.northeast = northeast;
	    this.southwest = southwest;
	    this.center = center;
	  }

	  //(data:Object) -> :Promise(:Bounds|[:Bounds])
	  Bounds.promiseFrom = function(data) { return $q(function(resolve, reject) {
	    if(data != null && angular.isFunction(data.then)){ resolve(data.then(Bounds.promiseFrom)); }
	    else if(data instanceof Bounds){ resolve(data); }
	    else if(window.google != null && window.google.maps != null && window.google.maps.LatLngBounds != null && data instanceof window.google.maps.LatLngBounds) {
	      resolve($q.all([Coordinate.promiseFrom(data.getNorthEast()), Coordinate.promiseFrom(data.getSouthWest()), Coordinate.promiseFrom(data.getCenter())]).then(function(coordinates){
	        return new Bounds(coordinates[0], coordinates[1], coordinates[2]);
	      }));
	    }
	    else if(angular.isArray(data)) { resolve($q.all(data.map(Bounds.promiseFrom))); }
	    else if(angular.isObject(data) && angular.isObject(data.northeast) && angular.isObject(data.southwest) && angular.isObject(data.center)){
	      resolve($q.all([Coordinate.promiseFrom(data.northeast), Coordinate.promiseFrom(data.southwest), Coordinate.promiseFrom(data.center)]).then(function(coordinates){
	        return new Bounds(coordinates[0], coordinates[1], coordinates[2]);
	      }));
	    } else { reject("data can't be parsed correctly"); }
	  })};

	  Bounds.prototype = {
	    toGoogle: function(){
	      if(window.google != null && window.google.maps != null && window.google.maps.LatLng != null){
	        return new google.maps.LatLngBounds(this.southwest.toGoogle(), this.northeast.toGoogle());
	      }
	      return null;
	    },
	    toJson: function(){
	      return {center: this.center.toJson(), southwest: this.southwest.toJson(), northeast: this.northeast.toJson()};
	    }
	  };

	  return Bounds;
	}

/***/ },
/* 8 */,
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	angular.module('map.services').service('MapHelper', MapHelper);
	MapHelper.$inject = ['GoogleMap', 'Coordinate', 'Feature', 'Bounds', '$q'];

	function MapHelper(GoogleMap, Coordinate, Feature, Bounds, $q){
	  var self = this;
	  //[:{lat,lng}] => {lat, lng}
	  this.getCenter = function(coordinates){
	    return GoogleMap.map().then(function(){
	      var bounds = new google.maps.LatLngBounds();

	      return Coordinate.promiseFrom(coordinates).then(function(coordinates){
	        angular.forEach(coordinates, function(coord){
	          bounds.extend(coord.toGoogle());
	        });

	        if(!bounds.isEmpty()) return Coordinate.promiseFrom(bounds.getCenter()).then(function(coord){return coord.toJson()});
	        else return $q.reject("no available center")
	      });


	    });
	  }

	  this.offsetCenter = function(coordinate, offsetX, offsetY) {
	    return GoogleMap.map().then(function(map){
	      var deferred = $q.defer();
	      var ov = new google.maps.OverlayView();
	      ov.onAdd = function() {
	        var proj = this.getProjection();

	        var toResolve = Coordinate.promiseFrom(coordinate).then(function(coordinate){
	          var point = proj.fromLatLngToContainerPixel(coordinate.toGoogle());
	          point.x = point.x + offsetX;
	          point.y = point.y + offsetY;
	          return proj.fromContainerPixelToLatLng(point);
	        }).then(Coordinate.promiseFrom);

	        deferred.resolve(toResolve);
	      };
	      ov.draw = function() {};
	      ov.setMap(map);
	      return deferred.promise;
	    });
	  }

	  //THIS IS TIGHTLY bounds to Feature, need to unbind it
	  this.boundingBox = function(objects) { return $q(function(resolve, reject){
	    resolve($q.all(objects).then(Feature.promiseFrom).then(function(objects){
	      var flattenedCoordinates = [];
	      for(var i=0; i<objects.length; i++){
	        var objectCoordinates = objects[i].flattenedCoordinates();
	        flattenedCoordinates = flattenedCoordinates.concat(objectCoordinates);
	      }
	      var bounds = new google.maps.LatLngBounds();
	      return Coordinate.promiseFrom(flattenedCoordinates).then(function(coordinates){
	        angular.forEach(coordinates, function(coord){
	          bounds.extend(coord.toGoogle());
	        });

	        if(!bounds.isEmpty()) return Bounds.promiseFrom(bounds).then(function(bounds){return bounds.toJson()});
	        else return $q.reject("no available center")
	      });
	    }));
	  })}

	  this.fitBounds = function(objects) {return GoogleMap.map().then(function(map){
	    return $q(function(resolve, reject){
	      if(objects instanceof Bounds) { resolve(Bounds.promiseFrom(objects)) }
	      else { resolve(Bounds.promiseFrom(self.boundingBox(objects))); }
	    }).then(function(bounds){
	      map.fitBounds(bounds.toGoogle());
	      return bounds;
	    });
	    
	  })}
	}

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	angular.module('map.services').service('LazyLoadGoogleMap', LazyLoadGoogleMap);
	LazyLoadGoogleMap.$inject = ['$window', '$q', '$timeout'];


	function LazyLoadGoogleMap($window, $q, $timeout){
	  this.load = function(key) {
	    function loadScript(){
	      var script = document.createElement('script');
	      script.type = 'text/javascript';
	      script.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp&callback=initGoogleMap';
	      if(key != null) script.src += "&key=" + key;
	      document.body.appendChild(script);
	    }

	    var deferred = $q.defer();
	    if($window.google && $window.google.maps){
	      $timeout(function(){deferred.resolve();});
	    } else {
	      $window.initGoogleMap = function(){ deferred.resolve() }

	      if (document.readyState === "complete") { loadScript() }
	      else if ($window.attachEvent) { $window.attachEvent('onload', loadScript); }
	      else { $window.addEventListener('load', loadScript, false); }
	    }

	    return deferred.promise;
	  }
	}

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	angular.module('map.services').service('GoogleMap', GoogleMap);
	GoogleMap.$inject = ['$q', 'LazyLoadGoogleMap', 'MapOptions'];

	function GoogleMap($q, LazyLoadGoogleMap, MapOptions){
	  var mapPromise = null;
	  var deferred = $q.defer();

	  //(key:String, id:String, options:MapOptions) -> :Promise(:google.maps.Map)
	  this.map = function(key, id, options) {
	    if(mapPromise != null) return mapPromise;
	    else if(key == null && id == null && options == null){
	      return deferred.promise;
	    } else{
	      mapPromise = LazyLoadGoogleMap.load(key).then(function(){
	        return new google.maps.Map(document.getElementById(id), options.toGoogle());
	      });
	      deferred.resolve(mapPromise);
	      return mapPromise;
	    }
	  };
	  this.$destroy = function(){
	    mapPromise = null;
	    deferred.reject("destroying map");
	  }
	}

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	angular.module('map.directives')
	  .directive('map', mapDirective)
	  .controller('MapController', MapController)

	mapDirective.$inject = ['GoogleMap', 'Coordinate', 'MapOptions', '$timeout'];
	MapController.$inject = ['$scope', '$q', 'GoogleMap', 'Marker', 'Polygon', 'Feature', 'UUID'];

	function mapDirective(GoogleMap, Coordinate, MapOptions, $timeout){
	  var GOOGLE_MAP_ID = "mapId";

	  return {
	    restrict: 'AE',
	    template: "<div class='map' style='height:100%'>" +
	        "<div style='height:100%' id='"+GOOGLE_MAP_ID+"'></div>" +
	        "<div ng-transclude style='display: none'></div>"+
	      "</div>",
	    scope: {
	      key:'@',
	      center:'=',
	      zoom:'=?',
	      styles:'=',
	      options:'=?'
	    },
	    transclude:true,
	    controller: MapController,
	    link: function($scope, element, attrs, controller){
	      if($scope.zoom == null) $scope.zoom = 3;
	      if($scope.center == null) $scope.center = {lat:0, lng: 0};

	      MapOptions.promiseFrom({center: $scope.center, zoom: $scope.zoom, styles:$scope.styles, options:$scope.options}).then(function(options){
	        GoogleMap.map($scope.key, GOOGLE_MAP_ID, options).then(function(map){
	          google.maps.event.addListener(map, 'bounds_changed', function(){

	            $timeout.cancel($scope.centerChangedPromise);
	            $scope.centerChangedPromise = $timeout(function(){
	              Coordinate.promiseFrom(map.getCenter()).then(function(coordinate){$scope.center = coordinate.toJson(); });
	              $scope.zoom = map.getZoom();
	            }, 100);
	          });
	        });
	      });

	      $scope.$watchGroup(["center", "zoom", "styles", "options"], function(nv,ov){ GoogleMap.map().then(function(map){
	        var data = {center:nv[0], zoom:nv[1], styles:nv[2], options:nv[3]};
	        MapOptions.promiseFrom(data).then(function(options){ options.fillMap(map); });
	      })});

	      $scope.$on("$destroy", function(){ GoogleMap.$destroy(); });

	    }
	  }
	}

	function MapController($scope, $q, GoogleMap, Marker, Polygon, Feature, UUID){
	  //(polygon:Object) -> Promise(:google.maps.Polygon)
	  this.addPolygon = function(polygon){
	    return Polygon.promiseFrom(polygon).then(function(polygon){
	      return GoogleMap.map().then(function(map){
	        return polygon.fillMap(map);
	      });
	    });
	  };
	  //(marker:Object) -> Promise(:google.maps.Marker)
	  this.addMarker = function(marker){
	    return GoogleMap.map().then(function(map){
	      return Marker.promiseFrom(marker).then(function(marker){
	        return marker.fillMap(map);
	      });
	    });
	  };
	  //(feature:Object) -> Promise()
	  this.addFeature = function(feature){
	    return GoogleMap.map().then(function(map){
	      return Feature.promiseFrom(feature).then(function(feature){
	        return feature.fillMap(map);
	      });
	    });
	  };
	}

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	angular.module('map.directives').directive('shapeOptions', shapeOptions)


	function shapeOptions(Coordinate){
	  return {
	    restrict: 'AE',
	    require: '^feature',
	    scope: {
	      type:'@',
	      model:'='
	    },
	    link: function($scope, element, attr, featureController){
	      $scope.$watchGroup(["model", "type"], function(nv){
	        var newModel = nv[0];
	        var newType = nv[1];
	        featureController.setOptions(newType, newModel)
	      });

	    }
	  }
	}


/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	angular.module('map.directives').directive('path', path)
	path.$inject = ['Coordinate'];

	function path(Coordinate){
	  return {
	    restrict: 'AE',
	    require: '^polygon',
	    scope: {
	      options:'=?',
	      model:'='
	    },
	    link: function($scope, element, attr, polygonController){
	      $scope.$watch("model", function(newValue){
	        polygonController.setPath(newValue)
	      });

	    }
	  }
	}

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	angular.module('map.directives').directive('marker', markerDirective)
	markerDirective.$inject = ['Marker', '$q'];

	function markerDirective(Marker, $q){
	  return {
	    restrict: 'AE',
	    require: '^map',
	    scope: {
	      options:'=?',
	      position:'=?'
	    },
	    link: function($scope, element, attr, mapController){
	      $scope.$watchGroup(["position", "options"], function(nv){
	        var data = {position:nv[0], options:nv[1]};

	        if($scope.markerPromise == null) $scope.markerPromise = mapController.addMarker(data);
	        else {
	          $scope.markerPromise.then(function(polygon){
	            polygon.setMap(null);
	            $scope.markerPromise = mapController.addMarker(data);
	          }, function(){
	            $scope.markerPromise = mapController.addMarker(data);
	          });
	        }

	      });

	    }
	  }
	}

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	angular.module('map.directives')
	  .directive('polygon', polygon)
	  .controller('PolygonController', PolygonController);

	PolygonController.$inject = ['$scope', '$q', 'Coordinate', 'UUID'];
	polygon.$inject = ['Polygon', '$q'];



	function PolygonController($scope, $q, Coordinate, UUID){
	  this.setPath = function(coordinates){ return Coordinate.promiseFrom(coordinates).then(function(coordinates){
	    return $scope.polygonPromise.then(function(polygon){
	      polygon.setPaths(coordinates.map(function(c){return c.toGoogle()}));
	    });
	  })};
	}

	function polygon(Polygon, $q){
	  return {
	    restrict: 'AE',
	    require: '^map',
	    scope: {
	      options:'=?'
	    },
	    controller: PolygonController,
	    link: function($scope, element, attr, mapController){
	      $scope.$watch("options", function(newValue){
	        if($scope.polygonPromise == null) $scope.polygonPromise = mapController.addPolygon(newValue);
	        else {
	          $scope.polygonPromise.then(function(polygon){
	            polygon.setMap(null);
	            $scope.polygonPromise = mapController.addPolygon(newValue);
	          }, function(error){
	            $scope.polygonPromise = mapController.addPolygon(newValue);
	          });
	        }
	      })

	    }
	  }
	}

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	angular.module('map.directives')
	  .directive('feature', feature)
	  .controller('FeatureController', FeatureController)

	FeatureController.$inject = ['$scope', '$q', 'Feature', 'Polygon', 'Marker', 'UUID'];
	feature.$inject = ['$timeout'];

	function FeatureController($scope, $q, Feature, Polygon, Marker, UUID){
	  this.setOptions = function(type, options){
	    $scope.featurePromise.then(function(feature){
	      if(angular.isString(type) && type.toLowerCase() == "polygon" && feature.geometry instanceof Polygon) {
	        feature.geometry.promiseUpdate(options);
	      }
	      
	    });
	  }
	}

	function feature($timeout){
	  return {
	    restrict: 'AE',
	    require: '^map',
	    scope: {
	      model:'='
	    },
	    controller: FeatureController,
	    link: function($scope, element, attr, mapController){
	      $scope.$watch("model", function(nv){
	        if($scope.featurePromise == null) $scope.featurePromise = mapController.addFeature(nv);
	        else {
	          $scope.featurePromise.then(function(feature){
	            $scope.featurePromise = mapController.addFeature(nv);
	          }, function(error){
	            $scope.featurePromise = mapController.addFeature(nv);
	          });
	        }
	      });
	    }
	  }
	}

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	angular.module('map.common').service('UUID', UUID);
	UUID.$inject = [];



	function UUID(){
	  var self = this;
	  //() -> :String
	  this.make = function(){
	    var d = new Date().getTime();
	    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	        var r = (d + Math.random()*16)%16 | 0;
	        d = Math.floor(d/16);
	        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
	    });
	    return uuid;
	  }
	}

/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	angular.module('map.common').service('Cache', Cache);
	Cache.$inject = [];

	function Cache(){
	  var cache = {}

	  var self = this;
	  this.put = function(id, object) {
	    cache[id] = object;
	  }

	  this.get = function(id){
	    return cache[id];
	  }
	}

/***/ }
/******/ ]);