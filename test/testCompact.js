/*jslint node: true, vars: true */

//
// Validate Compact works as expected
//
// Issues
//
const should = require('should');
const JSONLDPromises = require('../lib/jldUtils').promises;

let context = {
  id: '@id',
  type: '@type',

  PN_P:     'https://pn.schema.webshield.io/prop#',
  schema: 'https://schema.org/',

  deathDate: 'https://schema.org/deathDate',
  birthDate: 'https://schema.org/birthDate',
  email: 'schema:email',
  telephone: 'https://schema.org/telephone',
  gender: 'https://schema.org/gender',
  givenName: 'https://schema.org/givenName',
  familyName: 'https://schema.org/familyName',
  additionalName: 'https://schema.org/additionalName',
  taxID:   'https://schema.org/taxID',

  // https://schema.org/PostalAddress
  address: 'https://schema.org/address',
  addressCountry: 'https://schema.org/addressCountry',
  addressLocality: 'https://schema.org/addressLocality',
  addressRegion: 'https://schema.org/addressRegion',
  postalCode: 'https://schema.org/postalCode',
  postOfficeBoxNumber: 'https://schema.org/postOfficeBoxNumber',
  streetAddress:   'https://schema.org/streetAddress',

  // pn specfific
  sourceID: 'PN_P:sourceID',

  Subject: 'https://pn.schema.webshield.io/type#Subject',

  // schema.org types
  Person: 'https://schema.org/Person',
  PostalAddress: 'https://schema.org/PostalAddress',

};

describe('1 Compact and test and ensure assumptions', function () {
  'use strict';

  it('1.1 Compact and check looks as expected', function () {

    const subject1 = {
      '@id': 'http://id.webshield.io/acme/com/1',
      '@type': 'https://pn.schema.webshield.io/type#Subject',
      'https://schema.org/givenName': 'rich',
      'https://pn.schema.webshield.io/prop#sourceID': 'a-id',
      'https://schema.org/email': 'a_email',
      'https://schema.org/address': {
        '@type': 'https://schema.org/PostalAddress',
        'https://schema.org/addressRegion': 'SF',
      },
    };

    return JSONLDPromises.compact(subject1, context)
      .then(function (compacted) {
        console.log('***COMPACTED:%s', JSON.stringify(compacted, null, 2));

        compacted.should.have.property('@context');
        compacted.should.have.property('id');
        compacted.should.have.property('type', 'Subject');
        compacted.should.have.property('email');
        compacted.should.have.property('address');
      });
  }); // 1.1

}); // 1
