import React,{useCallback} from 'react';
import './Upload.css';
import InlineSVG from 'svg-inline-react';
import { Progress } from 'antd';
// import 'antd/dist/antd.css';
import Circle from 'react-circle';

class Upload extends React.Component{
    constructor(props){
        super(props);
        this.upload = this.upload.bind(this);
        // this.onUpload = this.onUpload.bind(this);
        // this.state ={file:null}
        // this.handleDragEnter = this.handleDragEnter.bind(this);
        // this.handleDragLeave = this.handleDragLeave.bind(this);
        // this.handleDrop = this.handleDrop.bind(this);
        // this.onChange = this.onChange.bind(this);
    }
    upload(){
        const files = this.input.files;
        if(files.length>1){
            alert('上传文件个数不能大于1');
            return -1;
        }
        this.props.onUpload(files);
    }
    handleDragEnter(e){
        e.preventDefault();
        e.stopPropagation()
    }
    handleDragLeave(e){
        e.preventDefault();
        e.stopPropagation()
    }
    handleDrop(e){
        e.preventDefault();
        const files = [...e.dataTransfer.files];
        if(files.length>1){
            alert('上传文件个数不能大于1');
            return -1;
        }
        this.props.onUpload(files);
    }

    render(){
        console.log('---------');
        let percent = this.props.percent;
        return (
            <div className='upload-container' onClick={e =>this.input.click()}
                onDragEnter={this.handleDragEnter}
                onDragLeave={this.handleDragLeave}
                onDragOver={this.handleDragEnter}
                onDrop={(event) => this.handleDrop(event)}
            >
                {percent==0 && <>
                    <input multiple type='file' onChange={this.upload} ref = {(input) => {this.input = input}}/>
                <span className='icon'>
                    <InlineSVG src={require("svg-inline-loader!assets/upload.svg")} />点击上传或拖拽到这里上传
                </span></>
                }
                {/* {percent!=0 && <Progress style={{ margin:'auto'}} type="circle" percent={percent} />} */}
                {percent!=0 &&
                    <Circle
                        size="200"
                        lineWidth="10"
                        progress={percent}
                    />
                }

            </div>
        );
    };
}
export default Upload