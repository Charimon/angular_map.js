(function(){
  'use strict';

  String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
  };

  angular.module('map.services', [])
    .service('LazyLoadGoogleMap', LazyLoadGoogleMap)
    .service('GoogleMap', GoogleMap)
    .service('MapHelper', MapHelper)
    .service('UUID', UUID);

  LazyLoadGoogleMap.$inject = ['$window', '$q', '$timeout'];
  GoogleMap.$inject = ['$q', 'LazyLoadGoogleMap', 'MapOptions'];
  MapHelper.$inject = ['GoogleMap', 'Coordinate', 'Feature', 'Bounds', '$q'];
  UUID.$inject = [];


  function LazyLoadGoogleMap($window, $q, $timeout){
    this.load = function(key) {
      function loadScript(){
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp&callback=initGoogleMap';
        if(key != null) script.src += "&key=" + key;
        document.body.appendChild(script);
      }

      var deferred = $q.defer();
      if($window.google && $window.google.maps){
        $timeout(function(){deferred.resolve();});
      } else {
        $window.initGoogleMap = function(){ deferred.resolve() }

        if (document.readyState === "complete") { loadScript() }
        else if ($window.attachEvent) { $window.attachEvent('onload', loadScript); }
        else { $window.addEventListener('load', loadScript, false); }
      }

      return deferred.promise;
    }
  }
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

  //() -> :String
  function UUID(){
    var self = this;
    this.make = function(){
      var d = new Date().getTime();
      var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = (d + Math.random()*16)%16 | 0;
          d = Math.floor(d/16);
          return (c=='x' ? r : (r&0x3|0x8)).toString(16);
      });
      return uuid;
    }
  }
})();
