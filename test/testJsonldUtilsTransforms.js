/*jslint node: true, vars: true */

//
// Test JSONLD utils
//
var //assert = require('assert'),
    should = require('should'),
    jsonldUtils = require('../lib/jldUtils');

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

  console.log('Base doc:%j', doc);

  describe('1 test finding objects of type in graph', function () {

    it('1.1 findObjects with one type ', function () {
      var p1, p2;
      p1 = jsonldUtils.findObjectsPromise(doc, context.Subject);
      p2 = p1.then(
        function (objects) {
          console.log('1.1 findObjects result: %j', objects);
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
      p1 = jsonldUtils.findObjectsPromise(doc, [context.Subject, context.SubjectIgnore]);
      p2 = p1.then(
        function (objects) {
          console.log('1.2 findObjects result: %j', objects);
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
    }); // 1.1
  }); // 1
});
