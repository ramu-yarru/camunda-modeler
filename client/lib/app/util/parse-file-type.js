'use strict';

import {
  forEach
} from 'min-dash';

var TYPES = {
  bpmn: 'http://www.omg.org/spec/BPMN',
  dmn: 'http://www.omg.org/spec/DMN',
  cmmn: 'http://www.omg.org/spec/CMMN'
};

var defintionsNoPrefix = /[<\s]+(?:Definitions|definitions)\s+/,
    namespaceNoPrefix = /xmlns="([^"]*)"/,
    defintionsPrefix = /[<\s]+(.*):(?:Definitions|definitions)\s+/;


module.exports = function parseType(file) {

  var contents = file.contents,
      type = null,
      matches,
      matchedNamespace,
      namespacePrefix;

  // no prefix e.g. <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL">
  if (defintionsNoPrefix.test(contents)) {
    matches = contents.match(namespaceNoPrefix);

    if (matches && matches[1]) {
      matchedNamespace = matches[1];
    }
  }

  // prefix e.g. <bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL">
  if (defintionsPrefix.test(contents)) {
    matches = contents.match(defintionsPrefix);

    if (matches && matches[1]) {

      // dynamically create regex based on matched prefix
      namespacePrefix = new RegExp(`xmlns:${ matches[1] }="([^"]*)"`);

      matches = contents.match(namespacePrefix);

      if (matches && matches[1]) {
        matchedNamespace = matches[1];
      }
    }
  }

  forEach(TYPES, function(uri, t) {
    if (matchedNamespace && matchedNamespace.indexOf(uri) !== -1) {
      type = t;
    }
  });

  return type;
};
