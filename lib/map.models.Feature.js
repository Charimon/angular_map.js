'use strict';

angular.module('map.models').factory('Feature', Feature);
Feature.$inject = ['$q', 'Coordinate', 'Polygon', 'MultiPolygon', 'Marker'];

function Feature($q, Coordinate, Polygon, MultiPolygon, Marker){
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