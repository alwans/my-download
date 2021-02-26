const express = require('express'),
    url = require('url'),
    bodyParser = require('body-parser'),
    fs = require('fs'),
    ip = require('ip'),
    os = require('os'),
    juicer = require('juicer'),
    compress = require('compression'),
    multer  = require('multer'),
    path = require('path'),
    {generateFileTree, getIP, getFilesListPath,checkFile, getBaseUrl,generatePlist,dateFormat} = require('./FileUtils');
const { ServerConfig,tree_labels, BaseConfig } = require('./config');
const { printLog } = require('./utils');

var nginx_download_relative_path = ''; //使用代理时，生成下载路径：相对路径
const nginx_download_dir = 'upload_files';
const labels = tree_labels;
const networkInterfaces = os.networkInterfaces();
const staticDir = path.join(__dirname, '../');
const filesListDir = getFilesListPath();
const filesDir = setFilePath();
const app = express();
const port = ServerConfig.server_port;
const ipAddress = ip.address();
app.use(compress()); //invoke gzip
// app.use((req, res, next) => {
//     res.setHeader('note', 'THIS IS A REQUEST FROM ANYPROXY WEB INTERFACE');
//     return next();
//   });
let upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, filesDir);
        },
        filename: function (req, file, cb) {
            var changedName = file.originalname;
            cb(null, changedName);
        }
    })
});

app.use(bodyParser.json());
app.use((req, res, next) => {
    const indexTpl = fs.readFileSync(path.join(staticDir, '/index.html'), { encoding: 'utf8' }),
      opt = {
        ipAddress: ipAddress || '127.0.0.1'
      };
    if (url.parse(req.url).pathname === '/') {
      res.setHeader('Content-Type', 'text/html');
      res.end(juicer(indexTpl, opt));
    } else {
      next();
    }
  });
app.use(express.static(staticDir));
app.use(express.static(filesListDir));
app.post('/upload/file',upload.single('file'),async (req,res) =>{await Upload(req,res)});
app.post('/upload/ipa',upload.single('file'),async (req,res) =>{await Upload(req,res)});
app.get('/download',(req,res) =>{
  let fileName = req.query.filename;
  let flag = checkFile(filesDir,fileName);
  if(!flag){
    return res.json({
      info:'文件不存在'
    });
  }
  let filePath = path.join(filesDir,fileName);
  let stat = fs.statSync(filePath);
  let readStream = fs.createReadStream(filePath);
  res.attachment(fileName);//解决文件名包含中文问题
  res.writeHead(200,{
    'Content-Type': 'application/octet-stream',
    // 'Content-Disposition': 'attachment; filename=' + fileName, //文件名包含中文报错
    'Content-Length': stat.size
  });
  readStream.pipe(res);
});
app.get('/list/download',(req,res) =>{
  let fileName = req.query.filename;
  if(fileName.includes('/')){
    fileName = fileName.split('/');
    fileName.splice(0,1);
    fileName = fileName.join('/');
  }
  let arr = fileName.split('/');
  fileName = arr.splice(arr.length-1,1)[0];
  let subPath = arr.join('/');
  let flag = checkFile(path.join(filesListDir,subPath),fileName);
  if(!flag){
    return res.json({
      info:'文件不存在'
    });
  }
  let filePath = path.join(filesListDir,subPath,fileName);
  let stat = fs.statSync(filePath);
  let readStream = fs.createReadStream(filePath);
  res.writeHead(200,{
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': 'attachment; filename=' + fileName,
    'Content-Length': stat.size
  });
  readStream.pipe(res);
});
app.get('/initData',async (req,res) =>{
  let result = await getQrcodeInfo();
  let data=await generateFileTree();
  data ==-1? result.data={} : result.data=data;
  result.labels = labels;
  res.json(result);
});
const Upload = async function(req,res){
  // console.log(req.file);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");
  res.json(await getQrcodeInfo());
}
const getQrcodeInfo = async function(){
  let files = fs.readdirSync(filesDir);
  if(files.length==0){
    return {
      fileName:''
    }
  }
  // console.log(files);
  files.sort(function(a, b) {
    if(a.includes('plist')){
      return 0;
    }else if(b.includes('plist')){
      return -1;
    }
    return fs.statSync(path.join(filesDir,b)).mtime.getTime() - 
           fs.statSync(path.join(filesDir,a)).mtime.getTime();
  });
  // console.log(files);
  let file = files[0];
  let stats = fs.statSync(path.join(filesDir,file));
  if(file.includes('ipa')){
    if(getBaseUrl().includes('https')){
      if(BaseConfig.isUseNginx){
        let obj = await generatePlist(filesDir,file,getBaseUrl()+'/'+url.format(path.join(nginx_download_relative_path,file)));
        if(obj==-1){
          return {fileName:''};
        }
        return {
          fileName:file,
          qrCodeUrl:'itms-services://?action=download-manifest&url='+getBaseUrl()+'/'+url.format(path.join(nginx_download_relative_path,obj.fileName)),
          createTime:dateFormat(stats.mtimeMs)
        }
      }else{
        let obj = await generatePlist(filesDir,file,getBaseUrl()+'/download?filename='+file);
        if(obj==-1){
          return {fileName:''};
        }
        console.log(obj);
        return {
          fileName:file,
          qrCodeUrl:'itms-services://?action=download-manifest&url='+getBaseUrl()+'/download?filename='+obj.fileName,
          createTime:dateFormat(stats.mtimeMs)
        }
      }

    }
    return {
      fileName:'未配置https,无法提供ipa文件下载',
      qrCodeUrl:'https://www.baidu.com',
      createTime:dateFormat(stats.mtimeMs)
    };
  }
  return {
    fileName:file,
    qrCodeUrl:'http://'+getIP()+':'+port+'/download?filename='+file,
    createTime:dateFormat(stats.mtimeMs)
  }
}
app.listen(port,() => {
  console.log('server is start...port:'+port);
});


/**
 * 设置文件上传路径，如果使用了nginx，文件上传路径使用目录树路径，目录为：upload_file
 * 如果未使用nginx，就使用默认的当前路径下的files目录
 */
function setFilePath (){
  if(BaseConfig.isUseNginx){
    let basePath = getFilesListPath();
    files = fs.readdirSync(basePath);
    let flag = false;
    for(file of files){
      if(file==nginx_download_dir){
        flag = true;
      }
    }
    if(!flag){
      console.log('create upload file...');
      fs.mkdirSync(path.join(basePath,nginx_download_dir));
    }
    nginx_download_relative_path = path.join(path.basename(basePath),nginx_download_dir);
    return path.join(basePath,nginx_download_dir);
  }else{
    return path.join(staticDir,'files');
  }
}

const getAllIpAddress = function(){
  const allIp = [];
  Object.keys(networkInterfaces).map((nic) => {
    networkInterfaces[nic].filter((detail) => {
      if (detail.family.toLowerCase() === 'ipv4') {
        allIp.push(detail.address);
      }
    });
  });
  return allIp.length ? allIp : ['127.0.0.1'];
}
// console.log(getAllIpAddress());