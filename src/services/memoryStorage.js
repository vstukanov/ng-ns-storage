/**
 * Created by vst on 5/28/16.
 */

angular.module('NSStorage')
  .service('NSStorage.memoryStorage', function () {

    var storage = {};

    var keys = function () {
      return Object.keys(storage);
    };

    var toString = function (value) {
      return (value && value.toString) ? value.toString() : "" + value;
    };

    var memoryStorage = {
      key: function (nth) {
        return keys()[nth] || null;
      },

      getItem: function (key) {
        key = toString(key);
        return storage[key] || null;
      },

      setItem: function (key, value) {
        key = toString(key);
        value = toString(value);

        storage[key] = value;
      },

      removeItem: function (key) {
        key = toString(key);
        delete storage[key];
      },

      clear: function () {
        storage = {};
      }
    };

    Object.defineProperty(memoryStorage, 'length', {
      get: function () {
        return keys().length;
      }
    });

    return memoryStorage;
  });
