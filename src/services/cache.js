/**
 * Created by vst on 5/29/16.
 */
var crc32 = require('crc-32');

var defineCacheClass = function ($q, globalPrefix, $rootScope) {

  var toArray = function (value) {
    return Array.prototype.slice.call(value);
  };

  var methodHash = function (name, args) {
    var argHash = crc32.str(JSON.stringify(toArray(args)));
    return name + '.' + argHash;
  };

  var defaultOptions = {
    // By default endless time life
    defaultTtl: false,

    // No items limit by default
    maxItems: false,

    clearOn: false
  };

  var Cache = function (provider, ns, options) {
    this.options = angular.extend({}, defaultOptions, options || {});
    this.$provider = provider;
    this.$ns = ns;

    var clearOn = this.options.clearOn;
    if (clearOn) {
      var clear = angular.bind(this, this.clear);

      if (angular.isString(clearOn)) {
        this.$$clearOnDeregisteration = $rootScope.$on(clearOn, clear);
      }

      if (angular.isNumber(clearOn)) {
        this.$$clearOnIntervalId = setInterval(clear, clearOn);
      }

      if (angular.isFunction(clearOn)) {
        clearOn(clear);
      }
    }
  };

  var checkKey = function (key) {
    key = (key && key.toString) ? key.toString() : "" + key;

    if (key.indexOf(':') !== -1) {
      throw 'Column char `:` is not allowed in key name. Given key: `' + key + '`.';
    }

    return key;
  };

  var time = function () {
    return new Date().getTime();
  };

  Cache.prototype = {
    $$fullKey: function (key) {
      return [globalPrefix, this.$ns, '', checkKey(key)].join(':');
    },

    destroy: function () {
      if (this.$$clearOnDeregisteration) {
        this.$$clearOnDeregisteration();
      }

      if (this.$$clearOnIntervalId) {
        clearInterval(this.$$clearOnIntervalId);
      }
    },

    sync: function () {
      var cache = this;
      angular.forEach(this.keys(), function (key) {
        cache.has(key);
      });
    },

    'get': function (key) {
      var fullKey = this.$$fullKey(key);
      var data = this.$provider.getItem(fullKey);

      if (!data) {
        return data;
      }

      var cacheRow;

      try {
        cacheRow = JSON.parse(data);
      } catch (err) {
        console.warn('Key `%s:%s` exists but don\'t valid.', this.$ns, key);
        this.$provider.removeItem(fullKey);
        return null;
      }

      if (cacheRow.till === false) {
        return cacheRow.value;
      }

      var validToTime = Number(cacheRow.till);

      if (validToTime > time()) {
        return cacheRow.value;
      }

      this.$provider.removeItem(fullKey);
      return null;
    },

    has: function (key) {
      return this.get(key) !== null;
    },

    'set': function (key, data, ttl) {
      var fullKey = this.$$fullKey(key);
      var cacheRow = {
        till: false,
        value: (data === undefined) ? null : data
      };

      ttl = ttl || this.options.defaultTtl;

      if (ttl !== false) {
        var parsedTtl = Number(ttl);

        if (isNaN(ttl)) {
          console.warn('Bad ttl value `%s`. Use default one `%s`.', ttl, this.options.defaultTtl);
        }

        cacheRow.till = time() + parsedTtl;
      }

      var serializedData = JSON.stringify(cacheRow);

      if ((this.options.maxItems !== false) && !this.has(key)) {
        this.sync();

        var keys = this.keys();

        if ((keys.length + 1) > this.options.maxItems) {
          this.remove(keys[0]);
        }
      }

      this.$provider.setItem(fullKey, serializedData);
    },

    remove: function (key) {
      this.$provider.removeItem(this.$$fullKey(key));
    },

    keys: function () {
      var keys = [];
      var i = this.$provider.length;
      var prefix = globalPrefix + ':' + this.$ns;
      var key;

      while (i--) {
        key = this.$provider.key(i);

        if ((key.indexOf(prefix) === 0) && (key[prefix.length + 1] === ':')) {
          keys.unshift(key.replace(prefix + '::', ''));
        }
      }

      return keys;
    },

    key: function (nth) {
      return this.keys()[nth];
    },

    create: function (ns, options) {
      return new Cache(this.$provider, this.$ns + ':' + ns, options);
    },

    fn: function (key, fn, ttl) {
      var cache = this;

      return function () {
        var mhash = methodHash(key, arguments);
        var result = cache.get(mhash);

        if (result !== null) {
          return result;
        }

        result = fn.apply(null, arguments);
        cache.set(mhash, result, ttl);
        return result;
      };
    },

    promise: function (key, promise, ttl) {
      var cache = this;
      return function () {
        var mhash = methodHash(key, arguments);
        var result = cache.get(mhash);

        if (result !== null) {
          return $q.resolve(result);
        }

        var p = promise.apply(promise, arguments);
        return p.then(function (result) {
            cache.set(mhash, result, ttl);
            return result;
          });
      };
    },

    clear: function () {
      var i = this.$provider.length;
      var prefix = globalPrefix + ':' + this.$ns + ':';
      var key;

      while (i--) {
        key = this.$provider.key(i);

        if (key.indexOf(prefix) === 0) {
          this.$provider.removeItem(key);
        }
      }
    },

    get length() {
      return this.keys().length;
    }
  };

  return Cache;
};

angular.module('NSStorage')
  .factory('NSStorage.Cache', ['$q', 'NSStorage.prefix', '$rootScope', defineCacheClass]);
