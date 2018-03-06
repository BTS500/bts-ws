"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.RWebSocket = exports.Logger = exports.GrapheneApi = exports.ChainWebSocket = exports.ApiResult = exports.ApiRequest = exports.ApisInstance = undefined;

require("babel-polyfill");

var _ApisInstance = require("./libs/ApisInstance");

var _ApisInstance2 = _interopRequireDefault(_ApisInstance);

var _ApiRequest = require("./libs/ApiRequest");

var _ApiRequest2 = _interopRequireDefault(_ApiRequest);

var _ApiResult = require("./libs/ApiResult");

var _ApiResult2 = _interopRequireDefault(_ApiResult);

var _ChainWebSocket = require("./libs/ChainWebSocket");

var _ChainWebSocket2 = _interopRequireDefault(_ChainWebSocket);

var _GrapheneApi = require("./libs/GrapheneApi");

var _GrapheneApi2 = _interopRequireDefault(_GrapheneApi);

var _Logger = require("./libs/Logger");

var _Logger2 = _interopRequireDefault(_Logger);

var _RWebSocket = require("./libs/RWebSocket");

var _RWebSocket2 = _interopRequireDefault(_RWebSocket);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var exportList = {
    ApisInstance: _ApisInstance2.default,
    ApiRequest: _ApiRequest2.default,
    ApiResult: _ApiResult2.default,
    ChainWebSocket: _ChainWebSocket2.default,
    GrapheneApi: _GrapheneApi2.default,
    Logger: _Logger2.default,
    RWebSocket: _RWebSocket2.default
};

// If running on the browser client, install to window
if (typeof window !== "undefined" && typeof document !== "undefined") {
    for (var name in exportList) {
        if (exportList.hasOwnProperty(name)) {
            window[name] = exportList[name];
        }
    }
}

exports.ApisInstance = _ApisInstance2.default;
exports.ApiRequest = _ApiRequest2.default;
exports.ApiResult = _ApiResult2.default;
exports.ChainWebSocket = _ChainWebSocket2.default;
exports.GrapheneApi = _GrapheneApi2.default;
exports.Logger = _Logger2.default;
exports.RWebSocket = _RWebSocket2.default;