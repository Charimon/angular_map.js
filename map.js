(function(){
  'use strict';

  angular.module('map', [])
    .factory('Coordinate', CoordinateModel)
    .factory('MapOptions', MapOptionsModel)
    .service('LazyLoadGoogleMap', LazyLoadGoogleMap)
    .service('GoogleMap', GoogleMap)
    .directive('map', mapDirective);

  MapOptionsModel.$inject = ['Coordinate'];
  LazyLoadGoogleMap.$inject = ['$window', '$q', '$timeout'];
  GoogleMap.$inject = ['LazyLoadGoogleMap', 'MapOptions'];
  mapDirective.$inject = ['GoogleMap'];

  function CoordinateModel(){
    function Coordinate(lat, lng){
      this.lat = lat;
      this.lng = lng;
    }

    //(data:Object) -> :boolean
    Coordinate.validateJson = function(data){
      if(data == null) return false;

      if(data.lat == null) return false;
      if(data.lng == null) return false;
      return true;
    }
    //(d:Object) -> :Coordinate
    Coordinate.build = function(d){ return new Coordinate(d.lat, d.lng); }
    //(data:Object) -> :Coordinate | null
    Coordinate.fromJson = function(data){
      if(Coordinate.validateJson(data)){
        return Coordinate.build(data);
      }
    };
    //(responseData:Object) -> :Coordinate | :Array[Coordinate]
    Coordinate.apiResponseTransformer = function(responseData){
      if(angular.isArray(responseData)){
        return responseData.map(Coordinate.fromJson).filter(Boolean);
      }
      return Coordinate.fromJson(responseData);
    };

    Coordinate.prototype = {
      toGoogle: function(){
        if(google != null && google.maps != null && google.maps.LatLng != null){
          return new google.maps.LatLng(this.lat, this.lng);
        }
        return null;
      }
    }

    return Coordinate;
  }

  function MapOptionsModel(Coordinate){
    function MapOptions(zoom, center, styles, rest){
      this.zoom = zoom;
      this.center = Coordinate.fromJson(center);
      this.styles = styles;

      for(var prop in rest){
        if(rest.hasOwnProperty(prop) && prop != 'zoom' && prop != 'center' && prop != 'styles'){
          this[prop] = rest[prop];
        }
      }
    }
    //(d:Object) -> :MapOptions
    MapOptions.build = function(d){ return new MapOptions(d.zoom, d.center, d.styles, d) }

    //(data:Object) -> :MapOptions | null
    MapOptions.fromJson = function(data){
      if(MapOptions.validateJson(data)){
        return MapOptions.build(data);
      }
    };
    //(responseData:Object) -> :MapOptions | :Array[MapOptions]
    MapOptions.apiResponseTransformer = function(responseData){
      if(angular.isArray(responseData)){
        return responseData.map(MapOptions.fromJson).filter(Boolean);
      }
      return MapOptions.fromJson(responseData);
    };

    MapOptions.prototype = {
      toGoogle: function(){
        var result = {}
        for(var prop in this){
          if(this.hasOwnProperty(prop)){
            if(this[prop] == null || this[prop].toGoogle == undefined) result[prop] = this[prop];
            else result[prop] = this[prop].toGoogle();
          }
        }
        return result;
      }
    }

    return MapOptions;
  }

  function LazyLoadGoogleMap($window, $q, $timeout){
    this.load = function(key) {
      function loadScript(){
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp&callback=initGoogleMap';
        if(key != null) script.src += "&key=" + key;
        document.body.appendChild(script);
      }

      var deferred = $q.defer()
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

  function GoogleMap(LazyLoadGoogleMap, MapOptions){
    var mapPromise = null;
    this.map = function(key, id, options) {
      if(mapPromise != null) return mapPromise;
      else {
        mapPromise = LazyLoadGoogleMap.load(key).then(function(){
          var opt = MapOptions.build(options).toGoogle();
          var m = new google.maps.Map(document.getElementById(id), opt);
          return m;
        });
        return mapPromise;
      }
    }
    this.$destroy = function(){ mapPromise = null; }
  }

  function mapDirective(GoogleMap){
    var GOOGLE_MAP_ID = "mapId";

    return {
      template: "<div class='map' style='height:100%' id='"+GOOGLE_MAP_ID+"'></div>",
      scope: {
        key:'@',
        zoom:'=',
        center:'=',
        styles:'=',
        options:'=?'
      },
      link: function($scope, element, attrs){
        GoogleMap.map($scope.key, GOOGLE_MAP_ID, getMapOptions($scope)).then(function(map){
          $scope.$watch("styles", function(newValue){
            map.setOptions({styles: newValue});
          });
        });

        $scope.$on("$destroy", function(){ GoogleMap.$destroy(); });

        function getMapOptions($scope) {
          var opt = {};
          if($scope.zoom) opt.zoom = $scope.zoom;
          else opt.zoom = 3;
          if($scope.center) opt.center = $scope.center;
          else opt.center = {lat:0, lng: 0}
          if($scope.styles) opt.styles = $scope.styles;

          for(var prop in $scope.options){
            if($scope.options.hasOwnProperty(prop)){ opt[prop] = $scope.options[prop];}
          }

          return opt;
        }

      }
    }
  }

})()
