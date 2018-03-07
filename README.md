## BTS-WS

这是一个开源的 Bitshares 系统的 API SDK，构建在 WebSocket 连接通信的上层，提供了一组跨平台的业务层 API 开发接口。主要也是为了解决像我们这种第三方开发者，在针对 Bitshares 系统开发应用的时候，官方提供的 API 接口和文档不友好的问题。  

## 项目源码设计架构说明

系统源码的架构设计如下图所示，非常简单且直观的 API 调用逻辑，下面详细的介绍此分层的设计意义，主要是为了让大家能更方便的重用此系统源码，或者帮助此项目进行更加强大的更新和维护。
![bts-ws](/docs/imgs/bts-ws.png)

- #### API 接口层  
  这个代码模块负责提供此项目对外公开的已经封装好的业务逻辑 API，方便第三方系统直接调用 Bitshares 提供的原生 API 功能或自定义实现自己的业务逻辑。所有业务逻辑 API 的源码都会存放在 apis/ 目录下，此目录下的每个 .js 文件都是一个业务 API 的封装，并且在以后的项目发展过程中也会谨遵守这个原则，以方便项目的第三方使用者能够直观的修改和帮助完善这些业务 API。  

  把这个部分代码独立出来的另一个原因是因为官方文档对 Bitshares API 接口，和接口用途描述信息的匮乏，导致很多没有经验的开发人员不知道大部分的 Bitshares API 具体该如何使用，所以这样以插件的形式来开发和包装业务API，能够更加方便的进行多人配合开发和学习，来共同补充 Bitshsares 系统这方面的不足。
  ```javascript
    // 在 libs/GrapheneApi 中有如下代码，在开发新的业务 API 之后，需要手动引入 API 并定义方法名称。
    GrapheneApi.prototype.getObjects = require("../apis/getObjects").funName;
    GrapheneApi.prototype.setSubscribeCallback = require("../apis/setSubscribeCallback").funName;
    GrapheneApi.prototype.cancelAllSubscriptions = require("../apis/cancelAllSubscriptions").funName;
  ```

- #### API 处理层  
  此模块是项目库的核心模块，其职责是定义一套针对 Bitshares 系统特性的，接口请求和响应结果处理的流程，能够稳定且易于拓展的为上层的业务 API 模块提供完整的功能支持，其中重要的功能模块包括对订阅事件的管理、对请求和响应对象的包装与管理、系统错误的反馈机制和网络连接状态的管理等功能的支持。

  这个部分将会是项目库开发完整以后很少变动的部分，也是逻辑处理起来比较复杂的部分，应该有详细的测试和功能验证来避免BUG。

- #### 网络通讯层  
  对 WebSocket 的包装，提供跨平台的 WebSocket 支持，内部实现了 WebSocket 断线重连的功能，并向外公开一组状态监听的接口，方便上层系统对网络连接状态的监控与管理，也是唯一的真正与 Bitshares API 服务节点进行网络通讯的数据传输信道。

## 安装与测试

Npm 安装使用：
```
npm install bts-ws --save
```

浏览器使用：  
```html
<script type="text/javascript" src="bts-ws.min.js"></script>
<script>
window.onload = function () {
  var instance = ApisInstance.instance("wss://ws.gdex.top", {debug: true});
  instance.connect(function (error, apisInst) {
      console.log(instance === apisInst);
  });
};
</script>
```
运行单元测试：
```
npm run test
```

## 详细的使用教程
这部分等待项目单元测试写完以后再补充文档。

更多的关于更详细的使用细节了解可以查看 docs 目录下的文章。
