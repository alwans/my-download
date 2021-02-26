import React from 'react';
import './HomePage.css';
import Upload from './Upload.jsx';
import QRCode from 'qrcode.react';
import AppListPage from './AppListPage.jsx';
import {Treebeard} from 'react-treebeard';
import axios from 'axios';

// import ScrollAnimation from 'react-animate-on-scroll';
// const baseUrl = location.host;
// const baseUrl = '192.168.131.184:7090';

const MENU_LIST ={
    UPLOAD_MEUN:'UPLOAD_MEUN',
    FILE_TREE:'FILE_TREE'
}
function defer() {
    const d = {};
    d.promise = new Promise((resolve, reject) => {
        d.resolve = resolve;
        d.reject = reject;
    });

    return d;
}
function postJSON(url, data) {
    const d = defer();
    fetch(url, {
        method: 'POST',
        headers: {
            "Content-Type": "multipart/form-data",'Access-Control-Allow-Origin':'*'
        },
        body: data
    })
        .then((data) => {
            d.resolve(data.json());
        })
        .catch((error) => {
            console.error(error);
            d.reject(error);
        });
    return d.promise;
}

class HomePage extends React.Component{
    constructor(props){
        super(props);
        this.onUpload = this.onUpload.bind(this);
        this.state ={
            uploadPercent:0,
            qrCodeUrl:'',
            qrCode:'',
            qrCodeCreateTime:'',
            active_Memu:'FILE_TREE',
            data:{},
            labels:[]
        };
        this.initData();
        this.onChangeMenu = this.onChangeMenu.bind(this);
        this.configs = {
            headers: { 'Content-Type': 'multipart/form-data' ,'Access-Control-Allow-Origin':'*'},
            onUploadProgress: (progress) => {
            //   console.log(progress);
              let { loaded,total } = progress;
              let percent = parseInt((loaded / total * 100));
            //   console.log('precent: ',percent);
              this.setState({
                uploadPercent:percent
              })
            }
        }
    }
    initData(){
        fetch('/initData')
        .then(res =>res.json())
        .then(data => {
            if(data.fileName){
                this.setState({
                    qrCode:data.fileName,
                    qrCodeCreateTime:data.createTime,
                    data:data.data,
                    labels:data.labels,
                    qrCodeUrl:data.qrCodeUrl
                });
            }else{
                this.setState({
                    data:data.data,
                    labels:data.labels,
                    qrCodeUrl:data.qrCodeUrl
                });
            }
        })
        .catch(error => console.log(error));
    }
    onChangeMenu(){
        this.state.active_Memu==MENU_LIST.FILE_TREE? this.setState({active_Memu:MENU_LIST.UPLOAD_MEUN}) : this.setState({active_Memu:MENU_LIST.FILE_TREE});
    }

    onUpload(files){
        console.log(files);
        const file = files[0];
        console.log('file: ',file);
        const url = file.name.includes('ipa')? '/upload/ipa': '/upload/file';
        console.log('url: ',url);
        const formdata = new FormData();
        formdata.append('file',file);
        // let s = postJSON(url+'/upload',formdata);
        // let res = fetch(url,{ //fetch
        //     method:'POST',
        //     body:formdata,
        //     headers:{'Access-Control-Allow-Origin':'*'}
        // })
        // .then(resp => resp.json())
        // .then(data => {
        //     if(data.fileName){
        //         if(data.fileName){
        //             this.setState({
        //                 qrCode:data.fileName,
        //                 qrCodeUrl:data.qrCodeUrl,
        //                 qrCodeCreateTime:data.createTime
        //             });
        //         }
        //     }
        // })
        // .catch(error => console.log(error));
        // console.log('res: ',res);
        axios.post(url, formdata, this.configs).then(res => {
            console.log('res :',res);
            this.setState({
                qrCode:res.data.fileName,
                qrCodeUrl:res.data.qrCodeUrl,
                qrCodeCreateTime:res.data.createTime,
                uploadPercent:0
            });
        })
    }

    render(){
        const data = this.state.data;
        const labels = this.state.labels;
        console.log(data);
        console.log(labels);
        return (
            <div className='home-content'>
                <div className='ment_btn' onClick={this.onChangeMenu}>{this.state.active_Memu==MENU_LIST.FILE_TREE?'上传文件':'文件下载'}</div>
                {this.state.active_Memu==MENU_LIST.FILE_TREE &&
                   <h1 className='tree-tittle'>file download</h1>
                }
                {this.state.active_Memu==MENU_LIST.FILE_TREE &&
                    <AppListPage data={data} labels={labels}/>
                }
                {this.state.active_Memu==MENU_LIST.UPLOAD_MEUN &&
                    <Upload  onUpload={this.onUpload} percent={this.state.uploadPercent}/>
                }
                <div className="logo" >wang</div>
                {/* <div className='homepage'>
                    coming soon
                </div> */}
                {
                    this.state.active_Memu==MENU_LIST.UPLOAD_MEUN && this.state.qrCode && 
                    <div className='qrcode-container'>
                        <QRCode size={256} value={this.state.qrCodeUrl} bgColor={"#FFFFFF"} className='qrcode' />
                        <span className='qrcode-tittle'>{this.state.qrCode}</span>
                        <span className='qrcode-tittle'>{this.state.qrCodeCreateTime}</span>
                    </div>
                }
            </div>
        )
    }
}

export default HomePage;