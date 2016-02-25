/*jslint node: true, vars: true */

var assert = require('assert'),
  jsonld = require('jsonld'),
  should = require('should'),
  util = require('util'),
  uuid = require('node-uuid'),
  jsonldUtils = {};

//--------------------------
// JSONLD accessors et al
//---------------------------

//
// When accessing singleton object properties the code needed to handle both the compacted and
// expanded document format. This getter encapsulates this.
// called getO(node.property)
// The formats handled are
//  - #1 {}
//  - #2 [{}]
//  - #3 null or undefined
//
function getO(prop) {
  'use strict';

  if (!prop) {
    return null;
  }

  if (Array.isArray(prop)) {
    if (prop.length === 1) {
      return prop[0];
    } else if (prop.length === 0) {
      return null;
    } else {
      assert((prop.length === 1), util.format('Property is an array with > 1 value so do not know what to do'));
    }
  } else {
    return prop;
  }
}

//
// When accessing singleton value properties the code needed to handle both the compacted and
// expanded document format. This getter encapsulates this.
// called getV(node.property)
//
// The formats handled are
//  - #1 {'@value': '23'}
//  - #2 [{'@value': '23'}]
//  - #3 '23'
//  - #4 ['23']
//  - #5 null or undefined
//
function getV(prop) {
  'use strict';

  if (!prop) {
    return null;
  }

  // optimize
  if (prop['@value']) {
    // #1
    return prop['@value'];
  } else if (!Array.isArray(prop)) {
    // #3
    return prop;
  } else if (prop.length === 1) {
    if (prop[0]['@value']) {
      // #2
      return prop[0]['@value'];
    } else {
      // #3
      return prop[0];
    }
  } else {
    assert((prop.length !== 0), util.format('getV cannot handle array that has more than one value:%j', prop));
    return null;
  }
}

//
// returns true if the node is of the passed in type
//
function isType(node, type) {
  'use strict';

  assert(node, 'isType - no node passed in');

  if (!type) {
    return false;
  }

  if (!node['@type']) {
    return false;
  }

  if (Array.isArray(node['@type'])) {
    // @type is an array see if it contains the passed in type
    return (node['@type'].indexOf(type) > -1);
  } else {
    return (node['@type'] === type);
  }
}

//
// When accessing an array properties the code needed to handle both the compacted and
// expanded document format and always return an Array. This getter encapsulates this.
// Called getArray(node, property)
//
// The handled formats are
// #1 [stuff] -> return array
// #2 singleton - the code expects an array but the compact has removed ->return wrapped as an array
// #3 null/undefined - return an empty array - the code was just easier - not convinced on this
//
function getArray(node, prop) {
  'use strict';

  assert(node, 'getArray - no node passed in');
  assert(prop, 'getArray - no prop passed in');

  if (!node[prop]) {
    // case #3
    return [];
  } else if (util.isArray(node[prop])) {
    // case #1
    return node[prop];
  } else {
    // case #2
    return [node[prop]];
  }
}

// create a typed value from the passed in value and type
// props.value the value
// props.type - the type - can be an array of instance just assign
//
function createV(props) {
  'use strict';
  var type;
  assert(props, util.format('jsonldUtils.createV - no props passed in'));
  assert(props.value, util.format('jsonldUtils.createV - no props.value passed in:%j', props));
  assert(props.type, util.format('jsonldUtils.createV - no props.type passed in:%j', props));

  if (Array.isArray(props.type)) {
    type = props.type.slice(); // clone the array of types
  } else {
    type = props.type;
  }

  return {
    '@type': props.type,
    '@value': props.value
  };
}

//
// create a blank node
// props
//  *@id - optional id - a "_" prefix will be added
//  *@type - can be an instance or array of types
function createBlankNode(props) {
  'use strict';
  var node = {};

  assert(props['@type'], util.format('createBlankNode - must pass in a @type: %j', props));

  if (props['@id']) {
    node['@id'] = '_:' + props['@id'];
  } else {
    node['@id'] = '_:' + uuid.v4();
  }

  if (Array.isArray(props['@type'])) {
    node['@type'] = props['@type'].slice(); // clone the array of types
  } else {
    node['@type'] = [props['@type']];
  }

  return node;
}

// create a non blank node
// id - the id
// type - an single or array of types
function createNode(id, type) {
  'use strict';
  var node = {};
  assert(id, 'createNode required an id');
  assert(type, 'createNode requires a type');

  node['@id'] = id;
  if (Array.isArray(type)) {
    node['@type'] = type.slice(); // clone the array of types
  } else {
    node['@type'] = [type];
  }

  return node;
}

// addType adds a type to the node
// *node - node
// *type - single or array of types to add to the node
function addType2Node(node, type) {
  'use strict';

  var i;

  assert(node, 'addType2Node requires a node');
  assert(type, 'addType2Node requires a type');

  if (Array.isArray(type)) {
    if (!node['@type']) {
      node['@type'] = type;
    } else {
      if (!Array.isArray(node['@type'])) {
        // make it an array
        node['@type'] = [node['@type']];
      }

      // add types
      for (i = 0; i < type.length; i++) {
        node['@type'].push(type[i]);
      }
    }
  } else { // passed in type is not an array
    if (!node['@type']) {
      node['@type'] = [];
    } else if (!Array.isArray(node['@type'])) {
      node['@type'] = [node['@type']];
    }

    node['@type'].push(type);
  }
}

//
// Returns a Promise that will return an array of compacted objects of the specified type
// from the passed jsonld doc using the
// jsonld Frame mechanisms - http://json-ld.org/spec/latest/json-ld-framing/
//
// See the tests for an example of calling
//
// The input is
//  - jsonldDoc - can be expanded or compacted - the code will always expand as frame algorithm expands
//  - type - the type IRI, or an array of type IRI that looking for
//  - optionsMap an optional Map that may contain
//    - context - if passed added to document as @context
//
// The output is a Promise that if successful will return an array that either has zero or more
// compacted objects that match the requested input type.
//
// Error - an Error is thrown with reason.
//
// Side Effects
//   - Any blank nodes have thier @id overriden and set - i assume because the frame algorithm flattens
//
// The frame algorithm expects the passed in jsonld to have been expanded
jsonldUtils.promises = {};
jsonldUtils.promises.findObjects = function findObjectsPromise(inputDoc, type, optionsMap) {
  'use strict';

  var expandPromise, p1, p2;

  // if no context in the document see if one in the optionsMap
  if ((!inputDoc['@context']) && (optionsMap)) {
    if (optionsMap.get('@context')) {
      inputDoc['@context'] = optionsMap.get('@context');
    }
  }

  // get a jsonld expand promuse and add the then
  expandPromise = jsonld.promises.expand(inputDoc);

  // use then to add resolve and reject for the expand promise, this
  // will return a promise whose then will return the expanded value
  p1 = expandPromise.then(
    function (expanded) { // ok
      return expanded;
    },

    function (reason) { // catch error in the expand operation
      return new Error(util.format('FindObjects - Unexpected expand error:%s', reason));
    }
  );

  // create a promise that gets the expanded value and use the frame to extract
  // the necessary value.
  p2 = p1.then(
    function (expanded) {
      var framePromise,
          frame = {
            '@type': type
          };

      framePromise = jsonld.promises.frame(expanded, frame);

      // create a promise that returns the final result of the frame operation
      // on the expanded operation. Return the promise
      return framePromise.then(
        function (framed) {
          var graph;

          //console.log('findObjects - frame Promise.then results:%j', framed);

          // if not a named graph then remove the @graph and just return the array of objects
          if (!framed['@id']) {
            graph = framed['@graph'];
            switch (graph.length) {
              case 0:
                return [];
              case 1:
                return graph[0];
              default:
                return graph;
            }
          } else {
            // if an empty object then return a null as easier for higher layers to check
            if (framed.keys({}).length !== 0) {
              return framed;
            } else {
              return null;
            }
          }
        },

        function (reason) { // catch error in the frame operation
          return new Error(util.format('FindObjects - Unexpected frame error:%s', reason));
        }
      );
    },

    function (reason) { // catch any errors that occur in any of the resolve functions
      return new Error(util.format('FindObjects - Unexpected error:%s', reason));
    }
  );

  return p2;
};

module.exports = {
  addType2Node: addType2Node,
  createBlankNode: createBlankNode,
  createNode: createNode,
  createV: createV,
  getArray: getArray,
  getO: getO,
  getV: getV,
  isType: isType,

  // expose promises
  promises: jsonldUtils.promises
};
