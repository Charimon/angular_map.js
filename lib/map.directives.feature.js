'use strict';

angular.module('map.directives')
  .directive('feature', feature)
  .controller('FeatureController', FeatureController)

FeatureController.$inject = ['$scope', '$q', 'Feature', 'Polygon', 'Marker', 'UUID'];
feature.$inject = ['$timeout'];

function FeatureController($scope, $q, Feature, Polygon, Marker, UUID){
  this.setOptions = function(type, options){
    $scope.featurePromise.then(function(feature){
      if(angular.isString(type) && type.toLowerCase() == "polygon" && feature.geometry instanceof Polygon) {
        feature.geometry.promiseUpdate(options);
      }
      
    });
  }
}

function feature($timeout){
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