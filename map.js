(function(){
  'use strict';

  angular.module('map', [])
    .factory('Coordinate', CoordinateModel)
    .factory('MapOptions', MapOptionsModel)
    .factory('Polygon', PolygonModel)
    .factory('Path', PathModel)
    .service('LazyLoadGoogleMap', LazyLoadGoogleMap)
    .service('GoogleMap', GoogleMap)
    .directive('map', mapDirective)
    .directive('polygon', polygonDirective)
    .directive('path', pathDirective)
    .controller('MapController', MapController)
    .controller('PolygonController', PolygonController);

  MapOptionsModel.$inject = ['Coordinate'];
  LazyLoadGoogleMap.$inject = ['$window', '$q', '$timeout'];
  GoogleMap.$inject = ['$q', 'LazyLoadGoogleMap', 'MapOptions'];
  MapController.$inject = ['$scope', '$q', 'GoogleMap'];
  PolygonController.$inject = ['$scope', '$q'];
  mapDirective.$inject = ['GoogleMap'];
  polygonDirective.$inject = ['Polygon', '$q'];
  pathDirective.$inject = ['Coordinate'];

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
    };
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

    //(data:Object) -> :boolean
    MapOptions.validateJson = function(data){
      if(data == null) return false;

      if(data.zoom == null) return false;
      if(data.center == null) return false;
      return true;
    };

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
    };

    return MapOptions;
  }

  function PolygonModel(){
    function Polygon(options){
      for(var prop in options){
        if(options.hasOwnProperty(prop)){
          this[prop] = options[prop];
        }
      }
    }
    //(d:Object) -> :Polygon
    Polygon.build = function(d){ return new Polygon(d) };

    //(data:Object) -> :boolean
    //mutates data
    Polygon.validateJson = function(data){
      if(data == null) return false;

      if(data.stroke) {
        if(data.stroke.color != null) data.strokeColor = data.stroke.color;
        if(data.stroke.opacity != null) data.strokeOpacity = data.stroke.opacity;
        if(data.stroke.weight != null) data.strokeWeight = data.stroke.weight;
      }

      if(data.fill) {
        if(data.fill.color != null) data.fillColor = data.fill.color;
        if(data.fill.opacity != null) data.fillOpacity = data.fill.opacity;
      }
      return true;
    };

    //(data:Object) -> :Polygon | null
    Polygon.fromJson = function(data){
      //data will be muted after call to validateJson
      if(Polygon.validateJson(data)){
        return Polygon.build(data);
      }
    };
    //(responseData:Object) -> :Polygon | :Array[Polygon]
    Polygon.apiResponseTransformer = function(responseData){
      if(angular.isArray(responseData)){
        return responseData.map(Polygon.fromJson).filter(Boolean);
      }
      return Polygon.fromJson(responseData);
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

  function PathModel(){
    function Path(options){
//      this.zoom = zoom;

//      for(var prop in rest){
//        if(rest.hasOwnProperty(prop) && prop != 'zoom' && prop != 'center' && prop != 'styles'){
//          this[prop] = rest[prop];
//        }
//      }
    }
    //(d:Object) -> :Path
    Path.build = function(d){ return new Path(d) };

    //(data:Object) -> :boolean
    Path.validateJson = function(data){
      if(data == null) return false;
      return true;
    };

    //(data:Object) -> :Path | null
    Path.fromJson = function(data){
      if(Path.validateJson(data)){
        return Path.build(data);
      }
    };
    //(responseData:Object) -> :Path | :Array[Path]
    Path.apiResponseTransformer = function(responseData){
      if(angular.isArray(responseData)){
        return responseData.map(Path.fromJson).filter(Boolean);
      }
      return Path.fromJson(responseData);
    };

    Path.prototype = {
      toGoogle: function(){
        var result = {};
        for(var prop in this){
          if(this.hasOwnProperty(prop)){
            if(this[prop] == null || this[prop].toGoogle == undefined) result[prop] = this[prop];
            else result[prop] = this[prop].toGoogle();
          }
        }
        return result;
      }
    };

    return Path;
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

    this.map = function(key, id, options) {
      if(mapPromise != null) return mapPromise;
      else if(key == null && id == null && options == null){
        return deferred.promise;
      } else{
        mapPromise = LazyLoadGoogleMap.load(key).then(function(){
          var opt = MapOptions.apiResponseTransformer(options).toGoogle();
          return new google.maps.Map(document.getElementById(id), opt);
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

  function MapController($scope, $q, GoogleMap){
    this.addPolygon = function(polygon){
      if(polygon == null) return $q.reject("undefined polygon");

      return GoogleMap.map().then(function(map){
        var mapPolygon = polygon.toGoogle();
        mapPolygon.setMap(map);
        return mapPolygon;
      });
    };
  }

  function PolygonController($scope, $q){
    this.setPath = function(coordinates){
      if(coordinates == null) return $q.reject("undefined polygon");

      return $scope.polygon.then(function(polygon){
        polygon.setPaths(coordinates.map(function(c){return c.toGoogle()}));
      });
    }
  }

  function mapDirective(GoogleMap){
    var GOOGLE_MAP_ID = "mapId";

    return {
      template: "<div class='map' style='height:100%'>" +
          "<div style='height:100%' id='"+GOOGLE_MAP_ID+"'></div>" +
          "<div ng-transclude style='display: none'></div>"+
        "</div>",
      scope: {
        key:'@',
        zoom:'=',
        center:'=',
        styles:'=',
        options:'=?'
      },
      transclude:true,
      controller: MapController,
      link: function($scope, element, attrs, controller){
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

  function polygonDirective(Polygon, $q){
    return {
      restrict: 'AE',
      require: '^map',
      scope: {
        options:'=?'
      },
      controller: PolygonController,
      link: function($scope, element, attr, mapController){
        $scope.$watch("options", function(newValue){
          if($scope.polygon == null){
            $scope.polygon = mapController.addPolygon(Polygon.apiResponseTransformer(newValue));
          } else {
            $scope.polygon.then(function(polygon){
              if(newValue == null) {
                polygon.setMap(null);
                $scope.polygon = null;
              } else polygon.setOptions(newValue);
            }).catch(function(error){
              $scope.polygon = mapController.addPolygon(Polygon.apiResponseTransformer(newValue));
            });
          }
        });

      }
    }
  }

  function pathDirective(Coordinate){
    return {
      restrict: 'AE',
      require: ['^polygon', 'ngModel'],
      scope: {
        options:'=?',
        model:'=ngModel'
      },
      link: function($scope, element, attr, requires){
        var polygonController = requires[0];
        $scope.$watch("model", function(newValue){ polygonController.setPath(Coordinate.apiResponseTransformer(newValue)); });
      }
    }
  }
})();
