'use strict'

angular.module('map.directives')
  .directive('map', mapDirective)
  .controller('MapController', MapController)

mapDirective.$inject = ['GoogleMap', 'Coordinate', 'MapOptions', '$timeout'];
MapController.$inject = ['$scope', '$q', 'GoogleMap', 'Marker', 'Polygon', 'Feature', 'UUID'];

function mapDirective(GoogleMap, Coordinate, MapOptions, $timeout){
  var GOOGLE_MAP_ID = "mapId";

  return {
    restrict: 'AE',
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

function MapController($scope, $q, GoogleMap, Marker, Polygon, Feature, UUID){
  //(polygon:Object) -> Promise(:google.maps.Polygon)
  this.addPolygon = function(polygon){
    return Polygon.promiseFrom(polygon).then(function(polygon){
      return GoogleMap.map().then(function(map){
        return polygon.fillMap(map);
      });
    });
  };
  //(marker:Object) -> Promise(:google.maps.Marker)
  this.addMarker = function(marker){
    return GoogleMap.map().then(function(map){
      return Marker.promiseFrom(marker).then(function(marker){
        return marker.fillMap(map);
      });
    });
  };
  //(feature:Object) -> Promise()
  this.addFeature = function(feature){
    return GoogleMap.map().then(function(map){
      return Feature.promiseFrom(feature).then(function(feature){
        return feature.fillMap(map);
      });
    });
  };
}