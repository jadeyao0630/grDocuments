import { Iobject } from "../components/MTable/MTable"

const local ="192.168.10.122"
const glory ="192.168.10.213"
const isTest=true
export const serverIp=glory
export const serverPort=isTest?"4556":"4555"
export const webSocketPort=isTest?"3003":"3002"
export const remoteSotrageServer="http://192.168.10.243/uploads/"
export const acceptFiles=".xlsx,.docx,.xls,.ppt,.pptx,.pdf,.png,.gif,.jpeg,.jpg,.zip,.rar,.txt"
export interface ColumnData {
    label: string;
    isEditble?: boolean; // 假设每行数据中有一个fileName字段
    isFilterable?: boolean;
    isSortable?: boolean;
    sortType?: string;
    isFixed?:boolean;
    width:string|number;
    type:string;
    data:Array<any>;
    value:Array<any>;
    isHide:boolean;
    style?:React.CSSProperties;
    backupKey?:string;
    canBeExport?:boolean;
  }
  export const tableColumns:Iobject={
    docId:{
        label:'编号',
        width:80,
        type:'text',
        isFilterable:true,
        isFixed:true,
        canBeExport:true,
        isSortable:true,
        sortType:'number'
    },
    createTime:{
        label:'创建日期',
        width:100,
        type:'date',
        format:'yyyy/mm/dd',
        canBeExport:true,
        isSortable:true,
        sortType:'date'
    },
    project:{
        label:'所属项目',
        isEditble:true,
        width:140,
        style:{maxWidth:140},
        type:'combobox',
        data:[],
        value:["0"],
        isFilterable:true,
        backupKey:'projectId',
        canBeExport:true,
        sortType:"text"
    },
    category:{
        label:'分类',
        isEditble:true,
        width:140,
        style:{maxWidth:140},
        type:'combobox',
        data:[],
        value:["0"],
        isFilterable:true,
        backupKey:'categoryId',
        canBeExport:true,
        sortType:"text"
    },
    title:{
        label:'名称',
        isEditble:true,
        width:300,
        style:{minWidth:200},
        type:'textarea',
        isFilterable:true,
        canBeExport:true,
        sortType:"text"
    },
    agent:{
        label:'责任者',
        isEditble:true,
        width:"auto",
        type:'text',
        isFilterable:true,
        canBeExport:true,
        sortType:"text"
    },
    person:{
        label:'经办人',
        isEditble:true,
        width:120,
        style:{maxWidth:120},
        type:'text',
        isFilterable:true,
        canBeExport:true,
        sortType:"text"
    },
    location:{
        label:'位置',
        isEditble:true,
        width:"auto",
        type:'combobox',
        data:[],
        value:["0"],
        isFilterable:true,
        backupKey:'locationId',
        canBeExport:true,
        sortType:"text"
    },
    modifiedTime:{
        label:'更新日期',
        width:100,
        type:'date',
        isHide:true
    },
    remark:{
        label:'备注',
        isEditble:true,
        width:"auto",
        type:'textarea',
        isFilterable:true,
        canBeExport:true,
        sortType:"text"
    },
    description:{
        label:'标签',
        isEditble:true,
        width:200,
        type:'multiCombobox',
        data:[],
        value:[],
        isFilterable:true,
        canBeExport:true,
        sortType:"array"
    },
    coverPage:{
        label:'封面页',
        width:50,
        type:'img'
    },
    attachement:{
        label:'附件',
        width:"auto",
        type:'file',
        isHide:false,
        isEditble:true,
    },
}