import React from 'react';
import ReactDOM from 'react-dom';
import './AppListPage.css'
import InlineSVG from 'svg-inline-react';
import QRCode from 'qrcode.react';
import {Treebeard} from 'react-treebeard';
import { configConsumerProps } from 'antd/lib/config-provider';

var data={};
var current_data={};
var current_active_node='';
var current_urlPath='';
var search_active_node= {
    flag:false,
    node_relativePath:'',
    node_urlPath:'',
    node_obj:null
};

class Item extends React.Component{
    constructor(props) {
        super(props);
      }

    ensureVisible(){
        if ( this.props.i_data.isNeedScroll &&  this.props.i_data.data.relativePath==this.props.i_data.active_node) {
            // console.log(this.props);
            // console.log('run ensureVisible');
            // this.props.i_data.scrollIntoView(ReactDOM.findDOMNode(this));
            // console.log(ReactDOM.findDOMNode(this).getBoundingClientRect());
            ReactDOM.findDOMNode(this).scrollIntoViewIfNeeded()
        }
    }
    componentDidMount(){
        this.ensureVisible();
    }
    componentDidUpdate(){
        this.ensureVisible();
    }
    
    render(){
        let className ='';
        this.props.i_data.data.name.includes('.') ? className= 'fa-file-text-o li-display' : className='fa-folder li-display';
        return (
            <li 
                className={this.props.i_data.data.relativePath==this.props.i_data.active_node?'tree-li active':'tree-li'}  
                onClick={() => this.props.i_data.onClickHandle(this.props.i_data.data)}
            >
                {this.props.i_data.data.name.includes('.')?'':
                    <div className={'filter_icon'}>
                        {<InlineSVG 
                            src={this.props.i_data.data.toggled?require("svg-inline-loader!assets/arrow-down.svg"):require("svg-inline-loader!assets/arrow-right.svg")} 
                        />}
                    </div>
                }
                {/* <a className={className}> //在名称后面显示大小和日期
                    {this.props.i_data.data.name+' '+(this.props.i_data.data.size!=void 0? this.props.i_data.data.size:'')+' '+(this.props.i_data.data.name.includes('.')?this.props.i_data.data.createTime:'')}
                </a> */}
                <a className={className}>
                    {this.props.i_data.data.name}
                </a>
                {
                    this.props.i_data.data.name.includes('.') && 
                    <a class='download_icon' href={this.props.i_data.data.download_path}>
                        <InlineSVG 
                            src={require("svg-inline-loader!assets/download-icon.svg")} 
                        />
                    </a>
                }

            </li>
        );
    };
}

function TreeNode(props){
    // console.log('run treeNode...');
    if(!Array.isArray(props.data)){
        let className ='';
        props.data.name.includes('.') ? className= 'fa-file-text-o li-display' : className='fa-folder li-display';
        return (
            <>
                {/* {!props.data.name.includes('plist') && <li className={props.data.relativePath==props.active_node?'tree-li active':'tree-li'}  onClick={() => props.onClickHandle(props.data)}>
                    {props.data.name.includes('.')?'':
                        <div className={'filter_icon'}>
                            {<InlineSVG src={props.data.toggled?require("svg-inline-loader!assets/arrow-down.svg"):require("svg-inline-loader!assets/arrow-right.svg")} />}
                        </div>
                    }
                    <a className={className}>{props.data.name+' '+(props.data.size!=void 0? props.data.size:'')+' '+(props.data.name.includes('.')?props.data.createTime:'')}</a>
                </li>} */}
                {!props.data.name.includes('plist') && <Item i_data={props} />}
                { props.data.children !=void 0 && props.data.children.length>0 && 
                    <TreeNode 
                        data = {props.data.children} 
                        active_node={props.active_node} 
                        toggled={props.data.toggled} 
                        onClickHandle={props.onClickHandle}
                        scrollIntoView={props.scrollIntoView}
                        isNeedScroll={props.isNeedScroll}
                    />
                }
            </>
        )
    }else{
        return (
            <ul className={props.toggled?'tree-ul':'tree-ul ul-invisible'}>
            {
                props.data.map(item =>{
                    return (
                        <TreeNode 
                            data={item} 
                            active_node={props.active_node} 
                            onClickHandle={props.onClickHandle} 
                            scrollIntoView={props.scrollIntoView}
                            isNeedScroll = {props.isNeedScroll}
                        />
                    )
                })
            }
            </ul>
        )
    }
}

function Node(props){
    return(
        <li>
            {props.name}
        </li>
    )
}


function LabelNode(props){
    let labels = props.labels;
    if(labels.length==0){
        return <div></div>;
    }
    return (
        <ul>
            {
                labels.map(item =>{
                return (<li className={item.active?'serach-label search-label-active' : 'serach-label'} 
                onClick={() =>{props.onClickHandle(item)}}>{item.name}</li>)
                })
            }
        </ul>
    )
}

class AppListPage extends React.Component{
    constructor(props){
        super(props);
        this.treeContainer=React.createRef();
        this.state = {
            data:JSON.stringify(current_data)=='{}'? Object.assign({},this.props.data):current_data,
            labels:this.props.labels,
            filter_str:'',
            qrCodeUrl:current_urlPath==''?'':current_urlPath,
            active_node:current_active_node==''?'':current_active_node, //指的是激活node的路径
            curren_node_obj:null,//当前被激活的节点对象
            tree_height:document.documentElement.clientHeight-290,
            isNeedScroll:true
        };
        this.onClickHandle = this.onClickHandle.bind(this);
        this.onToggle = this.onToggle.bind(this);
        this.onClickLabelHandle = this.onClickLabelHandle.bind(this);
        this.onFilterHandle = this.onFilterHandle.bind(this);
        this.scrollElementIntoViewIfNeeded = this.scrollElementIntoViewIfNeeded.bind(this);
    }
    onFilterHandle(event){   //input -->onChange
        let str = event.target.value;
        let new_data = this.filterFunc(str,this.state.labels);
        this.setState({
            isNeedScroll:true,
            data:new_data,
            filter_str:str,
            active_node:search_active_node.node_relativePath!=''?search_active_node.node_relativePath:'',
            curren_node_obj: search_active_node.node_obj,
            qrCodeUrl:search_active_node.node_urlPath!=''?search_active_node.node_urlPath:''
        });
    }
    filterFunc(input_str,labels){
        // console.log('ori data: ',data);
        let ori_str = JSON.stringify(data);
        let new_data =JSON.parse(ori_str);
        const filter_arr = this.filterLabel(labels);
        search_active_node= {
            flag:false,
            node_relativePah:'',
            node_urlPath:'',
            node_obj:null
        };
        if(input_str!=''){
            // input_str.includes(' ')? filter_arr.concat(input_str.split(' ')) :filter_arr.push(input_str);
            if(input_str.includes(' ')){
                let a1 = input_str.split(' ');
                a1.map(v =>{
                    v!=''?filter_arr.push(v):'';
                });
            }else{
                filter_arr.push(input_str);
            }
        }
        if(filter_arr.length>0){
            console.log('filter_arr: ',filter_arr);
            // console.log('filter_arr: ',filter_arr);
            this.filterNode(new_data,null,filter_arr);
        }
        return new_data;
    }

    filterLabel(labels){
        const label_strs = [];
        labels.map(label =>{
            if(label.active){
                label_strs.push(label.name);
            }
        });
        return label_strs;
    }
    onToggle(node, toggled){
        const {cursor, data} = this.state;
        if (cursor) {
            this.setState(() => ({cursor, active: false}));
        }
        node.active = true;
        if (node.children) { 
            node.toggled = toggled; 
        }
        this.setState(() => ({cursor: node, data: Object.assign({}, data)}));
    }
    filterNode(node,parentNode,filter_arr){
        if(filter_arr){
            if(Array.isArray(node)){
                node.map(item =>{
                    this.filterNode(item,parentNode,filter_arr);
                });
            }else{
                // console.log('current node======>',node);
                // console.log('parentNode ======>',typeof parentNode);
                node.parentNode = parentNode;
                let flag = false;
                for(let filter_str of filter_arr){
                    if( node.name.toLowerCase().includes(filter_str.toLowerCase())){
                        for(let key of filter_arr){
                            if(node.relativePath.toLowerCase().includes(key.toLowerCase())){
                                flag = true;
                            }else{
                                flag = false;
                                break;
                            }
                        }
                    }else{
                        // break; //导致第一个关键字不满足，其他关键字不去尝试了。
                    }
                    if(flag){
                        if(!search_active_node.flag){
                            search_active_node.flag = true;
                            search_active_node.node_relativePath=node.relativePath;
                            search_active_node.node_obj = node;
                            node.urlPath.includes('.')?search_active_node.node_urlPath = node.urlPath:null;
                        }
                        break;
                    }
                }
                if(flag){
                    // console.log('includes node: ',node);
                    // console.log('node.parentNode: ',node.parentNode);
                    let copy_node = Object.assign({},node);
                    while(copy_node.parentNode!=null && copy_node.parentNode!=void 0){
                        copy_node.parentNode.toggled = true;
                        let p_node = copy_node.parentNode;
                        copy_node.parentNode = null;
                        copy_node = p_node;
                    }
                }
                let children = node.children;
                if(children!='' && children!=void 0 && children.length>0){             
                    this.filterNode(children,node,filter_arr);
                }
                node.parentNode = null;
            }
        }
    }

    onClickLabelHandle(label){  //labe --> onClick
        // console.log(label);
        let index = this.state.labels.indexOf(label);
        // console.log('index: ',index);
        label.active = !label.active;
        let new_labels =  this.state.labels.slice(0);
        new_labels.splice(index,1,label);
        // console.log('new_labels: ',new_labels);
        let new_data = this.filterFunc(this.state.filter_str,new_labels);
        this.setState({
            isNeedScroll:true,
            labels:new_labels,
            data:new_data,
            active_node:search_active_node.node_relativePath!=''?search_active_node.node_relativePath:'',
            curren_node_obj: search_active_node.node_obj,
            qrCodeUrl:search_active_node.node_urlPath!=''?search_active_node.node_urlPath:''
        });
    }
    onClickHandle(node){  //node --> onClick
        // console.log(node);
        let ori_str = JSON.stringify(this.state.data);
        let target_str = JSON.stringify(node);
        let new_arr = ori_str.split(target_str);
        // console.log('new_arr = ',new_arr);
        let new_node = Object.assign({},node);
        new_node.toggled = !new_node.toggled;
        let real_target_str = JSON.stringify(new_node);
        let new_all_node_str = new_arr.join(real_target_str);
        // console.log(new_all_node_str);
        let new_data = JSON.parse(new_all_node_str);
        // console.log(new_data);
        this.setState({
            isNeedScroll:false,
            data:new_data,
            active_node:node.relativePath,
            curren_node_obj:node,
            qrCodeUrl:node.name.includes('.') ? node.urlPath || '' :''
        });
    }

    scrollElementIntoViewIfNeeded(domNode){
        // const treeContainer = this.refs.treeContainer;
        // let containerDomNode = ReactDOM.findDOMNode(treeContainer);
        // console.log(containerDomNode);
        // console.log(this.treeContainer.current);
        // if(this.treeContainer.current){
        //     console.log(ReactDOM.findDOMNode(this.treeContainer.current).getBoundingClientRect());
        // }
        // console.log(domNode);
    }
    componentDidMount(){
        window.addEventListener('resize', () =>{
            let h1 = document.documentElement.clientHeight;
            let h2 = h1-290;
            console.log('h1: ',h1);
            console.log('h2: ',h2);
            this.setState({
                tree_height:h2
            });
        });
    }

    componentWillReceiveProps (nextProps){
        data = JSON.parse(JSON.stringify(nextProps.data)); //深拷贝保存每次父级传递过来的原始数据
        this.setState({
            data:nextProps.data,
            labels:nextProps.labels
        });
    }
    render(){
        console.log('-----');
        console.log(this.state);
        console.log('new this.state.data: ',this.state.data);
        current_data = this.state.data;
        current_active_node = this.state.active_node;
        current_urlPath = this.state.qrCodeUrl;
        if(JSON.stringify(this.state.data)=='{}'){
            return (<></>)
        }
        // console.log('new this.state.data: ',JSON.stringify(this.state.data));
        return (
            <div>
                <div className='search-filter'>
                    <div className='input-div'>
                        <span className='search-sapn'>
                            <i className="fa fa-search"/>
                        </span>
                        <input className='filter-input' placeholder="Search the files..." onChange={this.onFilterHandle} type="text" value={this.state.filter_str}></input>
                    </div>
                </div>
                <div className='serach-label-div'>
                    <LabelNode labels={this.state.labels} onClickHandle = {this.onClickLabelHandle} />
                </div>
                <div ref={this.treeContainer} className='tree-container' style={{height:this.state.tree_height}}> 
                    <ul className='tree-ul'>
                        <TreeNode 
                            data={this.state.data} 
                            active_node={this.state.active_node} 
                            onClickHandle={this.onClickHandle} 
                            scrollIntoView={this.scrollElementIntoViewIfNeeded}
                            isNeedScroll={this.state.isNeedScroll}
                        />
                    </ul>
                </div>
                <div className='list-qrcode-container'>
                {/* <Progress.Circle size={30} indeterminate={true} /> */}
                    {this.state.qrCodeUrl && 
                        <div className='search-qrcode'>
                            <QRCode size={256} value={this.state.qrCodeUrl} bgColor={"#FFFFFF"} className='filter_qrcode' />
                            <div className='qrcode-info'>
                                <span>
                                    {this.state.curren_node_obj.size!=void 0? this.state.curren_node_obj.size:''}
                                </span>
                                <span>
                                    {this.state.curren_node_obj.name.includes('.')?this.state.curren_node_obj.createTime:''}
                                </span>
                                {/* <a>
                                    {this.state.data.name+' '+(this.state.data.size!=void 0? this.state.data.size:'')+' '+(this.state.data.name.includes('.')?this.state.data.createTime:'')}
                                </a> */}
                            </div>
                        </div>
                    }
                </div>
            </div>
        )
        // return (
        //     <Treebeard data={this.state.data} onToggle={this.onToggle} />
        // )
    }
}


export default AppListPage;