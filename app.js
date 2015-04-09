(function(){
  'use strict';

  angular.module('app', ['map'])
    .controller("AppController", function($timeout, $scope, $http, MapHelper){
      var self = this;
      this.center = [ -122.285118747505649, 47.630984505723774 ];
      this.zoom = 3;
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
          [ -122.285118747505649, 47.630984505723774 ],
          [ -122.281328805231055, 47.630955937583138 ],
          [ -122.281348980179004, 47.629750438199125 ]
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
          return responseData.data.features.slice(0, 10);
        }).then(function(features){
          self.features = features;
          MapHelper.fitBounds(features).then(function(bounds){});
        });
      };

      $timeout(this.loadPolygons, 1000);
    });


})()
