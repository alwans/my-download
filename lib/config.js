exports.BaseConfig = {
    isUseNginx:false, //列表文件下载是否走nginx
    filePath:'',  //--->G:\\my-download\\testFile 完整路径
    protocol:'', //http ? https
    domain:'', //sample:www.baidu.com
    port:'' //sample:443
}
exports.ServerConfig={
    server_port:7090
}
exports.tree_labels=[
    {
        name:'ipa',
        active:false
    },
    {
        name:'apk',
        active:false
    },
    {
        name:'test1',
        active:false
    },
    {
        name:'test2',
        active:false
    },
    {
        name:'test3',
        active:false
    },
    {
      name:'ios',
      active:false
    },
    {
      name:'android',
      active:false
    },
]