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