/*jslint node: true, vars: true */

//
// The privacy node uses framing to find a subject type within a graph
// and then it udpates it, and then replace.
//
// Issues
// - looks like jsonld makes a copy when framing so the update is to the
//   new node, so need to replace node in the graph. Thinking of flattening
//
var assert = require('assert'),
    should = require('should'),
    jsonld = require('jsonld'),

    //jsonldUtils = require('../lib/jldUtils'),
    util = require('util');

describe('jsonld framing library learnings', function () {
  'use strict';

  var context = {
    Address:  'http://acme.schema.webshield.io/type#Address',
    Subject: 'http://acme.schema.webshield.io/type#Subject',
    SubjectType2: 'http://acme.schema.webshield.io/type#SubjectType2',
    SubjectIgnore: 'http://acme.schema.webshield.io/type#SubjectIgnore',
    address: 'http://acme.schema.webshield.io/prop#address',
    name: 'http://acme.schema.webshield.io/prop#name',
    child: 'http://acme.schema.webshield.io/prop#child'
  },
  /*graphArrayOfSubjects = {
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
  },*/
  graphEmbeddedSubject = {
    '@context': context,
    '@graph':[
      {
        '@id': 'http://id.webshield.io/acme/com/3',
        '@type': 'Subject',
        name: 'rich',
        address: {
          '@id': '_:ba1',
          '@type': ['Address'],
          name: 'address line 1'
        },
        child: {
          '@id': 'http://id.webshield.io/acme/com/child/1',
          '@type': 'SubjectType2',
          name: 'child_tasha',
          address: {
            '@id': '_:ba1',
            '@type': ['Address'],
            name: 'address line 2'
          }
        }
      }
    ]
  };

  describe('1 framing tests embedded object', function () {
    var expandedDoc;

    before(function () {
      var p1 = jsonld.promises.expand(graphEmbeddedSubject);
      p1.then(
        function (expanded) {
          expandedDoc = expanded;
          console.log('Expanded embedded doc:%j', expandedDoc);
        })
        .catch(
          function (reason) {
            assert.fail(util.format('unexpected error expanding doc: %j', reason));
          }
        );

      // return promise for mocha to check
      return p1;
    });

    it('2.1 find Subjects in document', function () {

      var promiseFramed, promiseUpdated, promiseDone, promiseFlattenedExpanded,
          frame = {
            '@embed': 'false',
            '@type': 'http://acme.schema.webshield.io/type#SubjectType2'
          };

      promiseFramed = jsonld.promises.frame(expandedDoc, frame);
      promiseUpdated = promiseFramed
        .then(function (framed) {
            var s;
            console.log('----1.1------framed:%j', framed);
            framed['@graph'].length.should.be.equal(1);
            s = framed['@graph'][0];
            s.should.have.property('@type', frame['@type']);
            s[context.name] = 'set-name-in-object-from-frame';
            console.log('----1.1-framed: name:%j after update:%j', s[context.name], framed);
            console.log('----1.1-Original name:%j after update:%j',
                        graphEmbeddedSubject['@graph'][0].child.name, graphEmbeddedSubject);
            return framed;
          });

      // lets flatten thr original
      promiseFlattenedExpanded = jsonld.promises.flatten(expandedDoc);
      promiseDone = promiseFlattenedExpanded
        .then(function (flattened) {
          var i;
          console.log('====flattend expanded:%j', flattened);
          for (i = 0; i < flattened.length; i++) {
            console.log('flattened[%s]:%j', i, flattened[i]);
          }

          // get updated
          return promiseUpdated
            .then(function (updated) {
              var j;
              console.log('----have updated: %j', updated);
              console.log('----have updated with flattened: %j', flattened);

              for (j = 0; j < flattened.length; j++) {
                console.log('+++++++++-matching %s with %j', updated['@graph'][0]['@id'], flattened[j]['@id']);
                if (flattened[j]['@id'] === updated['@graph'][0]['@id']) {
                  console.log('+++++++++-MATCHED %s with %s', updated['@graph'][0]['@id'], flattened[j]['@id']);
                  flattened[j] = updated['@graph'][0];
                }
              }

              return flattened;
            });
        });

      return promiseDone
        .then(function (result) {
          console.log('-----Final result:%j  - orginal:%j', result, expandedDoc);
        });
    }); // 2.1
  });

});
