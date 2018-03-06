window.onload = function () {
    var instance = ApisInstance.instance("wss://ws.gdex.top", {debug: true});
    instance.connect(function (error, apisInst) {
        if (error) {
            document.write("Connect Error，Please check the console.");
            console.log(error);
        } else {
            document.write("Chain ID : " + apisInst.chain_id);
        }
    });
};