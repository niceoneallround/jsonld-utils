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
const jsonld = require('jsonld');
const JSONLDUtils = require('../lib/jldUtils').npUtils;
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

let graphEmbeddedSubject = {
    '@context': context,
    '@graph': [
      {
        '@id': 'http://id.webshield.io/acme/com/1',
        '@type': 'Subject',
        name: 'rich',
        description: 'subject, not a privacy graph',
        address: {
          '@type': ['Address'],
          line1: 'address line 1'
        },
        child: {
          '@id': 'http://id.webshield.io/acme/com/child/1',
          '@type': 'EmbeddedSubject',
          description: 'embedded subject not a privacy graph',
          name: 'child_tasha',
          spare: '1',
          address: {
            '@type': ['Address'],
            line1: 'address line 2'
          },
        },
      },
      {
        '@id': 'http://id.webshield.io/acme/com/2',
        '@type': ['Subject', 'PrivacyGraph'],
        name: 'p_rich',
        description: 'subject, not a privacy graph',
        address: {
          '@type': ['Address'],
          line1: 'p_address line 1'
        },
        child: {
          '@id': 'http://id.webshield.io/acme/com/child/2',
          '@type': ['EmbeddedSubject', 'PrivacyGraph'],
          description: 'embedded subject not a privacy graph',
          name: 'child_tasha',
          spare: {
            '@type': 'https://md.pn.id.webshield.io/paction/com/me#1',
            v: 'cipher-text1'
          },
          address: {
            '@type': ['Address'],
            line1: 'p_address line 2'
          },
        },
      },
    ]
  };

describe('1 FRAME tests - to understand framing and encode assumptions used by product code', function () {
  'use strict';
  let expandedDoc;

  before(function () {
    return jsonld.promises.expand(graphEmbeddedSubject)
      .then(
        function (expanded) {
          expandedDoc = expanded;

          //console.log('Expanded embedded doc:%j', expandedDoc);
        })
        .catch(
          function (reason) {
            assert.fail(util.format('unexpected error expanding doc: %j', reason));
          }
      );
  });

  it('1.1 Use frame to find all nodes marked as Subject', function () {

    // this will find all nodes that have subject in the type - do not seem
    // to be able to filter by subject and privacy graph
    const frame = {
          '@embed': true,  // this will cause a copy of the object to be made - if false just get back the @id
          '@type': ['http://acme.schema.webshield.io/type#Subject']
        };

    return jsonld.promises.frame(expandedDoc, frame)
      .then(function (frameResult) {

        //console.log('***FRAMED:%s', JSON.stringify(frameResult, null, 2));

        frameResult.should.have.property('@graph');

        let nodes = frameResult['@graph'];
        nodes.length.should.be.equal(2);
        nodes[0].should.have.property('@id');
        nodes[0].should.have.property('@type'); // check just an id

      });
  }); // 1.1

  it('1.2 Use frame to find the embedded subject and ensure that a copy', function () {

    // IMPORTANT Note as this makes a copy if this is an embedded object
    // then WILL NOT BE UPDATING THE EMBEDDED ONE IN THE ORGINAL DOCUMENT
    // HENCE THIS MUST BE FIRST FLATTENED!!!!!!
    //
    const frame = {
          '@embed': true, // this will cause a copy of the object to be made - if false just get back the @id
          '@type': ['http://acme.schema.webshield.io/type#EmbeddedSubject']
        };

    return jsonld.promises.frame(expandedDoc, frame)
      .then(function (frameResult) {

        //console.log('***FRAMED with EMBEDDED:%s', JSON.stringify(frameResult, null, 2));

        frameResult.should.have.property('@graph');

        let nodes = frameResult['@graph'];
        nodes.length.should.be.equal(2);

        JSONLDUtils.isType(nodes[0], 'http://acme.schema.webshield.io/type#EmbeddedSubject').should.be.equal(true);
        JSONLDUtils.isType(nodes[1], 'http://acme.schema.webshield.io/type#EmbeddedSubject').should.be.equal(true);

        //
        // validate that make a copy of node by updating the framed result
        //

        // check original name is as expected
        let ochild = expandedDoc[0][context.child][0];
        ochild[context.name][0]['@value'].should.be.equal('child_tasha');

        // check copy is as expected
        //console.log(nodes[0]);
        nodes[0].should.have.property(context.name, 'child_tasha');

        // update copy
        nodes[0][context.name] = 'new name';
        nodes[0].should.have.property(context.name, 'new name');
        ochild[context.name][0]['@value'].should.be.equal('child_tasha');

      });
  }); // 1.2

  it('1.3 test thins frame wrapper works marked as Subject', function () {

    // this will find all nodes that have subject in the type, and just return @id
    console.log(expandedDoc);
    return JSONLDPromises.frame(expandedDoc, 'http://acme.schema.webshield.io/type#Subject', false)
      .then(function (frameResult) {

        //console.log('***FRAMED:%s', JSON.stringify(frameResult, null, 2));

        frameResult.should.have.property('@graph');

        let nodes = frameResult['@graph'];
        nodes.length.should.be.equal(2);
        nodes[0].should.have.property('@id');
        nodes[0].should.not.have.property('@type'); // check just an id

      });
  }); // 1.3

  it('1.4 test fame with OV to make sure works, the pau must be a URL', function () {

    let subject1 = {
      '@id': 'https://id.webshield.io/com/abc/alice_abc',
      '@type': 'https://subject.pn.schema.webshield.io/type#Subject',
      'https://schema.org/givenName': { '@type': 'http://paId-1', '@value': 'n1..v1' },
      'https://schema.org/familyName': { '@type': 'http://paId-1', '@value': 'n1..v1' },
      'http://pn.schema.webshield.io/prop#sourceID': 'alice_abc',
      'https://schema.org/taxID': 'alice_abc_ssn',
      'https://schema.org/address': {
        '@id': 'https://id.webshield.io/not-set/address#1',
        '@type': ['https://schema.org/PostalAddress'],
        'https://schema.org/postalCode': { '@type': 'http://paId-1', '@value': 'n1..v1' } } };

    // this will find all nodes that have subject in the type, and just return @id
    console.log(expandedDoc);
    return JSONLDPromises.frame(subject1, 'https://subject.pn.schema.webshield.io/type#Subject', false)
      .then(function (frameResult) {

        //console.log('***FRAMED:%s', JSON.stringify(frameResult, null, 2));

        frameResult.should.have.property('@graph');

        let nodes = frameResult['@graph'];
        nodes.length.should.be.equal(1);
        nodes[0].should.have.property('@id');
        nodes[0].should.not.have.property('@type'); // check just an id

      });
  }); // 1.4
}); // 1

describe('2 FLATTEN tests', function () {
  'use strict';

  const testSubjects = {
      '@context': context,
      '@graph': [
        {
          '@id': 'http://id.webshield.io/acme/com/1',
          '@type': 'Subject',
          name: 'angus',
          description: 'subject, not a privacy graph',
          address: {
            '@type': ['Address'],
            line1: 'address line 1'
          },
          child: {
            '@id': 'http://id.webshield.io/acme/com/child/1',
            '@type': 'Subject',
            description: 'embedded subject not a privacy graph',
            name: 'child_tasha',
            address: {
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
            '@type': ['Address'],
            line1: 'p_address line 1'
          },
          child: {
            '@id': 'http://id.webshield.io/acme/com/child/2',
            '@type': ['Subject'],
            description: 'embedded subject not a privacy graph',
            name: 'child_rebecca',
            address: {
              '@type': ['Address'],
              line1: 'p_address line 2'
            },
          },
        },
      ]
    };

  const oSubjects = {
        '@context': context,
        '@graph': [
          {
            '@id': 'http://id.webshield.io/acme/com/1',
            '@type': ['Subject', 'PrivacyGraph'],
            name: [
              { '@type': 'http://md.pn.id.webdshield.io/paction/com/abc/1',
                v: 'aes-ct'
              },
              { '@type': 'http://md.pn.id.webdshield.io/paction/com/abc/1',
                v: 'sha256-ct'
              },
            ],
            description: 'A privacy graph',
            address: {
              '@type': ['Address'],
              line1: 'address line 1'
            },
          },
        ]
      };

  const oSubjects2 = {
        '@context': context,
        '@graph': [
          {
            '@id': 'http://id.webshield.io/acme/com/2',
            '@type': ['Subject', 'PrivacyGraph'],
            name: [
              { '@type': 'http://md.pn.id.webdshield.io/paction/com/abc/1',
                v: 'aes-ct2'
              },
              { '@type': 'http://md.pn.id.webdshield.io/paction/com/abc/1',
                v: 'sha256-ct2'
              },
            ],
            description: 'A privacy graph',
            address: {
              '@type': ['Address'],
              line1: 'address line 2'
            },
          },
        ]
      };

  let expandTestSubjests;
  let expandoSubjects;
  let expandoSubjects2;

  before(function () {

    let p1 =  jsonld.promises.expand(testSubjects);
    let p2 = jsonld.promises.expand(oSubjects);
    let p3 = jsonld.promises.expand(oSubjects2);

    return Promise.all([p1, p2, p3])
      .then(
        function (values) {
          expandTestSubjests = values[0];
          expandoSubjects = values[1];
          expandoSubjects2 = values[2];
        },

        function (err) {
          console.log('****ERRROR on expand:%s', err);
          assert.fail(util.format('unexpected error expanding doc: %j', err));
        }
      );
  });

  it('2.1 Flatten the array of subjects', function () {

    let flattenedGraph;

    //
    // IMPORTANT THIS FLATTENS BOTH EMBEDDED SUBJECTS AND ADDRESS OBJECTS
    // ISSUE #1 the addresses are given a blank node id, the issue is that the id is not globally unique
    // so unless can flatten out if frame with another graph it joins the
    //
    let promiseFlatten = jsonld.promises.flatten(expandTestSubjests)
      .then(function (flattenResult) {
        //console.log('**** FLATTENED GRAPH:%s', JSON.stringify(flattenResult, null, 2));
        flattenResult.length.should.be.equal(8); // all nodes
        flattenedGraph = flattenResult;
        return flattenResult;
      });

    //
    // FIND the @id of the nodes in the flattened set that are of type subject
    //
    return promiseFlatten.
      then(function (flattenResult) {
        const frame = {
            '@embed': false,
            '@type': ['http://acme.schema.webshield.io/type#Subject']
          };

        return jsonld.promises.frame(flattenResult, frame)
          .then(function (frameResult) {
            //console.log('**** FRAMMED FLATTENED GRAPH:%s', JSON.stringify(frameResult, null, 2));
            frameResult['@graph'].length.should.be.equal(4);
          });
      });
  }); // 2.1

  it('2.2 Flatten Privacy Graph and remake with frame', function () {

    let flattenedoSubjects;

    //
    // IMPORTANT THIS FLATTENS BOTH EMBEDDED SUBJECTS AND ADDRESS OBJECTS
    // ISSUE #1 the addresses are given a blank node id, the issue is that the id is not globally unique
    // so unless can flatten out if frame with another graph it joins the
    //
    let promiseFlatten = jsonld.promises.flatten(expandoSubjects)
      .then(function (flattenResult) {
        //console.log('**** FLATTENED PRIVACY GRAPH:%s', JSON.stringify(flattenResult, null, 2));
        flattenResult.length.should.be.equal(4); // subject, address, two obfuscated values
        flattenedoSubjects = flattenResult;
        return flattenResult;
      });

    //
    // FRAME to only get the subject node
    //
    return promiseFlatten.
      then(function () {
        const frame = {
            '@embed': true,
            '@type': ['http://acme.schema.webshield.io/type#Subject']
          };

        return jsonld.promises.frame(flattenedoSubjects, frame)
          .then(function (frameResult) {
            //console.log('**** FRAMMED FLATTENED PRIVACY GRAPH:%s', JSON.stringify(frameResult, null, 2));
            frameResult['@graph'].length.should.be.equal(1);
          });
      });
  }); // 2.2

  it('2.2 Flatten Privacy Graph - show ISSUE with blank node @id being left in', function () {

    let flattenedoSubjects;
    let flattenedoSubjects2;

    //
    // IMPORTANT THIS FLATTENS BOTH EMBEDDED SUBJECTS AND ADDRESS OBJECTS
    // ISSUE #1 the addresses are given a blank node id, the issue is that the id is not globally unique
    // so unless can flatten out if frame with another graph it joins the
    //
    let promiseFlatten = jsonld.promises.flatten(expandoSubjects)
      .then(function (flattenResult) {
        console.log('**** FLATTENED PRIVACY GRAPH osubjects:%s', JSON.stringify(flattenResult, null, 2));
        flattenResult.length.should.be.equal(4); // subject, address, two obfuscated values
        flattenedoSubjects = flattenResult;

        // flatten osubject2
        return jsonld.promises.flatten(expandoSubjects2)
        .then(function (flattenResult2) {
          console.log('**** FLATTENED PRIVACY GRAPH osubjects2:%s', JSON.stringify(flattenResult2, null, 2));
          flattenResult2.length.should.be.equal(4); // subject, address, two obfuscated values
          flattenedoSubjects2 = flattenResult2;
        });
      });

    //
    // FRAME to get the subject nodes from both flattened types]
    //
    return promiseFlatten.
      then(function () {
        const frame = {
            '@embed': true,
            '@explict': false,
            '@type': ['http://acme.schema.webshield.io/type#Subject']
          };

        let allNodes = flattenedoSubjects.concat(flattenedoSubjects2);
        console.log('**** ALL NODES FLATTENED PRIVACY GRAPH osubject and osubjects2:%s', JSON.stringify(allNodes, null, 2));
        allNodes.length.should.be.equal(8); // both subjects expanded
        return jsonld.promises.frame(allNodes, frame)
          .then(function (frameResult) {
            //console.log('**** FRAMMED FLATTENED PRIVACY GRAPH osubject and osubjects2:%s', JSON.stringify(frameResult, null, 2));
            frameResult['@graph'].length.should.be.equal(2);

            // NO NEED TO COMAPCT AS FRAME DOES BUT ADDING TO CHECK
            return jsonld.promises.compact(frameResult, {}) // no context just want to remove @value and [] on singletons
              .then(function (compacted) {
                //console.log('**** COMPACTED FRAMMED FLATTENED PRIVACY GRAPH osubject and osubjects2:%s', JSON.stringify(compacted, null, 2));
                let anyNode = compacted['@graph'][0];
                if (anyNode[context.name][0][context.v].length !== 1) {
                  //
                  // ISSUE ISSUE with blank node ids
                  //
                  console.log('**********');
                  console.log('ISSUE ISSUE ISSUE - Frame operation adds non globally unqiue @id to blank nodes and cannot remove !!!');
                  console.log('HENCE IF PERFORM A FRAME ON TWO DIFFRENT SUBJECT NODES FROM TWO DIFFRENT GRAPHS THE BLANK NODES GET MERGED AS HAVE SAME @ID!!!! I WILL NEED TO WRITE CODE TO CORRECT');
                  console.log('**********');
                }
              });
          });
      });
  }); // 2.2
}); // 2

describe('3 PROCESS tests', function () {
  'use strict';

  const testSubjects = {
      '@context': context,
      '@graph': [
        {
          '@id': 'http://id.webshield.io/acme/com/1',
          '@type': 'Subject',
          name: 'angus',
          description: 'subject, not a privacy graph',
          address: {
            '@type': ['Address'],
            name: 'address line 1'
          },
          child: {
            '@id': 'http://id.webshield.io/acme/com/child/1',
            '@type': 'Subject',
            description: 'embedded subject not a privacy graph',
            name: 'child_tasha',
            address: {
              '@type': ['Address'],
              name: 'address line 2'
            },
          },
        },
        {
          '@id': 'http://id.webshield.io/acme/com/2',
          '@type': ['Subject'],
          name: 'jackie',
          description: 'subject, not a privacy graph',
          address: {
            '@type': ['Address'],
            name: 'p_address line 1'
          },
          child: {
            '@id': 'http://id.webshield.io/acme/com/child/2',
            '@type': ['Subject'],
            description: 'embedded subject not a privacy graph',
            name: 'child_rebecca',
            address: {
              '@type': ['Address'],
              name: 'p_address line 2'
            },
          },
        },
      ]
    };
  let expandedDoc;

  before(function () {
    return jsonld.promises.expand(testSubjects)
      .then(
        function (expanded) {
          expandedDoc = expanded;

          //console.log('Expanded embedded doc:%j', expandedDoc);
        })
        .catch(
          function (reason) {
            assert.fail(util.format('unexpected error expanding doc: %j', reason));
          }
      );
  });

  it('3.1 Flatten the array then process to update, them frame to put them back how was', function () {

    let flattenedGraph;

    //
    // IMPORTANT THIS FLATTENS BOTH EMBEDDED SUBJECTS AND ADDRESS OBJECTS
    //
    let promiseFlatten = jsonld.promises.flatten(expandedDoc)
      .then(function (flattenResult) {
        //console.log('**** FLATTENED GRAPH:%s', JSON.stringify(flattenResult, null, 2));
        flattenResult.length.should.be.equal(8); // all nodes
        flattenedGraph = flattenResult;
        return flattenResult;
      });

    //
    // IMPORTANT WHEN FRAMED THE DATA IT UNFLATTENED THE ADDRESS NODES AND
    // EMBEDS INTO THE EMBEDDED SUBJECT NODES
    //
    return promiseFlatten.
      then(function (flattenResult) {
        const frame = {
            '@embed': false,
            '@type': ['http://acme.schema.webshield.io/type#Subject']
          };

        return jsonld.promises.frame(flattenResult, frame)
          .then(function (frameResult) {
            //console.log('**** FRAMMED FLATTENED GRAPH:%s', JSON.stringify(frameResult, null, 2));

            //
            // Update the names to be cipher-text
            //
            let nodes = frameResult['@graph'];
            nodes.length.should.be.equal(4);

            for (let i = 0; i < nodes.length; i++) {
              nodes[i].should.have.property('@id');
              for (let j = 0; j < flattenedGraph.length; j++) {
                flattenedGraph[j].should.have.property('@id');
                if (nodes[i]['@id'] === flattenedGraph[j]['@id']) {
                  //console.log('***FOUND NODE TO UPDATE:%s', nodes[i]['@id']);
                  flattenedGraph[j][context.name] = 'cipher-text--' + JSONLDUtils.getV(flattenedGraph[j], context.name);

                  //console.log(flattenedGraph[j]);
                }
              }
            }

            //
            // Finally lets reframe the subjects, and embedded the data back to
            // where it was.
            //
            const frameAll = {
                '@embed': true,
                '@type': ['http://acme.schema.webshield.io/type#Subject']
              };

            return jsonld.promises.frame(flattenResult, frameAll)
              .then(function (finalResult) {
                //
                // Iterate over the top level subjects marking them as Privacy Graphs
                //console.log('**** FINAL_RESULT GRAPH:%s', JSON.stringify(finalResult, null, 2));
                // ISSUE
                // ISSUE
                finalResult['@graph'].length.should.be.equal(4);
                console.log('**********');
                console.log('ISSUE ISSUE - EMBEDDED CHILD SUBJECTS ARE BOTH EMBEDDED AND AT THE TOP LEVEL, SO DOUBLED WHY ?!!!!');
                console.log('**********');
              });

          });
      });
  }); // 3.1
}); // 3
