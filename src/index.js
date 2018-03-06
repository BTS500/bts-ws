import "babel-polyfill";
import ApisInstance from "./libs/ApisInstance";
import ApiRequest from "./libs/ApiRequest";
import ApiResult from "./libs/ApiResult";
import ChainWebSocket from "./libs/ChainWebSocket";
import GrapheneApi from "./libs/GrapheneApi";
import Logger from "./libs/Logger";
import RWebSocket from "./libs/RWebSocket";

let exportList = {
    ApisInstance,
    ApiRequest,
    ApiResult,
    ChainWebSocket,
    GrapheneApi,
    Logger,
    RWebSocket
};

// If running on the browser client, install to window
if (typeof window !== "undefined" && typeof document !== "undefined") {
    for (let name in exportList) {
        if (exportList.hasOwnProperty(name)) {
            window[name] = exportList[name];
        }
    }
}

export {
    ApisInstance,
    ApiRequest,
    ApiResult,
    ChainWebSocket,
    GrapheneApi,
    Logger,
    RWebSocket
};