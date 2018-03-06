import {ApisInstance} from "../../src";

let instance = ApisInstance.instance("wss://ws.gdex.io", {maxRetries: 5, debug: true});
instance.connect((error, inst) => {
    if (error) {
        console.log(error);
    } else {
        console.log(inst.chain_id);
    }
});

let readLine = require("readline").createInterface({input: process.stdin, output: process.stdout});
readLine.on("line", (line) => {
    if (line) {
        if (/^exit$/.test(line)) {  // 退出系统
            process.exit();

        } else if (/^\d+\.\d+\.\d+$/.test(line)) { // 获取区块对象详情
            instance.db_api.getObjects([line]).then((apiResult) => {
                console.log(apiResult.resultRaw);
            }).catch((error) => {
                console.log(error);
            });
        }
    }
});
