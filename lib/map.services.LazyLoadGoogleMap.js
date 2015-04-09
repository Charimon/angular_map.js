'use strict';

angular.module('map.services').service('LazyLoadGoogleMap', LazyLoadGoogleMap);
LazyLoadGoogleMap.$inject = ['$window', '$q', '$timeout'];


function LazyLoadGoogleMap($window, $q, $timeout){
  this.load = function(key) {
    function loadScript(){
      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp&callback=initGoogleMap';
      if(key != null) script.src += "&key=" + key;
      document.body.appendChild(script);
    }

    var deferred = $q.defer();
    if($window.google && $window.google.maps){
      $timeout(function(){deferred.resolve();});
    } else {
      $window.initGoogleMap = function(){ deferred.resolve() }

      if (document.readyState === "complete") { loadScript() }
      else if ($window.attachEvent) { $window.attachEvent('onload', loadScript); }
      else { $window.addEventListener('load', loadScript, false); }
    }

    return deferred.promise;
  }
}