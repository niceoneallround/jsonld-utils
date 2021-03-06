/*jslint node: true, vars: true */

const assert = require('assert');
const jsonld = require('jsonld');
const should = require('should');
const util = require('util');
const uuid = require('node-uuid');

//--------------------------
// JSONLD accessors et al
//---------------------------

let npUtils = {}; // pass the node and prop
let pUtils = {}; // pass just the property
let jsonldUtils = {};
jsonldUtils.promises = {};

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

pUtils.getO = function getObject(prop) {
  'use strict';
  return getO(prop);
};

npUtils.getO = function getObject(node, prop) {
  'use strict';
  assert(node, 'jsonldUtils.getO - no node passed in');
  assert(prop, 'jsonldUtils.getO - no prop passed in');

  if (node[prop]) {
    return getO(node[prop]);
  } else {
    return null;
  }
};

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

pUtils.getV = function getValue(prop) {
  'use strict';
  return getV(prop);
};

npUtils.getV = function getValue(node, prop) {
  'use strict';
  assert(node, 'jsonldUtils.getV - no node passed in');
  assert(prop, 'jsonldUtils.getV - no prop passed in');

  if (node[prop]) {
    return getV(node[prop]);
  } else {
    return null;
  }
};

//
// The property either holds an object with an @id or just the ID so get
//
pUtils.getId = function getIdentity(prop) {
  'use strict';
  if (!prop) {
    return null;
  }

  if (prop['@id']) {
    return prop['@id']; // object so return @id
  } else {
    return pUtils.getV(prop); // value that has the id so return value
  }
};

/**
  The property either holds an object with an @id or just the ID so get
*/

npUtils.getId = function getIdentity(node, prop) {
  'use strict';
  assert(node, 'jsonldUtils.getId - no node passed in');
  assert(prop, 'jsonldUtils.getId - no prop passed in');

  if (node[prop]) {
    return pUtils.getId(node[prop]);
  } else {
    return null;
  }
};

//
// returns true if the node is of the passed in type
//
function isType(node, type) {
  'use strict';

  assert(node, 'jsonld-utils.isType - no node passed in');

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

pUtils.isType = isType;
npUtils.isType = isType;

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

  assert(node, 'jsonldUtils.getArray - no node passed in');
  assert(prop, 'jsonldUtils.getArray - no prop passed in');

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

pUtils.getArray = getArray;
npUtils.getArray = getArray;

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
  let node = {};
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
      for (let i = 0; i < type.length; i++) {
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
// Lightweight wrapper around the compact
//
jsonldUtils.promises.compact = function compact(input, context, props) {
  'use strict';

  let expandContext = {}; // by default do not expand before compact
  if ((props) && (props.expandContext)) {
    // sometimes use as object may be a mix of compact and expand, so expand first so all expanded before compact, otherwise data loss
    expandContext = props.expandContext;
  }

  return jsonld.promises.compact(input, context, { expandContext: expandContext, })
    .then(function (compacted) {
      return compacted;
    })
    .catch(function (err) {
      throw new Error(util.format('compact: unexpected error:%s', err));
    });
};

//
// Expand the input document with the passed on @context, and then compact with
// an empty context to remove @value and singleton arrays.
//
// NOTE - this does not add any blank node @id to any embedded objects
//
// optionsMap
//  - @context
jsonldUtils.promises.expandCompact = function expandCompact(input, optionsMap) {
  'use strict';

  let expandOptions = {};

  // if no @context already in document, see if one has been passed in as an options
  if ((!input['@context']) && (optionsMap)) {
    if (optionsMap.get('@context')) {
      expandOptions.expandContext = optionsMap.get('@context');
    }
  }

  return jsonld.promises.expand(input, expandOptions)
    .then(function (expanded) {

      // compact to remove @value and singelton arrays
      return jsonld.promises.compact(expanded, {})
        .then(function (compacted) {
          return compacted;
        })
        .catch(function (err) {
          throw new Error(util.format('expandCompact: compact phase had an unexpected error:%s', err));
        });
    })
    .catch(function (err) {
      throw new Error(util.format('expandCompact: unexpected error:%s', err));
    });
};

//
// Light weight wrapper for the jsonld frame just in case need to change
// in the future.
//
// Assumptions
//  - input has been expanded
//
// expandedInput - can be an @graph, a single object, or an array
// type - can be an array or single jsonld-type
// embed - false returns just @ids, true returns copies
//
// optionsMap
//  - @context
jsonldUtils.promises.frame = function frame(expandedInput, type, embed) {
  'use strict';

  assert(expandedInput, 'frame - expandedInput param is missing');
  assert(type, 'frame - type param is missing');

  const frame = {
        '@embed': embed,
        '@type': type
      };

  return jsonld.promises.frame(expandedInput, frame)
    .then(function (frameResult) {
      return frameResult;
    })
    .catch(function (err) {
      throw new Error(util.format('jsoldUtils.frame: unexpected error:%s', err));
    });
};

//
// Light weight wrapper for the jsonld flatten just in case need to change
// in the future. NOTE Flatten expands the result
//
// Assumptions
//  - input has been expanded
//
// expandedInput - can be an @graph, a single object, or an array
//
jsonldUtils.promises.flatten = function flatten(expandedInput) {
  'use strict';

  assert(expandedInput, 'flatten- expandedInput param is missing');
  return jsonld.promises.flatten(expandedInput)
    .then(function (flattenResult) {
      return flattenResult;
    })
    .catch(function (err) {
      throw new Error(util.format('jsoldUtils.flatten: unexpected error:%s', err));
    });
};

//
// Light weight wrapper for the jsonld flatten just in case need to change
// in the future. NOTE Flatten expands the result, so compact with no context
// to remove single value arrays etc
//
// Assumptions
//  - input has been expanded
//
// expandedInput - can be an @graph, a single object, or an array
//
jsonldUtils.promises.flattenCompact = function flattenCompact(expandedInput) {
  'use strict';

  assert(expandedInput, 'flattenCompact - expandedInput param is missing');
  return jsonld.promises.flatten(expandedInput)
    .then(function (flattenResult) {
      // lets compact then
      return jsonldUtils.promises.compact(flattenResult, {})
        .then(function (compacted) {
          return compacted; // this will return a @graph
        });
    })
    .catch(function (err) {
      throw new Error(util.format('jsoldUtils.flattenExpand: unexpected error:%s', err));
    });
};

//
// Searches the input document for nodes with a @type that includes the passed in type and Returns
// a COPY of the nodes.
//
// It performs the following operations on the input JSON
// 1. apply jsonld expand to the input JSON using the @context in the document or one passed in options - frame works on expanded JSON
// 2. apply jsonld frame to the output from (1) using the passed in type, and @embed of true
//    2.1. note the result nodes are also run through a json-ld compact with an empty context
//
// ISSUE - see blank node issues in the frame and update tests
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
//   - Any blank nodes have thier @id overriden and set?? SEE ISSUE LATTER
//
jsonldUtils.promises.findObjects = function findObjectsPromise(inputDoc, type, optionsMap) {
  'use strict';
  let expandOptions = {};

  // if no context in the document see if one in the optionsMap
  if ((!inputDoc['@context']) && (optionsMap)) {
    if (optionsMap.get('@context')) {
      expandOptions.expandContext = optionsMap.get('@context');

      //inputDoc['@context'] = optionsMap.get('@context');
    }
  }

  // use then to add resolve and reject for the expand promise, this
  // will return a promise whose then will return the expanded value
  return jsonld.promises.expand(inputDoc, expandOptions)
    .then(
      function (expanded) { // ok
        //console.log('jldUtils.findObjects - frame expandP.then results:%j', expanded);
        return expanded;
      },

      function (reason) { // catch error in the expand operation
        return new Error(util.format('FindObjects - Unexpected expand error:%s', reason));
      }
    )
    .then(// frame the expanded document
      function (expanded) {

        // return the promise that will return the processed result from the frame
        return jsonld.promises.frame(expanded, { '@type': type, '@embed': true })
          .then(
            function (framed) {
              var graph;

              //console.log('jldUtils.findObjects - frame Promise.then results:%j', framed);
              if (!framed['@id']) {
                // if not a named graph then remove the @graph and just return the array of objects or null if empty
                graph = framed['@graph'];
                switch (graph.length) {
                  case 0:
                    return null; // return null
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
      }
    )
    .catch(function (err) {
      throw new Error(util.format('Error in findObjects: %s', err));
    });
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

  npUtils: npUtils, // property accessors that take a node and property
  pUtils: pUtils, // property accessors that just take the property

  // expose promises
  promises: jsonldUtils.promises
};
