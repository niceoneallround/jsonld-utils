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

  it('1.1 should compact the data', function () {

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
        //console.log('***COMPACTED:%s', JSON.stringify(compacted, null, 2));

        compacted.should.have.property('@context');
        compacted.should.have.property('id');
        compacted.should.have.property('type', 'Subject');
        compacted.should.have.property('email');
        compacted.should.have.property('address');
      },

      function  (err) {
        console.log('TEST-FAILED', err);
        throw err;
      });
  }); // 1.1
}); // describe 1

describe('2 BUG test', function () {
  'use strict';

  let context = {
    id: '@id',
    type: '@type',
    value: '@value',
    pnp0: 'http://api.webshield.io/prop#',
    pnt0: 'http://api.webshield.io/type#',
    pnp: 'http://pn.schema.webshield.io/prop#',
    pnt: 'http://pn.schema.webshield.io/type#',

    DecryptRequest: 'pnt:DecryptRequest',
    DecryptResponse: 'pnt:DecryptResponse',
    EncryptMetadata: 'pnt:EncryptMetadata',
    EncryptKeyMetadata: 'pnt:EncryptKeyMetadata',
    EncryptRequest: 'pnt:EncryptRequest',
    EncryptResponse: 'pnt:EncryptResponse',
    Metadata: 'pnt0:Metadata',
    KMS: 'pnt:KMS',
    Resource: 'pnt:Resource',

    algorithm: 'pnp:algorithm',
    creation_time: 'pnp0:creation_time',
    content_encrypt_key_md: 'pnp:content_encrypt_key_md',
    content_encrypt_key_md_jwt: 'pnp:content_encrypt_key_md_jwt',
    content_obfuscation_algorithm: 'pnp:content_obfuscation_algorithm',
    description: 'pnp0:description',
    encryption_metadata: 'pnp:encryption_metadata',
    issuer: 'pnp0:issuer',
    os: 'pnp:os',
    obfuscation_provider: 'pnp:obfuscation_provider',
    provider: 'pnp:provider',
    raw_encrypt_key_md: 'pnp:raw_encrypt_key_md',
    raw_encrypt_key_md_type: 'pnp:raw_encrypt_key_md_type',

    aad: 'pnp:aad',
    items: 'pnp:items',
    n: 'pnp:n',
    v: 'pnp:v',
  };

  it('2.1 should expand and compact losing no fields', function () {

    const data = {
      '@id': '_:e351e989-cf69-438d-80ec-7334f9bd6dba',
      '@type': 'http://pn.schema.webshield.io/type#DecryptResponse',
      'http://pn.schema.webshield.io/prop#encryption_metadata':
        { '@id': '_:183ca468-a958-4c6d-9705-0eb26057e690',
          '@type': 'http://pn.schema.webshield.io/type#EncryptKeyMetadata',
          'http://pn.schema.webshield.io/prop#content_obfuscation_algorithm': 'A256GCM',
          'http://pn.schema.webshield.io/prop#obfuscation_provider': 'abc.com',
          'http://pn.schema.webshield.io/prop#content_encrypt_key_md_jwt': 'add code to set JWT',
          'http://pn.schema.webshield.io/prop#content_encrypt_key_md': 'abce',
        },
      'http://pn.schema.webshield.io/prop#items': [
        { type: 'https://md.pn.id.webshield.io/paction_instance/io/webshield/test/query#deob-paction-1',
          n: '1',
          v: '2',
          id: '881386eb-7328-4347-9bd8-8ff81d5b2900' },
        { type: 'https://md.pn.id.webshield.io/paction_instance/io/webshield/test/query#deob-paction-1',
          n: '3',
          v: '4',
          id: 'b51038ca-e72f-4649-809c-53977ef294c5' },
        { type: 'https://md.pn.id.webshield.io/paction_instance/io/webshield/test/query#deob-paction-1',
          n: '5',
          v: '6',
          id: '768b81c1-6c50-4ec2-b41f-90e795b6bad2' },
        { type: 'https://md.pn.id.webshield.io/paction_instance/io/webshield/test/query#deob-paction-1',
          n: '7',
          v: '8',
          id: '676262b2-391f-49b6-9cf8-ad9ab56e73cd' },
        ],
    };

    return JSONLDPromises.compact(data, context, { expandContext: context, })
      .then(function (compacted) {
        console.log('***COMPACTED:%s', JSON.stringify(compacted, null, 2));

        compacted.should.have.property('@context');
        compacted.should.have.property('id');
        compacted.should.have.property('items');
        compacted.items.length.should.equal(4);
        compacted.items[0].should.have.property('type'); // make sure not lost during process

      },

      function  (err) {
        console.log('TEST-FAILED', err);
        throw err;
      });
  }); // 2.1

}); // 2
