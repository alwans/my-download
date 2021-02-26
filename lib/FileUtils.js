const { RSA_SSLV23_PADDING } = require('constants');
const fs = require('fs'),
    url = require('url'),
    ip = require('ip'),
    moment = require('moment'),
    AppInfoParser = require('app-info-parser'),
    extract = require('ipa-extract-info'),
    path = require('path');
const { BaseConfig, ServerConfig } = require('./config');
const { gen_plist } = require('./plist');
const { printLog } = require('./utils');
async function generatePlist(filePath,fileName,ipa_download_url){
    let packageName,version,appName='';
    return new Promise((resolve,reject) =>{
        let temp_fileName = fileName;
        if(temp_fileName.includes('.ipa')){
            temp_fileName = temp_fileName.replace('.ipa','')+'.plist';//去掉.ipa 后缀名,加上.plist后缀名
        }else{
            temp_fileName = temp_fileName+'.plist';
        }
        if(checkFile(filePath,temp_fileName)){
            resolve({
                fileName:temp_fileName 
            });
        }
        const parser = new AppInfoParser(path.join(filePath,fileName)) // or xxx.ipa
        parser.parse().then(result => {
                // console.log('app info ----> ', result)
                packageName = result.CFBundleIdentifier||'';
                version = result.CFBundleShortVersionString||'';
                appName = result.CFBundleName||'';
                if(fileName.includes('.ipa')){
                    fileName = fileName.replace('.ipa','')+'.plist';//去掉.ipa 后缀名,加上.plist后缀名
                }else{
                    fileName = fileName+'.plist';
                }
                if(checkFile(filePath,fileName)){
                    resolve({
                        fileName:fileName 
                    });
                }else{
                    if(packageName==''||version==""||appName==''){
                        console.log(`${fileName} gen plist is err ----> ,packageName || version || appName is null `);
                        resolve(-1);
                    }
                    let opt = {
                        url:ipa_download_url,
                        packageName : packageName,
                        version:version,
                        appName:appName
                    }
                    fs.writeFile(path.join(filePath,fileName),gen_plist(opt),'utf8',async function(error){
                        if(error){
                            console.log(`生成${fileName}文件失败, err:${error}`);
                            resolve(-1);
                        }
                        resolve( {
                            fileName:fileName
                        });
                    })
                }
            }).catch(err => {
                console.log(`${fileName} gen plist is err ----> ,${err} `);
                resolve(-1);
        })
        // console.log(fileName);
        // resolve({
        //     fileName:fileName
        // });
    });
}

async function generateFileTree(){
    let filePath = getFilesListPath();
    if(!filePath){
        console.log('获取文件目录失败,请检查BaseConfig配置');
        return -1;
    }
    let basePath = path.dirname(filePath);
    let fileName = path.basename(filePath);
    let obj = await fileTree(basePath,fileName,fileName);
    // console.log(JSON.stringify(obj));
    return obj;
}
async function fileTree(basepath,fileName,relativePath){
    let filePath = path.join(basepath,fileName);
    let files;
    try{
        files = fs.readdirSync(filePath);
    }catch(e){
        console.log(`读取目录路径: ${filePath} 失败`);
        return -1;
    }
    let children_nodes = [];
    if(files.length){
        files.sort(function(a, b) {
            let stats_a = fs.statSync(path.join(filePath,a));
            let stats_b = fs.statSync(path.join(filePath,b))
            if(stats_a.isFile() && !stats_b.isFile()){
                return -1;
            }else if(stats_b.isFile() && !stats_a.isFile()){
                return 0;
            }else if(stats_b.isFile() && stats_a.isFile()){
                return stats_b.ctime.getTime() - stats_a.ctime.getTime();
            }else{
                return stats_a.ctime.getTime() - stats_b.ctime.getTime();
            }
        });
        for(let file of files){
            let child_file_path = path.join(filePath,file);
            let stats = fs.statSync(child_file_path);
            let p =  path.join(relativePath,file);
            if(stats.isDirectory()){
                let obj = await fileTree(filePath,file,p);
                children_nodes.push(obj);
            }else{
                let file_download_path ='';
                let origin_file_download_path = BaseConfig.isUseNginx?  getBaseUrl() + '/' +url.format(path.join(relativePath,file)) :getBaseUrl() + '/list/download?filename='+ url.format(path.join(relativePath,file));
                if(file.includes('.ipa')){
                    let ipa_base_url = getBaseUrl();

                    if(!ipa_base_url.includes('https')){
                        file_download_path='';
                    }else{
                        let ipa_download_url = BaseConfig.isUseNginx?ipa_base_url+'/'+url.format(path.join(relativePath,file)) : ipa_base_url+'/list/download?filename='+url.format(path.join(relativePath,file));
                        let plist_obj = await generatePlist(filePath,file,ipa_download_url);
                        if(plist_obj==-1){
                            file_download_path='';
                        }else{
                            file_download_path = BaseConfig.isUseNginx? 
                            'itms-services://?action=download-manifest&url='+ipa_base_url+'/'+url.format(path.join(relativePath,plist_obj.fileName)) :
                            'itms-services://?action=download-manifest&url='+ipa_base_url+'/list/download?filename='+url.format(path.join(relativePath,plist_obj.fileName));
                        }
                    }
                }else{
                    let apk_base_url ='';
                    apk_base_url = getBaseUrl();
                    file_download_path = BaseConfig.isUseNginx? apk_base_url + '/' +url.format(path.join(relativePath,file)) :apk_base_url + '/list/download?filename='+ url.format(path.join(relativePath,file));
                }
                children_nodes.push(
                    {
                        name:file,
                        toggled:false,
                        download_path:origin_file_download_path,
                        urlPath:file_download_path,
                        relativePath:path.join(relativePath,file),
                        createTime:dateFormat(stats.mtimeMs),
                        size:getfilesize(stats.size),
                    }
                );
            }
        }
        // files.map(async file =>{

        // });
        return {
            name:fileName,
            toggled:false,
            urlPath:relativePath==fileName?'':relativePath,
            relativePath:relativePath==fileName?'':relativePath,
            children:children_nodes,
        }
    }else{
        return {
            name:fileName,
            toggled:false,
            relativePath:relativePath==fileName?'':relativePath,
            urlPath:relativePath==fileName?'':relativePath,
            children:children_nodes,
        }
    }
}



function getBaseUrl(){
    if(BaseConfig.protocol && BaseConfig.domain && BaseConfig.port){
        return BaseConfig.protocol+'://'+BaseConfig.domain+':'+BaseConfig.port
    }else{
        return 'http://'+getIP()+':'+ServerConfig.server_port;
    }
}

function getFilesListPath(){
    return BaseConfig.filePath!='' && BaseConfig.filePath!=void 0 ? BaseConfig.filePath : path.join(__dirname,'..','testFile');
}

function getIP(){
    return ip.address();
}
function checkFile(filePath,target_fileName){
    let files = fs.readdirSync(filePath);
    for(file of files){
      let stat = fs.statSync(path.join(filePath,file));
      if(file==target_fileName && stat.isFile){
        return true;
      }
    }
    return false;
}

function i_wait(time){
    return new Promise((resolve,reject) =>{
        setTimeout(()=>{
            resolve('1');
        },time);
    });
}

function dateFormat(timeMs){
	moment.locale('zh-cn');
	var formDate = moment(timeMs).format('YYYY-MM-DD HH:mm:ss');
	return formDate;
}

function getfilesize(size) {
    if (!size)
        return "";
    var num = 1024.00; //byte
    if (size < num)
        return size + "B";
    if (size < Math.pow(num, 2))
        return (size / num).toFixed(2) + "K"; //kb
    if (size < Math.pow(num, 3))
        return (size / Math.pow(num, 2)).toFixed(2) + "M"; //M
    if (size < Math.pow(num, 4))
        return (size / Math.pow(num, 3)).toFixed(2) + "G"; //G
    return (size / Math.pow(num, 4)).toFixed(2) + "T"; //T
}


// (async() =>{
//     // let f_path = path.join(__dirname,'..','files');
//     // let arr =[1];
//     // arr.map(async item =>{
//     //     let obj = await generatePlist(f_path,'usedcar4s.ipa','itms-services://?action=download-manifest&url=');
//     //     console.log(obj);
//     //     console.log('------');
//     // });
//     let obj = await generateFileTree();
//     console.log(obj);
// })();

// obj.then(data =>{
//     console.log(data);
// });
// generateFileTree();
// console.log(getBaseUrl());
// console.log(getIP());

module.exports ={
    generateFileTree,
    getBaseUrl,
    getIP,
    getFilesListPath,
    checkFile,
    getBaseUrl,
    generatePlist,
    dateFormat
}
