(function(){
  'use strict';

  angular.module('app', ['map'])
    .controller("AppController", function(){
      this.styles = [
        {
          "elementType": "geometry",
          "stylers": [
            { "saturation": -100 }
          ]
        },{
          "featureType": "road.highway",
          "stylers": [
            { "visibility": "off" }
          ]
        },{
          "featureType": "road.arterial",
          "stylers": [
            { "visibility": "off" }
          ]
        },{
          "featureType": "poi",
          "elementType": "labels",
          "stylers": [
            { "visibility": "off" }
          ]
        },{
          "featureType": "transit.line",
          "stylers": [
            { "visibility": "off" }
          ]
        }
      ];
    });


})()
