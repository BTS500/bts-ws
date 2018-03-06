"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.funName = funName;

var _ApiRequest = require("../libs/ApiRequest");

var _ApiRequest2 = _interopRequireDefault(_ApiRequest);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * get object
 */
function funName(ids) {
    if (!Array.isArray(ids)) {
        return Promise.reject(new TypeError("get_objects API, Only accept one array type parameter"));
    }
    return this.call(new _ApiRequest2.default("get_objects", ids));
}