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
	  .controller('MapController', MapController)
	  .controller('PolygonController', PolygonController);

	MapController.$inject = ['$scope', '$q', 'GoogleMap', 'Marker', 'Polygon', 'Feature'];
	PolygonController.$inject = ['$scope', '$q', 'Coordinate'];
	mapDirective.$inject = ['GoogleMap', 'Coordinate', 'MapOptions', '$timeout'];
	polygonDirective.$inject = ['Polygon', '$q'];
	markerDirective.$inject = ['Marker', '$q'];
	pathDirective.$inject = ['Coordinate'];
	featureDirective.$inject = ['$timeout'];

	function MapController($scope, $q, GoogleMap, Marker, Polygon, Feature){
	  //(polygon:Object) -> Promise(:google.maps.Polygon)
	  this.addPolygon = function(polygon){
	    return Polygon.promiseFrom(polygon).then(function(polygon){
	      return GoogleMap.map().then(function(map){
	        var mapPolygon = polygon.toGoogle();
	        mapPolygon.setMap(map);
	        return mapPolygon;
	      });
	    });
	  };
	  //(marker:Object) -> Promise(:google.maps.Marker)
	  this.addMarker = function(marker){
	    return GoogleMap.map().then(function(map){
	      return Marker.promiseFrom(marker).then(function(marker){
	        var mapMarker = marker.toGoogle();
	        mapMarker.setMap(map);
	        return mapMarker;
	      });
	    });
	  };
	  //(feature:Object) -> Promise()
	  this.addFeature = function(feature){
	    return GoogleMap.map().then(function(map){
	      return Feature.promiseFrom(feature).then(function(feature){
	        var mapFeature = feature.toGoogle();
	        mapFeature.setMap(map);
	        return mapFeature;
	      });
	    });
	  };
	}
	function PolygonController($scope, $q, Coordinate){
	  this.setPath = function(coordinates){ return Coordinate.promiseFrom(coordinates).then(function(coordinates){
	    return $scope.polygonPromise.then(function(polygon){
	      polygon.setPaths(coordinates.map(function(c){return c.toGoogle()}));
	    });
	  })};
	}
	function mapDirective(GoogleMap, Coordinate, MapOptions, $timeout){
	  var GOOGLE_MAP_ID = "mapId";

	  return {
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
	    require: ['^polygon', 'ngModel'],
	    scope: {
	      options:'=?',
	      model:'=ngModel'
	    },
	    link: function($scope, element, attr, requires){
	      var polygonController = requires[0];
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
	      model:'=model'
	    },
	    link: function($scope, element, attr, mapController){
	      $scope.$watch("model", function(nv){
	        mapController.addFeature(nv);


	//        if($scope.featurePromise == null) $scope.featurePromise = mapController.addMarker(data);
	//        else {
	//          $scope.featurePromise.then(function(polygon){
	//            polygon.setMap(null);
	//            $scope.markerPromise = mapController.addMarker(data);
	//          }, function(){
	//            $scope.markerPromise = mapController.addMarker(data);
	//          });
	//        }

	      });
	    }
	  }
	}


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	(function(){
	  'use strict';

	  String.prototype.capitalize = function() {
	    return this.charAt(0).toUpperCase() + this.slice(1);
	  };

	  angular.module('map.models', [])
	    .factory('Coordinate', CoordinateModel)
	    .factory('MapOptions', MapOptionsModel)
	    .factory('Polygon', PolygonModel)
	    .factory('MultiPolygon', MultiPolygonModel)
	    .factory('Marker', MarkerModel)
	    .factory('Feature', FeatureModel);

	  MapOptionsModel.$inject = ['Coordinate', '$q'];
	  CoordinateModel.$inject = ['$q'];
	  MarkerModel.$inject = ['Coordinate', '$q'];
	  PolygonModel.$inject = ['$q', 'Coordinate'];
	  MultiPolygonModel.$inject = ['$q', 'Polygon'];
	  FeatureModel.$inject = ['$q', 'Coordinate', 'Polygon', 'MultiPolygon', 'Marker'];

	  function MapOptionsModel(Coordinate, $q){
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
	      if(data != null && angular.isFunction(data.then)){ resolve(data); }
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
	  function CoordinateModel($q){
	    function Coordinate(lat, lng){
	      this.lat = lat;
	      this.lng = lng;
	    }

	    //(data:Object) -> :Promise(:Coordinate|[:Coordinate])
	    Coordinate.promiseFrom = function(data) { return $q(function(resolve, reject) {
	      if(data != null && angular.isFunction(data.then)){ resolve(data); }
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
	  function PolygonModel($q, Coordinate){
	    function Polygon(options){
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

	    //(data:Object) -> :Promise(:Polygon|[:Polygon])
	    Polygon.promiseFrom = function(data) { return $q(function(resolve, reject) {
	      if(data != null && angular.isFunction(data.then)){ resolve(data); }
	      else if (data instanceof Polygon) { resolve(data); }
	      else if (window.google != null && window.google.maps != null && window.google.maps.Polygon != null && data instanceof window.google.maps.Polygon) { reject("data can't be parsed correctly of type google.maps.Polygon"); }
	      else if (angular.isArray(data)) { resolve($q.all(data.map(Polygon.promiseFrom))); }
	      else if (angular.isObject(data) && angular.isArray(data.coordinates) && data.type == "Polygon") { resolve(Coordinate.promiseFrom(data.coordinates).then(function(paths){ return new Polygon({paths: paths}); })); }
	      else if (angular.isObject(data)) { resolve(new Polygon(data)); }
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
	      }
	    };

	    return Polygon;
	  }
	  function MultiPolygonModel($q, Polygon){
	    function MultiPolygonModel(options){
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

	    //(data:Object) -> :Promise(:MultiPolygonModel|[:MultiPolygonModel])
	    MultiPolygonModel.promiseFrom = function(data) { return $q(function(resolve, reject) {
	      if(data != null && angular.isFunction(data.then)){ resolve(data); }
	      else if (data instanceof MultiPolygonModel) { resolve(data); }
	      else if (angular.isArray(data)){ resolve($q.all(data.map(MultiPolygonModel.promiseFrom))); }
	      else if (angular.isObject(data)) {
	        var result = $q.all(data.coordinates.map(function(coordinates){
	          var data = {coordinates: coordinates, type: "Polygon"};
	          return Polygon.promiseFrom(data);
	        })).then(function(polygons){
	          data.polygons = polygons;
	          return new MultiPolygonModel(data);
	        });
	          resolve(result);
	      }
	      else { reject("data can't be parsed correctly"); }
	    })};

	    MultiPolygonModel.prototype = {
	      toGoogle: function(){
	        var result = {};
	        for(var prop in this){
	          if(this.hasOwnProperty(prop)){
	            if(this[prop] == null || this[prop].toGoogle == undefined) result[prop] = this[prop];
	            else result[prop] = this[prop].toGoogle();
	          }
	        }
	        return new google.maps.Polygon(result);
	      }
	    };

	    return MultiPolygonModel;
	  }
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
	      if(data != null && angular.isFunction(data.then)){ resolve(data); }
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
	      }
	    };

	    return Marker;

	  }
	  function FeatureModel($q, Coordinate, Polygon, MultiPolygon, Marker){
	    function Feature(geometry, properties){
	      this.geometry = geometry;
	      this.properties = properties;
	    }

	    //(data:Object) -> :Promise(:Feature|[:Feature])
	    Feature.promiseFrom = function(data) { return $q(function(resolve, reject){
	      if(data != null && angular.isFunction(data.then)){ resolve(data); }
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
	      toGoogle: function(){
	        return this.geometry.toGoogle();
	      }
	    };

	    return Feature;

	  }
	})();


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
	    .service('MapHelper', MapHelper);

	  LazyLoadGoogleMap.$inject = ['$window', '$q', '$timeout'];
	  GoogleMap.$inject = ['$q', 'LazyLoadGoogleMap', 'MapOptions'];
	  MapHelper.$inject = ['GoogleMap', 'Coordinate', '$q'];


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

	  function MapHelper(GoogleMap, Coordinate, $q){
	    //[:{lat,lng}] => {lat, lng}
	    this.getCenter = function(coordinates){
	      return GoogleMap.map().then(function(){
	        var bounds = new google.maps.LatLngBounds();

	        return Coordinate.promiseFrom(coordinates).then(function(coordinates){
	          angular.forEach(coordinates, function(coord){
	            bounds.extend(coord.toGoogle());
	          });

	          if(!bounds.isEmpty()) return Coordinate.promiseFrom(bounds.getCenter());
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
	  }
	})();


/***/ }
/******/ ]);