/*jslint node: true, vars: true */

//
// Validate that compact can be used to merge nodes with the same @id
// in a set of nodes
//
// Issues
//
const should = require('should');
const JSONLDPromises = require('../lib/jldUtils').promises;

describe('1 Validate thta frame can merge two graphs as expected', function () {
  'use strict';

  const EMBED = true;

  const subject1 = {
    '@id': 'http://id.webshield.io/acme/com/1',
    '@type': 'https://pn.schema.webshield.io/type#Subject',
    'https://schema.org/givenName': 'rich',
    'https://pn.schema.webshield.io/prop#sourceID': 'a-id',
    'https://schema.org/address': {
      '@id': 'http://id.webshield.io/acme/com/address/1',
      '@type': 'https://schema.org/PostalAddress',
      'https://schema.org/postalCode': '94123',
    },
  };

  it('1.1 should produce a single node for the subject and merge properties', function () {

    const subject2 = { // same id mix of same and different proprties
      '@id': 'http://id.webshield.io/acme/com/1',
      '@type': 'https://pn.schema.webshield.io/type#Subject',
      'https://pn.schema.webshield.io/prop#sourceID': 'a-id',
      'https://schema.org/email': 'a_email',
      'https://schema.org/address': {
        '@id': 'http://id.webshield.io/acme/com/address/1',
        '@type': 'https://schema.org/PostalAddress',
        'https://schema.org/addressRegion': 'SF',
      },
    };

    const expandedDoc = { '@graph': [subject1, subject2] };

    return JSONLDPromises.frame(expandedDoc, ['https://pn.schema.webshield.io/type#Subject'], EMBED) // embed
      .then(function (frameResult) {
        //console.log('***FRAMED RESULT:%s', JSON.stringify(frameResult, null, 2));

        frameResult.should.not.have.property('@context');
        frameResult.should.have.property('@graph');
        frameResult['@graph'].length.should.be.equal(1);
        let subject = frameResult['@graph'][0];
        subject.should.have.property('@id');
        subject.should.have.property('@type', 'https://pn.schema.webshield.io/type#Subject');
        subject.should.have.property('https://schema.org/email');
        subject.should.have.property('https://schema.org/givenName', 'rich');
        subject.should.have.property('https://pn.schema.webshield.io/prop#sourceID', 'a-id');
        subject.should.have.property('https://schema.org/address');
        subject['https://schema.org/address'].should.have.property('@id');
        subject['https://schema.org/address'].should.have.property('https://schema.org/addressRegion', 'SF');
        subject['https://schema.org/address'].should.have.property('https://schema.org/postalCode', '94123');
      },

      function  (err) {
        console.log('TEST-FAILED', err);
        throw err;
      });
  }); // 1.1

  it('1.2 should merge as same ID but different subject types so adds both types to subject @type', function () {

    const subject2 = { // same id different type
      '@id': 'http://id.webshield.io/acme/com/1',
      '@type': 'https://pn.schema.webshield.io/type#Subject_ANOTHER',
      'https://pn.schema.webshield.io/prop#sourceID': 'a-id',
      'https://schema.org/email': 'a_email',
      'https://schema.org/address': {
        '@id': 'http://id.webshield.io/acme/com/address/1',
        '@type': 'https://schema.org/PostalAddress',
        'https://schema.org/addressRegion': 'SF',
      },
    };

    const expandedDoc = { '@graph': [subject1, subject2] };

    return JSONLDPromises.frame(expandedDoc, ['https://pn.schema.webshield.io/type#Subject'], EMBED) // embed
      .then(function (frameResult) {
        //console.log('***FRAMED RESULT:%s', JSON.stringify(frameResult, null, 2));

        frameResult.should.not.have.property('@context');
        frameResult.should.have.property('@graph');
        frameResult['@graph'].length.should.be.equal(1);
        let subject = frameResult['@graph'][0];
        subject.should.have.property('@id');
        subject.should.have.property('@type');
        subject['@type'].length.should.be.equal(2);
        subject.should.have.property('https://schema.org/email');
        subject.should.have.property('https://schema.org/givenName', 'rich');
        subject.should.have.property('https://pn.schema.webshield.io/prop#sourceID', 'a-id');
        subject.should.have.property('https://schema.org/address');
        subject['https://schema.org/address'].should.have.property('@id');
        subject['https://schema.org/address'].should.have.property('https://schema.org/addressRegion', 'SF');
        subject['https://schema.org/address'].should.have.property('https://schema.org/postalCode', '94123');
      },

      function  (err) {
        console.log('TEST-FAILED', err);
        throw err;
      });
  }); // 1.2

  it('1.3 should only return graph of type asked', function () {

    const subject2 = { // diffrent id and type
      '@id': 'http://id.webshield.io/ANOTHER/com/1',
      '@type': 'https://pn.schema.webshield.io/type#Subject_ANOTHER',
      'https://pn.schema.webshield.io/prop#sourceID': 'a-id',
      'https://schema.org/email': 'a_email',
      'https://schema.org/address': {
        '@id': 'http://id.webshield.io/acme/com/address/1',
        '@type': 'https://schema.org/PostalAddress',
        'https://schema.org/addressRegion': 'SF',
      },
    };

    const expandedDoc = { '@graph': [subject1, subject2] };

    return JSONLDPromises.frame(expandedDoc, ['https://pn.schema.webshield.io/type#Subject'], EMBED) // embed
      .then(function (frameResult) {
        //console.log('***FRAMED RESULT:%s', JSON.stringify(frameResult, null, 2));

        frameResult.should.not.have.property('@context');
        frameResult.should.have.property('@graph');
        frameResult['@graph'].length.should.be.equal(1);
        let subject = frameResult['@graph'][0];
        subject.should.have.property('@id');
        subject.should.have.property('@type', 'https://pn.schema.webshield.io/type#Subject');
        subject.should.not.have.property('https://schema.org/email');
        subject.should.have.property('https://schema.org/givenName', 'rich');
        subject.should.have.property('https://pn.schema.webshield.io/prop#sourceID', 'a-id');
        subject.should.have.property('https://schema.org/address');
        subject['https://schema.org/address'].should.have.property('@id');
        subject['https://schema.org/address'].should.have.property('https://schema.org/addressRegion', 'SF');
        subject['https://schema.org/address'].should.have.property('https://schema.org/postalCode', '94123');
      },

      function  (err) {
        console.log('TEST-FAILED', err);
        throw err;
      });
  }); // 1.3

  it('1.4 should return all subjects if pass in all types', function () {

    const subject2 = { // same id and type
      '@id': 'http://id.webshield.io/acme/com/1',
      '@type': 'https://pn.schema.webshield.io/type#Subject',
      'https://pn.schema.webshield.io/prop#sourceID': 'a-id',
      'https://schema.org/email': 'a_email',
      'https://schema.org/address': {
        '@id': 'http://id.webshield.io/acme/com/address/1',
        '@type': 'https://schema.org/PostalAddress',
        'https://schema.org/addressRegion': 'SF',
      },
    };

    const anotherSubjectAndType = { // different id and type
      '@id': 'http://id.webshield.io/ANOTHER/com/1',
      '@type': 'https://pn.schema.webshield.io/type#Subject_ANOTHER',
      'https://pn.schema.webshield.io/prop#sourceID': 'a-id2',
      'https://schema.org/email': 'a_email',
      'https://schema.org/address': {
        '@id': 'http://id.webshield.io/ANOTHER/com/address/1',
        '@type': 'https://schema.org/PostalAddress',
        'https://schema.org/addressRegion': 'SF',
      },
    };

    const expandedDoc = { '@graph': [subject1, subject2, anotherSubjectAndType] };
    const types = ['https://pn.schema.webshield.io/type#Subject',
                    'https://pn.schema.webshield.io/type#Subject_ANOTHER'];

    return JSONLDPromises.frame(expandedDoc, types, EMBED) // embed
      .then(function (frameResult) {
        //console.log('***FRAMED RESULT:%s', JSON.stringify(frameResult, null, 2));

        frameResult.should.not.have.property('@context');
        frameResult.should.have.property('@graph');
        frameResult['@graph'].length.should.be.equal(2); // should merge one subject
        let subjects =   frameResult['@graph'];

        for (let i = 0; i < subjects.length; i++) {
          let subject = subjects[i];
          if (subject['@id'] === subject1['@id']) {
            subject.should.have.property('@id', 'http://id.webshield.io/acme/com/1');
            subject.should.have.property('@type', 'https://pn.schema.webshield.io/type#Subject');
            subject.should.have.property('https://schema.org/email');
            subject.should.have.property('https://schema.org/givenName', 'rich');
            subject.should.have.property('https://pn.schema.webshield.io/prop#sourceID', 'a-id');
            subject.should.have.property('https://schema.org/address');
            subject['https://schema.org/address'].should.have.property('@id');
            subject['https://schema.org/address'].should.have.property('https://schema.org/addressRegion', 'SF');
            subject['https://schema.org/address'].should.have.property('https://schema.org/postalCode', '94123');

          } else {
            subject.should.have.property('@id', 'http://id.webshield.io/ANOTHER/com/1');
            subject.should.have.property('@type', 'https://pn.schema.webshield.io/type#Subject_ANOTHER');
            subject.should.have.property('https://schema.org/email', 'a_email');
            subject.should.not.have.property('https://schema.org/givenName');
            subject.should.have.property('https://pn.schema.webshield.io/prop#sourceID', 'a-id2');
            subject.should.have.property('https://schema.org/address');
            subject['https://schema.org/address'].should.have.property('@id', 'http://id.webshield.io/ANOTHER/com/address/1');
            subject['https://schema.org/address'].should.have.property('https://schema.org/addressRegion', 'SF');
            subject['https://schema.org/address'].should.not.have.property('https://schema.org/postalCode');
          }
        }
      },

      function  (err) {
        console.log('TEST-FAILED', err);
        throw err;
      });
  }); // 1.4

  it('1.5 should return all subjects if all share the same type for example PriavcyGraph but should only merge on id', function () {

    const COMMON_TYPE = 'http://pn.schema.webshield.io/type#COMMON';

    const pg1 = {
      '@id': 'http://id.webshield.io/acme/com/1',
      '@type': ['https://pn.schema.webshield.io/type#Subject', COMMON_TYPE],
      'https://schema.org/givenName': 'rich',
      'https://pn.schema.webshield.io/prop#sourceID': 'a-id',
      'https://schema.org/address': {
        '@id': 'http://id.webshield.io/acme/com/address/1',
        '@type': 'https://schema.org/PostalAddress',
        'https://schema.org/postalCode': '94123',
      },
    };

    const pg2 = { // same id and type
      '@id': 'http://id.webshield.io/acme/com/1',
      '@type': ['https://pn.schema.webshield.io/type#Subject', COMMON_TYPE],
      'https://pn.schema.webshield.io/prop#sourceID': 'a-id',
      'https://schema.org/email': 'a_email',
      'https://schema.org/address': {
        '@id': 'http://id.webshield.io/acme/com/address/1',
        '@type': 'https://schema.org/PostalAddress',
        'https://schema.org/addressRegion': 'SF',
      },
    };

    const pg3 = { // different id and type
      '@id': 'http://id.webshield.io/ANOTHER/com/1',
      '@type': ['https://pn.schema.webshield.io/type#Subject_ANOTHER', COMMON_TYPE],
      'https://pn.schema.webshield.io/prop#sourceID': 'a-id2',
      'https://schema.org/email': 'a_email',
      'https://schema.org/address': {
        '@id': 'http://id.webshield.io/ANOTHER/com/address/1',
        '@type': 'https://schema.org/PostalAddress',
        'https://schema.org/addressRegion': 'SF',
      },
    };

    const expandedDoc = { '@graph': [pg1, pg2, pg3] };
    const types = [COMMON_TYPE];

    return JSONLDPromises.frame(expandedDoc, types, EMBED) // embed
      .then(function (frameResult) {
        console.log('***FRAMED RESULT:%s', JSON.stringify(frameResult, null, 2));

        frameResult.should.not.have.property('@context');
        frameResult.should.have.property('@graph');
        frameResult['@graph'].length.should.be.equal(2); // should merge one subject
        let subjects =   frameResult['@graph'];

        for (let i = 0; i < subjects.length; i++) {
          let subject = subjects[i];
          if (subject['@id'] === subject1['@id']) {
            subject.should.have.property('@id', 'http://id.webshield.io/acme/com/1');
            subject['@type'].length.should.be.equal(2);
            subject.should.have.property('https://schema.org/email');
            subject.should.have.property('https://schema.org/givenName', 'rich');
            subject.should.have.property('https://pn.schema.webshield.io/prop#sourceID', 'a-id');
            subject.should.have.property('https://schema.org/address');
            subject['https://schema.org/address'].should.have.property('@id');
            subject['https://schema.org/address'].should.have.property('https://schema.org/addressRegion', 'SF');
            subject['https://schema.org/address'].should.have.property('https://schema.org/postalCode', '94123');

          } else {
            subject.should.have.property('@id', 'http://id.webshield.io/ANOTHER/com/1');
            subject['@type'].length.should.be.equal(2);
            subject.should.have.property('https://schema.org/email', 'a_email');
            subject.should.not.have.property('https://schema.org/givenName');
            subject.should.have.property('https://pn.schema.webshield.io/prop#sourceID', 'a-id2');
            subject.should.have.property('https://schema.org/address');
            subject['https://schema.org/address'].should.have.property('@id', 'http://id.webshield.io/ANOTHER/com/address/1');
            subject['https://schema.org/address'].should.have.property('https://schema.org/addressRegion', 'SF');
            subject['https://schema.org/address'].should.not.have.property('https://schema.org/postalCode');
          }
        }
      },

      function  (err) {
        console.log('TEST-FAILED', err);
        throw err;
      });
  }); // 1.5
}); // describe 1
