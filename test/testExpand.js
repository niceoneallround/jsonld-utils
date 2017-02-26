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
  address: 'http://schema.org/address',
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

describe('1 EXPAND test and ensure assumptions', function () {
  'use strict';

  it('1.1 should expand and not add any blank node @ids', function () {

    const subject1 = {
      '@context': context,
      id: 'http://id.webshield.io/acme/com/1',
      type: 'Subject',
      givenName: 'rich',
      sourceID: 'a-id',
      email: 'a_email',
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
            compacted.should.have.property('@id');
            compacted.should.have.property('@type');
            compacted.should.have.property('https://schema.org/email');
            compacted.should.have.property('https://pn.schema.webshield.io/prop#sourceID');
            compacted.should.have.property(context.givenName, 'rich'); // check values do not have @value
            compacted[context.address].should.not.have.property('@id'); // check embedded types have not been assigned a blank node @id
          });
      });
  }); // 1.1

  it('1.2 should Expand/Compact and not add any blank nodes', function () {

    const subject1 = {
      '@id': 'http://id.webshield.io/acme/com/1',
      '@type': 'Subject',
      givenName: 'rich',
      sourceID: 'a-id',
      email: 'a_email',
      address: {
        '@type': 'PostalAddress',
        addressRegion: 'SF',
      },
    };

    let optionsMap = new Map();
    optionsMap.set('@context', context);
    return JSONLDUtils.promises.expandCompact(subject1, optionsMap)
      .then(function (result) {
        //console.log('***EXPANDED/Compact:%s', JSON.stringify(expanded, null, 2));
        //  check ASSUMPTIONS used by code
        result.should.have.property('@id');
        result.should.have.property('@type');
        result.should.have.property('https://schema.org/email');
        result.should.have.property(context.givenName, 'rich'); // check values do not have @value
        result[context.address].should.not.have.property('@id'); // check embedded types have not been assigned a blank node @id
      });
  }); // 1.2

  it('1.3 should expand/compact without any errors - this was a bug so checking', function () {

    const context13 = {
      id: '@id',
      type: '@type',
      MINE_T: 'https://query.com.schema.webshield.io/type#',
      MINE_P: 'https://query.com.schema.webshield.io/prop#',
      PN_P: 'http://pn.schema.webshield.io/prop#',
      PN_T: 'http://pn.schema.webshield.io/type#',
      schema: 'https://schema.org/',
      givenName: 'schema:givenName',
      familyName: 'schema:familyName',
      taxID: 'schema:taxID',
    };

    const data = {
      '@id': 'https://pn.id.webshield.io/query/100/99/168/192#e2e-query-by-id',
      '@type': 'https://pn.schema.webshield.io/type#SubjectQuery',
      'https://pn.schema.webshield.io/prop#query_nodes': [
        {
          '@id': '_:25236e5e-35b7-43cf-9bb3-339eeaefc17d',
          '@type': [
            'https://pn.schema.webshield.io/type#QueryNode'
          ],
          'https://pn.schema.webshield.io/prop#query_result_graph_node': 'bob',
          'https://pn.schema.webshield.io/prop#params': {
            '@id': 'https://pn.id.webshield.io/query_restriction/100/99/168/192#1488149493-1',
            '@type': 'https://pn.schema.webshield.io/type#SubjectQueryRestriction',
            'https://pn.schema.webshield.io/prop#subjectID': 'https://acme.come/members/bob'
          },
          'https://pn.schema.webshield.io/prop#properties': {
            familyName: '',
            givenName: '',
            taxID: '',
          },
        },
      ]
    };

    let optionsMap = new Map();
    optionsMap.set('@context', context13);
    return JSONLDUtils.promises.expandCompact(data, optionsMap)
      .then(function (result) {
        console.log('***EXPANDED/Compact:%s', JSON.stringify(result, null, 2));

        //  check ASSUMPTIONS used by code
        result.should.have.property('@id');
        result.should.have.property('@type');
        result.should.have.property('https://pn.schema.webshield.io/prop#query_nodes');
        result['https://pn.schema.webshield.io/prop#query_nodes'].should.have.property('https://pn.schema.webshield.io/prop#properties');

        let properties = result['https://pn.schema.webshield.io/prop#query_nodes']['https://pn.schema.webshield.io/prop#properties'];
        properties.should.have.property(context.givenName, '');
      });
  }); // 1.2

}); // 1
