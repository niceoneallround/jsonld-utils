/*jslint node: true, vars: true */

//
// Test JSONLD utils
//
var assert = require('assert'),
    should = require('should'),
    jsonldUtils = require('../lib/jldUtils'),
    util = require('util');

describe('jsonld utils fetch objects', function () {
  'use strict';

  var context = {
    Address:  'http://acme.schema.webshield.io/type#Address',
    Subject: 'http://acme.schema.webshield.io/type#Subject',
    SubjectIgnore: 'http://acme.schema.webshield.io/type#SubjectIgnore',
    address: 'http://acme.schema.webshield.io/prop#address',
    name: 'http://acme.schema.webshield.io/prop#name'
  },
  doc = {
    '@context': context,
    '@graph':[
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
      var p1, p2;
      p1 = jsonldUtils.promises.findObjects(doc, context.Subject);
      p2 = p1.then(
        function (objects) {
          //console.log('1.1 findObjects result: %j', objects);
          objects.should.have.property('@id');
          objects.should.have.property('@type', context.Subject);
          objects.should.have.property(context.address);
          objects.should.have.property(context.name);
        },

        function (reason) {
          throw reason;
        });

      p2.catch(function (reason) {
        throw reason;
      });

      // return promise for mocha to check
      return p2;
    }); // 1.1

    it('1.2 findObjects passing two requested types', function () {
      var p1, p2;
      p1 = jsonldUtils.promises.findObjects(doc, [context.Subject, context.SubjectIgnore]);
      p2 = p1.then(
        function (objects) {
          //console.log('1.2 findObjects result: %j', objects);
          objects.length.should.be.equal(2, 'expected two objects back');
        },

        function (reason) {
          throw reason;
        });

      p2.catch(function (reason) {
        throw reason;
      });

      // return promise for mocha to check
      return p2;
    }); // 1.2

    it('1.3 findObjects pass non existent type', function () {
      var p1, p2;
      p1 = jsonldUtils.promises.findObjects(doc, ['bogus']);
      p2 = p1.then(
        function (objects) {
          assert(!objects, util.format('no object should be found for bogus type:%j', objects));
        },

        function (reason) {
          throw reason;
        });

      p2.catch(function (reason) {
        throw reason;
      });

      // return promise for mocha to check
      return p2;
    }); // 1.3

    it('1.4 findObjects pass non existent type with just a simple object', function () {
      var p1, p2, ldoc;

      ldoc = {
        '@context': context,
        '@id': '_:23',
        '@type': 'Subject',
        name: 'rich'
      };

      p1 = jsonldUtils.promises.findObjects(ldoc, ['bogus']);
      p2 = p1.then(
        function (objects) {
          assert(!objects, util.format('no object should be found for bogus type:%j', objects));
        },

        function (reason) {
          throw reason;
        });

      p2.catch(function (reason) {
        throw reason;
      });

      // return promise for mocha to check
      return p2;
    }); // 1.4

    it('1.5 findObjects pass valid type with just a simple object', function () {
      var p1, p2, ldoc;

      ldoc = {
        '@context': context,
        '@id': '_:23',
        '@type': 'Subject',
        name: 'rich'
      };

      p1 = jsonldUtils.promises.findObjects(ldoc, context.Subject);
      p2 = p1.then(
        function (objects) {
          assert(objects, util.format('object should be found for type:%j', objects));
        },

        function (reason) {
          throw reason;
        });

      p2.catch(function (reason) {
        throw reason;
      });

      // return promise for mocha to check
      return p2;
    }); // 1.5
  }); // 1
});
