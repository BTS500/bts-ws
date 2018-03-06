"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var logger = require("./Logger").instance("ApiResult");

var ApiResult = function () {
    function ApiResult(resultJson) {
        _classCallCheck(this, ApiResult);

        logger.log(resultJson);

        this.resultRaw = null;
        this.resultObj = null;
        this.subscribe = false;
        this.subscription_id = -1;

        if (resultJson) {
            this.resultRaw = resultJson;
            this.resultObj = JSON.parse(resultJson);
        }

        this._bypassResultProperty().build();
    }

    _createClass(ApiResult, [{
        key: "_bypassResultProperty",
        value: function _bypassResultProperty() {
            var _this2 = this;

            var _this = this;

            if (!this.resultObj) {
                return this;
            }

            var _loop = function _loop(attribute) {
                if (_this2.resultObj.hasOwnProperty(attribute)) {
                    Object.defineProperty(_this, attribute, {
                        get: function get() {
                            return _this.resultObj[attribute];
                        },
                        set: function set(value) {
                            return _this.resultObj[attribute] = value;
                        },
                        enumerable: true,
                        configurable: true
                    });
                }
            };

            for (var attribute in this.resultObj) {
                _loop(attribute);
            }

            return this;
        }

        /**
         * According to the response content, make consistent treatment
         */

    }, {
        key: "build",
        value: function build() {
            if (!this.error && this.method && this.method === "notice") {
                this.id = this.params[0];
                this.subscription_id = this.params[0];
                this.subscribe = true;
            }
            return this;
        }
    }]);

    return ApiResult;
}();

exports.default = ApiResult;