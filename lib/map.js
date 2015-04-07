'use strict';
require('./map.models.js');

angular.module('map', ['map.models'])
  .directive('map', mapDirective)
  .directive('marker', markerDirective)
  .directive('polygon', polygonDirective)
  .directive('path', pathDirective)
  .controller('MapController', MapController)
  .controller('PolygonController', PolygonController);

MapController.$inject = ['$scope', '$q', 'GoogleMap', 'Marker', 'Polygon'];
PolygonController.$inject = ['$scope', '$q', 'Coordinate'];
mapDirective.$inject = ['GoogleMap', 'Coordinate', 'MapOptions', '$timeout'];
polygonDirective.$inject = ['Polygon', '$q'];
markerDirective.$inject = ['Marker', '$q'];
pathDirective.$inject = ['Coordinate'];

function MapController($scope, $q, GoogleMap, Marker, Polygon){
  //(polygon:Object) -> Promise(:google.maps.Polygon)
  this.addPolygon = function(polygon){
    return Polygon.promiseFrom(polygon).then(function(polygon){
      return GoogleMap.map().then(function(map){
        var mapPolygon = polygon.toGoogle();
        mapPolygon.setMap(map);
        return mapPolygon;
      });
    });
  };

  //(marker:Object) -> Promise(:google.maps.Marker)
  this.addMarker = function(marker){
    return GoogleMap.map().then(function(map){
      return Marker.promiseFrom(marker).then(function(marker){
        var mapMarker = marker.toGoogle();
        mapMarker.setMap(map);
        return mapMarker;
      });
    });
  };
}
function PolygonController($scope, $q, Coordinate){
  this.setPath = function(coordinates){ return Coordinate.promiseFrom(coordinates).then(function(coordinates){
    return $scope.polygonPromise.then(function(polygon){
      polygon.setPaths(coordinates.map(function(c){return c.toGoogle()}));
    });
  })};
}
function mapDirective(GoogleMap, Coordinate, MapOptions, $timeout){
  var GOOGLE_MAP_ID = "mapId";

  return {
    template: "<div class='map' style='height:100%'>" +
        "<div style='height:100%' id='"+GOOGLE_MAP_ID+"'></div>" +
        "<div ng-transclude style='display: none'></div>"+
      "</div>",
    scope: {
      key:'@',
      center:'=',
      zoom:'=?',
      styles:'=',
      options:'=?'
    },
    transclude:true,
    controller: MapController,
    link: function($scope, element, attrs, controller){
      if($scope.zoom == null) $scope.zoom = 3;
      if($scope.center == null) $scope.center = {lat:0, lng: 0};

      MapOptions.promiseFrom({center: $scope.center, zoom: $scope.zoom, styles:$scope.styles, options:$scope.options}).then(function(options){
        GoogleMap.map($scope.key, GOOGLE_MAP_ID, options).then(function(map){
          google.maps.event.addListener(map, 'bounds_changed', function(){

            $timeout.cancel($scope.centerChangedPromise);
            $scope.centerChangedPromise = $timeout(function(){
              Coordinate.promiseFrom(map.getCenter()).then(function(coordinate){$scope.center = coordinate.toJson(); });
              $scope.zoom = map.getZoom();
            }, 100);
          });
        });
      });

      $scope.$watchGroup(["center", "zoom", "styles", "options"], function(nv,ov){ GoogleMap.map().then(function(map){
        var data = {center:nv[0], zoom:nv[1], styles:nv[2], options:nv[3]};
        MapOptions.promiseFrom(data).then(function(options){ options.fillMap(map); });
      })});

      $scope.$on("$destroy", function(){ GoogleMap.$destroy(); });

    }
  }
}
function markerDirective(Marker, $q){
  return {
    restrict: 'AE',
    require: '^map',
    scope: {
      options:'=?',
      position:'=?'
    },
    link: function($scope, element, attr, mapController){
      $scope.$watchGroup(["position", "options"], function(nv){
        var data = {position:nv[0], options:nv[1]};

        if($scope.markerPromise == null) $scope.markerPromise = mapController.addMarker(data);
        else {
          $scope.markerPromise.then(function(polygon){
            polygon.setMap(null);
            $scope.markerPromise = mapController.addMarker(data);
          }, function(){
            $scope.markerPromise = mapController.addMarker(data);
          });
        }

      });

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
        if($scope.polygonPromise == null) $scope.polygonPromise = mapController.addPolygon(newValue);
        else {
          $scope.polygonPromise.then(function(polygon){
            polygon.setMap(null);
            $scope.polygonPromise = mapController.addPolygon(newValue);
          }, function(error){
            $scope.polygonPromise = mapController.addPolygon(newValue);
          });
        }
      })

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
      $scope.$watch("model", function(newValue){
        polygonController.setPath(newValue)
      });

    }
  }
}
