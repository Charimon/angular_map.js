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