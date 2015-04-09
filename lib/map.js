'use strict';

angular.module('map.common', [])
angular.module('map.models', ['map.common'])
angular.module('map.services', ['map.models'])
angular.module('map.directives', [])

require('./map.common.UUID.js');
require('./map.common.Cache.js');

require('./map.models.Coordinate.js');
require('./map.models.Marker.js');
require('./map.models.Polygon.js');
require('./map.models.MultiPolygon.js');
require('./map.models.Feature.js');
require('./map.models.MapOptions.js');
require('./map.models.Bounds.js');


require('./map.services.MapHelper.js');
require('./map.services.LazyLoadGoogleMap.js');
require('./map.services.GoogleMap.js');


require('./map.directives.map.js');
require('./map.directives.shapeOptions.js');
require('./map.directives.path.js');
require('./map.directives.marker.js');
require('./map.directives.polygon.js');
require('./map.directives.feature.js');


angular.module('map', ['map.models', 'map.services', 'map.directives']);