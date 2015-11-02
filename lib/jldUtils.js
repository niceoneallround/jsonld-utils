/*jslint node: true, vars: true */

var assert = require('assert'),
    should = require('should'),
    util = require('util'),
    uuid = require('node-uuid');

//--------------------------
// JSONLD accessors et al
//---------------------------

// Return the object contained in the past in property. Handles compacted or expanded format
//
// called getO(node.property)
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
// Return the value from an object that may be in expanded or compacted format
//
// called getV(node.property)
function getV(prop) {
  'use strict';

  if (!prop) {
    return null;
  }

  if (Array.isArray(prop)) {
    // by default expanded format is an array of {@value: 'blah'}
    if (prop.length === 1) {
      return prop[0]['@value'];
    } else {
      assert(false, util.format('getV cannot handle array that does not have one and only one value:%j', prop));
    }
  } else if (util.isObject(prop)) {
    // if value is an object assume that in the @value format
    return prop['@value'];
  } else {
    // else just assume a plain value so return it
    return prop;
  }
}

//
// Return the prop within the node as an array. If not there barf
//
function getArray(node, prop) {
  'use strict';

  assert(node, 'getArray - no node passed in');

  if (!node[prop]) {
    // if node is null/empty return an empty array
    return [];
  } else if (util.isArray(node[prop])) {
    return node[prop];
  } else {
    // if single object/value
    return [node[prop]];
  }
}

// returns true of the item is of the passed in type
// *node
// *type
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
    return (node['@type'].indexOf(type) > -1);
  } else {
    return (node['@type'] === type);
  }
}

// create a jsonld expanded value
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
    type = props.type.slice(); // clone just in case any bs
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
    node['@type'] = props['@type']; /// FIXME make a slice
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
    node['@type'] = type; // FIXME make a slice
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

module.exports = {
  addType2Node: addType2Node,
  createBlankNode: createBlankNode,
  createNode: createNode,
  createV: createV,
  getArray: getArray,
  getO: getO,
  getV: getV,
  isType: isType
};
