"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.funName = funName;

var _ApiRequest = require("../libs/ApiRequest");

var _ApiRequest2 = _interopRequireDefault(_ApiRequest);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * subscribe data
 *
 * @param callback function
 * @param clear_filter bool
 * @param subscription_id int
 * @return {Promise}
 */
function funName(callback) {
    var clear_filter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    var subscription_id = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : -1;

    if (typeof callback !== "function") {
        return Promise.reject(new TypeError("set_subscribe_callback 'callback' must be added！"));
    }
    subscription_id = subscription_id !== -1 ? subscription_id : _ApiRequest2.default.getSubscriptionId();

    var api = new _ApiRequest2.default("set_subscribe_callback", subscription_id, clear_filter);
    api.setCallback(callback).setSubscriptionId(subscription_id);

    return this.call(api);
}