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