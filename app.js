(function(){
  'use strict';

  angular.module('app', ['map'])
    .controller("AppController", function($timeout, $scope, $http){
      var self = this;
      this.center = {lat: 47.577837, lng: -122.341721};
      this.zoom = 12;
      this.polygonOptions = {
        editable: true,
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

      this.makeMarkers = function(n){
        var markers = [];
        for(var i=0; i< n; i++){
          var lat = Math.random()*180/2 - 90/2;
          var lng = Math.random()*360/4 - 180/4;
          markers.push({lat:lat, lng:lng})
        }
        return markers;
      };
//      $scope.markers = this.makeMarkers(500);

      this.styles = [{"elementType": "geometry", "stylers": [ { "saturation": -100 }]},
        {"featureType": "road.highway", "stylers": [{ "visibility": "off" }]},
        {"featureType": "road.arterial", "stylers": [{ "visibility": "off" }]},
        {"featureType": "poi", "elementType": "labels", "stylers": [{ "visibility": "off" }]},
        {"featureType": "transit.line", "stylers": [{ "visibility": "off" }]}
      ];

      this.loadPolygons = function(){
        $http.get("seattle_hoods.geo.json").then(function(responseData){
          return responseData.data.features.slice(0, 1000);
        }).then(function(features){
          self.features = features;
        });
      };

      $timeout(this.loadPolygons, 1000);
    });


})()
