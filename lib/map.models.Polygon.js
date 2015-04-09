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