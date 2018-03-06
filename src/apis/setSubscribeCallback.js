import ApiRequest from "../libs/ApiRequest";

/**
 * subscribe data
 *
 * @param callback function
 * @param clear_filter bool
 * @param subscription_id int
 * @return {Promise}
 */
export function funName(callback, clear_filter = true, subscription_id = -1) {
    if (typeof callback !== "function") {
        return Promise.reject(new TypeError("set_subscribe_callback 'callback' must be added！"));
    }
    subscription_id = subscription_id !== -1 ? subscription_id : ApiRequest.getSubscriptionId();

    let api = new ApiRequest("set_subscribe_callback", subscription_id, clear_filter);
    api.setCallback(callback).setSubscriptionId(subscription_id);

    return this.call(api);
}