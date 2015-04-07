(function(){
  'use strict';

  String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
  };

  angular.module('map.services', [])
    .service('LazyLoadGoogleMap', LazyLoadGoogleMap)
    .service('GoogleMap', GoogleMap)
    .service('MapHelper', MapHelper);

  LazyLoadGoogleMap.$inject = ['$window', '$q', '$timeout'];
  GoogleMap.$inject = ['$q', 'LazyLoadGoogleMap', 'MapOptions'];
  MapHelper.$inject = ['GoogleMap', 'Coordinate', '$q'];


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

  function MapHelper(GoogleMap, Coordinate, $q){
    //[:{lat,lng}] => {lat, lng}
    this.getCenter = function(coordinates){
      return GoogleMap.map().then(function(){
        var bounds = new google.maps.LatLngBounds();

        return Coordinate.promiseFrom(coordinates).then(function(coordinates){
          angular.forEach(coordinates, function(coord){
            bounds.extend(coord.toGoogle());
          });

          if(!bounds.isEmpty()) return Coordinate.promiseFrom(bounds.getCenter());
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
  }
})();
