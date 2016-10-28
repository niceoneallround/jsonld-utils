/*jslint node: true, vars: true */

//
// Test JSONLD utils
//
const assert = require('assert');
const should = require('should');
const jsonldUtils = require('../lib/jldUtils');
const util = require('util');

describe('jsonld utils tests', function () {
  'use strict';

  var ITEMS = 'http://test.schema.blah.blah.com/prop#items',
      API_T = {
        Assertion: 'http://test/type#Assertion',
        DatasetData: 'http://test/type#DatasetData',
        DatasetEntity: 'http://test/type#DatasetEntity',
        Error: 'http://test/type#Error',
        SvcRequest: 'http://test/type#SvcRequest',
      };

  describe('1 getO tests', function () {

    it('1.1 should handle a plain object- compact', function () {
      var  obj = { prop1: 'id1' },
          doc = obj;
      (jsonldUtils.getO(doc)).should.equal(obj);
    });

    it('1.2 should handle an object with @value', function () {
      var  obj = { prop1: 'id1' }, doc = [obj];
      (jsonldUtils.getO(doc)).should.equal(obj);
    });

    it('1.3 should handle a null object and return null', function () {
      (jsonldUtils.getO(null) === null).should.be.equal(true);
    });

    it('1.4 should handle an undefined value and return null', function () {
      var  doc = { prop1: null };
      (jsonldUtils.getO(doc.prop2) === null).should.equal(true);
    });
  });

  describe('2 getV tests', function () {

    it('2.1 should handle a plain value - compact', function () {
      var  doc = { prop1: 'id1' };
      (jsonldUtils.getV(doc.prop1)).should.equal('id1');
    });

    it('2.2 should handle an expanded @value not in an array', function () {
      var  doc = { prop1: { '@value': '23' } };
      (jsonldUtils.getV(doc.prop1)).should.equal('23');
    });

    it('2.3 should handle an expanded @value in an array', function () {
      var  doc = { prop1: [{ '@value': '23' }] };
      (jsonldUtils.getV(doc.prop1)).should.equal('23');
    });

    it('2.4 should handle a null value and return null', function () {
      (jsonldUtils.getV(null) === null).should.be.equal(true);
    });

    it('2.5 should handle an undefined value and return null', function () {
      var  doc = { prop1: null };
      (jsonldUtils.getV(doc.prop2) === null).should.equal(true);
    });

    it('2.6 should handle an empty array', function () {
      var  doc = { prop1: [] };
      (jsonldUtils.getV(doc.prop2) === null).should.equal(true);
    });

    it('2.7 check should work with other paths to accessors', function () {
      var  doc = { prop1: 'id1' };
      (jsonldUtils.npUtils.getV(doc, 'prop1')).should.equal('id1');
      (jsonldUtils.pUtils.getV(doc.prop1)).should.equal('id1');
    });
  });

  describe('3 getArray tests', function () {

    it('3.1 should handle a list', function () {
      var input = {}, output;
      input[ITEMS] = ['a', 'b', 'c'];

      output = jsonldUtils.getArray(input, ITEMS);
      output.length.should.be.equal(3);
    });

    it('3.2 should handle a value that should be a list', function () {
      var input = {}, output;
      input[ITEMS] = 'a';

      output = jsonldUtils.getArray(input, ITEMS);
      output.length.should.be.equal(1);
    });

    it('3.3 should handle an object that should be a list', function () {
      var input = {}, output;
      input[ITEMS] = { '@id': 'a' };

      output = jsonldUtils.getArray(input, ITEMS);
      output.length.should.be.equal(1);
    });

    it('3.4 should support get array on pUtils, and npUtils', function () {
      let input = {}, output;
      input[ITEMS] = ['a', 'b', 'c'];

      output = jsonldUtils.pUtils.getArray(input, ITEMS);
      output.length.should.be.equal(3);

      output = jsonldUtils.npUtils.getArray(input, ITEMS);
      output.length.should.be.equal(3);
    });

  });

  describe('4 isType tests', function () {

    it('4.1 should handle type as an array with one item', function () {
      var  obj = {};
      obj['@type'] = [API_T.SvcRequest];
      (jsonldUtils.isType(obj, API_T.SvcRequest)).should.equal(true);
      (jsonldUtils.isType(obj, API_T.Error)).should.equal(false);
    });

    it('4.2 should handle type as an array with >1 item', function () {
      var  obj = {};
      obj['@type'] = [API_T.SvcRequest, API_T.Error];
      (jsonldUtils.isType(obj, API_T.SvcRequest)).should.equal(true);
      (jsonldUtils.isType(obj, API_T.Error)).should.equal(true);
      (jsonldUtils.isType(obj, 'http://a.com/bogus')).should.equal(false);
    });

    it('4.3 should handle type as an object', function () {
      var  obj = {};
      obj['@type'] = API_T.Error;
      (jsonldUtils.isType(obj, API_T.Error)).should.equal(true);
      (jsonldUtils.isType(obj, 'http://a.com/bogus')).should.equal(false);
    });

    it('4.4 should support isType on pUtils, and npUtils', function () {
      var  obj = {};
      obj['@type'] = [API_T.SvcRequest];
      (jsonldUtils.pUtils.isType(obj, API_T.SvcRequest)).should.equal(true);
      (jsonldUtils.npUtils.isType(obj, API_T.Error)).should.equal(false);
    });
  });

  describe('5 createBlankNode tests', function () {

    it('5.1 should handle just a type instance', function () {
      var  props = {}, node;
      props['@type'] = API_T.Assertion;

      node = jsonldUtils.createBlankNode(props);
      node.should.have.property('@id');
      node['@type'].should.containEql(API_T.Assertion);
    });

    it('5.2 should handle just a type array', function () {
      var  props = {}, node;
      props['@type'] = [API_T.Assertion, API_T.DatasetData];

      node = jsonldUtils.createBlankNode(props);
      node.should.have.property('@id');
      node['@type'].should.containEql(API_T.Assertion);
      node['@type'].should.containEql(API_T.DatasetData);
    });
  });

  describe('6 addType2Node tests', function () {

    it('6.1 add single type when node has no type property', function () {
      var  node = {};
      jsonldUtils.addType2Node(node, API_T.Assertion);
      node.should.have.property('@type');
      node['@type'].should.containEql(API_T.Assertion);
    });

    it('6.2 add arrays type when node has no type property', function () {
      var node = {},
        types = [API_T.Assertion, API_T.DatasetData];
      jsonldUtils.addType2Node(node, types);
      node.should.have.property('@type');
      node['@type'].should.containEql(API_T.Assertion);
      node['@type'].should.containEql(API_T.DatasetData);
    });

    it('6.3 add single type when node has an instance type property', function () {
      var node = {};

      node['@type'] = API_T.DatasetEntity;
      jsonldUtils.addType2Node(node, API_T.Assertion);
      node.should.have.property('@type');
      node['@type'].should.containEql(API_T.Assertion);
      node['@type'].should.containEql(API_T.DatasetEntity);
    });

    it('6.4 add single type when node has an array type property', function () {
      var node = {};

      node['@type'] = [API_T.DatasetEntity];
      jsonldUtils.addType2Node(node, API_T.Assertion);
      node.should.have.property('@type');
      node['@type'].should.containEql(API_T.Assertion);
      node['@type'].should.containEql(API_T.DatasetEntity);
    });

    it('6.5 add array type when node has an instance type property', function () {
      var node = {},
        types = [API_T.Assertion, API_T.DatasetData];

      node['@type'] = API_T.DatasetEntity;
      jsonldUtils.addType2Node(node, types);
      node.should.have.property('@type');
      node['@type'].should.containEql(API_T.Assertion);
      node['@type'].should.containEql(API_T.DatasetData);
      node['@type'].should.containEql(API_T.DatasetEntity);
    });

    it('6.6 add single type when node has an array type property', function () {
      var node = {}, types = [API_T.Assertion, API_T.DatasetData];

      node['@type'] = [API_T.DatasetEntity];
      jsonldUtils.addType2Node(node, types);
      node.should.have.property('@type');
      node['@type'].should.containEql(API_T.Assertion);
      node['@type'].should.containEql(API_T.DatasetData);
      node['@type'].should.containEql(API_T.DatasetEntity);
    });
  }); // describe 6

  describe('7 createNode tests', function () {

    var id = 'http://test.webshield.io/27272';

    it('7.1 create a node with single type', function () {
      var node = {};
      node = jsonldUtils.createNode(id, API_T.Assertion);
      node.should.have.property('@id', id);
      node.should.have.property('@type');
      assert(jsonldUtils.isType(node, API_T.Assertion), util.format('node does not have API_T:Assertion:%j', node));
      assert(Array.isArray(node['@type']), '@type is not an array');
    });

    it('7.2 create a node with an array of types', function () {
      var node = {};
      node = jsonldUtils.createNode(id, [API_T.Assertion, API_T.DatasetData]);
      node.should.have.property('@id', id);
      node.should.have.property('@type');
      assert(Array.isArray(node['@type']), '@type is not an array');
      assert(jsonldUtils.isType(node, API_T.Assertion), util.format('node does not have API_T:Assertion:%j', node));
      assert(jsonldUtils.isType(node, API_T.DatasetData), util.format('node does not have API_T:DatasetData:%j', node));
    });

  }); // describe 7

  describe('8 createV tests', function () {

    it('8.1 create a value', function () {
      var v = {};
      v = jsonldUtils.createV({ value: '23', type: ['a'] });
      v.should.have.property('@value', '23');
      v.should.have.property('@type', ['a']);
    });
  }); // describe 8

  describe('9 getId tests', function () {

    it('9.1 get id from an object', function () {
      var id = { '@id': '23' }, node;
      node = { prop: id };
      jsonldUtils.npUtils.getId(node, 'prop').should.be.equal('23');
    });

    it('9.2 get id from a value', function () {
      var id = '23', node;
      node = { prop: id };
      jsonldUtils.npUtils.getId(node, 'prop').should.be.equal('23');
    });

    it('3.2 get id from a typed value', function () {
      var id = jsonldUtils.createV({ value: '23', type: ['a'] }), node;
      node = { prop: id };
      jsonldUtils.npUtils.getId(node, 'prop').should.be.equal('23');
    });
  }); // describe 9

});
