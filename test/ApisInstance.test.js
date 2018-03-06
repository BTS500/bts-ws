import {expect} from "chai";
import {ApisInstance} from "../src";

describe("测试 ApisInstance 相关API : ", function () {
    let inst = null;

    describe("#instance() 函数", function () {
        it("是否能正常创建实例", function () {
            inst = ApisInstance.instance("wss://ws.gdex.top");
            expect(inst).to.be.an.instanceOf(ApisInstance);
        });

        it("是否是全局单利模式", function () {
            expect(ApisInstance.instance()).to.equal(inst);
            expect(ApisInstance.instance().ws_url).to.equal("wss://ws.gdex.top");
        });
    });

    describe("#connect() 函数", function () {
        it("传递错误的回调函数", function () {
            expect(function () {
                inst.connect("callback");
            }).to.throw(TypeError);
        });

        it("传递错误的API节点地址", function (done) {
            inst.ws_url = "wsx://127.0.0.1/";
            inst.connect(function (error, apisInst) {
                expect(error).to.not.be.null;
                expect(error).to.be.an.instanceOf(TypeError);
                done();
            });
        });

        it("正常的进行连接调用", function (done) {
            this.timeout(60000);

            inst.ws_url = "wss://ws.gdex.top";
            inst.connect((error, apisInst) => {
                try {
                    expect(error).to.be.null;
                    expect(apisInst).to.not.be.null;
                    expect(apisInst).to.equal(inst);
                    expect(apisInst).to.have.all.keys("ws_url", "ws_rpc", "options", "chain_id", "db_api", "hist_api", "net_api");
                    done();
                } catch (error) {
                    done(error);
                }
            });
        });

        it("重复的进行连接调用", function (done) {
            inst.connect((error, apisInst) => {
                expect(error).to.instanceOf(ReferenceError);
                done();
            });
        });
    });

    describe("#reconnect() 函数", function () {
        it("修改连接地址并重新连接", function (done) {
            this.timeout(60000);

            let newUrl = "wss://bit.btsabc.org/ws";
            inst.ws_url = newUrl;
            inst.reconnect((error, apisInst) => {
                try {
                    if (error) done(error);
                    expect(error).to.be.null;
                    expect(apisInst).to.equal(inst);
                    expect(apisInst.ws_url).to.equal(newUrl);
                    expect(apisInst).to.have.all.keys("ws_url", "ws_rpc", "options", "chain_id", "db_api", "hist_api", "net_api");
                    done();
                } catch (error) {
                    done(error);
                }
            });
        });
    });

    describe("#close() 函数", function () {
        // it("测试关闭之后是否能重新连接", function (done) {
        //     this.timeout(60000);
        //     inst.close().then((event) => {
        //         expect(event).to.not.be.null;
        //         expect(inst.ws_rpc.readyState).to.equal(3);
        //         done();
        //     }).catch((error) => {
        //         done(error);
        //     });
        // });

        it("测试关闭之后禁止重新连接", function (done) {
            this.timeout(60000);
            inst.close({keepClosed: true}).then((event) => {
                expect(event).to.not.be.null;
                expect(inst.ws_rpc.readyState).to.equal(3);
                done();
            }).catch((error) => {
                done(error);
            });
        });
    });

});