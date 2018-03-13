import {expect} from "chai";
import {RWebSocket} from "../src";

const TEST_URL = "wss://ws.gdex.io";

describe("测试 RWebSocket 相关 API 功能 : ", function () {

    it("#RWebSocket 是否按预期抛出 Error", function () {
        this.timeout(60000);
        return new Promise(function (resolve, reject) {

            expect(function () {
                let webSocket = new RWebSocket(); // 没有传递 url 参数所以必定抛出异常
            }).to.throw(ReferenceError);

            expect(function () {
                let webSocket = new RWebSocket(TEST_URL); // Node 环境中 WebSocket 不存在，所以必须传递 constructor 配置项
            }).to.throw(TypeError);

            resolve();
        });
    });

    it("#RWebSocket 事件监听器函数是否按照预期工作", function () {
        this.timeout(60000);
        return new Promise(function (resolve, reject) {
            let webSocket = new RWebSocket(TEST_URL, [], {constructor: require("ws")});
            let msg1 = function () {
            };
            let msg2 = function () {
            };
            let msg3 = function () {
            };
            let msg4 = function () {
            };

            let listeners = {"message": [[msg1, null], [msg2, null], [msg3, null], [msg4, null]]};
            webSocket.assignEventListener(listeners);
            webSocket.removeEventListener("message", msg1);
            webSocket.addEventListener("close", function () {
                webSocket.keep_listeners.message.length === 3 ? resolve() : reject();
            });
            webSocket.addEventListener("open", function () {
                webSocket.close(1000, "reason", {keepClosed: true});
            });
        });
    });

    it("#RWebSocket 完整的工作情景测试", function () {
        this.timeout(60000);
        return new Promise(function (resolve, reject) {
            let connectCount = 0;
            let onceChecked = false;
            let webSocket = new RWebSocket(TEST_URL, [], {
                constructor: require("ws"),
                maxRetries: 5,
                reconnectionDelayGrowFactor: 1
            });

            webSocket.onceEventListener("open", function () {   // 测试仅执行一次的监听函数是否能正常工作
                onceChecked = connectCount === 0;
            }, {test: true});

            webSocket.addEventListener("open", function (event, options) {  // 测试正常的监听函数是否能正常工作
                connectCount++;
                expect(event).to.not.be.null;
                expect(options.test).to.be.true;
                webSocket.send("{\"id\":2,\"method\":\"call\",\"params\":[1,\"login\",[\"\",\"\"]]}");
            }, {test: true});

            webSocket.addEventListener("message", function (event, options) {
                expect(JSON.parse(event.data)).to.have.all.keys(["id", "result", "jsonrpc"]);
                expect(options.test).to.be.true;

                webSocket.ws_url = "wss://connect.gdex.io";  // 为了触发 down 事件，接下来我们连接到一个错误的地址
                webSocket.close(4444, "test");
            }, {test: true});

            webSocket.addEventListener("close", function (event, options) {
                if (event.code === 4444) {
                    expect(event.reason).equal("test");
                }
                expect(options.test).to.be.true;
            }, {test: true});

            webSocket.addEventListener("down", function (event, options) {
                expect(onceChecked).to.be.true;
                expect(options.test).to.be.true;
                resolve();
            }, {test: true});
        });
    });

    it("#RWebSocket 允许用户主动触发指定事件", function () {
        this.timeout(60000);
        return new Promise(function (resolve, reject) {
            let webSocket = new RWebSocket(TEST_URL, [], {constructor: require("ws")});
            webSocket.onceEventListener("down", function (event, options) {
                expect(event).equal("Custom message.");
                expect(options.test).to.be.true;
            }, {test: true});

            webSocket.addEventListener("down", function (event, options) {
                expect(event).equal("Custom message.");
                expect(options.test).to.be.true;
                webSocket.close(1000, "", {keepClosed: true})
            }, {test: true});

            webSocket.addEventListener("close", function () {
                resolve();
            });

            webSocket.emitEvent("down", "Custom message.");
        });
    });

});