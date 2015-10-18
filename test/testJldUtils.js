/*jslint node: true, vars: true */

//
// Test JSONLD utils
//
var should = require('should'),
    jsonldUtils = require('../lib/jldUtils');

describe('jsonld utils tests', function() {
  'use strict';

  var ITEMS = 'http://test.schema.blah.blah.com/prop#items',
      API_T = {
        Assertion: 'http://a/type#Assertion',
        DatasetEntity: 'http://a/type#DatasetEntity',
        Error: 'http://a/type#Error',
        SvcRequest: 'http://a/type#SvcRequest'
      };

  describe('1 getO tests', function() {

    it('1.1 should handle a plain object- compact', function() {
      var  obj = {prop1: 'id1' }, doc = obj;
      (jsonldUtils.getO(doc)).should.equal(obj);
    });

    it('1.2 should handle an object with @value', function() {
      var  obj = {prop1: 'id1' }, doc = [obj];
      (jsonldUtils.getO(doc)).should.equal(obj);
    });

    it('1.3 should handle a null object and return null', function() {
      (jsonldUtils.getO(null) === null).should.be.equal(true);
    });

    it('1.4 should handle an undefined value and return null', function() {
      var  doc = {prop1: null};
      (jsonldUtils.getO(doc.prop2) === null).should.equal(true);
    });

  });

  describe('2 getV tests', function() {

    it('2.1 should handle a plain value - compact', function() {
      var  doc = {prop1: 'id1' };
      (jsonldUtils.getV(doc.prop1)).should.equal('id1');
    });

    it('2.2 should handle an object with @value', function() {
      var  doc = {prop1: {'@value': '23'}};
      (jsonldUtils.getV(doc.prop1)).should.equal('23');
    });

    it('2.3 should handle an array of 1 object with @value', function() {
      var  doc = {prop1: [{'@value': '23'}]};
      (jsonldUtils.getV(doc.prop1)).should.equal('23');
    });

    it('2.4 should handle a null value and return null', function() {
      (jsonldUtils.getV(null) === null).should.be.equal(true);
    });

    it('2.5 should handle an undefined value and return null', function() {
      var  doc = {prop1: null};
      (jsonldUtils.getV(doc.prop2) === null).should.equal(true);
    });
  });

  describe('3 getArray tests', function() {

    it('3.1 should handle a list', function() {
      var input = {}, output;
      input[ITEMS] = ['a', 'b', 'c'];

      output = jsonldUtils.getArray(input, ITEMS);
      output.length.should.be.equal(3);
    });

    it('3.2 should handle a value that should be a list', function() {
      var input = {}, output;
      input[ITEMS] = 'a';

      output = jsonldUtils.getArray(input, ITEMS);
      output.length.should.be.equal(1);
    });

    it('3.3 should handle an object that should be a list', function() {
      var input = {}, output;
      input[ITEMS] = {'@id': 'a'};

      output = jsonldUtils.getArray(input, ITEMS);
      output.length.should.be.equal(1);
    });

  });

  describe('4 isType tests', function() {

    it('4.1 should handle type as an array with one item', function() {
      var  obj = {};
      obj['@type'] = [API_T.SvcRequest];
      (jsonldUtils.isType(obj, API_T.SvcRequest)).should.equal(true);
      (jsonldUtils.isType(obj, API_T.Error)).should.equal(false);
    });

    it('4.2 should handle type as an array with >1 item', function() {
      var  obj = {};
      obj['@type'] = [API_T.SvcRequest, API_T.Error];
      (jsonldUtils.isType(obj, API_T.SvcRequest)).should.equal(true);
      (jsonldUtils.isType(obj, API_T.Error)).should.equal(true);
      (jsonldUtils.isType(obj, 'http://a.com/bogus')).should.equal(false);
    });

    it('4.3 should handle type as an object', function() {
      var  obj = {};
      obj['@type'] = API_T.Error;
      (jsonldUtils.isType(obj, API_T.Error)).should.equal(true);
      (jsonldUtils.isType(obj, 'http://a.com/bogus')).should.equal(false);
    });
  });

  describe('5 createBlankNode tests', function() {

    it('5.1 should handle just a type instance', function() {
      var  props = {}, node;
      props['@type'] = API_T.Assertion;

      node = jsonldUtils.createBlankNode(props);
      node.should.have.property('@id');
      node['@type'].should.containEql(API_T.Assertion);
    });

    it('5.2 should handle just a type array', function() {
      var  props = {}, node;
      props['@type'] = [API_T.Assertion, API_T.DatasetData];

      node = jsonldUtils.createBlankNode(props);
      node.should.have.property('@id');
      node['@type'].should.containEql(API_T.Assertion);
      node['@type'].should.containEql(API_T.DatasetData);
    });
  });

  describe('6 addType2Node tests', function() {

    it('6.1 add single type when node has no type property', function() {
      var  node = {};
      jsonldUtils.addType2Node(node, API_T.Assertion);
      node.should.have.property('@type');
      node['@type'].should.containEql(API_T.Assertion);
    });

    it('6.2 add arrays type when node has no type property', function() {
      var  node = {}, types = [API_T.Assertion, API_T.DatasetData];
      jsonldUtils.addType2Node(node, types);
      node.should.have.property('@type');
      node['@type'].should.containEql(API_T.Assertion);
      node['@type'].should.containEql(API_T.DatasetData);
    });

    it('6.3 add single type when node has an instance type property', function() {
      var  node = {};

      node['@type'] = API_T.DatasetEntity;
      jsonldUtils.addType2Node(node, API_T.Assertion);
      node.should.have.property('@type');
      node['@type'].should.containEql(API_T.Assertion);
      node['@type'].should.containEql(API_T.DatasetEntity);
    });

    it('6.4 add single type when node has an array type property', function() {
      var  node = {};

      node['@type'] = [API_T.DatasetEntity];
      jsonldUtils.addType2Node(node, API_T.Assertion);
      node.should.have.property('@type');
      node['@type'].should.containEql(API_T.Assertion);
      node['@type'].should.containEql(API_T.DatasetEntity);
    });

    it('6.5 add array type when node has an instance type property', function() {
      var  node = {}, types = [API_T.Assertion, API_T.DatasetData];

      node['@type'] = API_T.DatasetEntity;
      jsonldUtils.addType2Node(node, types);
      node.should.have.property('@type');
      node['@type'].should.containEql(API_T.Assertion);
      node['@type'].should.containEql(API_T.DatasetData);
      node['@type'].should.containEql(API_T.DatasetEntity);
    });

    it('6.6 add single type when node has an array type property', function() {
      var  node = {}, types = [API_T.Assertion, API_T.DatasetData];

      node['@type'] = [API_T.DatasetEntity];
      jsonldUtils.addType2Node(node, types);
      node.should.have.property('@type');
      node['@type'].should.containEql(API_T.Assertion);
      node['@type'].should.containEql(API_T.DatasetData);
      node['@type'].should.containEql(API_T.DatasetEntity);
    });

  });

});
