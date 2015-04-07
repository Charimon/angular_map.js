(function(){
  'use strict';

  String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
  };

  angular.module('map.models', [])
    .factory('Coordinate', CoordinateModel)
    .factory('MapOptions', MapOptionsModel)
    .factory('Polygon', PolygonModel)
    .factory('Marker', MarkerModel)
    .service('LazyLoadGoogleMap', LazyLoadGoogleMap)
    .service('GoogleMap', GoogleMap)
    .service('MapHelper', MapHelper);

  MapOptionsModel.$inject = ['Coordinate', '$q'];
  LazyLoadGoogleMap.$inject = ['$window', '$q', '$timeout'];
  GoogleMap.$inject = ['$q', 'LazyLoadGoogleMap', 'MapOptions'];
  MapHelper.$inject = ['GoogleMap', 'Coordinate', '$q'];
  CoordinateModel.$inject = ['$q'];
  MarkerModel.$inject = ['Coordinate', '$q'];
  PolygonModel.$inject = ['$q'];


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
  function MapOptionsModel(Coordinate, $q){
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
    MapOptions.promiseFrom = function(data) {
      if(data instanceof MapOptions) {
        return $q.when(data);
      } else if(window.google != null && window.google.maps != null && window.google.maps.MapOptions != null && data instanceof window.google.maps.MapOptions) {
        return $q.reject("data can't be parsed correctly is of type google.maps.MapOptions");
      } else if(angular.isArray(data)) {
        return $q.all(data.map(MapOptions.promiseFrom));
      } else if(data != null) {
        return Coordinate.promiseFrom(data.center).then(function(coordinate){
          if(data != null && (angular.isNumber(data.zoom) || angular.isString(data.zoom))){
            return $q.when(new MapOptions(data.zoom, coordinate, data.styles, data.options));
          } else {
            return $q.reject("data can't be parsed correctly");
          }
        });
      } else {
        return $q.reject("data can't be parsed correctly");
      }
    };

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
  function CoordinateModel($q){
    function Coordinate(lat, lng){
      this.lat = lat;
      this.lng = lng;
    }

    //(data:Object) -> :Promise(:Coordinate|[:Coordinate])
    Coordinate.promiseFrom = function(data) {
      if(data instanceof Coordinate){
        return $q.when(data);
      } else if(window.google != null && window.google.maps != null && window.google.maps.LatLng != null && data instanceof window.google.maps.LatLng) {
        return $q.when(new Coordinate(data.lat(), data.lng()));
      } else if(angular.isArray(data)) {
        return $q.all(data.map(Coordinate.promiseFrom))
      } else if( data != null && (angular.isNumber(data.lat) || angular.isString(data.lat)) && (angular.isNumber(data.lng) || angular.isString(data.lng))){
        return $q.when(new Coordinate(data.lat, data.lng));
      } else {
        return $q.reject("data can't be parsed correctly");
      }
    };

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
  function PolygonModel($q){
    function Polygon(options){
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

    //(data:Object) -> :Promise(:Polygon|[:Polygon])
    Polygon.promiseFrom = function(data) {
      if(data instanceof Polygon){
        return $q.when(data);
      } else if(window.google != null && window.google.maps != null && window.google.maps.Polygon != null && data instanceof window.google.maps.Polygon) {
        return $q.reject("data can't be parsed correctly of type google.maps.Polygon");
      } else if(angular.isArray(data)) {
        return $q.all(data.map(Polygon.promiseFrom))
      } else if(data != null){
        return $q.when(new Polygon(data));
      } else {
        return $q.reject("data can't be parsed correctly");
      }
    };

    Polygon.prototype = {
      toGoogle: function(){
        var result = {};
        for(var prop in this){
          if(this.hasOwnProperty(prop)){
            if(this[prop] == null || this[prop].toGoogle == undefined) result[prop] = this[prop];
            else result[prop] = this[prop].toGoogle();
          }
        }
        return new google.maps.Polygon(result);
      }
    };

    return Polygon;
  }
  function MarkerModel(Coordinate, $q){
    function Marker(position, options){
      this.position = position;

      for(var prop in options){
        if(options.hasOwnProperty(prop) && prop != 'position'){
          this[prop] = options[prop];
        }
      }
    }

    //(data:Object) -> :Promise(:Marker|[:Marker])
    Marker.promiseFrom = function(data) {
      if(data instanceof Marker){
        return $q.when(data);
      } else if(window.google != null && window.google.maps != null && window.google.maps.Marker != null && data instanceof window.google.maps.Marker) {
        return $q.reject("data can't be parsed correctly of type google.maps.Marker");
      } else if(angular.isArray(data)) {
        return $q.all(data.map(Marker.promiseFrom))
      } else if(data != null){
        return Coordinate.promiseFrom(data.position).then(function(coordinate){
          return new Marker(coordinate, data);
        });
      } else {
        return $q.reject("data can't be parsed correctly");
      }
    };

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
      }
    };

    return Marker;

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
