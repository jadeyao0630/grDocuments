import React, { FC,useState, useEffect, useRef } from "react";
import { useDBload } from "../../utils/DBLoader/DBLoaderContext";
import { Iobject } from "../MTable/MTable";
import Input from "../Input/input";
import InputWrapper from "../Input/InputWrapper";
import Dropdown, { OptionType } from "../Select/Dropdown";
import { MultiValue, SingleValue } from "react-select";
import Button from "../Button/button";
import {ColumnData,tableColumns} from "../../utils/config"

export interface ISearchBarProps {
    className?: string;
    onSizeChanged?: (size: number) => void;
}
const SearchBar: FC<ISearchBarProps> = (props) => {
    const { className,onSizeChanged } = props;
    const { result,setSearch,tags,setTags,projects,locations,categories } = useDBload();
    const [_tags,_setTags] = useState<OptionType[]>([]);
    const [selected,setSelected] = useState<SingleValue<OptionType> | MultiValue<OptionType>>([]);
    
    const [selectedProj,setSelectedProj] = useState<SingleValue<OptionType> | MultiValue<OptionType>>([]);
    const [selectedCate,setSelectedCate] = useState<SingleValue<OptionType> | MultiValue<OptionType>>([]);
    const [selectedLoca,setSelectedLoca] = useState<SingleValue<OptionType> | MultiValue<OptionType>>([]);
    const self = useRef<HTMLDivElement>(null);
    const delay = 300;
    const isOptionType = (option: any): option is OptionType => {
      return option && typeof option.label === "string" && typeof option.value === "string";
    };
    const _searchChange = (selectedOptions: SingleValue<OptionType> | MultiValue<OptionType>)=>{
        console.log("_searchChange",selectedOptions)
        setSelected(selectedOptions)
        setTimeout(()=>onSizeChanged?.(self.current?self.current.clientHeight:48),delay)
    }
    const _projChange = (selectedOptions: SingleValue<OptionType> | MultiValue<OptionType>)=>{
      console.log("_projChange",selectedOptions)
      console.log(self?.current?.clientHeight);
      setSelectedProj(selectedOptions)
      setTimeout(()=>onSizeChanged?.(self.current?self.current.clientHeight:48),delay)
      
    }
    const _cateChange = (selectedOptions: SingleValue<OptionType> | MultiValue<OptionType>)=>{
      console.log("_cateChange",selectedOptions)
      setSelectedCate(selectedOptions)
      setTimeout(()=>onSizeChanged?.(self.current?self.current.clientHeight:48),delay)
      
    }
    const _locaChange = (selectedOptions: SingleValue<OptionType> | MultiValue<OptionType>)=>{
      console.log("_locaChange",selectedOptions)
      setSelectedLoca(selectedOptions)
      setTimeout(()=>onSizeChanged?.(self.current?self.current.clientHeight:48),delay)
      
    }
    
    const onTagAdded = (added: OptionType)=>{
      //_searchChange([added])
      const newAdded:Iobject={id:added.value,name:added.label,freq:1,isDisabled:0}
      if(tags!==undefined && tags.length>0){
        setTags([...tags, newAdded])
      }else{
        setTags([newAdded])
      }
    }
    const convertSelected = (selected:SingleValue<OptionType> | MultiValue<OptionType>) => {
      return selected?
              (
                Array.isArray(selected)?
                  selected
                  :
                  [selected]
              )
                :
              []
    }
    const isIncludes = (source:Array<OptionType>,target:string,valueId:string) =>{
      return source.length>0?
              source.filter(s=>(target.length>0 && s.label.toLowerCase().includes(target.toLowerCase())) || (Number(valueId)>-1 && s.value.toString().toLowerCase().includes(valueId.toString().toLowerCase()))).length>0
              :
              true
    }
    const onSearchClicked =()=>{
      console.log(selectedProj,typeof(selectedProj),selectedProj?.constructor)
      const searchList:Iobject={project:convertSelected(selectedProj),category:convertSelected(selectedCate),location:convertSelected(selectedLoca)}
      var searchResult:Iobject[]|undefined=[]
      if(searchList!==null){
        console.log(searchList)
        searchResult=result?.filter(res=>{
          return isIncludes(searchList.project,res.project,res.projectId) && 
                  isIncludes(searchList.category,res.category,res.categoryId) && 
                  isIncludes(searchList.location,res.location,res.locationId)
        })
      }
      console.log(searchResult)
      //setSearch(searchResult!==undefined?searchResult:(result?result:[]));
      var _selected:string[]=[];
      if(selected===null || (Array.isArray(selected) && selected.length===0) || (isOptionType(selected) && (selected as OptionType).label.length===0)) {
        setSearch(searchResult?searchResult:[])
        return;
      }
      if(searchResult==undefined || searchResult?.length===0){
        searchResult=result
      }
      if(Array.isArray(selected)){
        _selected = selected.map(opt=>opt.label.toLowerCase())
        //const searchStr = element.value.toLowerCase(); // Convert search string to lowercase for case-insensitive search
          
      }else{
        _selected=[(selected as OptionType).label.toLowerCase()]
      }
      
      
      const filteredResult = searchResult?.filter((res: Iobject) => {
        var allTags:string[]=[]
        Object.keys(res).forEach(key => {
          if(tableColumns[key] && tableColumns[key].isFilterable){
            //console.log(key,res[key])
            if(key==="description"){
              
              allTags = [...allTags,...(res[key].split(",").map((tag:string)=>tag.trim().toLowerCase()))]
            }if(key==="docId"){
              allTags = [...allTags,res[key].toString()]
            }else
              allTags = [...allTags,res[key]]
          }
          
        })
        //console.log(_selected,allTags)
        return _selected.every(selectedItem => allTags.find(tag=>tag!==null &&tag.length>0 && tag.toString().includes(selectedItem)) !== undefined);
        // return Object.keys(res).some((key) => {
        //   const value = res[key];
        //   console.log("filteredResult",key,value)
        //   if (typeof value === 'string') {
        //     if(Array.isArray(_selected))
        //       return _selected.find((sel)=>value.toLowerCase().includes(sel))!==undefined; // Convert value to lowercase for case-insensitive search
        //     else{
        //       return value.toLowerCase().includes(_selected); // Convert value to lowercase for case-insensitive search
        //     }
        //   }
        //   return false;
        // });
      });
      //console.log(_selected,searchResult,filteredResult)
      if (filteredResult === undefined) {
        setSearch([]);
      } else {
        setSearch(filteredResult);
      }
    }
    
    useEffect(() => {
      //console.log("tags1",tags)
      _setTags(tags?tags.map((data) => ({
        label: data.name,
        value: data.id.toString()
      })):[])
    },[tags])
    //console.log("tags",tags,_tags)
    return <div ref={self} style={{display:"flex",width:"100%",position:"fixed",top:"49px",background:"white",zIndex:"999"}}>
                <Dropdown 
                  style={{margin:"5px 0px 5px 5px",textAlign:'left',width:"30%"}}
                  options={projects?projects.filter((data)=>Number(data.isDisabled)===0).map((data) => ({
                    label: data.name,
                    value: data.id.toString()
                  })):[]}
                  isMulti={true}
                  showDropIndicator={true}
                  showInput={true}
                  onChange={_projChange}
                  placeholder="请选择项目"
                ></Dropdown>
                <Dropdown 
                  style={{margin:"5px 0px 5px 5px",textAlign:'left',width:"30%"}}
                  options={categories?categories.filter((data)=>Number(data.isDisabled)===0).map((data) => ({
                    label: data.name,
                    value: data.id.toString()
                  })):[]}
                  isMulti={true}
                  showDropIndicator={true}
                  showInput={true}
                  onChange={_cateChange}
                  placeholder="请选择分类"
                ></Dropdown>
                <Dropdown 
                  style={{margin:"5px 0px 5px 5px",textAlign:'left',width:"30%"}}
                  options={locations?locations.filter((data)=>Number(data.isDisabled)===0).map((data) => ({
                    label: data.name,
                    value: data.id.toString()
                  })):[]}
                  isMulti={true}
                  showDropIndicator={true}
                  showInput={true}
                  onChange={_locaChange}
                  placeholder="请选择位置"
                ></Dropdown>
            <div style={{display:"grid",gridTemplateColumns:"1fr auto",width:"34%"}}>
              <Dropdown 
                style={{margin:"5px 0px 5px 5px",textAlign:'left'}}
                options={_tags}
                isMulti={true}
                showDropIndicator={false}
                showInput={true}
                onChange={_searchChange}
                onAdd={onTagAdded}
                placeholder="请输入关键字"
                ></Dropdown>
              <Button style={{margin:5}} btnType="green" onClick={onSearchClicked}>搜索</Button>
          </div>
    </div>
      //<Input type="search" style={{display:'block',margin:'10px'}} onChange={searchChange} autoComplete="off"/>;
            
}
export default SearchBar;