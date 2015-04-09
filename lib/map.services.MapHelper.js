'use strict'

angular.module('map.services').service('MapHelper', MapHelper);
MapHelper.$inject = ['GoogleMap', 'Coordinate', 'Feature', 'Bounds', '$q'];

function MapHelper(GoogleMap, Coordinate, Feature, Bounds, $q){
  var self = this;
  //[:{lat,lng}] => {lat, lng}
  this.getCenter = function(coordinates){
    return GoogleMap.map().then(function(){
      var bounds = new google.maps.LatLngBounds();

      return Coordinate.promiseFrom(coordinates).then(function(coordinates){
        angular.forEach(coordinates, function(coord){
          bounds.extend(coord.toGoogle());
        });

        if(!bounds.isEmpty()) return Coordinate.promiseFrom(bounds.getCenter()).then(function(coord){return coord.toJson()});
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

  //THIS IS TIGHTLY bounds to Feature, need to unbind it
  this.boundingBox = function(objects) { return $q(function(resolve, reject){
    resolve($q.all(objects).then(Feature.promiseFrom).then(function(objects){
      var flattenedCoordinates = [];
      for(var i=0; i<objects.length; i++){
        var objectCoordinates = objects[i].flattenedCoordinates();
        flattenedCoordinates = flattenedCoordinates.concat(objectCoordinates);
      }
      var bounds = new google.maps.LatLngBounds();
      return Coordinate.promiseFrom(flattenedCoordinates).then(function(coordinates){
        angular.forEach(coordinates, function(coord){
          bounds.extend(coord.toGoogle());
        });

        if(!bounds.isEmpty()) return Bounds.promiseFrom(bounds).then(function(bounds){return bounds.toJson()});
        else return $q.reject("no available center")
      });
    }));
  })}

  this.fitBounds = function(objects) {return GoogleMap.map().then(function(map){
    return $q(function(resolve, reject){
      if(objects instanceof Bounds) { resolve(Bounds.promiseFrom(objects)) }
      else { resolve(Bounds.promiseFrom(self.boundingBox(objects))); }
    }).then(function(bounds){
      map.fitBounds(bounds.toGoogle());
      return bounds;
    });
    
  })}
}