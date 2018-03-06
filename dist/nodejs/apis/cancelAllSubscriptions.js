"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.funName = funName;

var _ApiRequest = require("../libs/ApiRequest");

var _ApiRequest2 = _interopRequireDefault(_ApiRequest);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * cancel all Subscriptions
 */
function funName() {
  return this.call(new _ApiRequest2.default("cancel_all_subscriptions"));
}