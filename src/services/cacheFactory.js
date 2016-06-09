/**
 * Created by vst on 5/29/16.
 */

angular.module('NSStorage')
  .factory('NSStorage.cacheFactory', [
    '$window',
    'NSStorage.memoryStorage',
    'NSStorage.Cache',
    'NSStorage.prefix', function ($window, memoryStorage, Cache, prefix) {

    var isStorageSupported = !!$window.localStorage;

    if (isStorageSupported) {
      var testkey = prefix + '__test__';
      try {
        $window.localStorage.setItem(testkey, '');
      } catch (err) {
        isStorageSupported = false;
      } finally {
        $window.localStorage.removeItem(testkey);
      }
    }

    var provider = function (name) {
      switch (name) {
        case 'local':
          return isStorageSupported ? $window.localStorage : false;

        case 'session':
          return isStorageSupported ? $window.sessionStorage : false;

        case 'memory':
          return memoryStorage;

        default:
          return false;
      }
    };

    return {
      create: function (storageName, ns, options) {
        storageName = storageName || 'memory';
        var _provider = provider(storageName);
        ns = ns || "__default__";

        if (!_provider) {
          console.warn('Provider "%s" unknown or not supported switch to memoryStorage.');
          _provider = memoryStorage;
        }

        return new Cache(_provider, ns, options);
      },

      local: function (ns, options) {
        return this.create('local', ns, options);
      },

      session: function (ns, options) {
        return this.create('session', ns, options);
      },

      memory: function (ns, options) {
        return this.create('memory', ns, options);
      }
    };
  }]);
