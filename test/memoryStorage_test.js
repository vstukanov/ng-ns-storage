/**
 * Created by vst on 5/28/16.
 */

var module = angular.mock.module;
var inject = angular.mock.inject;

require('src/module.js');

describe('memoryStorage service', function () {
  var memoryStorage;

  beforeEach(module('NSStorage'));

  beforeEach(inject(['NSStorage.memoryStorage', function (_memoryStorage_) {
    memoryStorage = _memoryStorage_;
    memoryStorage.clear();
  }]));

  it('initially length have to be zero.', function () {
    expect(memoryStorage.length).toBe(0);
  });

  it('getItem for unknown key have to be null', function () {
    expect(memoryStorage.getItem('foo')).toBeNull();
  });

  it('getItem and setItem have to work', function () {
    memoryStorage.setItem('foo', 'bar');
    expect(memoryStorage.getItem('foo')).toBe('bar');
  });

  it('setItem have to covert value to strings', function () {
    memoryStorage.setItem('foo', 100);
    expect(memoryStorage.getItem('foo')).toBe('100');
  });

  it('method have to covert key to strings', function () {
    memoryStorage.setItem(10, 100);
    expect(memoryStorage.getItem('10')).toBe('100');
  });

  it('null should work as key', function () {
    memoryStorage.setItem(null, 'foo');
    expect(memoryStorage.getItem(null)).toBe('foo');
  });

  it('length should work properly', function () {
    memoryStorage.setItem(null, 'foo');
    memoryStorage.setItem(undefined, 'bar');
    memoryStorage.setItem(100, 'baz');
    memoryStorage.setItem('100', 'replace');

    expect(memoryStorage.length).toBe(3);
  });

  it('removeItem should work properly', function () {
    memoryStorage.setItem(null, 'foo');
    memoryStorage.setItem(undefined, 'bar');

    memoryStorage.removeItem(null);

    expect(memoryStorage.length).toBe(1);
  });

  it('clear should work properly', function () {
    memoryStorage.setItem(null, 'foo');
    memoryStorage.setItem(undefined, 'bar');
    memoryStorage.setItem(100, 'baz');
    memoryStorage.setItem('100', 'replace');

    memoryStorage.clear();

    expect(memoryStorage.length).toBe(0);
  });
});
