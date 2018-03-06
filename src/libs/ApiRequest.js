let logger = (require("./Logger")).instance("ApiRequest");

let _id = 0;    // Uniquely identifies
let _subscription_id = 100; // Uniquely identifies

class ApiRequest {

    constructor(method = "") {
        this.id = _id++;
        this.method = "call";
        this.api_identifier = 1;
        this.api_method = method;

        if (arguments.length > 1) {
            this.api_params = Array.from(arguments).slice(1, arguments.length);   // Ignore the first parameter
        } else {
            this.api_params = [];
        }

        this.resolve = null;
        this.reject = null;
        this.subscribe = false; // Whether it is a subscription type
        this.callback = null;
        if (this.api_method === "set_subscribe_callback" || this.api_method === "set_pending_transaction_callback" ||
            this.api_method === "set_block_applied_callback" || this.api_method === "subscribe_to_market" ||
            this.api_method === "get_full_accounts" || this.api_method === "set_block_applied_callback"
        ) {
            this.subscribe = true;  // Subscribe to the API list
        }
    }

    /**
     * set call api name
     *
     * @param method api name
     */
    setMethod(method) {
        this.api_method = method;
        return this
    }

    /**
     * set api identifier
     *
     * @param identifier int
     */
    setIdentifier(identifier) {
        this.api_identifier = identifier;
        return this;
    }

    /**
     * Asynchronous call Promise
     *
     * @param resolve Promise.resolve
     */
    setResolve(resolve) {
        this.resolve = resolve;
        return this;
    }

    /**
     * Asynchronous call Promise
     *
     * @param reject Promise.reject
     */
    setReject(reject) {
        this.reject = reject;
        return this;
    }

    /**
     * Subscription type callback function
     *
     * @param callback Function After the subscription information is released, this function is called back every time
     */
    setCallback(callback) {
        this.callback = callback;
        return this;
    }

    /**
     * Add parameters to the end
     *
     * @param param parameter
     */
    addParam(param) {
        this.api_params.push(param);
        return this;
    }

    /**
     * build object to json
     *
     * @return json
     */
    build() {
        let apiJSON = {
            id: this.id,
            method: this.method,
            params: [
                this.api_identifier,
                this.api_method,
                [...this.api_params]
            ]
        };
        logger.log(JSON.stringify(apiJSON));
        return JSON.stringify(apiJSON);
    }

    /**
     * Set Subscription Id
     */
    setSubscriptionId(id) {
        this.subscription_id = id;
        return this;
    }

    /**
     * Get Subscription Id
     */
    static getSubscriptionId() {
        return _subscription_id;
    }
}

export default ApiRequest;