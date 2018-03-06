import ApiRequest from "../libs/ApiRequest";

/**
 * cancel all Subscriptions
 */
export function funName() {
    return this.call(new ApiRequest("cancel_all_subscriptions"));
}