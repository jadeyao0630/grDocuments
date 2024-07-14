import React, { FC,useState, useEffect, useRef } from "react";
import { useDBload } from "../../utils/DBLoader/DBLoaderContext";
import { findColumnByLabel, formatDateTime } from '../../utils/utils';
import {ColumnData,tableColumns,serverIp,serverPort} from '../../utils/config'

import Input from "../Input/input";
import Select, { SelectOption } from "../Select/Select";
import Button from "../Button/button";
import Dropdown, { OptionType } from "../Select/Dropdown";
import { MultiValue, SingleValue } from "react-select";
import ReactTooltip ,{ Tooltip, TooltipRefProps } from "react-tooltip";
import MessageBox from "../MessageBox/MessageBox";
import Dialog, { useDialog } from "../Dialog/Dialog";
import Icon from "../Icon/icon";
import MPopup from "../Popup/MPopup";
import Modal from 'react-modal';
import { renderAsync } from 'docx-preview';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

// import classNames from "classnames";

export interface ImTableProps {
    className?: string;
    style?: React.CSSProperties;
}
export interface Iobject {
    [key: string]: any;
}
interface ImageItem {
    id: string;
    fileName: string; // 假设每行数据中有一个fileName字段
  }
  
//const projects=["大兴","北七家","西铁营"]
//const categories=["运营类","投资结算","营销类","物业中标通知书","审计文件","上市公司文件","股票债券文件","图纸类","招商文件"]
//const docTags=["请款","请示","大兴","北七家","西铁营"]
//const locations=["销售类合同模板","苏州营销","北七家商品房精装修","北七家营销","物业公司运营文件"]



//const serverIp='192.168.10.213'
//const serverPort = '4555'
const MTable: FC<ImTableProps> = (props) => {
    const { className,style } = props;
    const { 
        setReload,
        result,search,setResult,setSearch,
        categories,setCategories,
        projects,setProjects,
        tags,setTags,
        tagsToAdd,setTagsToAdd,
        locations,setLocations } = useDBload();
    const [imageURLs, setImageURLs] = useState<{ [key: string]: string }>({});
    const [imageURLs_thumb, setImageURLs_thumb] = useState<{ [key: string]: string }>({});
    const [hoveredImage, setHoveredImage] = useState<string | null>(null);
    const popupRef = useRef<HTMLImageElement>(null);
    const tooltipRef1 = useRef<TooltipRefProps>(null)
    const fileListRef = useRef<HTMLUListElement>(null)
    const tableColumnSettingsButn = useRef<HTMLButtonElement>(null)
    const [currentItem, setCurrentItem] = useState<Iobject>();
    
    const [message, setMessage] = useState<string | null>(null);

    const [position, setPosition] = useState({left:0,top:0});

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(15);
    const [goToPage, setGoToPage] = useState(1);
    const [sortData, setSortData] = useState<Iobject>({type:"down",id:"createTime"});

    const { DialogComponent, showDialog: showDialogHandler } = useDialog();
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | ArrayBuffer | null>(null);
  const [previewType, setPreviewType] = useState<string | null>(null);
    
    const [visibleColumn, setVisibleColumn] = useState([
        'docId',
        'createTime',
        'project',
        'category',
        'title',
        'agent',
        'person',
        'location',
        //'modifiedTime',
        'remark',
        'description',
        'coverPage',
        //'attachement'
    ]);
    const url2File = async(url:string,folder:string) => {
        try {
            const response = await fetch(`http://${serverIp}:${serverPort}/preview?folder=${folder}&fileName=${url}`);
            const data = await response.blob();
            const fileName = url.split('/').pop() || 'downloadedFile';
            const fileType = data.type;
            const file = new File([data], fileName, { type: fileType });
            console.log('File:', file);
            return file
          } catch (error) {
            console.error('Error fetching file:', error);
          }
          return undefined
    }
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>,item:Iobject,key:string) => {
        if (event.target.files) {
            item[key]=Array.from(event.target.files).map(f=>f.name).join(",")
          //const fileArray = [...files, ...Array.from(event.target.files)];
            //setCurrentItem({...currentItem,attachement:fileArray.map(f=>f.name).join(",")});
            //setFiles(fileArray);
            setTimeout(() => {
                if(fileListRef.current){
                    fileListRef.current.scrollTop=fileListRef.current.scrollHeight
                }
            }, 200);
          
        }
    };
    const handleFileClick = async (file: File|undefined) => {
        if(file){
            const fileURL = URL.createObjectURL(file);
            if (file.name.endsWith('.docx')) {
                const arrayBuffer = await file.arrayBuffer();
                const container = document.createElement('div');
                await renderAsync(arrayBuffer, container);
                setPreviewContent(container.innerHTML);
            } else if (file.name.endsWith('.xlsx')|| file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
                const data = await file.arrayBuffer();
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const htmlString = XLSX.utils.sheet_to_html(firstSheet);
                setPreviewContent(htmlString);
            }else {
                
                if (file.type.startsWith('image/')) {
                    const fileReader = new FileReader();
                    fileReader.onload = async (e) => {
                        if (file.type.startsWith('image/')) {
                            setPreviewSrc(fileReader.result);
                            setPreviewType(file.type);
                        } 
                    }
                    fileReader.readAsDataURL(file);
                }else {
                    setPreviewContent(`<iframe src="${fileURL}" width="100%" height="100%" style="border: none;margin:-3px;"></iframe>`);
                }

                //window.open(fileURL, '_blank', 'width=800,height=600,scrollbars=yes');
                //
            }
            setSelectedFile(file);
        }
        setModalIsOpen(true);
    };
    
    const handleFileDelected = (file: File|undefined) => {
        if(file){

            setFiles(files.filter((f) => f !== file));
        }
    }

    const _closeModal = () => {
    setModalIsOpen(false);
    setSelectedFile(null);
    };
  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
  };
  const handlePreviousPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
    setGoToPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const handleNextPage = () => {
    if(search!==undefined){
        setCurrentPage((prevPage) => Math.min(prevPage + 1, Math.ceil(search.length / itemsPerPage)));
        
        setGoToPage((prevPage) => Math.min(prevPage + 1, Math.ceil(search.length / itemsPerPage)));
    }
  };
  const handleGoToPageSubmit = (e: React.KeyboardEvent) => {
    //e.preventDefault();
    if(search!==undefined && e.code.toUpperCase()==="ENTER"){
        const pageNumber = goToPage;
        if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= Math.ceil(search.length / itemsPerPage)) {
        setCurrentPage(pageNumber);
        }
        setGoToPage(pageNumber);
    }
  };
  const handleGoToPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGoToPage(Number(e.target.value));
  };
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setItemsPerPage(value);
      setCurrentPage(1); // Reset to the first page
    }
  };
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = search?.slice(startIndex, startIndex + itemsPerPage);
  //setSearch(paginatedData?paginatedData:[])

  useEffect(() => {
    const handleScroll = () => {
        setPosition((p)=>{
            p.left=window.scrollX
            p.top=window.scrollY
            return p
        }
        );
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

    const openModal = (id: any) => {
        const filteredResult = result?.filter((res: Iobject) => res['docId'] === id);
        if(filteredResult!==undefined && filteredResult.length>0){
            setCurrentItem(filteredResult[0])
        }
        console.log("id",id,filteredResult)
        //setIsModalOpen(true);
      };
    
      const closeModal = () => {
        setCurrentItem(undefined)
        setFiles([])
        //setIsModalOpen(false);
      };
      const closePopup = () => {
        setHoveredImage(null);
        //setIsModalOpen(false);
      };
      const [renderedItems, setRenderedItems] = useState<JSX.Element[]>([]);

      useEffect(() => {
        const fetchFilesAndRender = async () => {
          if (currentItem !== undefined) {
            const items = await Promise.all(
              Object.keys(currentItem).map(async (key, index) => {
                const result_ = findColumnByLabel(tableColumns, key);
                if (result_ !== undefined) {
                  const item = await getItem(result_, key, currentItem);
                  return (
                    <div style={{ display: "grid", gridTemplateColumns: "60px 1fr", justifyItems: "right" }} key={index}>
                      <label style={{ alignSelf: "center" }}>
                        {tableColumns[key].label}:
                      </label>
                      {item}
                    </div>
                  );
                }
                return null;
              })
            );
            // 过滤掉可能的 null 值
            setRenderedItems(items.filter(item => item !== null) as JSX.Element[]);
          }
        };
        fetchFilesAndRender();
      }, [currentItem, tableColumns]);

      useEffect(() => {

        tableColumns.category.data=categories?.filter((data)=>Number(data.isDisabled)===0).map((data) => ({
            label: data.name,
            value: data.id.toString()
          }))
          //tableColumns.project.value=["0"]
          tableColumns.project.data=projects?.filter((data)=>Number(data.isDisabled)===0).map((data) => ({
            label: data.name,
            value: data.id.toString()
          }))
          //tableColumns.project.value=["0"]
          tableColumns.location.data=locations?.filter((data)=>Number(data.isDisabled)===0).map((data) => ({
            label: data.name,
            value: data.id.toString()
          }))
          
          //tableColumns.project.value=["0"]
          tableColumns.description.data=tags?.filter((data)=>Number(data.isDisabled)===0).map((data) => ({
            label: data.name,
            value: data.id.toString()
          }))
      },[categories,projects,locations,tags]);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                setHoveredImage(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [popupRef]);

    useEffect(() => {
        if (search && search.length > 0) {
            const fetchImageURLs = async () => {
                const urls: { [key: string]: string } = {};
                const urls_thumb: { [key: string]: string } = {};
                for (const item of search as Iobject[]) {
                    if(item["coverPage"]!==undefined && item["coverPage"]!==null && item["coverPage"].length>0){
                        const url = await fetch(`http://${serverIp}:${serverPort}/preview?folder=${item["docId"]}&fileName=thumb_${item["coverPage"]}`, {
                            method: 'get',
                            headers: {
                                'Content-Type': 'application/json',
                            }
                        }).then(response => response.url);
                        urls[item["docId"]] = url.replace("thumb_","");
                        urls_thumb[item["docId"]] = url;
                    }
                }
                setImageURLs(urls);
                setImageURLs_thumb(urls_thumb);
            };
            fetchImageURLs();
        }
    }, [search]);
    if(search===undefined || search.length===0) return <div>没有记录</div>

    const showMessage = (mesg:string | null) => {
      setMessage(mesg);
    };

    const handleMouseEnter = (url: string,event:React.MouseEvent) => {
        setHoveredImage(url);
        console.log(url)
        //console.log(window.innerWidth,event.clientX + 10,popupRef.current,popupRef.current?.getBoundingClientRect());
        //setPopupPosition({ top: window.scrollY, left: 0});
    };

    const setTd = (index:number, key:string,item:Iobject) => {
        if(tableColumns.hasOwnProperty(key)){
            const type=tableColumns[key].type
            var style:React.CSSProperties={...tableColumns[key]['style'],textAlign:"left"}
            if(!visibleColumn.includes(key)&&!tableColumns[key].isFixed) style={...style, display:'none' }
            var td_item = item[key];
            if (type === "img") {
                style = { padding: 0,textAlign:"center" };
                td_item = imageURLs_thumb[item["docId"]] ? <img className="thumbnail" src={imageURLs_thumb[item["docId"]]} alt="coverPage" onClick={(e) => handleMouseEnter(imageURLs[item["docId"]],e)} /> : 
                (imageURLs_thumb[item["docId"]]?'Loading...':'');
            }else if (type === "date") {
                td_item = formatDateTime(item[key],tableColumns[key].format);
            }
            
            return <td key={index} 
                        data-index={index} 
                        className={tableColumns[key].isFixed?"fixed-pos fixed-2nd":""}
                        //data-tooltip-id={"table-tooltips"} 
                        //data-tooltip-content={td_item} 
                        style={style} 
                        
                        //title={tooltipVisible[index] ? td_item : ''}
                        onDoubleClick={() => handleDoubleClick(item["docId"],key)}>
                            <div 
                        style={style} onMouseEnter={(e) => {
                            if(e.target instanceof HTMLDivElement){
                                const td = e.target as HTMLDivElement
                                const isOverflowing = td.scrollWidth > td.clientWidth ;
                                if(isOverflowing) {
                                    td.classList.add('has_tool_tip')
                                    tooltipRef1.current?.open({
                                        anchorSelect: '.has_tool_tip',
                                        content:td_item
                                    })
                                }
                                //console.log(tooltipRef1.current,isOverflowing)
                            }
                            
                        }}
                        onMouseLeave={(e) => {
                            if(e.target instanceof HTMLDivElement){
                                const td = e.target as HTMLDivElement
                                td.classList.remove('has_tool_tip')
                                tooltipRef1.current?.close()
                                //console.log(tooltipRef1.current)
                            }
                        }}>

                                {td_item}
                            </div>
                        </td>
        }return null
    }
    const setTh = (index:number, key:string) => {
        if(tableColumns.hasOwnProperty(key)){
            const columnData:ColumnData=tableColumns[key]
            var style:React.CSSProperties={...tableColumns[key]['style'],textAlign:"center"}
            if(!visibleColumn.includes(key)&&!columnData.isFixed) style={...style, display:'none' }
            if(columnData.width) style={...style, width: columnData.width }
            if(columnData.style) style={...style, ...columnData.style }
            var th_item=columnData.label;

            return <th className={(tableColumns[key].isFixed?"fixed-pos fixed-2nd":"")+" "+(tableColumns[key].sortType?"sortable-column":"")} 
                    style={{...style,...{}}}
                    data-id={key} data-sort={tableColumns[key].sortType} key={index} data-index={index}
                    onClick={e=>handleSortColumn(e,sortData?.['type']==="up")} >
                            
                            {th_item}
                            {tableColumns[key].sortType && sortData?.['type']==="up" && sortData?.['id'] ===key &&
                            <Icon icon="angle-up" style={{marginLeft:"2px",pointerEvents: 'none'}}></Icon>
                            }
                            {tableColumns[key].sortType && sortData?.['type']==="down" && sortData?.['id'] ===key &&
                            <Icon icon="angle-down" style={{marginLeft:"2px",pointerEvents: 'none'}}></Icon>}

                    </th>
        }return null
    }
    const handleSortColumn = (e:React.MouseEvent<HTMLTableHeaderCellElement>,isUp:boolean) => {
        console.log((e.target as HTMLTableHeaderCellElement).dataset.sort)
        const sortKey=(e.target as HTMLTableHeaderCellElement).dataset.id
        const sortType=(e.target as HTMLTableHeaderCellElement).dataset.sort
        if(sortKey){
            const sortedData = [...search].sort((a, b) => {
                // Ensure the values being compared are numbers, or handle as needed
                if(sortType==="number")
                    return isUp?Number(b[sortKey]) - Number(a[sortKey]):Number(a[sortKey]) - Number(b[sortKey]);
                else if(sortType==="date")
                    return isUp?new Date(b[sortKey]).getTime() - new Date(a[sortKey]).getTime():new Date(a[sortKey]).getTime() - new Date(b[sortKey]).getTime();
                else if(sortType==="array")
                    return isUp?b[sortKey].toString().split(",").length - a[sortKey].toString().split(",").length:a[sortKey].toString().split(",").length - b[sortKey].toString().split(",").length ;
                else
                    return isUp?a[sortKey].localeCompare(b[sortKey], 'zh-CN'):b[sortKey].localeCompare(a[sortKey], 'zh-CN')

            });
            setSortData({type:isUp?"down":"up",id:sortKey})
            setSearch(sortedData);
            
        }
        
    }
    const headers = Object.keys(tableColumns)
    const handleDoubleClick = (id: number, key:string) => {
        const filteredResult = result?.filter((res: Iobject) => res['docId'] === id);
        
        if(filteredResult!==undefined && filteredResult.length>0){
            const result_ = findColumnByLabel(tableColumns, key);
            if(result_!==undefined)
                console.log(`Row with id ${(filteredResult[0] as Iobject)[key]} was double-clicked`);
        }
        
        // 你可以在这里执行其他操作，例如显示编辑界面或弹出窗口
      };
    const createForm = () => {
        if(currentItem!==undefined){
            return Object.keys(currentItem).map((key,index)=>{
                const result_ = findColumnByLabel(tableColumns, key);
                if(result_!==undefined){
                    return {renderedItems}
                }
                return null;
            })
        }
        return null
        
    }
    const onTagAdded = (added:OptionType,key:string,item:Iobject)=>{
        console.log("added tags",added);
        const newAdded={id:added.value,name:added.label,freq:1,isDisabled:0}
        const itemValues=item[key]!==undefined && item[key].length>0?item[key].split(","):[]
        itemValues.push(added.label)
        const updatedItem = { ...currentItem, [key]: itemValues.join(', ')};
        console.log(updatedItem);
        setCurrentItem(updatedItem);

        setTags(tags?tags.concat(newAdded):[newAdded])
        setTagsToAdd(tagsToAdd?tagsToAdd.concat(newAdded):[newAdded])


    }
    const onTextChanged = (e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>,key:string,item:Iobject)=>{
        const updatedItem = { ...item, [key]: e.target.value };
        setCurrentItem(updatedItem);
    }
    const onDeleted = async() => {
        try {
            const userResponse = await showDialogHandler("确定删除操作吗？")
            if (userResponse) {
                console.log('User confirmed');
                if(currentItem){
                    fetch("http://"+serverIp+":"+serverPort+"/saveData",{
                        headers:{
                          'Content-Type': 'application/json'
                        },
                        method: 'POST',
                        body: JSON.stringify({ type: 'mssql',query:`
                          UPDATE documents_list 
                          SET isDisabled = 1, modifiedTime = N'${new Date().toISOString()}'
                          WHERE docId = ${currentItem.docId}
                          `})
                      })
                      .then(response => response.json())
                      .then(data => {
                          console.log("saveData",data)
                          
                          setCurrentItem(undefined)
                          setReload?.(new Date().getTime()/1000)
                          showMessage(data.data.rowsAffected.length>0?"删除完成":"删除失败")

                      })
                }
            } else {
                console.log('User canceled');
            }
        } catch (error) {
            console.error('Dialog was dismissed', error);
        }
        
        
    }
    const onSubmited = () => {
        const updatedItem:Iobject = { ...currentItem, ['modifiedTime']: new Date().toISOString() };
        var values:string[]=[];
        var keys:string[]=[];
        var values_keys:string[]=[]
        var source_key:string[]=[];

        Object.keys(updatedItem).forEach(k=>{
            if(k!=="id"){
                values.push(
                    k==="docId"||k==="categoryId"||k==="projectId"||k==="locationId"||k==="isDisabled"?
                    (k==="isDisabled"?0:updatedItem[k])
                    :
                    "N'"+updatedItem[k]+"'")
                keys.push(k)
                values_keys.push(`${k} = source.${k}`)
                source_key.push(`source.${k}`)
            }
        })
        console.log('query',`
        MERGE INTO documents_list AS target
        USING (VALUES (${values.join(", ")})) AS source (${keys.join(", ")})
        ON target.docId = source.docId
        WHEN MATCHED THEN
            UPDATE SET ${values_keys.join(", ")}
        WHEN NOT MATCHED THEN
            INSERT (${values.join(", ")})
            VALUES (${source_key.join(", ")});
        `,updatedItem)
        fetch("http://"+serverIp+":"+serverPort+"/saveData",{
          headers:{
            'Content-Type': 'application/json'
          },
          method: 'POST',
          body: JSON.stringify({ type: 'mssql',query:`
            MERGE INTO documents_list AS target
            USING (VALUES (${values.join(", ")})) AS source (${keys.join(", ")})
            ON target.docId = source.docId
            WHEN MATCHED THEN
                UPDATE SET ${values_keys.join(", ")}
            WHEN NOT MATCHED THEN
                INSERT (${keys.join(", ")})
                VALUES (${source_key.join(", ")});
            `})
        })
        .then(response => response.json())
        .then(data => {
            console.log("saveData",data)
            showMessage(data.data.rowsAffected.length>0?"执行完成":"执行失败")
        })
        if(files && files.length>0){
            const formData = new FormData();
            formData.append('folder', updatedItem["docId"]);
            files.forEach(file => {
                formData.append('files', file);
            });
            try {
                fetch(`http://${serverIp}:${serverPort}/uploadFiles`, {
                    method: 'POST',
                    body: formData,
                }).then(r=>console.log(r));
            } catch (error) {
                console.error('Error:', error);
            }
        }
        if(tagsToAdd!==undefined && tagsToAdd.length>0){
            var queries:string[]=[]
            tagsToAdd?.forEach(tag=>{
                values=[];
                keys=[];
                values_keys=[]
                source_key=[];
                Object.keys(tag).forEach(k=>{
                    
                        values.push(k==="id"||k==="freq"||k==="isDisabled"?tag[k]:"N'"+tag[k]+"'")
                        keys.push(k)
                        if(k!=='id') values_keys.push(`${k} = source.${k}`)
                        source_key.push(`source.${k}`)
                    
                })
                queries.push(`
                MERGE INTO tags AS target
                USING (VALUES (${values.join(", ")})) AS source (${keys.join(", ")})
                ON target.id = source.id
                WHEN MATCHED THEN
                    UPDATE SET ${values_keys.join(", ")}
                WHEN NOT MATCHED THEN
                    INSERT (${keys.join(", ")})
                    VALUES (${source_key.join(", ")});
                `)
            })
            console.log(queries.join(" "))
            fetch("http://"+serverIp+":"+serverPort+"/saveData",{
              headers:{
                'Content-Type': 'application/json'
              },
              method: 'POST',
              body: JSON.stringify({ type: 'mssql',query:queries.join(" ")})
            })
            .then(response => response.json())
            .then(data => {
                
                setTagsToAdd([])
                console.log("saveData tags",data)
                
                
            })
        }
        
        if(result!==undefined){
            setResult(result.map((item) => (item['docId'] === updatedItem['docId'] ? updatedItem : item)))
            setSearch(search.map((item) => (item['docId'] === updatedItem['docId'] ? updatedItem : item)))
        }else{
            setResult([updatedItem])
            setSearch([updatedItem])
        }

        console.log(currentItem,updatedItem)
    }
    const getValuesFromLabels = (labels:string,columnData:ColumnData)=>{
        return labels.split(",").map((ik:String)=>{
            const matched = columnData.data.find(d=>d.label===ik.trim());
            if(matched!==undefined) return matched.value
        }).filter((itm:String) => itm !== undefined)
    }
    const getValues = (values:string,columnData:ColumnData) => {
        return values?(values.constructor===String?getValuesFromLabels(values,columnData):[values]):(columnData.value?columnData.value:[])
    }

    const getItem = async (columnData: ColumnData, key: string, item: Iobject): Promise<JSX.Element> => {
        const width = 300;
        if (columnData.type === "text") {
          return <Input style={{ width: width, margin: "5px 0px 5px 10px" }} type='text' name={key} value={item[key]} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { onTextChanged(e, key, item) }} />;
        } else if (columnData.type === "textarea") {
          return <textarea className="gr-textarea" style={{ width: width, margin: "5px 0px 5px 10px" }} name={key} value={item[key]} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => { onTextChanged(e, key, item) }} />;
        } else if (columnData.type === "combobox" || columnData.type === 'multiCombobox') {
          console.log(item[key], item[key].constructor, item[key].constructor === String ? getValuesFromLabels(item[key].toString(), columnData) : item[key]);
          return <Dropdown
            defaultValues={getValues(item[key], columnData)}
            style={{ width: width, display: "inline-block", margin: "5px 0px 5px 10px", textAlign: 'left' }}
            options={columnData.data ? columnData.data : []}
            isMulti={columnData.type === 'multiCombobox'}
            showDropIndicator={columnData.type === 'multiCombobox'}
            showInput={columnData.type === 'multiCombobox'}
            onChange={(val) => onSelectValueChanged(val, key, item)}
            onAdd={(added) => onTagAdded(added, key, item)}
          ></Dropdown>;
        } else if (columnData.type === "file") {
          const newFiles: File[] = [];
          if (item[key]) {
            const fs = item[key].split(',');
            const filePromises = fs.map(async (f: string) => {
              const ff = await url2File(f,item['docId']);
              console.log("inside loop", ff);
              if (ff) newFiles.push(ff);
            });
            await Promise.all(filePromises);
          }
          console.log("out", newFiles);
          return <div className="form-input-wList-container" key={key} style={{
            display: "grid", width: width, margin: "5px 0px 5px 10px", textAlign: "left",
            //pointerEvents: "none",opacity: "0.6" 
          }}>
            {newFiles.length > 0 ? (<ul ref={fileListRef} style={{ paddingLeft: "0", overflowY: "auto", maxHeight: "100px" }}>
              {newFiles.map((itm: File, index: number) => <li key={index} style={{ display: "grid", gridTemplateColumns: "1fr auto", width: "calc(100%)" }} >
                <label style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} onClick={() => handleFileClick(itm)}>{itm.name}</label>
                <Button className="form-input-wList-delete" style={{ width: "30px", border: "none" }} onClick={(e) =>
                  handleFileDelected(itm)
                }><Icon icon="times" style={{ color: "red" }}></Icon></Button>
              </li>)}
            </ul>) : (<></>)} <Input type="file" className="form-input-wList" multiple
              accept=".xlsx,.docx,.xls,.ppt,.pdf,.png,.gif,.jpeg,.jpg,.zip,txt" onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, item, key)} /></div>;
        }
        return <Input style={{ width: width, margin: "5px 0px 5px 10px" }} type={columnData.type} name={key} value={item[key]} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { onTextChanged(e, key, item) }} />;
      };
    const onSelectValueChanged=(selectedOptions: SingleValue<OptionType> | MultiValue<OptionType>,key:string,item:Iobject) => {
        console.log(selectedOptions)
        const updatedItem = { ...item, [key]: Array.isArray(selectedOptions)?selectedOptions.map(option => option.label).join(', '):
            (selectedOptions?(selectedOptions as OptionType).label:"" )};
        console.log(updatedItem);
        setCurrentItem(updatedItem);
    }
    const handleCheckboxChange = (key: string) => {
        setVisibleColumn(prevState =>
          prevState.includes(key)
            ? prevState.filter(column => column !== key)
            : [...prevState, key]
        );
      };
      const customStyles = {
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          width:'100%',
          height:'100%',
          zIndex: 1900,  // Custom z-index for modal content
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          zIndex: 1899,  // Custom z-index for modal overlay
        },
      };
    return (
        <div style={{...style,...{}}}>
            <table>
                <thead>
                    <tr key="header_tr">
                    <th key={"header-index-0"} 
                                className="fixed-pos fixed-1st-th sortable-column"
                                data-id="id"
                                data-sort="number"
                                style={{padding:0,minWidth:50}} onClick={e=>handleSortColumn(e,sortData?.['type']==="up")} >
                            
                            #
                            {sortData?.['type']==="up" && sortData?.['id'] ==='id' &&
                            <Icon icon="angle-up" style={{marginLeft:"2px",pointerEvents: 'none'}}></Icon>
                            }
                            {sortData?.['type']==="down" && sortData?.['id'] ==='id' &&
                            <Icon icon="angle-down" style={{marginLeft:"2px",pointerEvents: 'none'}}></Icon>}
                                </th>
                        {headers.map((item, index) => (
                            setTh(index,item)
                        ))}
                        <th key="action_btns" style={{ width: 50,textAlign:"left"}} className="fixed-pos fixed-last">功能</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedData?.map((item:Iobject, index) => (
                        <tr key={index}>
                            <td key={"index-"+index} 
                                data-index={"index-"+index} className="fixed-pos fixed-1st"
                                style={{padding:0,width:50}}>
                                    {item.id}
                                </td>
                            {headers.map((key, subIndex) => (
                                setTd(subIndex,key,item)
                            ))}
                            <td key={"action_btns_"+index } className="fixed-pos fixed-last"
                                style={{padding:0}}>
                                <Button 
                                style={{margin:5,border:"none",width:"35px"}}
                                hasShadow
                                data-tooltip-id={"table-tooltips"} 
                                data-tooltip-content={'编辑档案'} 
                                onClick={() => openModal(item["docId"])} ><Icon style={{color:"#348a09"}} icon="edit"></Icon></Button></td>
                        </tr>
                    ))}
                </tbody>
                
            </table>
            <Tooltip id='table-tooltips' ref={tooltipRef1} style={{zIndex:1001}}
            //id="table-tooltips"
            ></Tooltip>
            {DialogComponent}
            {message && (
                <MessageBox
                message={message}
                type="success"
                duration={3000}
                onClose={() => setMessage(null)}
                />
            )}
            {hoveredImage && (
                <div className="popupImg" style={{ top: `${position.top}px`,left: `${position.left}px`}}>
                    <span className="close-button" onClick={closePopup}>&times;</span>
                    <img ref={popupRef} src={hoveredImage} alt="Large preview" />
                </div>
            )}
            {currentItem && (
                <div className="modal">
                <div className="modal-content">
                    <span className="close-button" onClick={closeModal}>&times;</span>
                    <div style={{textAlign:"center",fontWeight:700}}>{currentItem['docId']}</div>
                    <div className="modal-form">
                        {renderedItems}
                    </div>
                    <div>
                        <Button style={{marginTop:"20px",width:100,marginRight:"10px"}} btnType="blue" hasShadow={true} onClick={onSubmited}>提交</Button>
                        <Button style={{marginTop:"20px",width:100}} btnType="red" hasShadow={true} onClick={onDeleted}>删除</Button>
                    </div>
                </div>
                </div>
            )}
            {<MPopup isOpen={isPopupOpen} togglePopup={togglePopup} tiggerElement={tableColumnSettingsButn}>
                {tableColumns && <ul className="column-list">{Object.keys(tableColumns).map((key,index)=>(
                    tableColumns[key].isFixed?
                    <></>:
                    <li className="column-list-item" key={index} onClick={() => handleCheckboxChange(key)}>
                        <Input type="checkbox" checked={visibleColumn.includes(key)} onChange={(e) => {
                      e.stopPropagation(); // 阻止事件冒泡
                      handleCheckboxChange(key);
                    }}></Input>{tableColumns[key].label}
                    </li>
                    ))}</ul>}
            </MPopup>}
            {previewContent && (
                <div style={{position:"fixed",zIndex:"1200",top:"0",left:"0",width:"100%",height:"100%",padding:"10px",background:"white" }}>
                    <h3>{selectedFile?.name}</h3>
                    <span className="close-button" style={{position:"fixed",zIndex:"1201",top:"0",right:"10px"}} onClick={()=>setPreviewContent(null)}>&times;</span>
                    <div style={{border:"1px solid #ddd", marginTop:"0px", padding:"3px",width:"100%",height:"calc(100% - 60px)",overflow:"auto"}}
                            dangerouslySetInnerHTML={{ __html: previewContent }}
                        ></div>
                </div>

            )}
            {previewSrc && previewType && (
                <div style={{ position:"fixed",zIndex:"1200",top:"0",left:"0",width:"100%",height:"100%",padding:"10px",background:"white" }}>
                    <h3>{selectedFile?.name}</h3>
                    <span className="close-button" style={{position:"fixed",zIndex:"1201",top:"0",right:"10px"}} onClick={()=>setPreviewSrc(null)}>&times;</span>
                    {previewType.startsWith('image/') && <img src={previewSrc as string} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%' }} />}
                    {previewType === 'application/pdf' && <embed src={previewSrc as string} type="application/pdf" width="100%" height="100%" />}
                    
                </div>
            )}
            <div className="pagination">
                <Button onClick={handlePreviousPage} disabled={currentPage === 1}>
                <Icon icon="angle-left"/>
                </Button>
                <span>
                第 <Input style={{width:"60px"}} type="number" value={goToPage}
            onChange={handleGoToPageChange} onKeyDown={handleGoToPageSubmit} min="1" max={Math.ceil(search.length / itemsPerPage)} /> 页/ {Math.ceil(search.length / itemsPerPage)}
                </span>
                <Button onClick={handleNextPage} disabled={currentPage === Math.ceil(search?.length / itemsPerPage)}>
                <Icon icon="angle-right"/>
                </Button>
                <div style={{display:"inline-block",marginLeft:"10px"}}>
                    <label>
                        每页
                        <Input
                        type="number"
                        value={itemsPerPage}
                        style={{margin:"0px 5px",width:"80px"}}
                        onChange={handleItemsPerPageChange}
                        // onKeyDown={(e) => {
                        //     if (e.key === 'Enter') {
                        //     e.preventDefault();
                        //     handleItemsPerPageChange(e as unknown as React.ChangeEvent<HTMLInputElement>);
                        //     }
                        // }}
                        />
                        项
                    </label>
                </div>
                <Button ref={tableColumnSettingsButn} style={{width:"30px",position:"absolute",right:"10px",transform:"translateY(-50%)",top:"50%"}} 
                    data-tooltip-id="table-tooltips" data-tooltip-content={"表头设置"} onClick={togglePopup}>
                <Icon icon="bars"/>
                </Button>
            </div>
        </div>
        
    );
}

export default MTable;