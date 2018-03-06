let logger = (require("./Logger")).instance("ApiResult");

class ApiResult {

    constructor(resultJson) {
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

    _bypassResultProperty() {
        let _this = this;

        if (!this.resultObj) {
            return this;
        }

        for (let attribute in this.resultObj) {
            if (this.resultObj.hasOwnProperty(attribute)) {
                Object.defineProperty(_this, attribute, {
                    get: function () {
                        return _this.resultObj[attribute];
                    },
                    set: function (value) {
                        return _this.resultObj[attribute] = value;
                    },
                    enumerable: true,
                    configurable: true
                });
            }
        }

        return this;
    }

    /**
     * According to the response content, make consistent treatment
     */
    build() {
        if (!this.error && this.method && this.method === "notice") {
            this.id = this.params[0];
            this.subscription_id = this.params[0];
            this.subscribe = true;
        }
        return this;
    }
}


export default ApiResult;