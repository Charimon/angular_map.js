'use strict'

angular.module('map.directives').directive('path', path)
path.$inject = ['Coordinate'];

function path(Coordinate){
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