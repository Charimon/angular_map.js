(function(){
  'use strict';

  String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
  };

  angular.module('map.models', [])
    .factory('Coordinate', Coordinate)
    .factory('MapOptions', MapOptions)
    .factory('Bounds', Bounds)
    .factory('Polygon', PolygonModel)
    .factory('MultiPolygon', MultiPolygon)
    .factory('Marker', MarkerModel)
    .factory('Feature', FeatureModel);

  MapOptions.$inject = ['Coordinate', '$q'];
  Bounds.$inject = ['Coordinate', '$q'];
  Coordinate.$inject = ['$q'];
  MarkerModel.$inject = ['Coordinate', '$q'];
  PolygonModel.$inject = ['$q', 'Coordinate'];
  MultiPolygon.$inject = ['$q', 'Polygon'];
  FeatureModel.$inject = ['$q', 'Coordinate', 'Polygon', 'MultiPolygon', 'Marker'];

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

  function PolygonModel($q, Coordinate){
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
      }

    };

    return Polygon;
  }
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
      }
    };

    return MultiPolygon;
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
      toGoogle: function(){
        return this.geometry.toGoogle();
      },
      flattenedCoordinates: function(){
        return this.geometry.flattenedCoordinates();
      }
    };

    return Feature;

  }
})();
