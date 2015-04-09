'use strict';

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

angular.module('map.models')
  .service('PolygonTransformer', PolygonTransformer)
  .factory('Polygon', Polygon)

PolygonTransformer.$inject = [];
Polygon.$inject = ['$q', 'Coordinate', 'PolygonTransformer', 'UUID', 'Cache'];


function Polygon($q, Coordinate, PolygonTransformer, UUID, Cache){
  function Polygon(options){
    this.uuid = UUID.make();
    this.options = options;
  }

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
        var mappedObj = Cache.get(this.uuid);
        if(mappedObj != null) mappedObj.setMap(null);
        
        mappedObj = this.toGoogle();
        mappedObj.setMap(map);
        Cache.put(this.uuid, mappedObj);
      }
      return this;
    },
    promiseUpdate: function(data) {
      var self = this;
      $q(function(resolve,reject){
        var transformed = PolygonTransformer.transform(data)
        angular.extend(self.options, transformed);

        var mappedObj = Cache.get(self.uuid);
        if(mappedObj != null) mappedObj.setOptions(transformed);
        resolve(self);
      });
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
    var _paths,
        _fillColor,
        _fillOpacity,
        _strokeColor,
        _strokeWeight,
        _strokeOpacity,
        _strokePosition,
        _draggable,
        _clickable,
        _editable,
        _geodesic,
        _visible,
        _zIndex = null

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
      if(prop.toLowerCase() == "zindex" && (angular.isNumber(v) || angular.isString(v))) _zIndex = parseInt(v);
      if(prop.toLowerCase() == "visible") _visible = !!v;
      if(prop.toLowerCase() == "geodesic") _geodesic = !!v;
      if(prop.toLowerCase() == "editable") _editable = !!v;
      if(prop.toLowerCase() == "clickable") _clickable = !!v;
      if(prop.toLowerCase() == "draggable") _draggable = !!v;
      if(prop.toLowerCase() == "strokeposition") _strokePosition = setStrokePositionToNumber(v);
      if(prop.toLowerCase() == "strokeopacity" && (angular.isNumber(v) || angular.isString(v))) _strokeOpacity = parseFloat(v);
      if(prop.toLowerCase() == "strokeweight" && (angular.isNumber(v) || angular.isString(v))) _strokeWeight = parseFloat(v);
      if(prop.toLowerCase() == "strokecolor" && angular.isString(v)) _strokeColor = v;
      if(prop.toLowerCase() == "fillopacity" && (angular.isNumber(v) || angular.isString(v))) _fillOpacity = parseFloat(v);
      if(prop.toLowerCase() == "fillcolor" && angular.isString(v)) _fillColor = v;
      if(prop.toLowerCase() == "stroke"){
        for(var subProp in data[prop]){ if(data.hasOwnProperty(subProp)) {
          var v = data[prop][subProp];
          if(prop.toLowerCase() == "position") _strokePosition = setStrokePositionToNumber(v);
          if(prop.toLowerCase() == "opacity" && (angular.isNumber(v) || angular.isString(v))) _strokeOpacity = parseFloat(v);
          if(prop.toLowerCase() == "weight" && (angular.isNumber(v) || angular.isString(v))) _strokeWeight = parseFloat(v);
          if(prop.toLowerCase() == "color" && angular.isString(v)) _strokeColor = v;
        }}
      }
      if(prop.toLowerCase() == "fill"){
        for(var subProp in data[prop]){ if(data.hasOwnProperty(subProp)) {
          var v = data[prop][subProp];
          if(prop.toLowerCase() == "opacity" && (angular.isNumber(v) || angular.isString(v))) _strokeOpacity = parseFloat(v);
          if(prop.toLowerCase() == "color" && angular.isString(v)) _strokeColor = v;
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
            _paths = [path];
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
            _paths = paths;
          }
          
        }
      }

    }}

    var validated = {}
    if(_paths != null) validated.paths = _paths;
    if(_fillColor != null) validated.fillColor = _fillColor;
    if(_fillOpacity != null) validated.fillOpacity = _fillOpacity;
    if(_strokeColor != null) validated.strokeColor = _strokeColor;
    if(_strokeWeight != null) validated.strokeWeight = _strokeWeight;
    if(_strokeOpacity != null) validated.strokeOpacity = _strokeOpacity;
    if(_strokePosition != null) validated.strokePosition = _strokePosition;
    if(_draggable != null) validated.draggable = _draggable;
    if(_clickable != null) validated.clickable = _clickable;
    if(_editable != null) validated.editable = _editable;
    if(_geodesic != null) validated.geodesic = _geodesic;
    if(_visible != null) validated.visible = _visible;
    if(_zIndex != null) validated.zIndex = _zIndex;

    return validated;
  }
}