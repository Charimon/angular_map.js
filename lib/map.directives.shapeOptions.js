'use strict';
angular.module('map.directives').directive('shapeOptions', shapeOptions)


function shapeOptions(Coordinate){
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
