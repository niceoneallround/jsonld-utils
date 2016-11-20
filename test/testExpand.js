/*jslint node: true, vars: true */

//
// Validate Expand works as expected
//
// Issues
//
const should = require('should');
const jsonld = require('jsonld');
const JSONLDUtils = require('../lib/jldUtils');

let context = {
  deathDate: 'https://schema.org/deathDate',
  birthDate: 'https://schema.org/birthDate',
  email: 'https://schema.org/email',
  telephone: 'https://schema.org/telephone',
  gender: 'https://schema.org/gender',
  givenName: 'https://schema.org/givenName',
  familyName: 'https://schema.org/familyName',
  additionalName: 'https://schema.org/additionalName',
  taxID:   'https://schema.org/taxID',

  // https://schema.org/PostalAddress
  address: 'http://schema.org/address',
  addressCountry: 'https://schema.org/addressCountry',
  addressLocality: 'https://schema.org/addressLocality',
  addressRegion: 'https://schema.org/addressRegion',
  postalCode: 'https://schema.org/postalCode',
  postOfficeBoxNumber: 'https://schema.org/postOfficeBoxNumber',
  streetAddress:   'https://schema.org/streetAddress',

  // pn specfific
  sourceID: 'https://pn.schema.webshield.io/prop#SourceID',

  Subject: 'https://pn.schema.webshield.io/type#Subject',

  // schema.org types
  Person: 'https://schema.org/Person',
  PostalAddress: 'https://schema.org/PostalAddress',

};

describe('1 EXPAND test and ensure assumptions', function () {
  'use strict';

  it('1.1 Expand and check that no blank @ids are added', function () {

    const subject1 = {
      '@context': context,
      '@id': 'http://id.webshield.io/acme/com/1',
      '@type': 'Subject',
      givenName: 'rich',
      sourceID: 'a-id',
      address: {
        '@type': 'PostalAddress',
        addressRegion: 'SF',
      },
    };

    return jsonld.promises.expand(subject1)
      .then(function (expanded) {
        //console.log('***EXPANDED:%s', JSON.stringify(expanded, null, 2));

        // compact to remove
        return jsonld.promises.compact(expanded, {})
          .then(function (compacted) {
            //console.log('***COMPACTED of EXPANDED:%s', JSON.stringify(compacted, null, 2));

            //  check ASSUMPTIONS used by code
            compacted.should.have.property(context.givenName, 'rich'); // check values do not have @value
            compacted.should.have.property(context.sourceID, 'a-id'); // check values do not have @value
            compacted[context.address].should.not.have.property('@id'); // check embedded types have not been assigned a blank node @id
          });
      });
  }); // 1.1

  it('1.1 Expand and check that no blank @ids are added', function () {

    const subject1 = {
      '@id': 'http://id.webshield.io/acme/com/1',
      '@type': 'Subject',
      givenName: 'rich',
      sourceID: 'a-id',
      address: {
        '@type': 'PostalAddress',
        addressRegion: 'SF',
      },
    };

    let optionsMap = new Map();
    optionsMap.set('@context', context);
    return JSONLDUtils.promises.expandCompact(subject1, optionsMap)
      .then(function (expanded) {
        //console.log('***EXPANDED:%s', JSON.stringify(expanded, null, 2));

        // compact to remove
        return jsonld.promises.compact(expanded, {})
          .then(function (compacted) {
            //console.log('***COMPACTED of EXPANDED:%s', JSON.stringify(compacted, null, 2));

            //  check ASSUMPTIONS used by code
            compacted.should.have.property(context.givenName, 'rich'); // check values do not have @value
            compacted.should.have.property(context.sourceID, 'a-id'); // check values do not have @value
            compacted[context.address].should.not.have.property('@id'); // check embedded types have not been assigned a blank node @id
          });
      });
  }); // 1.1

}); // 1
