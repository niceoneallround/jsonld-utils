/*jslint node: true, vars: true */

//
// The privacy node uses framing to find a subject type within a graph
// and then it udpates it, and then replace.
//
// Issues
// - looks like jsonld makes a copy when framing so the update is to the
//   new node, so need to replace node in the graph. Thinking of flattening
//
const assert = require('assert');
const should = require('should');
const JSONLDPromises = require('../lib/jldUtils').promises;
const util = require('util');

let context = {
  address: 'http://acme.schema.webshield.io/prop#address',
  description: 'https://pn.schema.webshield.io/prop#description',
  etype: 'http://acme.schema.webshield.io/prop#etype',
  line1: 'http://acme.schema.webshield.io/prop#line1',
  name: 'http://acme.schema.webshield.io/prop#name',
  spare: 'http://acme.schema.webshield.io/prop#spare',
  child: 'http://acme.schema.webshield.io/prop#child',
  v: 'http://acme.schema.webshield.io/prop#v',

  Address:  'http://acme.schema.webshield.io/type#Address',
  Subject: 'http://acme.schema.webshield.io/type#Subject',
  EmbeddedSubject: 'http://acme.schema.webshield.io/type#EmbeddedSubject',
  SubjectIgnore: 'http://acme.schema.webshield.io/type#SubjectIgnore',
  PrivacyGraph: 'https://pn.schema.webshield.io/type#PrivacyGraph',
};

describe('1 FLATTENlw tests using light weight jsonld flatten wrapper', function () {
  'use strict';

  const testSubjects = {
      '@context': context,
      '@graph': [
        {
          '@id': 'http://id.webshield.io/com/acme/1',
          '@type': 'Subject',
          name: 'angus',
          description: 'subject, not a privacy graph',
          address: {
            '@id': 'http://id.webshield.io/com/acme/address/1_1',
            '@type': ['Address'],
            line1: 'address line 1'
          },
          child: {
            '@id': 'http://id.webshield.io/com/acme/child/1',
            '@type': 'Subject',
            description: 'embedded subject not a privacy graph',
            name: 'child_tasha',
            address: {
              '@id': 'http://id.webshield.io/com/acme/address/1_2',
              '@type': ['Address'],
              line1: 'address line 2'
            },
          },
        },
        {
          '@id': 'http://id.webshield.io/acme/com/2',
          '@type': ['Subject'],
          name: 'jackie',
          description: 'subject, not a privacy graph',
          address: {
            '@id': 'http://id.webshield.io/com/acme/2_1',
            '@type': ['Address'],
            line1: 'p_address line 1'
          },
          child: {
            '@id': 'http://id.webshield.io/acme/com/child/2',
            '@type': ['Subject'],
            description: 'embedded subject not a privacy graph',
            name: 'child_rebecca',
            address: {
              '@id': 'http://id.webshield.io/com/acme/2_2',
              '@type': ['Address'],
              line1: 'p_address line 2'
            },
          },
        },
      ]
    };

  let expandCompactTestSubjests;

  before(function () {

    let p1 =  JSONLDPromises.expandCompact(testSubjects);

    return Promise.all([p1])
      .then(
        function (values) {
          expandCompactTestSubjests = values[0];
        },

        function (err) {
          console.log('****ERRROR on expand:%s', err);
          assert.fail(util.format('unexpected error expanding doc: %j', err));
        }
      );
  });

  it('1.1 Flatten the array of subjects', function () {

    //
    // IMPORTANT THIS FLATTENS BOTH EMBEDDED SUBJECTS AND ADDRESS OBJECTS
    // ISSUE #1 the addresses are given a blank node id, the issue is that the id is not globally unique
    // so unless can flatten out if frame with another graph it joins the
    //
    return JSONLDPromises.flatten(expandCompactTestSubjests)
      .then(function (flattenResult) {
        console.log('**** FLATTENED GRAPH:%s', JSON.stringify(flattenResult, null, 2));
        flattenResult.length.should.be.equal(8); // all nodes
        return flattenResult;
      });
  }); // 1.1

  it('1.2 Flatten and then compact the array of subjects - as flatten expands', function () {

    return JSONLDPromises.flattenCompact(expandCompactTestSubjests)
      .then(function (result) {
        console.log('**** FLATTENED-COMPACTED GRAPH:%s', JSON.stringify(result, null, 2));
        result['@graph'].length.should.be.equal(8); // all nodes
      });
  }); // 1.2
}); // 1
