import ApiRequest from "../libs/ApiRequest";

/**
 * get object
 */
export function funName(ids) {
    if (!Array.isArray(ids)) {
        return Promise.reject(new TypeError("get_objects API, Only accept one array type parameter"));
    }
    return this.call(new ApiRequest("get_objects", ids));
}