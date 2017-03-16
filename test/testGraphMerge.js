/*jslint node: true, vars: true */

//
// Validate that compact can be used to merge nodes with the same @id
// in a set of nodes
//
// Issues
//
const should = require('should');
const JSONLDPromises = require('../lib/jldUtils').promises;

describe('1 Compact and test and ensure assumptions', function () {
  'use strict';

  it('1.1 should compact the data', function () {

    const subject1 = {
      '@id': 'http://id.webshield.io/acme/com/1',
      '@type': 'https://pn.schema.webshield.io/type#Subject',
      'https://schema.org/givenName': 'rich',
      'https://pn.schema.webshield.io/prop#sourceID': 'a-id',
      'https://schema.org/email': 'a_email',
      'https://schema.org/address': {
        '@id': 'http://id.webshield.io/acme/com/address/1',
        '@type': 'https://schema.org/PostalAddress',
        'https://schema.org/postalCode': '94123',
      },
    };

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

    return JSONLDPromises.frame(expandedDoc, ['https://pn.schema.webshield.io/type#Subject'], true) // embed
      .then(function (frameResult) {
        console.log('***FRAMED RESULT:%s', JSON.stringify(frameResult, null, 2));

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
}); // describe 1
