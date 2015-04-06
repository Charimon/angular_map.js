(function(){
  'use strict';

  angular.module('app', ['map'])
    .controller("AppController", function($timeout){
      var self = this;
      this.polygonOptions = {
        stroke:{
          color:'red',
          opacity:'1',
          weight: 1
        },
        fill:{
          color:"green",
          opacity:1
        },
        paths: [
          {lat:25.774252, lng:-80.190262},
          {lat:18.466465, lng:-66.118292},
          {lat:32.321384, lng:-64.75737}
        ]
      };

      $timeout(function(){
        self.center = {lat: 10, lng: 0};

      }, 5000);

      this.polygonPath = [
        {lat:0, lng:0},
        {lat:0, lng:10},
        {lat:10, lng:10},
        {lat:10, lng:0}
      ];

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
