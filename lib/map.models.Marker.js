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
