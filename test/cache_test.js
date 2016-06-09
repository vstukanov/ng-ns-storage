/**
 * Created by vst on 5/29/16.
 */

var module = angular.mock.module;
var inject = angular.mock.inject;

require('src/module.js');

describe('NSStorage.Cache', function () {
  var Cache;
  var memoryStorage;
  var $q;
  var $rootScope;

  var defaultCache;
  var objectToSave = { foo: 'bar', bar: 100 };

  beforeEach(module('NSStorage'));

  beforeEach(inject(function ($injector) {
    $q = $injector.get('$q');
    Cache = $injector.get('NSStorage.Cache');
    memoryStorage = $injector.get('NSStorage.memoryStorage');
    $rootScope = $injector.get('$rootScope');

    defaultCache = new Cache(memoryStorage, 'default');
    defaultCache.clear();
  }));

  it('have to return null for unknown keys', function () {
    expect(defaultCache.get('foo')).toBeNull();
  });

  it('have to set and get items', function () {
    defaultCache.set('foo', objectToSave);
    expect(defaultCache.get('foo')).toEqual(objectToSave);
  });

  it('have to return null for expired keys', function (done) {
    defaultCache.set('foo', objectToSave, 100);

    setTimeout(function () {
      expect(defaultCache.get('foo')).toBeNull();
      done();
    }, 150);
  });

  it('have to return all keys in right order', function () {
    defaultCache.set('foo', objectToSave);
    defaultCache.set('bar', objectToSave);

    expect(defaultCache.keys()).toEqual(['foo', 'bar']);
  });

  it('have to return size of cache by `length` property', function () {
    defaultCache.set('foo', objectToSave);
    defaultCache.set('bar', objectToSave);

    expect(defaultCache.length).toBe(2);
  });

  it('have to delete all items by clear method', function () {
    defaultCache.set('foo', objectToSave);
    defaultCache.set('bar', objectToSave);

    defaultCache.clear();

    expect(defaultCache.length).toBe(0);
  });

  it('have to delete first item in case of out of `maxItems` option', function () {
    defaultCache = new Cache(memoryStorage, 'default', { maxItems: 2 });
    defaultCache.clear();

    defaultCache.set('first', 1);
    defaultCache.set('second', 2);
    defaultCache.set('third', 3);

    expect(defaultCache.keys()).toEqual(['second', 'third']);
  });

  it('have not delete item if we try to reset existing name', function () {
    defaultCache = new Cache(memoryStorage, 'default', { maxItems: 2 });
    defaultCache.clear();

    defaultCache.set('first', 1);
    defaultCache.set('second', 2);
    defaultCache.set('second', 3);

    expect(defaultCache.length).toBe(2);
  });

  it('have to use default ttl option', function (done) {
    defaultCache = new Cache(memoryStorage, 'default', { defaultTtl: 100 });
    defaultCache.clear();

    defaultCache.set('100', 100);

    setTimeout(function () {
      expect(defaultCache.get('100')).toBeNull();
      done();
    }, 200);
  });

  it('have to be able to create nested cache', function () {
    var nestedCache = defaultCache.create('nested');
    expect(nestedCache).toEqual(jasmine.any(Cache));
  });

  it('have to clear all nested data', function () {
    var nestedCache = defaultCache.create('nested');
    nestedCache.set('100', '200');

    defaultCache.clear();

    expect(nestedCache.get('100')).toBeNull();
  });

  it('should not clear storage started with the same prefix', function () {
    var anotherStorage = new Cache(memoryStorage, 'default-but-another');
    anotherStorage.set('foo', 200);

    defaultCache.clear();

    expect(anotherStorage.get('foo')).toBe(200);
  });

  it('should cache function call with the same arguments', function () {
    var i = 0;

    var add = function (value) {
      return i += value;
    };

    var hashedAdd = defaultCache.fn('add', add);

    hashedAdd(5);
    expect(hashedAdd(5)).toBe(5);
  });

  it('should not cache function call with different arguments', function () {
    var i = 0;

    var add = function (value) {
      return i += value;
    };

    var hashedAdd = defaultCache.fn('add', add);

    hashedAdd(3);
    expect(hashedAdd(5)).toBe(8);
  });

  it('have to cache promise', function (done) {
    var i = 0;

    var adding = function (value) {
      return new $q(function (accept) {
        accept(i += value);
      });
    };

    var cachedAdding = defaultCache.promise('adding', adding);

    cachedAdding(10).then(function (value) {
      expect(value).toBe(10);
      return cachedAdding(10);
    }).then(function (value) {
      expect(value).toBe(10);
      return cachedAdding(20);
    }).then(function (value) {
      expect(value).toBe(30);
    }).then(done);

    $rootScope.$digest();
  });
});
