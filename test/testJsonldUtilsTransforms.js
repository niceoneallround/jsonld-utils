/*jslint node: true, vars: true */

//
// Test JSONLD utils
//
var assert = require('assert'),
    should = require('should'),
    jsonldUtils = require('../lib/jldUtils'),
    util = require('util');

describe('FIND jsonld utils fetch objects', function () {
  'use strict';

  const context = {
    Address:  'http://acme.schema.webshield.io/type#Address',
    Subject: 'http://acme.schema.webshield.io/type#Subject',
    SubjectIgnore: 'http://acme.schema.webshield.io/type#SubjectIgnore',
    address: 'http://acme.schema.webshield.io/prop#address',
    name: 'http://acme.schema.webshield.io/prop#name'
  };

  let optionsMap = new Map();
  optionsMap.set('@context', context);

  const doc = {
    '@graph': [
      {
        '@id': 'http://id.webshield.io/acme/com/1',
        '@type': 'Subject',
        name: 'rich',
        address: {
          '@id': '_:ba1',
          '@type': ['Address'],
          name: 'address line 1'
        }
      },
      {
        '@id': 'http://id.webshield.io/acme/com/2',
        '@type': 'SubjectIgnore',
        name: 'bob',
        address: {
          '@id': '_:ba1',
          '@type': ['Address'],
          name: 'address line 1'
        }
      }
    ]
  };

  //console.log('Base doc:%j', doc);

  describe('1 test finding objects of type in graph', function () {

    it('1.1 findObjects with one type ', function () {
      return jsonldUtils.promises.findObjects(doc, context.Subject, optionsMap)
        .then(
          function (objects) {
            //console.log('1.1 findObjects result: %j', objects);
            objects.should.have.property('@id');
            objects.should.have.property('@type', context.Subject);
            objects.should.have.property(context.address);
            objects.should.have.property(context.name);
            doc.should.not.have.property('@context');
          }
        );
    }); // 1.1

    it('1.2 findObjects passing two requested types', function () {
      return jsonldUtils.promises.findObjects(doc, [context.Subject, context.SubjectIgnore], optionsMap)
        .then(
          function (objects) {
            //console.log('1.2 findObjects result: %j', objects);
            objects.length.should.be.equal(2, 'expected two objects back');
          }
        );
    }); // 1.2

    it('1.3 findObjects pass non existent type', function () {
      return jsonldUtils.promises.findObjects(doc, ['bogus'], optionsMap)
        .then(
          function (objects) {
            assert(!objects, util.format('no object should be found for bogus type:%j', objects));
          }
        );
    }); // 1.3

    it('1.4 findObjects pass non existent type with just a simple object', function () {
      const ldoc = {
        '@context': context, '@id': '_:23',
        '@type': 'Subject', name: 'rich' };

      return jsonldUtils.promises.findObjects(ldoc, ['bogus'], optionsMap)
        .then(
          function (objects) {
            assert(!objects, util.format('no object should be found for bogus type:%j', objects));
          }
        );
    }); // 1.4

    it('1.5 findObjects pass valid type with just a simple object', function () {
      const ldoc = {
        '@context': context,
        '@id': '_:23',
        '@type': 'Subject',
        name: 'rich' };

      return jsonldUtils.promises.findObjects(ldoc, context.Subject, optionsMap)
        .then(
          function (objects) {
            assert(objects, util.format('object should be found for type:%j', objects));
          }
        );
    }); // 1.5
  }); // 1
});
