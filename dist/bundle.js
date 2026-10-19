/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/css-loader/dist/cjs.js!./node_modules/sass-loader/dist/cjs.js!./src/styles/main.scss":
/*!***********************************************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./node_modules/sass-loader/dist/cjs.js!./src/styles/main.scss ***!
  \***********************************************************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../node_modules/css-loader/dist/runtime/sourceMaps.js */ "./node_modules/css-loader/dist/runtime/sourceMaps.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, `.chesskey-option-body {
  background-color: #a8a8a8;
  font-family: "Roboto", sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  overflow: hidden;
  margin: 0;
  padding: 20px;
}

.chesskey-option-input {
  margin: auto;
  display: block;
}

.chesskey-option-container {
  background-color: #f4f4f4;
  border-radius: 10px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1), 0 6px 6px rgba(0, 0, 0, 0.1);
  padding: 50px 20px;
  text-align: center;
  max-width: 100%;
  width: 800px;
}

.chesskey-option-h3 {
  margin: 0;
  letter-spacing: 2px;
  font-size: 16px;
}

.chesskey-option-content {
  font-size: 16px;
  letter-spacing: 1px;
  line-height: 40px;
  margin: 50px auto;
  max-width: 600px;
}

.chesskey-option-btn {
  background-color: #1c8cab;
  color: #f4f4f4;
  border: 0;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1), 0 6px 6px rgba(0, 0, 0, 0.1);
  padding: 14px 40px;
  font-size: 16px;
  cursor: pointer;
}
.chesskey-option-btn:active {
  transform: scale(0.98);
}
.chesskey-option-btn:focus {
  outline: 0;
}

.chesskey-event-log {
  font-size: 12px;
  line-height: 18px;
  letter-spacing: 0;
  max-height: 400px;
  overflow: auto;
  white-space: pre-wrap;
  text-align: left;
}`, "",{"version":3,"sources":["webpack://./src/styles/main.scss"],"names":[],"mappings":"AAIA;EACE,yBALc;EAMd,iCAAA;EACA,aAAA;EACA,sBAAA;EACA,mBAAA;EACA,uBAAA;EACA,aAAA;EACA,gBAAA;EACA,SAAA;EACA,aAAA;AAHF;;AAMA;EACE,YAAA;EACA,cAAA;AAHF;;AAMA;EACE,yBAtBgB;EAuBhB,mBAAA;EACA,wEAvBW;EAwBX,kBAAA;EACA,kBAAA;EACA,eAAA;EACA,YAAA;AAHF;;AAMA;EACE,SAAA;EACA,mBAAA;EACA,eAAA;AAHF;;AAMA;EACE,eAAA;EACA,mBAAA;EACA,iBAAA;EACA,iBAAA;EACA,gBAAA;AAHF;;AAMA;EACE,yBAAA;EACA,cA/CgB;EAgDhB,SAAA;EACA,mBAAA;EACA,uEAAA;EACA,kBAAA;EACA,eAAA;EACA,eAAA;AAHF;AAKE;EACE,sBAAA;AAHJ;AAME;EACE,UAAA;AAJJ;;AAOA;EACE,eAAA;EACA,iBAAA;EACA,iBAAA;EACA,iBAAA;EACA,cAAA;EACA,qBAAA;EACA,gBAAA;AAJF","sourcesContent":["$primary-color: #a8a8a8;\r\n$secondary-color: #f4f4f4;\r\n$box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1), 0 6px 6px rgba(0, 0, 0, 0.1);\r\n\r\n.chesskey-option-body {\r\n  background-color: $primary-color;\r\n  font-family: 'Roboto', sans-serif;\r\n  display: flex;\r\n  flex-direction: column;\r\n  align-items: center;\r\n  justify-content: center;\r\n  height: 100vh;\r\n  overflow: hidden;\r\n  margin: 0;\r\n  padding: 20px;\r\n}\r\n\r\n.chesskey-option-input {\r\n  margin: auto;\r\n  display: block;\r\n}\r\n\r\n.chesskey-option-container {\r\n  background-color: $secondary-color;\r\n  border-radius: 10px;\r\n  box-shadow: $box-shadow;\r\n  padding: 50px 20px;\r\n  text-align: center;\r\n  max-width: 100%;\r\n  width: 800px;\r\n}\r\n\r\n.chesskey-option-h3 {\r\n  margin: 0;\r\n  letter-spacing: 2px;\r\n  font-size: 16px;\r\n}\r\n\r\n.chesskey-option-content {\r\n  font-size: 16px;\r\n  letter-spacing: 1px;\r\n  line-height: 40px;\r\n  margin: 50px auto;\r\n  max-width: 600px;\r\n}\r\n\r\n.chesskey-option-btn {\r\n  background-color: #1c8cab;\r\n  color: $secondary-color;\r\n  border: 0;\r\n  border-radius: 10px;\r\n  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1), 0 6px 6px rgba(0, 0, 0, 0.1);\r\n  padding: 14px 40px;\r\n  font-size: 16px;\r\n  cursor: pointer;\r\n\r\n  &:active {\r\n    transform: scale(0.98);\r\n  }\r\n\r\n  &:focus {\r\n    outline: 0;\r\n  }\r\n}\r\n.chesskey-event-log {\r\n  font-size: 12px;\r\n  line-height: 18px;\r\n  letter-spacing: 0;\r\n  max-height: 400px;\r\n  overflow: auto;\r\n  white-space: pre-wrap;\r\n  text-align: left;\r\n}\r\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "./node_modules/css-loader/dist/runtime/api.js":
/*!*****************************************************!*\
  !*** ./node_modules/css-loader/dist/runtime/api.js ***!
  \*****************************************************/
/***/ ((module) => {

"use strict";


/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
module.exports = function (cssWithMappingToString) {
  var list = [];

  // return the list of modules as css string
  list.toString = function toString() {
    return this.map(function (item) {
      var content = "";
      var needLayer = typeof item[5] !== "undefined";
      if (item[4]) {
        content += "@supports (".concat(item[4], ") {");
      }
      if (item[2]) {
        content += "@media ".concat(item[2], " {");
      }
      if (needLayer) {
        content += "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {");
      }
      content += cssWithMappingToString(item);
      if (needLayer) {
        content += "}";
      }
      if (item[2]) {
        content += "}";
      }
      if (item[4]) {
        content += "}";
      }
      return content;
    }).join("");
  };

  // import a list of modules into the list
  list.i = function i(modules, media, dedupe, supports, layer) {
    if (typeof modules === "string") {
      modules = [[null, modules, undefined]];
    }
    var alreadyImportedModules = {};
    if (dedupe) {
      for (var k = 0; k < this.length; k++) {
        var id = this[k][0];
        if (id != null) {
          alreadyImportedModules[id] = true;
        }
      }
    }
    for (var _k = 0; _k < modules.length; _k++) {
      var item = [].concat(modules[_k]);
      if (dedupe && alreadyImportedModules[item[0]]) {
        continue;
      }
      if (typeof layer !== "undefined") {
        if (typeof item[5] === "undefined") {
          item[5] = layer;
        } else {
          item[1] = "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {").concat(item[1], "}");
          item[5] = layer;
        }
      }
      if (media) {
        if (!item[2]) {
          item[2] = media;
        } else {
          item[1] = "@media ".concat(item[2], " {").concat(item[1], "}");
          item[2] = media;
        }
      }
      if (supports) {
        if (!item[4]) {
          item[4] = "".concat(supports);
        } else {
          item[1] = "@supports (".concat(item[4], ") {").concat(item[1], "}");
          item[4] = supports;
        }
      }
      list.push(item);
    }
  };
  return list;
};

/***/ }),

/***/ "./node_modules/css-loader/dist/runtime/sourceMaps.js":
/*!************************************************************!*\
  !*** ./node_modules/css-loader/dist/runtime/sourceMaps.js ***!
  \************************************************************/
/***/ ((module) => {

"use strict";


module.exports = function (item) {
  var content = item[1];
  var cssMapping = item[3];
  if (!cssMapping) {
    return content;
  }
  if (typeof btoa === "function") {
    var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(cssMapping))));
    var data = "sourceMappingURL=data:application/json;charset=utf-8;base64,".concat(base64);
    var sourceMapping = "/*# ".concat(data, " */");
    return [content].concat([sourceMapping]).join("\n");
  }
  return [content].join("\n");
};

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js":
/*!****************************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js ***!
  \****************************************************************************/
/***/ ((module) => {

"use strict";


var stylesInDOM = [];
function getIndexByIdentifier(identifier) {
  var result = -1;
  for (var i = 0; i < stylesInDOM.length; i++) {
    if (stylesInDOM[i].identifier === identifier) {
      result = i;
      break;
    }
  }
  return result;
}
function modulesToDom(list, options) {
  var idCountMap = {};
  var identifiers = [];
  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    var id = options.base ? item[0] + options.base : item[0];
    var count = idCountMap[id] || 0;
    var identifier = "".concat(id, " ").concat(count);
    idCountMap[id] = count + 1;
    var indexByIdentifier = getIndexByIdentifier(identifier);
    var obj = {
      css: item[1],
      media: item[2],
      sourceMap: item[3],
      supports: item[4],
      layer: item[5]
    };
    if (indexByIdentifier !== -1) {
      stylesInDOM[indexByIdentifier].references++;
      stylesInDOM[indexByIdentifier].updater(obj);
    } else {
      var updater = addElementStyle(obj, options);
      options.byIndex = i;
      stylesInDOM.splice(i, 0, {
        identifier: identifier,
        updater: updater,
        references: 1
      });
    }
    identifiers.push(identifier);
  }
  return identifiers;
}
function addElementStyle(obj, options) {
  var api = options.domAPI(options);
  api.update(obj);
  var updater = function updater(newObj) {
    if (newObj) {
      if (newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap && newObj.supports === obj.supports && newObj.layer === obj.layer) {
        return;
      }
      api.update(obj = newObj);
    } else {
      api.remove();
    }
  };
  return updater;
}
module.exports = function (list, options) {
  options = options || {};
  list = list || [];
  var lastIdentifiers = modulesToDom(list, options);
  return function update(newList) {
    newList = newList || [];
    for (var i = 0; i < lastIdentifiers.length; i++) {
      var identifier = lastIdentifiers[i];
      var index = getIndexByIdentifier(identifier);
      stylesInDOM[index].references--;
    }
    var newLastIdentifiers = modulesToDom(newList, options);
    for (var _i = 0; _i < lastIdentifiers.length; _i++) {
      var _identifier = lastIdentifiers[_i];
      var _index = getIndexByIdentifier(_identifier);
      if (stylesInDOM[_index].references === 0) {
        stylesInDOM[_index].updater();
        stylesInDOM.splice(_index, 1);
      }
    }
    lastIdentifiers = newLastIdentifiers;
  };
};

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/insertBySelector.js":
/*!********************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/insertBySelector.js ***!
  \********************************************************************/
/***/ ((module) => {

"use strict";


var memo = {};

/* istanbul ignore next  */
function getTarget(target) {
  if (typeof memo[target] === "undefined") {
    var styleTarget = document.querySelector(target);

    // Special case to return head of iframe instead of iframe itself
    if (window.HTMLIFrameElement && styleTarget instanceof window.HTMLIFrameElement) {
      try {
        // This will throw an exception if access to iframe is blocked
        // due to cross-origin restrictions
        styleTarget = styleTarget.contentDocument.head;
      } catch (e) {
        // istanbul ignore next
        styleTarget = null;
      }
    }
    memo[target] = styleTarget;
  }
  return memo[target];
}

/* istanbul ignore next  */
function insertBySelector(insert, style) {
  var target = getTarget(insert);
  if (!target) {
    throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");
  }
  target.appendChild(style);
}
module.exports = insertBySelector;

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/insertStyleElement.js":
/*!**********************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/insertStyleElement.js ***!
  \**********************************************************************/
/***/ ((module) => {

"use strict";


/* istanbul ignore next  */
function insertStyleElement(options) {
  var element = document.createElement("style");
  options.setAttributes(element, options.attributes);
  options.insert(element, options.options);
  return element;
}
module.exports = insertStyleElement;

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js":
/*!**********************************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js ***!
  \**********************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


/* istanbul ignore next  */
function setAttributesWithoutAttributes(styleElement) {
  var nonce =  true ? __webpack_require__.nc : 0;
  if (nonce) {
    styleElement.setAttribute("nonce", nonce);
  }
}
module.exports = setAttributesWithoutAttributes;

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/styleDomAPI.js":
/*!***************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/styleDomAPI.js ***!
  \***************************************************************/
/***/ ((module) => {

"use strict";


/* istanbul ignore next  */
function apply(styleElement, options, obj) {
  var css = "";
  if (obj.supports) {
    css += "@supports (".concat(obj.supports, ") {");
  }
  if (obj.media) {
    css += "@media ".concat(obj.media, " {");
  }
  var needLayer = typeof obj.layer !== "undefined";
  if (needLayer) {
    css += "@layer".concat(obj.layer.length > 0 ? " ".concat(obj.layer) : "", " {");
  }
  css += obj.css;
  if (needLayer) {
    css += "}";
  }
  if (obj.media) {
    css += "}";
  }
  if (obj.supports) {
    css += "}";
  }
  var sourceMap = obj.sourceMap;
  if (sourceMap && typeof btoa !== "undefined") {
    css += "\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))), " */");
  }

  // For old IE
  /* istanbul ignore if  */
  options.styleTagTransform(css, styleElement, options.options);
}
function removeStyleElement(styleElement) {
  // istanbul ignore if
  if (styleElement.parentNode === null) {
    return false;
  }
  styleElement.parentNode.removeChild(styleElement);
}

/* istanbul ignore next  */
function domAPI(options) {
  if (typeof document === "undefined") {
    return {
      update: function update() {},
      remove: function remove() {}
    };
  }
  var styleElement = options.insertStyleElement(options);
  return {
    update: function update(obj) {
      apply(styleElement, options, obj);
    },
    remove: function remove() {
      removeStyleElement(styleElement);
    }
  };
}
module.exports = domAPI;

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/styleTagTransform.js":
/*!*********************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/styleTagTransform.js ***!
  \*********************************************************************/
/***/ ((module) => {

"use strict";


/* istanbul ignore next  */
function styleTagTransform(css, styleElement) {
  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = css;
  } else {
    while (styleElement.firstChild) {
      styleElement.removeChild(styleElement.firstChild);
    }
    styleElement.appendChild(document.createTextNode(css));
  }
}
module.exports = styleTagTransform;

/***/ }),

/***/ "./node_modules/webextension-polyfill-ts/lib/index.js":
/*!************************************************************!*\
  !*** ./node_modules/webextension-polyfill-ts/lib/index.js ***!
  \************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));

exports.browser = __webpack_require__(/*! webextension-polyfill */ "./node_modules/webextension-polyfill/dist/browser-polyfill.js");


/***/ }),

/***/ "./node_modules/webextension-polyfill/dist/browser-polyfill.js":
/*!*********************************************************************!*\
  !*** ./node_modules/webextension-polyfill/dist/browser-polyfill.js ***!
  \*********************************************************************/
/***/ (function(module, exports) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (global, factory) {
  if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [module], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
		__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
		(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  } else // removed by dead control flow
{ var mod; }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (module) {
  /* webextension-polyfill - v0.8.0 - Tue Apr 20 2021 11:27:38 */

  /* -*- Mode: indent-tabs-mode: nil; js-indent-level: 2 -*- */

  /* vim: set sts=2 sw=2 et tw=80: */

  /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
  "use strict";

  if (typeof browser === "undefined" || Object.getPrototypeOf(browser) !== Object.prototype) {
    const CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE = "The message port closed before a response was received.";
    const SEND_RESPONSE_DEPRECATION_WARNING = "Returning a Promise is the preferred way to send a reply from an onMessage/onMessageExternal listener, as the sendResponse will be removed from the specs (See https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage)"; // Wrapping the bulk of this polyfill in a one-time-use function is a minor
    // optimization for Firefox. Since Spidermonkey does not fully parse the
    // contents of a function until the first time it's called, and since it will
    // never actually need to be called, this allows the polyfill to be included
    // in Firefox nearly for free.

    const wrapAPIs = extensionAPIs => {
      // NOTE: apiMetadata is associated to the content of the api-metadata.json file
      // at build time by replacing the following "include" with the content of the
      // JSON file.
      const apiMetadata = {
        "alarms": {
          "clear": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "clearAll": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "get": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "getAll": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "bookmarks": {
          "create": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "get": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getChildren": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getRecent": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getSubTree": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getTree": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "move": {
            "minArgs": 2,
            "maxArgs": 2
          },
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeTree": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "search": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "update": {
            "minArgs": 2,
            "maxArgs": 2
          }
        },
        "browserAction": {
          "disable": {
            "minArgs": 0,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "enable": {
            "minArgs": 0,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "getBadgeBackgroundColor": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getBadgeText": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getPopup": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getTitle": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "openPopup": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "setBadgeBackgroundColor": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "setBadgeText": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "setIcon": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "setPopup": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "setTitle": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          }
        },
        "browsingData": {
          "remove": {
            "minArgs": 2,
            "maxArgs": 2
          },
          "removeCache": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeCookies": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeDownloads": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeFormData": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeHistory": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeLocalStorage": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removePasswords": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removePluginData": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "settings": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "commands": {
          "getAll": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "contextMenus": {
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeAll": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "update": {
            "minArgs": 2,
            "maxArgs": 2
          }
        },
        "cookies": {
          "get": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getAll": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getAllCookieStores": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "set": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "devtools": {
          "inspectedWindow": {
            "eval": {
              "minArgs": 1,
              "maxArgs": 2,
              "singleCallbackArg": false
            }
          },
          "panels": {
            "create": {
              "minArgs": 3,
              "maxArgs": 3,
              "singleCallbackArg": true
            },
            "elements": {
              "createSidebarPane": {
                "minArgs": 1,
                "maxArgs": 1
              }
            }
          }
        },
        "downloads": {
          "cancel": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "download": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "erase": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getFileIcon": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "open": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "pause": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeFile": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "resume": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "search": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "show": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          }
        },
        "extension": {
          "isAllowedFileSchemeAccess": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "isAllowedIncognitoAccess": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "history": {
          "addUrl": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "deleteAll": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "deleteRange": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "deleteUrl": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getVisits": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "search": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "i18n": {
          "detectLanguage": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getAcceptLanguages": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "identity": {
          "launchWebAuthFlow": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "idle": {
          "queryState": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "management": {
          "get": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getAll": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "getSelf": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "setEnabled": {
            "minArgs": 2,
            "maxArgs": 2
          },
          "uninstallSelf": {
            "minArgs": 0,
            "maxArgs": 1
          }
        },
        "notifications": {
          "clear": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "create": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "getAll": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "getPermissionLevel": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "update": {
            "minArgs": 2,
            "maxArgs": 2
          }
        },
        "pageAction": {
          "getPopup": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getTitle": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "hide": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "setIcon": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "setPopup": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "setTitle": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "show": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          }
        },
        "permissions": {
          "contains": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getAll": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "request": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "runtime": {
          "getBackgroundPage": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "getPlatformInfo": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "openOptionsPage": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "requestUpdateCheck": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "sendMessage": {
            "minArgs": 1,
            "maxArgs": 3
          },
          "sendNativeMessage": {
            "minArgs": 2,
            "maxArgs": 2
          },
          "setUninstallURL": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "sessions": {
          "getDevices": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "getRecentlyClosed": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "restore": {
            "minArgs": 0,
            "maxArgs": 1
          }
        },
        "storage": {
          "local": {
            "clear": {
              "minArgs": 0,
              "maxArgs": 0
            },
            "get": {
              "minArgs": 0,
              "maxArgs": 1
            },
            "getBytesInUse": {
              "minArgs": 0,
              "maxArgs": 1
            },
            "remove": {
              "minArgs": 1,
              "maxArgs": 1
            },
            "set": {
              "minArgs": 1,
              "maxArgs": 1
            }
          },
          "managed": {
            "get": {
              "minArgs": 0,
              "maxArgs": 1
            },
            "getBytesInUse": {
              "minArgs": 0,
              "maxArgs": 1
            }
          },
          "sync": {
            "clear": {
              "minArgs": 0,
              "maxArgs": 0
            },
            "get": {
              "minArgs": 0,
              "maxArgs": 1
            },
            "getBytesInUse": {
              "minArgs": 0,
              "maxArgs": 1
            },
            "remove": {
              "minArgs": 1,
              "maxArgs": 1
            },
            "set": {
              "minArgs": 1,
              "maxArgs": 1
            }
          }
        },
        "tabs": {
          "captureVisibleTab": {
            "minArgs": 0,
            "maxArgs": 2
          },
          "create": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "detectLanguage": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "discard": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "duplicate": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "executeScript": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "get": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getCurrent": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "getZoom": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "getZoomSettings": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "goBack": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "goForward": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "highlight": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "insertCSS": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "move": {
            "minArgs": 2,
            "maxArgs": 2
          },
          "query": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "reload": {
            "minArgs": 0,
            "maxArgs": 2
          },
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeCSS": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "sendMessage": {
            "minArgs": 2,
            "maxArgs": 3
          },
          "setZoom": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "setZoomSettings": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "update": {
            "minArgs": 1,
            "maxArgs": 2
          }
        },
        "topSites": {
          "get": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "webNavigation": {
          "getAllFrames": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getFrame": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "webRequest": {
          "handlerBehaviorChanged": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "windows": {
          "create": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "get": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "getAll": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "getCurrent": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "getLastFocused": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "update": {
            "minArgs": 2,
            "maxArgs": 2
          }
        }
      };

      if (Object.keys(apiMetadata).length === 0) {
        throw new Error("api-metadata.json has not been included in browser-polyfill");
      }
      /**
       * A WeakMap subclass which creates and stores a value for any key which does
       * not exist when accessed, but behaves exactly as an ordinary WeakMap
       * otherwise.
       *
       * @param {function} createItem
       *        A function which will be called in order to create the value for any
       *        key which does not exist, the first time it is accessed. The
       *        function receives, as its only argument, the key being created.
       */


      class DefaultWeakMap extends WeakMap {
        constructor(createItem, items = undefined) {
          super(items);
          this.createItem = createItem;
        }

        get(key) {
          if (!this.has(key)) {
            this.set(key, this.createItem(key));
          }

          return super.get(key);
        }

      }
      /**
       * Returns true if the given object is an object with a `then` method, and can
       * therefore be assumed to behave as a Promise.
       *
       * @param {*} value The value to test.
       * @returns {boolean} True if the value is thenable.
       */


      const isThenable = value => {
        return value && typeof value === "object" && typeof value.then === "function";
      };
      /**
       * Creates and returns a function which, when called, will resolve or reject
       * the given promise based on how it is called:
       *
       * - If, when called, `chrome.runtime.lastError` contains a non-null object,
       *   the promise is rejected with that value.
       * - If the function is called with exactly one argument, the promise is
       *   resolved to that value.
       * - Otherwise, the promise is resolved to an array containing all of the
       *   function's arguments.
       *
       * @param {object} promise
       *        An object containing the resolution and rejection functions of a
       *        promise.
       * @param {function} promise.resolve
       *        The promise's resolution function.
       * @param {function} promise.reject
       *        The promise's rejection function.
       * @param {object} metadata
       *        Metadata about the wrapped method which has created the callback.
       * @param {boolean} metadata.singleCallbackArg
       *        Whether or not the promise is resolved with only the first
       *        argument of the callback, alternatively an array of all the
       *        callback arguments is resolved. By default, if the callback
       *        function is invoked with only a single argument, that will be
       *        resolved to the promise, while all arguments will be resolved as
       *        an array if multiple are given.
       *
       * @returns {function}
       *        The generated callback function.
       */


      const makeCallback = (promise, metadata) => {
        return (...callbackArgs) => {
          if (extensionAPIs.runtime.lastError) {
            promise.reject(new Error(extensionAPIs.runtime.lastError.message));
          } else if (metadata.singleCallbackArg || callbackArgs.length <= 1 && metadata.singleCallbackArg !== false) {
            promise.resolve(callbackArgs[0]);
          } else {
            promise.resolve(callbackArgs);
          }
        };
      };

      const pluralizeArguments = numArgs => numArgs == 1 ? "argument" : "arguments";
      /**
       * Creates a wrapper function for a method with the given name and metadata.
       *
       * @param {string} name
       *        The name of the method which is being wrapped.
       * @param {object} metadata
       *        Metadata about the method being wrapped.
       * @param {integer} metadata.minArgs
       *        The minimum number of arguments which must be passed to the
       *        function. If called with fewer than this number of arguments, the
       *        wrapper will raise an exception.
       * @param {integer} metadata.maxArgs
       *        The maximum number of arguments which may be passed to the
       *        function. If called with more than this number of arguments, the
       *        wrapper will raise an exception.
       * @param {boolean} metadata.singleCallbackArg
       *        Whether or not the promise is resolved with only the first
       *        argument of the callback, alternatively an array of all the
       *        callback arguments is resolved. By default, if the callback
       *        function is invoked with only a single argument, that will be
       *        resolved to the promise, while all arguments will be resolved as
       *        an array if multiple are given.
       *
       * @returns {function(object, ...*)}
       *       The generated wrapper function.
       */


      const wrapAsyncFunction = (name, metadata) => {
        return function asyncFunctionWrapper(target, ...args) {
          if (args.length < metadata.minArgs) {
            throw new Error(`Expected at least ${metadata.minArgs} ${pluralizeArguments(metadata.minArgs)} for ${name}(), got ${args.length}`);
          }

          if (args.length > metadata.maxArgs) {
            throw new Error(`Expected at most ${metadata.maxArgs} ${pluralizeArguments(metadata.maxArgs)} for ${name}(), got ${args.length}`);
          }

          return new Promise((resolve, reject) => {
            if (metadata.fallbackToNoCallback) {
              // This API method has currently no callback on Chrome, but it return a promise on Firefox,
              // and so the polyfill will try to call it with a callback first, and it will fallback
              // to not passing the callback if the first call fails.
              try {
                target[name](...args, makeCallback({
                  resolve,
                  reject
                }, metadata));
              } catch (cbError) {
                console.warn(`${name} API method doesn't seem to support the callback parameter, ` + "falling back to call it without a callback: ", cbError);
                target[name](...args); // Update the API method metadata, so that the next API calls will not try to
                // use the unsupported callback anymore.

                metadata.fallbackToNoCallback = false;
                metadata.noCallback = true;
                resolve();
              }
            } else if (metadata.noCallback) {
              target[name](...args);
              resolve();
            } else {
              target[name](...args, makeCallback({
                resolve,
                reject
              }, metadata));
            }
          });
        };
      };
      /**
       * Wraps an existing method of the target object, so that calls to it are
       * intercepted by the given wrapper function. The wrapper function receives,
       * as its first argument, the original `target` object, followed by each of
       * the arguments passed to the original method.
       *
       * @param {object} target
       *        The original target object that the wrapped method belongs to.
       * @param {function} method
       *        The method being wrapped. This is used as the target of the Proxy
       *        object which is created to wrap the method.
       * @param {function} wrapper
       *        The wrapper function which is called in place of a direct invocation
       *        of the wrapped method.
       *
       * @returns {Proxy<function>}
       *        A Proxy object for the given method, which invokes the given wrapper
       *        method in its place.
       */


      const wrapMethod = (target, method, wrapper) => {
        return new Proxy(method, {
          apply(targetMethod, thisObj, args) {
            return wrapper.call(thisObj, target, ...args);
          }

        });
      };

      let hasOwnProperty = Function.call.bind(Object.prototype.hasOwnProperty);
      /**
       * Wraps an object in a Proxy which intercepts and wraps certain methods
       * based on the given `wrappers` and `metadata` objects.
       *
       * @param {object} target
       *        The target object to wrap.
       *
       * @param {object} [wrappers = {}]
       *        An object tree containing wrapper functions for special cases. Any
       *        function present in this object tree is called in place of the
       *        method in the same location in the `target` object tree. These
       *        wrapper methods are invoked as described in {@see wrapMethod}.
       *
       * @param {object} [metadata = {}]
       *        An object tree containing metadata used to automatically generate
       *        Promise-based wrapper functions for asynchronous. Any function in
       *        the `target` object tree which has a corresponding metadata object
       *        in the same location in the `metadata` tree is replaced with an
       *        automatically-generated wrapper function, as described in
       *        {@see wrapAsyncFunction}
       *
       * @returns {Proxy<object>}
       */

      const wrapObject = (target, wrappers = {}, metadata = {}) => {
        let cache = Object.create(null);
        let handlers = {
          has(proxyTarget, prop) {
            return prop in target || prop in cache;
          },

          get(proxyTarget, prop, receiver) {
            if (prop in cache) {
              return cache[prop];
            }

            if (!(prop in target)) {
              return undefined;
            }

            let value = target[prop];

            if (typeof value === "function") {
              // This is a method on the underlying object. Check if we need to do
              // any wrapping.
              if (typeof wrappers[prop] === "function") {
                // We have a special-case wrapper for this method.
                value = wrapMethod(target, target[prop], wrappers[prop]);
              } else if (hasOwnProperty(metadata, prop)) {
                // This is an async method that we have metadata for. Create a
                // Promise wrapper for it.
                let wrapper = wrapAsyncFunction(prop, metadata[prop]);
                value = wrapMethod(target, target[prop], wrapper);
              } else {
                // This is a method that we don't know or care about. Return the
                // original method, bound to the underlying object.
                value = value.bind(target);
              }
            } else if (typeof value === "object" && value !== null && (hasOwnProperty(wrappers, prop) || hasOwnProperty(metadata, prop))) {
              // This is an object that we need to do some wrapping for the children
              // of. Create a sub-object wrapper for it with the appropriate child
              // metadata.
              value = wrapObject(value, wrappers[prop], metadata[prop]);
            } else if (hasOwnProperty(metadata, "*")) {
              // Wrap all properties in * namespace.
              value = wrapObject(value, wrappers[prop], metadata["*"]);
            } else {
              // We don't need to do any wrapping for this property,
              // so just forward all access to the underlying object.
              Object.defineProperty(cache, prop, {
                configurable: true,
                enumerable: true,

                get() {
                  return target[prop];
                },

                set(value) {
                  target[prop] = value;
                }

              });
              return value;
            }

            cache[prop] = value;
            return value;
          },

          set(proxyTarget, prop, value, receiver) {
            if (prop in cache) {
              cache[prop] = value;
            } else {
              target[prop] = value;
            }

            return true;
          },

          defineProperty(proxyTarget, prop, desc) {
            return Reflect.defineProperty(cache, prop, desc);
          },

          deleteProperty(proxyTarget, prop) {
            return Reflect.deleteProperty(cache, prop);
          }

        }; // Per contract of the Proxy API, the "get" proxy handler must return the
        // original value of the target if that value is declared read-only and
        // non-configurable. For this reason, we create an object with the
        // prototype set to `target` instead of using `target` directly.
        // Otherwise we cannot return a custom object for APIs that
        // are declared read-only and non-configurable, such as `chrome.devtools`.
        //
        // The proxy handlers themselves will still use the original `target`
        // instead of the `proxyTarget`, so that the methods and properties are
        // dereferenced via the original targets.

        let proxyTarget = Object.create(target);
        return new Proxy(proxyTarget, handlers);
      };
      /**
       * Creates a set of wrapper functions for an event object, which handles
       * wrapping of listener functions that those messages are passed.
       *
       * A single wrapper is created for each listener function, and stored in a
       * map. Subsequent calls to `addListener`, `hasListener`, or `removeListener`
       * retrieve the original wrapper, so that  attempts to remove a
       * previously-added listener work as expected.
       *
       * @param {DefaultWeakMap<function, function>} wrapperMap
       *        A DefaultWeakMap object which will create the appropriate wrapper
       *        for a given listener function when one does not exist, and retrieve
       *        an existing one when it does.
       *
       * @returns {object}
       */


      const wrapEvent = wrapperMap => ({
        addListener(target, listener, ...args) {
          target.addListener(wrapperMap.get(listener), ...args);
        },

        hasListener(target, listener) {
          return target.hasListener(wrapperMap.get(listener));
        },

        removeListener(target, listener) {
          target.removeListener(wrapperMap.get(listener));
        }

      });

      const onRequestFinishedWrappers = new DefaultWeakMap(listener => {
        if (typeof listener !== "function") {
          return listener;
        }
        /**
         * Wraps an onRequestFinished listener function so that it will return a
         * `getContent()` property which returns a `Promise` rather than using a
         * callback API.
         *
         * @param {object} req
         *        The HAR entry object representing the network request.
         */


        return function onRequestFinished(req) {
          const wrappedReq = wrapObject(req, {}
          /* wrappers */
          , {
            getContent: {
              minArgs: 0,
              maxArgs: 0
            }
          });
          listener(wrappedReq);
        };
      }); // Keep track if the deprecation warning has been logged at least once.

      let loggedSendResponseDeprecationWarning = false;
      const onMessageWrappers = new DefaultWeakMap(listener => {
        if (typeof listener !== "function") {
          return listener;
        }
        /**
         * Wraps a message listener function so that it may send responses based on
         * its return value, rather than by returning a sentinel value and calling a
         * callback. If the listener function returns a Promise, the response is
         * sent when the promise either resolves or rejects.
         *
         * @param {*} message
         *        The message sent by the other end of the channel.
         * @param {object} sender
         *        Details about the sender of the message.
         * @param {function(*)} sendResponse
         *        A callback which, when called with an arbitrary argument, sends
         *        that value as a response.
         * @returns {boolean}
         *        True if the wrapped listener returned a Promise, which will later
         *        yield a response. False otherwise.
         */


        return function onMessage(message, sender, sendResponse) {
          let didCallSendResponse = false;
          let wrappedSendResponse;
          let sendResponsePromise = new Promise(resolve => {
            wrappedSendResponse = function (response) {
              if (!loggedSendResponseDeprecationWarning) {
                console.warn(SEND_RESPONSE_DEPRECATION_WARNING, new Error().stack);
                loggedSendResponseDeprecationWarning = true;
              }

              didCallSendResponse = true;
              resolve(response);
            };
          });
          let result;

          try {
            result = listener(message, sender, wrappedSendResponse);
          } catch (err) {
            result = Promise.reject(err);
          }

          const isResultThenable = result !== true && isThenable(result); // If the listener didn't returned true or a Promise, or called
          // wrappedSendResponse synchronously, we can exit earlier
          // because there will be no response sent from this listener.

          if (result !== true && !isResultThenable && !didCallSendResponse) {
            return false;
          } // A small helper to send the message if the promise resolves
          // and an error if the promise rejects (a wrapped sendMessage has
          // to translate the message into a resolved promise or a rejected
          // promise).


          const sendPromisedResult = promise => {
            promise.then(msg => {
              // send the message value.
              sendResponse(msg);
            }, error => {
              // Send a JSON representation of the error if the rejected value
              // is an instance of error, or the object itself otherwise.
              let message;

              if (error && (error instanceof Error || typeof error.message === "string")) {
                message = error.message;
              } else {
                message = "An unexpected error occurred";
              }

              sendResponse({
                __mozWebExtensionPolyfillReject__: true,
                message
              });
            }).catch(err => {
              // Print an error on the console if unable to send the response.
              console.error("Failed to send onMessage rejected reply", err);
            });
          }; // If the listener returned a Promise, send the resolved value as a
          // result, otherwise wait the promise related to the wrappedSendResponse
          // callback to resolve and send it as a response.


          if (isResultThenable) {
            sendPromisedResult(result);
          } else {
            sendPromisedResult(sendResponsePromise);
          } // Let Chrome know that the listener is replying.


          return true;
        };
      });

      const wrappedSendMessageCallback = ({
        reject,
        resolve
      }, reply) => {
        if (extensionAPIs.runtime.lastError) {
          // Detect when none of the listeners replied to the sendMessage call and resolve
          // the promise to undefined as in Firefox.
          // See https://github.com/mozilla/webextension-polyfill/issues/130
          if (extensionAPIs.runtime.lastError.message === CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE) {
            resolve();
          } else {
            reject(new Error(extensionAPIs.runtime.lastError.message));
          }
        } else if (reply && reply.__mozWebExtensionPolyfillReject__) {
          // Convert back the JSON representation of the error into
          // an Error instance.
          reject(new Error(reply.message));
        } else {
          resolve(reply);
        }
      };

      const wrappedSendMessage = (name, metadata, apiNamespaceObj, ...args) => {
        if (args.length < metadata.minArgs) {
          throw new Error(`Expected at least ${metadata.minArgs} ${pluralizeArguments(metadata.minArgs)} for ${name}(), got ${args.length}`);
        }

        if (args.length > metadata.maxArgs) {
          throw new Error(`Expected at most ${metadata.maxArgs} ${pluralizeArguments(metadata.maxArgs)} for ${name}(), got ${args.length}`);
        }

        return new Promise((resolve, reject) => {
          const wrappedCb = wrappedSendMessageCallback.bind(null, {
            resolve,
            reject
          });
          args.push(wrappedCb);
          apiNamespaceObj.sendMessage(...args);
        });
      };

      const staticWrappers = {
        devtools: {
          network: {
            onRequestFinished: wrapEvent(onRequestFinishedWrappers)
          }
        },
        runtime: {
          onMessage: wrapEvent(onMessageWrappers),
          onMessageExternal: wrapEvent(onMessageWrappers),
          sendMessage: wrappedSendMessage.bind(null, "sendMessage", {
            minArgs: 1,
            maxArgs: 3
          })
        },
        tabs: {
          sendMessage: wrappedSendMessage.bind(null, "sendMessage", {
            minArgs: 2,
            maxArgs: 3
          })
        }
      };
      const settingMetadata = {
        clear: {
          minArgs: 1,
          maxArgs: 1
        },
        get: {
          minArgs: 1,
          maxArgs: 1
        },
        set: {
          minArgs: 1,
          maxArgs: 1
        }
      };
      apiMetadata.privacy = {
        network: {
          "*": settingMetadata
        },
        services: {
          "*": settingMetadata
        },
        websites: {
          "*": settingMetadata
        }
      };
      return wrapObject(extensionAPIs, staticWrappers, apiMetadata);
    };

    if (typeof chrome != "object" || !chrome || !chrome.runtime || !chrome.runtime.id) {
      throw new Error("This script should only be loaded in a browser extension.");
    } // The build process adds a UMD wrapper around this file, which makes the
    // `module` variable available.


    module.exports = wrapAPIs(chrome);
  } else {
    module.exports = browser;
  }
});
//# sourceMappingURL=browser-polyfill.js.map


/***/ }),

/***/ "./src/active_time_check.ts":
/*!**********************************!*\
  !*** ./src/active_time_check.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   checkActiveTime: () => (/* binding */ checkActiveTime)
/* harmony export */ });
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./util */ "./src/util.ts");
/* harmony import */ var _storage__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./storage */ "./src/storage.ts");
/* harmony import */ var _event_log__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./event_log */ "./src/event_log.ts");
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};




function checkActiveTime() {
    return __awaiter(this, void 0, void 0, function () {
        var now, hours, minutes, data, hasActiveTime, tournamentUrlRegex, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, 6, 7]);
                    (0,_util__WEBPACK_IMPORTED_MODULE_0__.debugLog)('[checkActiveTime] START');
                    now = new Date();
                    hours = now.getHours();
                    minutes = now.getMinutes();
                    return [4 /*yield*/, (0,_storage__WEBPACK_IMPORTED_MODULE_1__.getData)()];
                case 1:
                    data = _a.sent();
                    if (!(hours >= 6 && hours < 17)) return [3 /*break*/, 3];
                    return [4 /*yield*/, (0,_storage__WEBPACK_IMPORTED_MODULE_1__.checkHasActiveTime)()];
                case 2:
                    hasActiveTime = _a.sent();
                    console.log('[checkActiveTime] hasActiveTime [' + hasActiveTime + ']');
                    tournamentUrlRegex = new RegExp('.*tournament.*');
                    // if is tournament page redirect always
                    if (!hasActiveTime ||
                        (data.disableBlitz && tournamentUrlRegex.test(window.location.href))) {
                        (0,_event_log__WEBPACK_IMPORTED_MODULE_2__.logEvent)("game page LOCKED, redirecting to /streak: unlocked until ".concat((0,_event_log__WEBPACK_IMPORTED_MODULE_2__.formatTime)(data.expireTime)) +
                            ", hasActiveTime ".concat(hasActiveTime, ", last stored score ").concat(data.currentScore));
                        (0,_util__WEBPACK_IMPORTED_MODULE_0__.debugLog)('[checkActiveTime] redirecting');
                        window.location.replace("https://lichess.org/streak");
                    }
                    else {
                        (0,_event_log__WEBPACK_IMPORTED_MODULE_2__.logEvent)("game page unlocked until ".concat((0,_event_log__WEBPACK_IMPORTED_MODULE_2__.formatTime)(data.expireTime)));
                        (0,_util__WEBPACK_IMPORTED_MODULE_0__.debugLog)('[checkActiveTime] proceed');
                    }
                    return [3 /*break*/, 4];
                case 3:
                    (0,_event_log__WEBPACK_IMPORTED_MODULE_2__.logEvent)("game page open outside locked hours (6:00-17:00)");
                    _a.label = 4;
                case 4: return [3 /*break*/, 7];
                case 5:
                    error_1 = _a.sent();
                    (0,_event_log__WEBPACK_IMPORTED_MODULE_2__.logError)('checkActiveTime', error_1);
                    return [3 /*break*/, 7];
                case 6:
                    (0,_util__WEBPACK_IMPORTED_MODULE_0__.debugLog)('[checkActiveTime] DONE');
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    });
}


/***/ }),

/***/ "./src/blitz_control.ts":
/*!******************************!*\
  !*** ./src/blitz_control.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   initBlitzControl: () => (/* binding */ initBlitzControl)
/* harmony export */ });
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./util */ "./src/util.ts");

function hideQuickPairingButtons() {
    var _a, _b, _c, _d, _e;
    (0,_util__WEBPACK_IMPORTED_MODULE_0__.debugLog)('[hideQuickPairingButtons]');
    // remove quick pairing buttons
    (_a = document.querySelector('[data-id="1+0"]')) === null || _a === void 0 ? void 0 : _a.remove();
    (_b = document.querySelector('[data-id="2+1"]')) === null || _b === void 0 ? void 0 : _b.remove();
    (_c = document.querySelector('[data-id="3+0"]')) === null || _c === void 0 ? void 0 : _c.remove();
    (_d = document.querySelector('[data-id="3+2"]')) === null || _d === void 0 ? void 0 : _d.remove();
    (_e = document.querySelector('[data-id="5+0"]')) === null || _e === void 0 ? void 0 : _e.remove();
}
function addCustomButtonEventHandler() {
    (0,_util__WEBPACK_IMPORTED_MODULE_0__.debugLog)('[addCustomButtonEventHandler]');
    var customButton = document.querySelector('[data-id="custom"]');
    if (customButton != null) {
        customButton.addEventListener('click', function (e) {
            setTimeout(adjustTimeSliders, 500);
        });
    }
}
var timeDivName = "time-choice range";
var incDivName = "increment-choice range";
function adjustTimeSliders() {
    (0,_util__WEBPACK_IMPORTED_MODULE_0__.debugLog)('[adjustTimeSliders]');
    var timeDiv = document.getElementsByClassName(timeDivName)[0];
    if (timeDiv != null && timeDiv instanceof HTMLDivElement) {
        //debugLog(`Found ${timeDiv} element`);
        var minutesRange = timeDiv.getElementsByClassName("range")[0];
        if (minutesRange != null && minutesRange instanceof HTMLInputElement) {
            //debugLog(`Found timeRange`);
            minutesRange.min = "9";
        }
    }
    var incDiv = document.getElementsByClassName(incDivName)[0];
    if (incDiv != null && incDiv instanceof HTMLDivElement) {
        //debugLog(`Found ${incDiv} element`);
        var minutesRange = incDiv.getElementsByClassName("range")[0];
        if (minutesRange != null && minutesRange instanceof HTMLInputElement) {
            //debugLog(`Found incrementRange`);
            minutesRange.min = "3";
        }
    }
}
function initBlitzControl() {
    (0,_util__WEBPACK_IMPORTED_MODULE_0__.debugLog)('[initBlitzControl]');
    try {
        hideQuickPairingButtons();
        addCustomButtonEventHandler();
        adjustTimeSliders(); // in case the dialog is already open
    }
    catch (e) {
        (0,_util__WEBPACK_IMPORTED_MODULE_0__.debugLog)(e);
    }
}


/***/ }),

/***/ "./src/data.ts":
/*!*********************!*\
  !*** ./src/data.ts ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ChessKeyData: () => (/* binding */ ChessKeyData)
/* harmony export */ });
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./util */ "./src/util.ts");
/* harmony import */ var _streak_rules__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./streak_rules */ "./src/streak_rules.ts");


var ChessKeyData = /** @class */ (function () {
    function ChessKeyData(targetScore, expireTime, disableBlitz, currentScore, paidRung) {
        this.targetScore = targetScore !== null && targetScore !== void 0 ? targetScore : 40;
        this.expireTime = expireTime !== null && expireTime !== void 0 ? expireTime : 0;
        this.disableBlitz = disableBlitz !== null && disableBlitz !== void 0 ? disableBlitz : false;
        this.currentScore = currentScore !== null && currentScore !== void 0 ? currentScore : 0;
        this.paidRung = paidRung !== null && paidRung !== void 0 ? paidRung : _streak_rules__WEBPACK_IMPORTED_MODULE_1__.NO_RUNG_PAID;
    }
    ChessKeyData.prototype.dumpToLog = function () {
        (0,_util__WEBPACK_IMPORTED_MODULE_0__.debugLog)("[dumpToLog] currentScore [".concat(this.currentScore, "]"));
        (0,_util__WEBPACK_IMPORTED_MODULE_0__.debugLog)("[dumpToLog] paidRung [".concat(this.paidRung, "]"));
        (0,_util__WEBPACK_IMPORTED_MODULE_0__.debugLog)("[dumpToLog] targetScore [".concat(this.targetScore, "]"));
        (0,_util__WEBPACK_IMPORTED_MODULE_0__.debugLog)("[dumpToLog] expireTime [".concat(this.expireTime, "]"));
        (0,_util__WEBPACK_IMPORTED_MODULE_0__.debugLog)("[dumpToLog] disableBlitz [".concat(this.disableBlitz, "]"));
    };
    return ChessKeyData;
}());

;


/***/ }),

/***/ "./src/event_log.ts":
/*!**************************!*\
  !*** ./src/event_log.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   clearEventLog: () => (/* binding */ clearEventLog),
/* harmony export */   formatTime: () => (/* binding */ formatTime),
/* harmony export */   logError: () => (/* binding */ logError),
/* harmony export */   logEvent: () => (/* binding */ logEvent),
/* harmony export */   readEventLog: () => (/* binding */ readEventLog),
/* harmony export */   watchStorageChanges: () => (/* binding */ watchStorageChanges)
/* harmony export */ });
/* harmony import */ var webextension_polyfill_ts__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! webextension-polyfill-ts */ "./node_modules/webextension-polyfill-ts/lib/index.js");
/* harmony import */ var _storage_queue__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./storage_queue */ "./src/storage_queue.ts");


/**
 * A persistent record of what the extension saw and decided, for working out after
 * the fact why games did or did not unlock.
 *
 * The console is no use for that: it is cleared on every page load, and a missed
 * unlock is exactly what triggers one -- the active time check bounces the game page
 * back to /streak. This log lives in storage.local and survives reloads. Read it from
 * the Options page.
 */
var LOG_KEY = 'chessKeyEventLog';
var MAX_ENTRIES = 1000;
// Appends and Clear share one queue, so two events logged back to back cannot drop
// each other and a queued append cannot land after a Clear. Ordering is per page;
// two lichess tabs logging at the same instant can still lose an entry.
var logStore = (0,_storage_queue__WEBPACK_IMPORTED_MODULE_1__.createLogStore)(webextension_polyfill_ts__WEBPACK_IMPORTED_MODULE_0__.browser.storage.local, LOG_KEY, MAX_ENTRIES);
function logEvent(msg) {
    console.log("[event] ".concat(msg));
    var entry = { time: Date.now(), page: window.location.pathname, msg: msg };
    logStore.append(entry).catch(function (error) { return console.error("[logEvent] ".concat(error)); });
}
function logError(where, error) {
    var _a;
    console.error("[".concat(where, "] ").concat(error));
    logEvent("ERROR in ".concat(where, ": ").concat((_a = error === null || error === void 0 ? void 0 : error.stack) !== null && _a !== void 0 ? _a : error));
}
/**
 * Records every change to the unlock expiry and the target, whoever made it, with the
 * value before and after. An award that is written and then quietly put back shows
 * up here as an expiry that moves forward and then straight back.
 */
function watchStorageChanges() {
    webextension_polyfill_ts__WEBPACK_IMPORTED_MODULE_0__.browser.storage.onChanged.addListener(function (changes, area) {
        var _a, _b, _c, _d, _e, _f;
        var change = changes['chessKeyData'];
        if (area != 'sync' || change == null) {
            return;
        }
        var before = (_a = change.oldValue) !== null && _a !== void 0 ? _a : {};
        var after = (_b = change.newValue) !== null && _b !== void 0 ? _b : {};
        if (before.expireTime != after.expireTime) {
            var direction = ((_c = after.expireTime) !== null && _c !== void 0 ? _c : 0) < ((_d = before.expireTime) !== null && _d !== void 0 ? _d : 0) ? ' (MOVED BACKWARDS)' : '';
            logEvent("stored unlock changed ".concat(formatTime((_e = before.expireTime) !== null && _e !== void 0 ? _e : 0), " -> ").concat(formatTime((_f = after.expireTime) !== null && _f !== void 0 ? _f : 0)).concat(direction));
        }
        if (before.targetScore != after.targetScore) {
            logEvent("stored target changed ".concat(before.targetScore, " -> ").concat(after.targetScore));
        }
    });
}
function readEventLog() {
    return logStore.read();
}
function clearEventLog() {
    return logStore.clear();
}
function formatTime(millis) {
    return millis > 0 ? new Date(millis).toLocaleString() : 'never';
}


/***/ }),

/***/ "./src/options.ts":
/*!************************!*\
  !*** ./src/options.ts ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   initOptionsIfAble: () => (/* binding */ initOptionsIfAble)
/* harmony export */ });
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./util */ "./src/util.ts");
/* harmony import */ var _storage__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./storage */ "./src/storage.ts");
/* harmony import */ var _event_log__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./event_log */ "./src/event_log.ts");
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};




function showEventLog() {
    return __awaiter(this, void 0, void 0, function () {
        var entries, lines;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0,_event_log__WEBPACK_IMPORTED_MODULE_2__.readEventLog)()];
                case 1:
                    entries = _a.sent();
                    lines = entries.slice().reverse().map(function (e) { return "".concat((0,_event_log__WEBPACK_IMPORTED_MODULE_2__.formatTime)(e.time), "  ").concat(e.page, "  ").concat(e.msg); });
                    document.getElementById('event-log').textContent = lines.length > 0 ? lines.join('\n') : '(empty)';
                    return [2 /*return*/];
            }
        });
    });
}
function initEventLogView() {
    var _this = this;
    showEventLog();
    (0,_util__WEBPACK_IMPORTED_MODULE_0__.getInputElement)('event-log-refresh').addEventListener('click', showEventLog);
    (0,_util__WEBPACK_IMPORTED_MODULE_0__.getInputElement)('event-log-copy').addEventListener('click', function () {
        var _a;
        navigator.clipboard.writeText((_a = document.getElementById('event-log').textContent) !== null && _a !== void 0 ? _a : '');
    });
    (0,_util__WEBPACK_IMPORTED_MODULE_0__.getInputElement)('event-log-clear').addEventListener('click', function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0,_event_log__WEBPACK_IMPORTED_MODULE_2__.clearEventLog)()];
                case 1:
                    _a.sent();
                    showEventLog();
                    return [2 /*return*/];
            }
        });
    }); });
}
function saveOptions() {
    return __awaiter(this, void 0, void 0, function () {
        var targetPuzzle_1, disableBlitz_1, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    (0,_util__WEBPACK_IMPORTED_MODULE_0__.debugLog)('[saveOptions]');
                    targetPuzzle_1 = parseInt((0,_util__WEBPACK_IMPORTED_MODULE_0__.getInputElement)('target-puzzle').value);
                    disableBlitz_1 = (0,_util__WEBPACK_IMPORTED_MODULE_0__.getInputElement)('disable-blitz').checked;
                    // An empty or non-numeric target would be saved as null, and a null target
                    // pays on every new streak page.
                    if (!Number.isInteger(targetPuzzle_1) || targetPuzzle_1 < 1) {
                        (0,_event_log__WEBPACK_IMPORTED_MODULE_2__.logEvent)("options NOT saved: target \"".concat((0,_util__WEBPACK_IMPORTED_MODULE_0__.getInputElement)('target-puzzle').value, "\" is not a whole number of at least 1"));
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, (0,_storage__WEBPACK_IMPORTED_MODULE_1__.updateData)(function (data) {
                            (0,_event_log__WEBPACK_IMPORTED_MODULE_2__.logEvent)("options saved: target ".concat(data.targetScore, " -> ").concat(targetPuzzle_1, ", disableBlitz ").concat(data.disableBlitz, " -> ").concat(disableBlitz_1));
                            data.targetScore = targetPuzzle_1;
                            data.disableBlitz = disableBlitz_1;
                        })];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    e_1 = _a.sent();
                    (0,_util__WEBPACK_IMPORTED_MODULE_0__.debugLog)(e_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function loadOptions() {
    return __awaiter(this, void 0, void 0, function () {
        var data, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    (0,_util__WEBPACK_IMPORTED_MODULE_0__.debugLog)('[loadOptions]');
                    return [4 /*yield*/, (0,_storage__WEBPACK_IMPORTED_MODULE_1__.getData)()];
                case 1:
                    data = _a.sent();
                    (0,_util__WEBPACK_IMPORTED_MODULE_0__.getInputElement)('target-puzzle').value = data.targetScore.toString();
                    (0,_util__WEBPACK_IMPORTED_MODULE_0__.getInputElement)('disable-blitz').checked = data.disableBlitz;
                    return [3 /*break*/, 3];
                case 2:
                    e_2 = _a.sent();
                    (0,_util__WEBPACK_IMPORTED_MODULE_0__.debugLog)(e_2);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function breakOptions() {
    return __awaiter(this, void 0, void 0, function () {
        var expireTime, curTime, timeToBreak, e_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    (0,_util__WEBPACK_IMPORTED_MODULE_0__.debugLog)('[breakOptions]');
                    return [4 /*yield*/, (0,_storage__WEBPACK_IMPORTED_MODULE_1__.getData)()];
                case 1:
                    expireTime = (_a.sent()).expireTime;
                    curTime = Date.now();
                    if (!(curTime - expireTime > 90 * 60 * 1000)) return [3 /*break*/, 3];
                    (0,_event_log__WEBPACK_IMPORTED_MODULE_2__.logEvent)('take a break: +5m');
                    return [4 /*yield*/, (0,_storage__WEBPACK_IMPORTED_MODULE_1__.addActiveMinutes)(5)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    timeToBreak = 90 - Math.round((curTime - expireTime) / 60000);
                    console.log("[breakOptions] time to next break [".concat(timeToBreak, "m]"));
                    _a.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    e_3 = _a.sent();
                    (0,_util__WEBPACK_IMPORTED_MODULE_0__.debugLog)(e_3);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function initOptionsIfAble() {
    (0,_util__WEBPACK_IMPORTED_MODULE_0__.debugLog)('[initOptions]');
    if (document.getElementById('target-puzzle') != null && document.getElementById('disable-blitz') != null) {
        loadOptions();
        (0,_util__WEBPACK_IMPORTED_MODULE_0__.getInputElement)('save').addEventListener('click', saveOptions);
        (0,_util__WEBPACK_IMPORTED_MODULE_0__.getInputElement)('break').addEventListener('click', breakOptions);
        initEventLogView();
    }
    else {
        (0,_util__WEBPACK_IMPORTED_MODULE_0__.debugLog)('[initOptions] no options to init');
    }
}


/***/ }),

/***/ "./src/storage.ts":
/*!************************!*\
  !*** ./src/storage.ts ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   addActiveMinutes: () => (/* binding */ addActiveMinutes),
/* harmony export */   checkHasActiveTime: () => (/* binding */ checkHasActiveTime),
/* harmony export */   getData: () => (/* binding */ getData),
/* harmony export */   getDisableBlitz: () => (/* binding */ getDisableBlitz),
/* harmony export */   readData: () => (/* binding */ readData),
/* harmony export */   saveStreakState: () => (/* binding */ saveStreakState),
/* harmony export */   updateData: () => (/* binding */ updateData)
/* harmony export */ });
/* harmony import */ var webextension_polyfill_ts__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! webextension-polyfill-ts */ "./node_modules/webextension-polyfill-ts/lib/index.js");
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./util */ "./src/util.ts");
/* harmony import */ var _data__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./data */ "./src/data.ts");
/* harmony import */ var _storage_queue__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./storage_queue */ "./src/storage_queue.ts");
/* harmony import */ var _event_log__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./event_log */ "./src/event_log.ts");
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};





var AWARD_VERIFY_DELAY_MILLIS = 3000;
var READ_ATTEMPTS = 3;
var READ_RETRY_DELAY_MILLIS = 500;
// Every write goes through this one queue -- see storage_queue.ts for the lost-update
// race it exists to prevent. Only this page's writes are ordered; two lichess tabs
// writing at the same instant can still race.
var dataStore = (0,_storage_queue__WEBPACK_IMPORTED_MODULE_3__.createDataStore)(webextension_polyfill_ts__WEBPACK_IMPORTED_MODULE_0__.browser.storage.sync, 'chessKeyData', function () { return new _data__WEBPACK_IMPORTED_MODULE_2__.ChessKeyData(); });
function updateData(mutate) {
    return __awaiter(this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, dataStore.update(mutate)];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_1 = _a.sent();
                    (0,_event_log__WEBPACK_IMPORTED_MODULE_4__.logError)('updateData', error_1);
                    throw error_1;
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * For decisions that feed a write, such as the streak page's target and paid rung.
 * Retries a failing read, then rejects: falling back to the defaults here would pay
 * at the default target and forget the paid rung.
 */
function readData() {
    return __awaiter(this, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0,_storage_queue__WEBPACK_IMPORTED_MODULE_3__.retry)(function () { return dataStore.read(); }, READ_ATTEMPTS, READ_RETRY_DELAY_MILLIS)];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_2 = _a.sent();
                    (0,_event_log__WEBPACK_IMPORTED_MODULE_4__.logError)('readData', error_2);
                    throw error_2;
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * For display and for decisions that write nothing. A failed read falls back to the
 * defaults, which reads as "locked" -- never base a write on the result, use
 * updateData.
 */
function getData() {
    return __awaiter(this, void 0, void 0, function () {
        var error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, dataStore.read()];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_3 = _a.sent();
                    (0,_event_log__WEBPACK_IMPORTED_MODULE_4__.logError)('getData', error_3);
                    return [2 /*return*/, new _data__WEBPACK_IMPORTED_MODULE_2__.ChessKeyData()];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getDisableBlitz() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getData()];
                case 1: return [2 /*return*/, (_a.sent()).disableBlitz];
            }
        });
    });
}
/**
 * Applies `mutate` and, when minutes > 0, unlocks games until now + minutes, all in
 * one write. "AWARD WRITTEN" is only logged once that write has succeeded.
 */
function writeAward(minutes, mutate) {
    return __awaiter(this, void 0, void 0, function () {
        var expireTime, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    expireTime = Date.now() + (minutes * 60 * 1000);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, updateData(function (data) {
                            mutate(data);
                            if (minutes > 0) {
                                data.expireTime = expireTime;
                            }
                        })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_4 = _a.sent();
                    if (minutes > 0) {
                        (0,_event_log__WEBPACK_IMPORTED_MODULE_4__.logEvent)("AWARD WRITE FAILED +".concat(minutes, "m: ").concat(error_4));
                    }
                    throw error_4;
                case 4:
                    if (minutes > 0) {
                        (0,_event_log__WEBPACK_IMPORTED_MODULE_4__.logEvent)("AWARD WRITTEN +".concat(minutes, "m, games unlocked until ").concat((0,_event_log__WEBPACK_IMPORTED_MODULE_4__.formatTime)(expireTime)));
                        setTimeout(function () { return verifyAward(expireTime); }, AWARD_VERIFY_DELAY_MILLIS);
                    }
                    return [2 /*return*/];
            }
        });
    });
}
// Kept from the investigation into lost awards: if anything still writes a stale
// expireTime back (another tab, a future writer), this says so.
function verifyAward(expireTime) {
    return __awaiter(this, void 0, void 0, function () {
        var after;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getData()];
                case 1:
                    after = _a.sent();
                    if (after.expireTime < expireTime) {
                        (0,_event_log__WEBPACK_IMPORTED_MODULE_4__.logEvent)("AWARD LOST: expireTime was overwritten back to ".concat((0,_event_log__WEBPACK_IMPORTED_MODULE_4__.formatTime)(after.expireTime)));
                    }
                    else {
                        (0,_event_log__WEBPACK_IMPORTED_MODULE_4__.logEvent)("award verified, unlocked until ".concat((0,_event_log__WEBPACK_IMPORTED_MODULE_4__.formatTime)(after.expireTime)));
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function addActiveMinutes(minutes) {
    (0,_util__WEBPACK_IMPORTED_MODULE_1__.debugLog)("[addActiveMinutes] Adding ".concat(minutes, " minutes"));
    return writeAward(minutes, function () { });
}
/** One write for a score reading: the score, the paid rung and any award together. */
function saveStreakState(score, paidRung, awardMinutes) {
    return writeAward(awardMinutes, function (data) {
        data.currentScore = score;
        data.paidRung = paidRung;
    });
}
function checkHasActiveTime() {
    return __awaiter(this, void 0, void 0, function () {
        var expireTime, curTime;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getData()];
                case 1:
                    expireTime = (_a.sent()).expireTime;
                    curTime = Date.now();
                    (0,_util__WEBPACK_IMPORTED_MODULE_1__.debugLog)("[checkHasActiveTime] expireTime [".concat(expireTime, "] >= curTime [").concat(curTime, "]"));
                    return [2 /*return*/, expireTime >= curTime];
            }
        });
    });
}


/***/ }),

/***/ "./src/storage_queue.ts":
/*!******************************!*\
  !*** ./src/storage_queue.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createDataStore: () => (/* binding */ createDataStore),
/* harmony export */   createLogStore: () => (/* binding */ createLogStore),
/* harmony export */   createQueue: () => (/* binding */ createQueue),
/* harmony export */   retry: () => (/* binding */ retry)
/* harmony export */ });
/**
 * Serialized read-modify-write over a browser storage area.
 *
 * Writers used to save a whole object they had read earlier, so whichever save
 * landed last put back every field the others had just changed -- including a
 * freshly awarded unlock. Here every change reads fresh data, applies itself and
 * waits for its save before the next change starts.
 *
 * No browser imports on purpose: the node test runner drives this module directly
 * with a fake storage area whose calls are slow enough to overlap.
 */
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
/**
 * Runs jobs one at a time, in the order they were queued. A job that fails rejects
 * its own promise but does not stop the jobs queued after it.
 */
function createQueue() {
    var tail = Promise.resolve();
    return function enqueue(job) {
        var result = tail.then(job);
        tail = result.catch(function () { });
        return result;
    };
}
/**
 * Runs `job` up to `attempts` times, waiting `delayMillis` between tries, and returns
 * the first success. Rejects with the last error once the attempts run out.
 */
function retry(job, attempts, delayMillis) {
    return __awaiter(this, void 0, void 0, function () {
        var lastError, attempt, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    attempt = 1;
                    _a.label = 1;
                case 1:
                    if (!(attempt <= attempts)) return [3 /*break*/, 8];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 7]);
                    return [4 /*yield*/, job()];
                case 3: return [2 /*return*/, _a.sent()];
                case 4:
                    error_1 = _a.sent();
                    lastError = error_1;
                    if (!(attempt < attempts)) return [3 /*break*/, 6];
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, delayMillis); })];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6: return [3 /*break*/, 7];
                case 7:
                    attempt++;
                    return [3 /*break*/, 1];
                case 8: throw lastError;
            }
        });
    });
}
function createDataStore(area, key, makeDefault) {
    var enqueue = createQueue();
    // Fields added since the object was stored (paidRung, for data saved by 2.1.1)
    // come from the defaults instead of reading as undefined, and so does a stored
    // null -- a NaN saved from an empty Options field comes back as null.
    function read() {
        return __awaiter(this, void 0, void 0, function () {
            var stored, data, _i, _a, _b, field, value;
            var _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, area.get(key)];
                    case 1:
                        stored = _d.sent();
                        data = makeDefault();
                        for (_i = 0, _a = Object.entries((_c = stored === null || stored === void 0 ? void 0 : stored[key]) !== null && _c !== void 0 ? _c : {}); _i < _a.length; _i++) {
                            _b = _a[_i], field = _b[0], value = _b[1];
                            if (value != null) {
                                data[field] = value;
                            }
                        }
                        return [2 /*return*/, data];
                }
            });
        });
    }
    // A failed read rejects before anything is written, so defaults can never be
    // saved over real data.
    function update(mutate) {
        var _this = this;
        return enqueue(function () { return __awaiter(_this, void 0, void 0, function () {
            var data;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, read()];
                    case 1:
                        data = _b.sent();
                        mutate(data);
                        return [4 /*yield*/, area.set((_a = {}, _a[key] = data, _a))];
                    case 2:
                        _b.sent();
                        return [2 /*return*/, data];
                }
            });
        }); });
    }
    return { read: read, update: update };
}
function createLogStore(area, key, maxEntries) {
    var enqueue = createQueue();
    function read() {
        return __awaiter(this, void 0, void 0, function () {
            var stored;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, area.get(key)];
                    case 1:
                        stored = _b.sent();
                        return [2 /*return*/, (_a = stored === null || stored === void 0 ? void 0 : stored[key]) !== null && _a !== void 0 ? _a : []];
                }
            });
        });
    }
    function append(entry) {
        var _this = this;
        return enqueue(function () { return __awaiter(_this, void 0, void 0, function () {
            var entries;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, read()];
                    case 1:
                        entries = _b.sent();
                        entries.push(entry);
                        if (entries.length > maxEntries) {
                            entries = entries.slice(-maxEntries);
                        }
                        return [4 /*yield*/, area.set((_a = {}, _a[key] = entries, _a))];
                    case 2:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    }
    // Queued like a write, so an append already in flight cannot land after the
    // clear and bring the old entries back.
    function clear() {
        return enqueue(function () { return area.remove(key); });
    }
    return { read: read, append: append, clear: clear };
}


/***/ }),

/***/ "./src/streak_rules.ts":
/*!*****************************!*\
  !*** ./src/streak_rules.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BAD_BEAT_MINUTES: () => (/* binding */ BAD_BEAT_MINUTES),
/* harmony export */   BAD_BEAT_WINDOW: () => (/* binding */ BAD_BEAT_WINDOW),
/* harmony export */   BONUS_INTERVAL: () => (/* binding */ BONUS_INTERVAL),
/* harmony export */   NO_RUNG_PAID: () => (/* binding */ NO_RUNG_PAID),
/* harmony export */   StreakSession: () => (/* binding */ StreakSession),
/* harmony export */   TARGET_MINUTES: () => (/* binding */ TARGET_MINUTES),
/* harmony export */   parseScore: () => (/* binding */ parseScore)
/* harmony export */ });
/**
 * Reads the score out of the streak panel's text.
 *
 * Returns null when there is nothing to read: the panel is torn down and rebuilt
 * between puzzles, and treating that gap as a score of 0 looks exactly like a
 * collapsed streak.
 */
function parseScore(raw) {
    if (raw == null) {
        return null;
    }
    var parsed = parseInt(raw, 10);
    return isNaN(parsed) ? null : parsed;
}
var BAD_BEAT_WINDOW = 5;
var BAD_BEAT_MINUTES = 5;
var TARGET_MINUTES = 10;
var BONUS_INTERVAL = 5;
/** No rung of the award ladder has been paid for the current streak. */
var NO_RUNG_PAID = -1;
/**
 * Scoring rules for one continuous run of the Lichess streak page.
 *
 * The previous score is held per session on purpose. A score lower than the one
 * before it only means "the streak just ended" when both readings come from the
 * same page session: a new streak page always renders 0, so comparing against a
 * score carried over from an earlier session made the first puzzle of a new
 * streak look like a collapse and handed out bad beat time for solving one easy
 * puzzle.
 */
var StreakSession = /** @class */ (function () {
    /**
     * startingScore is null when the score panel could not be read as the page
     * opened. That is not a score of 0: a 0 would look like a new streak and wipe
     * the stored paidRung. The first real reading then decides.
     */
    function StreakSession(startingScore, targetScore, paidRung) {
        if (paidRung === void 0) { paidRung = NO_RUNG_PAID; }
        this.openingScoreKnown = startingScore != null;
        this.prevScore = startingScore !== null && startingScore !== void 0 ? startingScore : 0;
        this.targetScore = targetScore;
        this.paidRung = paidRung;
    }
    /**
     * Puts the paid rung back after the save of the award for `awardedRung` failed, so
     * the next reading pays it again. Left alone if a later reading already moved the
     * paid rung on: that reading's own save decides what is stored.
     */
    StreakSession.prototype.undoAward = function (previousPaidRung, awardedRung) {
        if (this.paidRung == awardedRung) {
            this.paidRung = previousPaidRung;
        }
    };
    /**
     * A streak only climbs or ends, so a reading below the paid rung means the streak
     * that earned it is over, and a new streak must be able to earn it again.
     */
    StreakSession.prototype.forgetEndedStreak = function (score) {
        if (score < this.paidRung) {
            this.paidRung = NO_RUNG_PAID;
        }
    };
    /**
     * The highest rung of the award ladder a score has reached -- the target, then
     * every BONUS_INTERVAL puzzles past it: 40, 45, 50, 55. Scores between two rungs
     * belong to the lower one, so 41 through 44 all sit on the 40 rung.
     *
     * A rung is paid for being *reached*, not for being read exactly. The score panel
     * is only sampled after a debounce and is torn down between puzzles, so a fast
     * solve is regularly read once the streak has already moved past the rung's
     * number; a page session can also open with the streak restored past several. An
     * exact-match check left those puzzles unpaid and the games locked.
     */
    StreakSession.prototype.rungFor = function (score) {
        if (score < this.targetScore) {
            return NO_RUNG_PAID;
        }
        var rungsPast = Math.floor((score - this.targetScore) / BONUS_INTERVAL);
        return this.targetScore + (rungsPast * BONUS_INTERVAL);
    };
    /**
     * The award owed for the score the page opened on.
     *
     * A session can start with the target already passed, and no later score change
     * will pay those puzzles out, so the opening reading is settled once here. No bad
     * beat check: with a single reading there is nothing to have dropped from.
     */
    StreakSession.prototype.openingAward = function () {
        if (!this.openingScoreKnown) {
            return { streakEnded: false, minutes: 0, reason: '' };
        }
        this.forgetEndedStreak(this.prevScore);
        var rung = this.rungFor(this.prevScore);
        if (rung <= this.paidRung) {
            return { streakEnded: false, minutes: 0, reason: '' };
        }
        this.paidRung = rung;
        return { streakEnded: false, minutes: TARGET_MINUTES, reason: "ALREADY PAST ".concat(rung, "! KEEP GOING!") };
    };
    StreakSession.prototype.onScore = function (curScore) {
        // The page re-renders the score panel between puzzles, so the same score
        // gets read back more than once. Only an actual change can earn time.
        if (curScore == this.prevScore) {
            return { streakEnded: false, minutes: 0, reason: '' };
        }
        var streakEnded = curScore < this.prevScore;
        var minutes = 0;
        var reason = '';
        if (streakEnded && this.prevScore >= this.targetScore - BAD_BEAT_WINDOW) {
            minutes = BAD_BEAT_MINUTES;
            reason = 'BAD BEAT. Take a break';
        }
        this.forgetEndedStreak(curScore);
        // One award per reading: a jump over several rungs pays once, for the highest.
        // Awards reset the unlock rather than add to it, so paying each skipped rung
        // would grant no more time.
        var rung = this.rungFor(curScore);
        if (rung > this.paidRung) {
            if (TARGET_MINUTES >= minutes) {
                minutes = TARGET_MINUTES;
                reason = rung == this.targetScore ? 'HIT TARGET! KEEP GOING!' : 'GO FOR GOLD!';
            }
            this.paidRung = rung;
        }
        this.prevScore = curScore;
        return { streakEnded: streakEnded, minutes: minutes, reason: reason };
    };
    return StreakSession;
}());



/***/ }),

/***/ "./src/streak_tracker.ts":
/*!*******************************!*\
  !*** ./src/streak_tracker.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   initStreakTracker: () => (/* binding */ initStreakTracker)
/* harmony export */ });
/* harmony import */ var _storage__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./storage */ "./src/storage.ts");
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./util */ "./src/util.ts");
/* harmony import */ var _streak_rules__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./streak_rules */ "./src/streak_rules.ts");
/* harmony import */ var _event_log__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./event_log */ "./src/event_log.ts");
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};




var scoreDivName = "puzzle__side__streak__score text";
var activeScore = -1;
var scoreCheckDelayMillis = 800;
var session = null;
// How the score was read while it sat on its current value, reported with the next
// change: many unreadable reads around a skipped score point at the panel rebuild.
var readStats = { since: Date.now(), reads: 0, unreadable: 0 };
var lastUnparseable = null;
// region Active Score Tracker
function onScoreChange(curScore) {
    return __awaiter(this, void 0, void 0, function () {
        var prevScore, paidBefore_1, skipped, award_1, decision, secondsOnScore, paidAfter_1, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    console.log("[onScoreChange] Current Score [".concat(curScore, "]"));
                    prevScore = session.prevScore;
                    paidBefore_1 = session.paidRung;
                    skipped = curScore > prevScore + 1 ? " (JUMP: ".concat(curScore - prevScore - 1, " score(s) never read)") : '';
                    award_1 = session.onScore(curScore);
                    decision = award_1.minutes > 0 ? "award +".concat(award_1.minutes, "m \"").concat(award_1.reason, "\"") : 'no award';
                    secondsOnScore = Math.round((Date.now() - readStats.since) / 1000);
                    (0,_event_log__WEBPACK_IMPORTED_MODULE_3__.logEvent)("score ".concat(prevScore, " -> ").concat(curScore).concat(skipped, ": ").concat(decision).concat(award_1.streakEnded ? ', STREAK ENDED' : '') +
                        " [".concat(secondsOnScore, "s on previous score, ").concat(readStats.reads, " reads, ").concat(readStats.unreadable, " unreadable]"));
                    readStats = { since: Date.now(), reads: 0, unreadable: 0 };
                    if (award_1.streakEnded) {
                        console.log("[onScoreChange] STREAK OVER :(");
                    }
                    if (award_1.minutes > 0) {
                        console.log("[onScoreChange] ".concat(award_1.reason));
                    }
                    paidAfter_1 = session.paidRung;
                    return [4 /*yield*/, (0,_storage__WEBPACK_IMPORTED_MODULE_0__.saveStreakState)(curScore, paidAfter_1, award_1.minutes).catch(function (error) {
                            // The award never reached storage: let the next reading pay it again.
                            if (award_1.minutes > 0) {
                                session.undoAward(paidBefore_1, paidAfter_1);
                            }
                            throw error;
                        })];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    (0,_event_log__WEBPACK_IMPORTED_MODULE_3__.logError)('onScoreChange', error_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getScoreContainer() {
    // debugLog('[getScoreContainer] START');
    var scoreDiv = null;
    try {
        //scoreDiv = document.getElementsByClassName(scoreDivContainer)[0];
        scoreDiv = document.getElementById('main-wrap');
    }
    catch (error) {
        console.log('[getScoreContainer] ' + error.toString());
    }
    var isNotNull = scoreDiv != null;
    //debugLog('[getScoreContainer] DONE [' + isNotNull + ']');
    return scoreDiv;
}
function getScoreDiv() {
    //debugLog('[getScoreDiv] START');
    var scoreDiv = null;
    try {
        scoreDiv = document.getElementsByClassName(scoreDivName);
        if (scoreDiv != null) {
            scoreDiv = scoreDiv[0];
        }
    }
    catch (error) {
        // console.log('[getScoreDiv] ' + error.toString());
    }
    var isNotNull = scoreDiv != null;
    //debugLog('[getScoreDiv] DONE [' + isNotNull + ']');
    return scoreDiv;
}
// null means the score panel could not be read right now, which is not the same
// thing as a score of 0 -- see parseScore
function getCurScore() {
    var _a;
    //debugLog('[getCurScore] START');
    try {
        var curValueString = (_a = getScoreDiv()) === null || _a === void 0 ? void 0 : _a.innerHTML;
        //console.log(`[getCurScore] ${curValueString}`);
        var score = (0,_streak_rules__WEBPACK_IMPORTED_MODULE_2__.parseScore)(curValueString);
        // Text that is there but is not a number means Lichess changed the panel's
        // markup -- every read would fail the same way, so say so once.
        if (score == null && curValueString != null && curValueString != lastUnparseable) {
            lastUnparseable = curValueString;
            (0,_event_log__WEBPACK_IMPORTED_MODULE_3__.logEvent)("score panel text not a number: ".concat(JSON.stringify(curValueString.slice(0, 200))));
        }
        return score;
    }
    catch (error) {
        console.error('[getCurScore] ERROR ' + error.toString());
        return null;
    }
}
// Callback function to execute when mutations are observed
var callback = function (mutationList, observer) {
    for (var _i = 0, mutationList_1 = mutationList; _i < mutationList_1.length; _i++) {
        var mutation = mutationList_1[_i];
        if (mutation.type === "childList") {
            setTimeout(function () {
                var mutatedScore = getCurScore();
                readStats.reads++;
                if (mutatedScore == null) {
                    readStats.unreadable++;
                }
                //debugLog('[' + mutatedScore + '] [' + activeScore + ']');
                if (mutatedScore != null && mutatedScore != activeScore) {
                    //debugLog('mutatedScore [' + mutatedScore + ']');
                    //debugLog('activeScore [' + activeScore + ']');
                    activeScore = mutatedScore;
                    onScoreChange(mutatedScore);
                }
            }, scoreCheckDelayMillis);
        }
    }
};
var targetNode = getScoreContainer();
var config = { attributes: true, childList: true, subtree: true };
// endregion
function initStreakTracker() {
    return __awaiter(this, void 0, void 0, function () {
        var stored, error_2, targetScore, openingScore, opening, openingSession_1, paidAfter_2, observer;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    (0,_util__WEBPACK_IMPORTED_MODULE_1__.debugLog)("[initStreakTracker] START");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0,_storage__WEBPACK_IMPORTED_MODULE_0__.readData)()];
                case 2:
                    stored = _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    // Running on defaults would pay at the default target and forget the paid
                    // rung, so this page does not track the score at all. A reload tries again.
                    (0,_event_log__WEBPACK_IMPORTED_MODULE_3__.logEvent)('ERROR: settings could not be read, score not tracked on this page -- reload to retry');
                    return [2 /*return*/];
                case 4:
                    targetScore = stored.targetScore;
                    openingScore = getCurScore();
                    activeScore = openingScore !== null && openingScore !== void 0 ? openingScore : 0;
                    // The paid rung comes from storage so that reopening the page on the restored
                    // streak -- a reload, or the redirect from a locked game page -- does not pay it
                    // again. An unreadable opening score is passed as null, not 0: see StreakSession.
                    session = new _streak_rules__WEBPACK_IMPORTED_MODULE_2__.StreakSession(openingScore, targetScore, stored.paidRung);
                    opening = session.openingAward();
                    (0,_event_log__WEBPACK_IMPORTED_MODULE_3__.logEvent)("streak page opened: score ".concat(openingScore !== null && openingScore !== void 0 ? openingScore : 'unreadable', ", target ").concat(targetScore, ", ") +
                        "paid rung ".concat(stored.paidRung, " -> ").concat(session.paidRung, ", unlocked until ").concat((0,_event_log__WEBPACK_IMPORTED_MODULE_3__.formatTime)(stored.expireTime), ", ") +
                        (opening.minutes > 0 ? "opening award +".concat(opening.minutes, "m \"").concat(opening.reason, "\"") : 'no opening award'));
                    // Saved even without an award: a new streak resets the stored rung.
                    if (openingScore != null) {
                        if (opening.minutes > 0) {
                            console.log("[initStreakTracker] ".concat(opening.reason));
                        }
                        openingSession_1 = session;
                        paidAfter_2 = session.paidRung;
                        (0,_storage__WEBPACK_IMPORTED_MODULE_0__.saveStreakState)(openingScore, paidAfter_2, opening.minutes).catch(function (error) {
                            // The award never reached storage: let the next reading pay it again.
                            if (opening.minutes > 0) {
                                openingSession_1.undoAward(stored.paidRung, paidAfter_2);
                            }
                            (0,_event_log__WEBPACK_IMPORTED_MODULE_3__.logError)('initStreakTracker', error);
                        });
                    }
                    observer = new MutationObserver(callback);
                    if (targetNode == null) {
                        (0,_event_log__WEBPACK_IMPORTED_MODULE_3__.logEvent)('ERROR: #main-wrap not found, score will not be tracked on this page');
                        return [2 /*return*/];
                    }
                    // Start observing the target node for configured mutations
                    observer.observe(targetNode, config);
                    (0,_event_log__WEBPACK_IMPORTED_MODULE_3__.watchStorageChanges)();
                    window.addEventListener('pagehide', function () {
                        (0,_event_log__WEBPACK_IMPORTED_MODULE_3__.logEvent)("leaving streak page at score ".concat(activeScore));
                    });
                    (0,_util__WEBPACK_IMPORTED_MODULE_1__.debugLog)("[initStreakTracker] DONE activeScore [".concat(activeScore, "] targetScore [").concat(targetScore, "]"));
                    return [2 /*return*/];
            }
        });
    });
}


/***/ }),

/***/ "./src/styles/main.scss":
/*!******************************!*\
  !*** ./src/styles/main.scss ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/styleDomAPI.js */ "./node_modules/style-loader/dist/runtime/styleDomAPI.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/insertBySelector.js */ "./node_modules/style-loader/dist/runtime/insertBySelector.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js */ "./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/insertStyleElement.js */ "./node_modules/style-loader/dist/runtime/insertStyleElement.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/styleTagTransform.js */ "./node_modules/style-loader/dist/runtime/styleTagTransform.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_node_modules_sass_loader_dist_cjs_js_main_scss__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! !!../../node_modules/css-loader/dist/cjs.js!../../node_modules/sass-loader/dist/cjs.js!./main.scss */ "./node_modules/css-loader/dist/cjs.js!./node_modules/sass-loader/dist/cjs.js!./src/styles/main.scss");

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());
options.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
options.domAPI = (_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_node_modules_sass_loader_dist_cjs_js_main_scss__WEBPACK_IMPORTED_MODULE_6__["default"], options);




       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_node_modules_sass_loader_dist_cjs_js_main_scss__WEBPACK_IMPORTED_MODULE_6__["default"] && _node_modules_css_loader_dist_cjs_js_node_modules_sass_loader_dist_cjs_js_main_scss__WEBPACK_IMPORTED_MODULE_6__["default"].locals ? _node_modules_css_loader_dist_cjs_js_node_modules_sass_loader_dist_cjs_js_main_scss__WEBPACK_IMPORTED_MODULE_6__["default"].locals : undefined);


/***/ }),

/***/ "./src/util.ts":
/*!*********************!*\
  !*** ./src/util.ts ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Mode: () => (/* binding */ Mode),
/* harmony export */   debugLog: () => (/* binding */ debugLog),
/* harmony export */   getInputElement: () => (/* binding */ getInputElement),
/* harmony export */   getMode: () => (/* binding */ getMode)
/* harmony export */ });
var Mode;
(function (Mode) {
    Mode["TRACK_STREAK"] = "TRACK_STREAK";
    Mode["CHECK_ACTIVE_TIME"] = "CHECK_ACTIVE_TIME";
    Mode["OPTIONS"] = "OPTIONS";
})(Mode || (Mode = {}));
function getMode() {
    var url = window.location.href;
    debugLog("[getMode] for ".concat(url));
    var determinedMode = Mode.CHECK_ACTIVE_TIME; // default
    var streakRegEx = new RegExp('.*streak.*');
    var timeCheckRegEx = new RegExp('.*(pool|any|tournament).*');
    var optionsRegEx = new RegExp('.*dist\/options.html');
    if (streakRegEx.test(url)) {
        determinedMode = Mode.TRACK_STREAK;
    }
    else if (optionsRegEx.test(url)) {
        determinedMode = Mode.OPTIONS;
    }
    else {
        determinedMode = Mode.CHECK_ACTIVE_TIME;
    }
    return determinedMode;
}
function getInputElement(id) {
    var element = document.getElementById(id);
    return element;
}
function debugLog(msg) {
    // disable for production release
    console.log(msg);
    var htmlLog = document.getElementById("debug-log-output");
    if (htmlLog != null) {
        htmlLog.innerHTML = htmlLog.innerHTML + " | " + msg;
    }
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/nonce */
/******/ 	(() => {
/******/ 		__webpack_require__.nc = undefined;
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
(() => {
"use strict";
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./util */ "./src/util.ts");
/* harmony import */ var _streak_tracker__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./streak_tracker */ "./src/streak_tracker.ts");
/* harmony import */ var _active_time_check__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./active_time_check */ "./src/active_time_check.ts");
/* harmony import */ var _styles_main_scss__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./styles/main.scss */ "./src/styles/main.scss");
/* harmony import */ var _storage__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./storage */ "./src/storage.ts");
/* harmony import */ var _options__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./options */ "./src/options.ts");
/* harmony import */ var _blitz_control__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./blitz_control */ "./src/blitz_control.ts");
/* harmony import */ var _event_log__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./event_log */ "./src/event_log.ts");
/* harmony import */ var webextension_polyfill_ts__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! webextension-polyfill-ts */ "./node_modules/webextension-polyfill-ts/lib/index.js");









try {
    console.log('TODO: time of day as an option');
    var mode = (0,_util__WEBPACK_IMPORTED_MODULE_0__.getMode)();
    (0,_util__WEBPACK_IMPORTED_MODULE_0__.debugLog)("mode [".concat(mode, "]"));
    (0,_event_log__WEBPACK_IMPORTED_MODULE_7__.logEvent)("ChessKey ".concat(webextension_polyfill_ts__WEBPACK_IMPORTED_MODULE_8__.browser.runtime.getManifest().version, " loaded, mode ").concat(mode));
    switch (mode) {
        case _util__WEBPACK_IMPORTED_MODULE_0__.Mode.TRACK_STREAK:
            (0,_streak_tracker__WEBPACK_IMPORTED_MODULE_1__.initStreakTracker)();
            break;
        case _util__WEBPACK_IMPORTED_MODULE_0__.Mode.CHECK_ACTIVE_TIME:
            (0,_active_time_check__WEBPACK_IMPORTED_MODULE_2__.checkActiveTime)();
            break;
        case _util__WEBPACK_IMPORTED_MODULE_0__.Mode.OPTIONS:
            (0,_options__WEBPACK_IMPORTED_MODULE_5__.initOptionsIfAble)();
            break;
    }
    (0,_storage__WEBPACK_IMPORTED_MODULE_4__.getDisableBlitz)().then(function (disableBlitz) {
        if (disableBlitz) {
            (0,_blitz_control__WEBPACK_IMPORTED_MODULE_6__.initBlitzControl)();
        }
    });
}
catch (error) {
    console.error(error);
}

})();

/******/ })()
;
//# sourceMappingURL=bundle.js.map