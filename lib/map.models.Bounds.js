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