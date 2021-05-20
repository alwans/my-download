# my-download

**生成二维码下载文件**

 ## 使用
- 安装依赖： cnpm install 
- 启用服务： node lib/webServer.js
- 打开链接：[访问web](http://127.0.0.1:7090) 

### 配置属性
 **配置文件：[lib/config.js](https://github.com/alwans/my-download/blob/master/lib/config.js)**  
 #### 属性介绍：
 
| key      | desc |  type  |
| -------- | -------- | ------|
| isUseNginx | 列表文件下载是否走nginx   |  boolean |
| filePath   | 扫描的根目录(绝对路径)   |    String  |
| protocol   | http ? https   |   string |
| domain   | sample:www.baidu.com   |   string |
| port   | sample:443   |  string  |

*如果是ipa文件扫码下载，就一定需要配置protocol：为 https，domain：可下载 ipa文件的域名，端口：https一般都是443*
