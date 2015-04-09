'use strict';

angular.module('map.directives')
  .directive('polygon', polygon)
  .controller('PolygonController', PolygonController);

PolygonController.$inject = ['$scope', '$q', 'Coordinate', 'UUID'];
polygon.$inject = ['Polygon', '$q'];



function PolygonController($scope, $q, Coordinate, UUID){
  this.setPath = function(coordinates){ return Coordinate.promiseFrom(coordinates).then(function(coordinates){
    return $scope.polygonPromise.then(function(polygon){
      polygon.setPaths(coordinates.map(function(c){return c.toGoogle()}));
    });
  })};
}

function polygon(Polygon, $q){
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