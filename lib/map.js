'use strict';
require('./map.models.js');
require('./map.services.js');

angular.module('map', ['map.models', 'map.services'])
  .directive('map', mapDirective)
  .directive('marker', markerDirective)
  .directive('polygon', polygonDirective)
  .directive('path', pathDirective)
  .directive('feature', featureDirective)
  .directive('mapOptions', mapOptionsDirective)
  .controller('MapController', MapController)
  .controller('PolygonController', PolygonController)
  .controller('FeatureController', FeatureController);

MapController.$inject = ['$scope', '$q', 'GoogleMap', 'Marker', 'Polygon', 'Feature', 'UUID'];
PolygonController.$inject = ['$scope', '$q', 'Coordinate', 'UUID'];
FeatureController.$inject = ['$scope', '$q', 'Feature', 'Polygon', 'Marker', 'UUID'];
mapDirective.$inject = ['GoogleMap', 'Coordinate', 'MapOptions', '$timeout'];
polygonDirective.$inject = ['Polygon', '$q'];
markerDirective.$inject = ['Marker', '$q'];
pathDirective.$inject = ['Coordinate'];
featureDirective.$inject = ['$timeout'];

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
function PolygonController($scope, $q, Coordinate, UUID){
  this.setPath = function(coordinates){ return Coordinate.promiseFrom(coordinates).then(function(coordinates){
    return $scope.polygonPromise.then(function(polygon){
      polygon.setPaths(coordinates.map(function(c){return c.toGoogle()}));
    });
  })};
}
function FeatureController($scope, $q, Feature, Polygon, Marker, UUID){
  this.setOptions = function(type, options){
    $scope.featurePromise.then(function(feature){
      if(angular.isString(type) && type.toLowerCase() == "polygon" && feature.geometry instanceof Polygon) {
        var geo = feature.geometry.promiseFrom(options);
        feature.geometry.mappedObj.setOptions(options);
      }
      
    });
  }

}
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
    require: '^polygon',
    scope: {
      options:'=?',
      model:'='
    },
    link: function($scope, element, attr, polygonController){
      $scope.$watch("model", function(newValue){
        polygonController.setPath(newValue)
      });

    }
  }
}
function featureDirective($timeout){
  return {
    restrict: 'AE',
    require: '^map',
    scope: {
      model:'='
    },
    controller: FeatureController,
    link: function($scope, element, attr, mapController){
      $scope.$watch("model", function(nv){
        if($scope.featurePromise == null) $scope.featurePromise = mapController.addFeature(nv);
        else {
          $scope.featurePromise.then(function(feature){
            $scope.featurePromise = mapController.addFeature(nv);
          }, function(error){
            $scope.featurePromise = mapController.addFeature(nv);
          });
        }
      });
    }
  }
}

function mapOptionsDirective(Coordinate){
  return {
    restrict: 'AE',
    require: '^feature',
    scope: {
      type:'@',
      model:'='
    },
    link: function($scope, element, attr, featureController){
      $scope.$watchGroup(["model", "type"], function(nv){
        var newModel = nv[0];
        var newType = nv[1];
        featureController.setOptions(newType, newModel)
      });

    }
  }
}
