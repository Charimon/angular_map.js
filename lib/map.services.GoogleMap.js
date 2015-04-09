'use strict';

angular.module('map.services').service('GoogleMap', GoogleMap);
GoogleMap.$inject = ['$q', 'LazyLoadGoogleMap', 'MapOptions'];

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