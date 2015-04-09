'use strict';

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

angular.module('map.models')
  .service('PolygonTransformer', PolygonTransformer)
  .factory('Polygon', Polygon)

PolygonTransformer.$inject = [];
Polygon.$inject = ['$q', 'Coordinate', 'PolygonTransformer'];


function Polygon($q, Coordinate, PolygonTransformer){
  function Polygon(options){ this.options = options; }

  //(data:Object) -> :Promise(:Polygon|[:Polygon])
  Polygon.promiseFrom = function(data) { return $q(function(resolve, reject) {
    if(data != null && angular.isFunction(data.then)){ resolve(data.then(Polygon.promiseFrom)); }
    else if (data instanceof Polygon) { resolve(data); }
    else if (window.google != null && window.google.maps != null && window.google.maps.Polygon != null && data instanceof window.google.maps.Polygon) { reject("data can't be parsed correctly of type google.maps.Polygon"); }
    else if (angular.isArray(data)) { resolve($q.all(data.map(Polygon.promiseFrom))); }
    else if (angular.isObject(data)) {
      var validated = PolygonTransformer.transform(data);
      resolve(Coordinate.promiseFrom(validated.paths).then(function(paths){
        validated.paths = paths;
        return new Polygon(validated);
      }));
    }
    else { reject("data can't be parsed correctly"); }
  })};

  Polygon.prototype = {
    toGoogle: function(){
      var result = {};
      for(var prop in this.options){
        if(this.options.hasOwnProperty(prop)){
          if(this.options[prop] == null || this.options[prop].toGoogle == undefined) result[prop] = this.options[prop];
          else result[prop] = this.options[prop].toGoogle();
        }
      }
      return new google.maps.Polygon(result);
    },
    //() -> [:Coordinates]
    flattenedCoordinates: function(){
      var flatCoordinates = []
      for(var i=0; i<this.options.paths.length; i++) {
        for(var j=0; j<this.options.paths[i].length; j++) {
          flatCoordinates.push(this.options.paths[i][j]);
        }
      }
      return flatCoordinates
    },
    fillMap: function(map){
      if(window.google != null && window.google.maps != null && window.google.maps.Map != null && map instanceof window.google.maps.Map){
        if(this.mappedObj != null) this.mappedObj.setMap(null);
        this.mappedObj = this.toGoogle();
        this.mappedObj.setMap(map);
      }
      return this;
    }

  };

  return Polygon;
}

function PolygonTransformer(){
  /* white listed properties
    paths:[[:Object]],
    fillColor:String,
    fillOpacity:Number,
    strokeColor:String,
    strokeWeight:Number,
    strokeOpacity:Number,
    strokePosition:Number
    draggable:Boolean,
    clickable:Boolean,
    editable:Boolean,
    geodesic:Boolean,
    visible:Boolean,
    zIndex:Boolean
  */

  //(data:JSON) -> :Promise(:JSON)
  this.transform = function(data){
    var validated = {
      paths:[[]],
      fillColor: "#000",
      fillOpacity: 0.4,
      strokeColor: "#000",
      strokeWeight: 1,
      strokeOpacity:1,
      strokePosition:0,
      draggable:false,
      clickable:false,
      editable:false,
      geodesic:false,
      visible:true,
      zIndex:0
    };

    var setStrokePositionToNumber = function(strokePosition, obj){
      var validatedStrokePosition = null;

      if(angular.isString(strokePosition)) {
        if(strokePosition.toLowerCase() == "center") validatedStrokePosition = 0;
        else if(strokePosition.toLowerCase() == "inside") validatedStrokePosition = -1;
        else if(strokePosition.toLowerCase() == "outside") validatedStrokePosition = 1;
      } else if(strokePosition == 0) {
        validatedStrokePosition = 0
      } else if(strokePosition == 1) {
        validatedStrokePosition = 1
      } else if(strokePosition == -1) {
        validatedStrokePosition = -1
      } 

      if(validatedStrokePosition != null) obj.strokePosition = validatedStrokePosition;
    }

    for(var prop in data){ if(data.hasOwnProperty(prop)) {
      var v = data[prop];
      if(prop.toLowerCase() == "zindex" && (angular.isNumber(v) || angular.isString(v))) validated.zIndex = parseInt(v);
      if(prop.toLowerCase() == "visible") validated.visible = !!v;
      if(prop.toLowerCase() == "geodesic") validated.geodesic = !!v;
      if(prop.toLowerCase() == "editable") validated.editable = !!v;
      if(prop.toLowerCase() == "clickable") validated.clickable = !!v;
      if(prop.toLowerCase() == "draggable") validated.draggable = !!v;
      if(prop.toLowerCase() == "strokeposition") setStrokePositionToNumber(v, validated);
      if(prop.toLowerCase() == "strokeopacity" && (angular.isNumber(v) || angular.isString(v))) validated.strokeOpacity = parseFloat(v);
      if(prop.toLowerCase() == "strokeweight" && (angular.isNumber(v) || angular.isString(v))) validated.strokeWeight = parseFloat(v);
      if(prop.toLowerCase() == "strokecolor" && angular.isString(v)) validated.strokeColor = v;
      if(prop.toLowerCase() == "fillopacity" && (angular.isNumber(v) || angular.isString(v))) validated.fillOpacity = parseFloat(v);
      if(prop.toLowerCase() == "fillcolor" && angular.isString(v)) validated.fillColor = v;
      if(prop.toLowerCase() == "stroke"){
        for(var subProp in data[prop]){ if(data.hasOwnProperty(subProp)) {
          var v = data[prop][subProp];
          if(prop.toLowerCase() == "position") setStrokePositionToNumber(v, validated);
          if(prop.toLowerCase() == "opacity" && (angular.isNumber(v) || angular.isString(v))) validated.strokeOpacity = parseFloat(v);
          if(prop.toLowerCase() == "weight" && (angular.isNumber(v) || angular.isString(v))) validated.strokeWeight = parseFloat(v);
          if(prop.toLowerCase() == "color" && angular.isString(v)) validated.strokeColor = v;
        }}
      }
      if(prop.toLowerCase() == "fill"){
        for(var subProp in data[prop]){ if(data.hasOwnProperty(subProp)) {
          var v = data[prop][subProp];
          if(prop.toLowerCase() == "opacity" && (angular.isNumber(v) || angular.isString(v))) validated.strokeOpacity = parseFloat(v);
          if(prop.toLowerCase() == "color" && angular.isString(v)) validated.strokeColor = v;
        }}
      }
      if(prop.toLowerCase() == "path" || prop.toLowerCase() == "paths" || prop.toLowerCase() == "coordinates") {
        if(angular.isArray(v) && v.length > 0) {
          if(angular.isObject(v[0]) && !angular.isArray(v[0])) {
            //assume we are give 1 path
            var path = [];
            for(var i=0; i<v.length; i++){
              if(angular.isObject(v[i])){ path.push(v[i]); }
            }
            validated.paths = [path];
          } else {
            var paths = [];
            for(var i=0; i<v.length; i++){
              if(angular.isArray(v[i])){
                var path = [];
                for(var j=0; j< v[i].length; j++) {
                  if(angular.isObject(v[i][j])){
                    path.push(v[i][j]);
                  }
                }
                paths.push(path);
              }
            }
            validated.paths = paths;
          }
          
        }
      }

    }}


    return validated;
  }
}