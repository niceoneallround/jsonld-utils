/*jslint node: true, vars: true */

//
// Test JSONLD utils
//
var assert = require('assert'),
    should = require('should'),
    jsonld = require('jsonld'),

    //jsonldUtils = require('../lib/jldUtils'),
    util = require('util');

describe('LEARN jsonld npm library learnings', function () {
  'use strict';

  let context = {
    Address:  'http://acme.schema.webshield.io/type#Address',
    Subject: 'http://acme.schema.webshield.io/type#Subject',
    SubjectIgnore: 'http://acme.schema.webshield.io/type#SubjectIgnore',
    address: 'http://acme.schema.webshield.io/prop#address',
    name: 'http://acme.schema.webshield.io/prop#name'
  },
  doc = {
    '@context': context,
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

  describe('1 expand tests', function () {

    function checkExpanded(exp) {
      //console.log('checkExpanded:%j', exp);
      exp.length.should.be.equal(2);
      exp[0].should.have.property('@id');
      exp[0].should.have.property('@type');
      exp[0].should.have.property('http://acme.schema.webshield.io/prop#name');
    }

    // note how return the promise and do not use a done method :)
    it('1.1 expand using a promise', function () {
      let p1 = new Promise(function (resolve, reject) {
        //console.log('setting up promise');
        jsonld.expand(doc, function (err, expanded) {
          if (err) {
            reject(err);
          } else {
            resolve(expanded);
          }
        });
      });

      //console.log('setting up promise then and catch');
      let p2 = p1.then(
        function (value) { // ok
          //console.log('expanded1.1: %j', value);
          checkExpanded(value);
        },

        function (reason) { // err
          assert.fail(util.format('1.1 Unexpected expand error:%s', reason));
        }
      );

      // setup p2 to catch any error in succesful processing
      p2.catch(
        function (reason) { // error in then ok
          //console.log('p2.catch: %s', reason);
          assert.fail(util.format('1.1 Unexpected error when processing a successful expand:%s', reason));
        });

      // return promise so mocha can check result
      return p2;
    }); // 1.1

    it('1.2 expand using jsonld promises', function () {
      let p1 = jsonld.promises.expand(doc);
      p1.then(
        function (expanded) {
          //console.log('expanded 1.2: %j', expanded);
          checkExpanded(expanded);
        })
        .catch(
          function (reason) {
            assert(reason, util.format('unexpected error expanding doc: %j', reason));
          }
        );

      // return promise for mocha to check
      return p1;
    }); // 1.2
  }); // 1

  describe('2 framing tests base is not a graph', function () {

    let expandedDoc;

    before(function () {
      return jsonld.promises.expand(doc)
        .then(
          function (expanded) {
            expandedDoc = expanded;
          })
        .catch(
          function (reason) {
            assert.fail(util.format('2.before unexpected error expanding doc: %s', reason));
          }
        );
    });

    it('2.1 find Subjects in document', function () {

      const frame = {
            '@embed': true,
            '@type': 'http://acme.schema.webshield.io/type#Subject'
          };

      return jsonld.promises.frame(expandedDoc, frame)
        .then(
          function (framed) {
            framed['@graph'].length.should.be.equal(1);
            let s = framed['@graph'][0];
            s.should.have.property('@type', frame['@type']);
          })
        .catch(
          function (reason) {
            assert.fail(util.format('2.1 unexpected error expanding doc: %s', reason));
          });
    }); // 2.1
  });

  describe('3 framing tests base is a named graph', function () {

    let namedGraph = {
      '@context': context,
      '@id': 'http://id.webshield.io/nameGraph/1',
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

    var expandedDoc;

    before(function () {
      return jsonld.promises.expand(namedGraph)
        .then(
          function (expanded) {
            expandedDoc = expanded;
          })
          .catch(
            function (reason) {
              assert.fail(util.format('unexpected error expanding doc: %j', reason));
            }
          );
    });

    it('3.1 find Subjects in document', function () {

      const frame = {
            '@embed': 'false',
            '@type': 'http://acme.schema.webshield.io/type#Subject'
          };

      return jsonld.promises.frame(expandedDoc, frame)
        .then(
          function (framed) {
            //console.log('3.1 framed:%j', framed);
            framed['@graph'].length.should.be.equal(1);
            let s = framed['@graph'][0];
            s.should.have.property('@type', frame['@type']);
          })
        .catch(
          function (reason) {
            assert.fail(util.format('3.1 unexpected error expanding doc: %j', reason));
          });
    }); // 3.1
  });

});
