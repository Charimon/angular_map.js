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
	__webpack_require__(1);
	__webpack_require__(2);

	angular.module('map', ['map.models', 'map.services'])
	  .directive('map', mapDirective)
	  .directive('marker', markerDirective)
	  .directive('polygon', polygonDirective)
	  .directive('path', pathDirective)
	  .directive('feature', featureDirective)
	  .directive('mapOptions', mapOptionsDirective)
	  .controller('MapController', MapController)
	  .controller('PolygonController', PolygonController)
	  .controller('FeatureController', FeatureController);

	MapController.$inject = ['$scope', '$q', 'GoogleMap', 'Marker', 'Polygon', 'Feature', 'UUID'];
	PolygonController.$inject = ['$scope', '$q', 'Coordinate', 'UUID'];
	FeatureController.$inject = ['$scope', '$q', 'Feature', 'Polygon', 'Marker', 'UUID'];
	mapDirective.$inject = ['GoogleMap', 'Coordinate', 'MapOptions', '$timeout'];
	polygonDirective.$inject = ['Polygon', '$q'];
	markerDirective.$inject = ['Marker', '$q'];
	pathDirective.$inject = ['Coordinate'];
	featureDirective.$inject = ['$timeout'];

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
	function PolygonController($scope, $q, Coordinate, UUID){
	  this.setPath = function(coordinates){ return Coordinate.promiseFrom(coordinates).then(function(coordinates){
	    return $scope.polygonPromise.then(function(polygon){
	      polygon.setPaths(coordinates.map(function(c){return c.toGoogle()}));
	    });
	  })};
	}
	function FeatureController($scope, $q, Feature, Polygon, Marker, UUID){
	  this.setOptions = function(type, options){
	    $scope.featurePromise.then(function(feature){
	      if(angular.isString(type) && type.toLowerCase() == "polygon" && feature.geometry instanceof Polygon) {
	        var geo = feature.geometry.promiseFrom(options);
	        feature.geometry.mappedObj.setOptions(options);
	      }
	      
	    });
	  }

	}
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
	function polygonDirective(Polygon, $q){
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
	function pathDirective(Coordinate){
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
	function featureDirective($timeout){
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

	function mapOptionsDirective(Coordinate){
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
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	angular.module('map.models', [])

	__webpack_require__(6);
	__webpack_require__(3);
	__webpack_require__(4);
	__webpack_require__(5);
	__webpack_require__(9);


	__webpack_require__(7);
	__webpack_require__(8);

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	(function(){
	  'use strict';

	  String.prototype.capitalize = function() {
	    return this.charAt(0).toUpperCase() + this.slice(1);
	  };

	  angular.module('map.services', [])
	    .service('LazyLoadGoogleMap', LazyLoadGoogleMap)
	    .service('GoogleMap', GoogleMap)
	    .service('MapHelper', MapHelper)
	    .service('UUID', UUID);

	  LazyLoadGoogleMap.$inject = ['$window', '$q', '$timeout'];
	  GoogleMap.$inject = ['$q', 'LazyLoadGoogleMap', 'MapOptions'];
	  MapHelper.$inject = ['GoogleMap', 'Coordinate', 'Feature', 'Bounds', '$q'];
	  UUID.$inject = [];


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

	  //() -> :String
	  function UUID(){
	    var self = this;
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
	})();


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	angular.module('map.models').factory('Marker', MarkerModel);

	MarkerModel.$inject = ['Coordinate', '$q'];

	function MarkerModel(Coordinate, $q){
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
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	  'use strict';

	  String.prototype.capitalize = function() {
	    return this.charAt(0).toUpperCase() + this.slice(1);
	  };

	  angular.module('map.models').factory('Polygon', Polygon)

	  Polygon.$inject = ['$q', 'Coordinate'];

	  function Polygon($q, Coordinate){
	    function Polygon(paths, options){
	      this.paths = paths;

	      for(var prop in options){
	        if(options.hasOwnProperty(prop) && prop != "fill" && prop != "stroke" && prop != "paths" & prop != "path"){
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

	    //(data:Object) -> :Promise(:Polygon|[:Polygon])
	    Polygon.promiseFrom = function(data) { return $q(function(resolve, reject) {
	      if(data != null && angular.isFunction(data.then)){ resolve(data.then(Polygon.promiseFrom)); }
	      else if (data instanceof Polygon) { resolve(data); }
	      else if (window.google != null && window.google.maps != null && window.google.maps.Polygon != null && data instanceof window.google.maps.Polygon) { reject("data can't be parsed correctly of type google.maps.Polygon"); }
	      else if (angular.isArray(data)) { resolve($q.all(data.map(Polygon.promiseFrom))); }
	      else if (angular.isObject(data) && angular.isArray(data.coordinates) && data.type == "Polygon") {
	        resolve(Coordinate.promiseFrom(data.coordinates).then(function(paths){
	          return new Polygon(paths);
	        }));
	      }
	      else if (angular.isObject(data)) {
	        var paths = []
	        if(angular.isArray(data.path)) paths = [data.paths];
	        if(angular.isArray(data.paths)) paths = data.paths;
	        resolve(Coordinate.promiseFrom(paths).then(function(paths){return new Polygon(paths, data)}));
	      }
	      else { reject("data can't be parsed correctly"); }
	    })};

	    Polygon.prototype = {
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
	                  flattnedCoords.push(coords[i][j]);
	              }
	            }
	          }
	          return flattnedCoords;
	        }
	        return _flattenCoords(this.paths);
	      },
	      //(data:Object) -> :Promise(:Polygon)
	      promiseFrom: function(data){
	        var self = this;
	        return Polygon.promiseFrom(data).then(function(polygon){
	          // self.mappedObj.setMap(null)

	          // self = polygon.fillMap();
	        })
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

	    return Polygon;
	  }

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	String.prototype.capitalize = function() {
	  return this.charAt(0).toUpperCase() + this.slice(1);
	};

	angular.module('map.models').factory('MultiPolygon', MultiPolygon)
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
/* 6 */
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
	    else if(angular.isArray(data) && data.length == 2 && angular.isNumber(data[0]) && angular.isNumber(data[1])) { resolve(new Coordinate(data[1], data[0])); }
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
/* 7 */
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
/* 8 */
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
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	angular.module('map.models').factory('Feature', FeatureModel);
	FeatureModel.$inject = ['$q', 'Coordinate', 'Polygon', 'MultiPolygon', 'Marker'];

	function FeatureModel($q, Coordinate, Polygon, MultiPolygon, Marker){
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

/***/ }
/******/ ]);