'use strict'

angular.module('map.directives').directive('marker', markerDirective)
markerDirective.$inject = ['Marker', '$q'];

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