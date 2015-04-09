'use strict'

angular.module('map.common').service('Cache', Cache);
Cache.$inject = [];

function Cache(){
  var cache = {}

  var self = this;
  this.put = function(id, object) {
    cache[id] = object;
  }

  this.get = function(id){
    return cache[id];
  }
}