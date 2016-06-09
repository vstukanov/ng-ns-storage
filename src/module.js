/**
 * Created by vst on 5/28/16.
 */

var NSStorage = angular
  .module('NSStorage', [])
  .value('NSStorage.prefix', 'NSStorage');

require('./services/cache.js');
require('./services/memoryStorage.js');
require('./services/cacheFactory.js');

module.exports = NSStorage;
