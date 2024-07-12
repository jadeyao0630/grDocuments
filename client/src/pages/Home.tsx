import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DBLoader from '../utils/DBLoader/DBLoader';
import { DBLoaderContextType } from '../utils/DBLoader/DBLoaderContext';
import SearchBar from '../components/SearchBar/SearchBar';
import MTable from '../components/MTable/MTable';
import Header from '../components/Header/header';
import HeaderMenuItem from '../components/Header/HeaderMenuItem';
import FileUpload from '../components/FileUpload/FileUpload';
import UserRegister from '../components/Register/UserRegister';
import Dropdown, { OptionType } from '../components/Select/Dropdown';
import Button from '../components/Button/button';
import Input from '../components/Input/input';
import Icon from '../components/Icon/icon';

import { Tooltip } from 'react-tooltip';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { serverIp, serverPort, tableColumns } from '../utils/config';
import { formatDate } from '../utils/utils';
import { useDialog } from '../components/Dialog/Dialog';

interface HomeProps {
  showMessage: (message: string | null) => void;
}

const Home: React.FC<HomeProps> = ({ showMessage }) => {
  const [showPopup, setShowPopup] = useState<string | undefined>(undefined);
  const [optionData, setOptionData] = useState<any>({ projects: [], tags: [], locations: [], categories: [] });
  const [optionOriginalData, setOptionOriginalData] = useState<any>({ projects: [], tags: [], locations: [], categories: [] });
  const [data, setData] = useState<DBLoaderContextType>();
  const [optionIndex, setOptionIndex] = useState<string>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [tableMarginTop, setTableMarginTop] = useState(98);
  const [dialogMessage, setDialogMessage] = useState<string | null>(null);
  const { DialogComponent, showDialog: showDialogHandler } = useDialog();


  const scrollableContainerRef = useRef<HTMLUListElement>(null);
  const navigate = useNavigate();

  const onFilterChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (optionIndex) {
      setOptionData({
        ...optionData,
        [optionIndex]: optionData[optionIndex].map((d: any) => ({ ...d, isHide: e.target.value.length > 0 && !d.name.includes(e.target.value) }))
      });
    }
  };

  const MenuItemClicked = async (e: React.MouseEvent<HTMLAnchorElement>, data: DBLoaderContextType) => {
    e.preventDefault();
    if (e.currentTarget.dataset.name === "import" || e.currentTarget.dataset.name === "register" || e.currentTarget.dataset.name === "options") {
      setShowPopup(e.currentTarget.dataset.name);
      if (e.currentTarget.dataset.name === "options") {
        const optionList: any = { projects: [], tags: [], locations: [], categories: [] };
        const { projects, tags, locations, categories } = data;
        setData(data);
        optionList.projects = projects;
        optionList.tags = tags;
        optionList.locations = locations;
        optionList.categories = categories;
        setOptionData(optionList);
        setOptionOriginalData(optionList);
      }
    } else if (e.currentTarget.dataset.name === "export") {
      const userResponse = await showDialogHandler("确认导出吗？");
      if (userResponse) {
        const { search } = data;
        const fileName = "export_" + formatDate(new Date());
        if (search) {
          const formatSearch = search.map((item: any) => {
            const newItem: any = {};
            Object.keys(item).forEach(key => {
              if (tableColumns.hasOwnProperty(key) && tableColumns[key].canBeExport) {
                newItem[tableColumns[key].label] = tableColumns[key].type === "date" ? new Date(item[key]) : item[key];
              }
            });
            return newItem;
          });
          const wscols = Object.keys(formatSearch[0]).map(key => {
            const maxLength = Math.max(
              ...formatSearch.map(item => item[key].toString().length),
              key.length
            );
            return { wch: maxLength + 4 }; // Add extra space for padding
          });
          const worksheet = XLSX.utils.json_to_sheet(formatSearch);
          worksheet['!cols'] = wscols;
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, '档案');
          const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
          const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
          saveAs(blob, `${fileName}.xlsx`);
        }
      }
    } else if (e.currentTarget.dataset.name === "logout") {
      navigate('/login');
    }
  };

  const getMaxIdItem = (items: any[]): any | undefined => {
    return items.reduce((max, item) => (item.id > max.id ? item : max), items[0]);
  };

  const handleAddItem = (key: string) => {
    const lastItem = getMaxIdItem(optionData[key]);
    if (lastItem !== undefined) {
      optionData[key].push({ ...lastItem, name: "", id: lastItem.id + 1, isNew: true });
      setOptionData((opt: any) => ({ ...opt, [key]: optionData[key] }));
      setTimeout(() => {
        const scrollableContainer = scrollableContainerRef.current;
        if (scrollableContainer) {
          scrollableContainer.scrollTop = scrollableContainer.scrollHeight;
        }
      }, 500);
    }
  };

  const handleInputChange = (key: string, index: number, value: string) => {
    const newOptionData = optionData[key].map(((opt: any, idx: number) => (
      idx === index
        ? { ...opt, name: value }
        : opt
    )));
    setOptionData((opt: any) => ({ ...opt, [key]: newOptionData }));
  };

  const processSubmitSave = (key: string, index: number, data: DBLoaderContextType, setStatus: boolean) => {
    const { projects, categories, locations, setReload } = data;
    let sourceData: any[] | undefined = [];
    if (key === "categories") {
      sourceData = categories;
    } else if (key === "locations") {
      sourceData = locations;
    } else if (key === "projects") {
      sourceData = projects;
    }
    if (sourceData !== undefined) {
      const editItem = optionData[key][index];
      const matched = sourceData.find(d => d.id === editItem.id);
      let query = "";
      if (!setStatus) {
        const keys: string[] = [];
        const values: string[] = [];
        const keys_values: string[] = [];
        Object.keys(editItem).forEach(key => {
          if (key !== "id" && key !== "isNew") {
            keys.push(key);
            const val = key === "isDisabled" ? editItem[key] ? "1" : "0" : `N'${editItem[key]}'`;
            values.push(val);
            keys_values.push(`${key}=${val}`);
          }
        });
        if (editItem.isNew) {
          query = `INSERT INTO ${key} (${keys.join(", ")}) VALUES (${values.join(",")});`;
        } else {
          if (matched !== undefined) {
            query = `UPDATE ${key} SET ${keys_values.join(",")} WHERE id=${matched.id}; UPDATE documents_list SET category = N'${editItem.name}' WHERE category=N'${matched.name}';`;
          } else {
            query = `INSERT INTO ${key} (${keys.join(", ")}) VALUES (${values.join(",")});`;
          }
        }
      } else {
        query = `UPDATE ${key} SET isDisabled = ${editItem?.isDisabled ? 0 : 1} WHERE id=${matched?.id}`;
        const newOptionData = optionData[key].map(((opt: any, idx: number) => (
          idx === index
            ? { ...opt, isDisabled: !editItem?.isDisabled }
            : opt
        )));
        setOptionData((opt: any) => ({ ...opt, [key]: newOptionData }));
      }

      fetch(`http://${serverIp}:${serverPort}/saveData`, {
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({ type: 'mssql', query: query })
      })
        .then(response => response.json())
        .then(data => {
          setReload?.(new Date().getTime() / 1000);
          showMessage(data.data.rowsAffected.length > 0 ? "执行完成" : "执行失败");
        });
    }
  };

  const saveChanges = (key: string, index: number, setStatus: boolean = false) => {
    if (data !== undefined && optionData !== undefined) {
      processSubmitSave(key, index, data, setStatus);
      if (!setStatus) {
        setOptionOriginalData((opt: any) => ({
          ...opt, [key]: opt[key].map((op: any, id: number) => (
            id === index
              ? optionData[key][index]
              : op
          ))
        }));
      }
    }
  };

  let PopupContent = (<></>);
  if (showPopup === "import") {
    PopupContent = (
      <div style={{ display: "inline-grid", gridTemplateRows: "auto auto 1fr" }} className={isProcessing ? "disabled" : ""}>
        <h4 style={{ marginBottom: "20px", marginTop: "10px" }}>导入数据</h4>
        <span className="close-button" onClick={() => { setShowPopup(undefined); }}>&times;</span>
        <div style={{ margin: "40px 0px" }}>
          <FileUpload onCompleted={(isCompleted) => {
            if (data !== undefined) {
              const { setReload } = data;
              setReload?.(new Date().getTime() / 1000);
            }
            setIsProcessing(!isCompleted);
          }} />
        </div>
      </div>
    );
  } else if (showPopup === "register") {
    PopupContent = (
      <div style={{ display: "inline-grid", gridTemplateRows: "auto auto 1fr", width: "100%" }} className={isProcessing ? "disabled" : ""}>
        <h4 style={{ marginBottom: "10px", marginTop: "10px" }}>注册用户</h4>
        <span className="close-button" onClick={() => { setShowPopup(undefined); }}>&times;</span>
        <div style={{ margin: "20px 20px" }}>
          <UserRegister />
        </div>
      </div>
    );
  } else if (showPopup === "options") {
    PopupContent = (
      <div style={{ display: "inline-grid", gridTemplateRows: "auto auto 1fr", width: "100%" }} className={isProcessing ? "disabled" : ""}>
        <h4 style={{ marginBottom: "10px", marginTop: "10px" }}>编辑选项</h4>
        <span className="close-button" onClick={() => { setOptionIndex(undefined); setShowPopup(undefined); }}>&times;</span>
        <div style={{ margin: "20px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center" }}>
            <Dropdown
              style={{ margin: "5px 0px 5px 5px", textAlign: 'left' }}
              options={[
                { label: "项目", value: "projects" },
                { label: "分类", value: "categories" },
                { label: "位置", value: "locations" }
              ]}
              isMulti={false}
              isClearable={false}
              showDropIndicator={true}
              showInput={false} onChange={(e) => {
                if (e !== null)
                  setOptionIndex((e as OptionType).value);
              }} />
            <Button data-tooltip-id='main-tooltips' data-tooltip-content={"添加选项"} style={optionIndex ? { color: "#1362B7", height: "35px", width: "35px", marginLeft: "5px" } : { display: "none" }} onClick={(e) => {
              if (optionIndex !== undefined) handleAddItem(optionIndex);
            }}><Icon icon={"plus"}></Icon></Button>
          </div>
          {optionData && optionIndex && optionData[optionIndex] &&
            <>
              <Input type='search' style={{ marginTop: "10px", width: "calc( 100% - 5px)" }} onChange={onFilterChanged}></Input>
              <ul ref={scrollableContainerRef} style={{ overflowY: "auto", maxHeight: "200px", marginTop: "10px" }}>
                {optionData[optionIndex].map((opt: any, idx: number) => (
                  !opt.isHide && <li key={idx} style={{
                    display: "grid", gridTemplateColumns: "1fr auto auto auto", marginTop: "5px", alignItems: "center", textAlign: "left", border: "1px solid #ddd", paddingLeft: "10px", borderRadius: "5px", marginLeft: "-28px",
                    ...(optionOriginalData[optionIndex].length - 1 === idx ? { marginBottom: "5px" } : {})
                  }}>
                    <Input type="text" style={{ border: "none", boxShadow: "none", ...opt.isDisabled ? { color: "grey" } : {} }} value={opt.name} onChange={(e) => {
                      handleInputChange(optionIndex, idx, (e.currentTarget as HTMLInputElement).value);
                    }} />
                    <Button data-tooltip-id='main-tooltips' data-tooltip-content={"保存修改"} style={optionOriginalData[optionIndex][idx] && optionOriginalData[optionIndex][idx].name === opt.name ? { display: "none" } : { color: "green", border: "none", boxShadow: "none" }}
                      onClick={() => saveChanges(optionIndex, idx)}><Icon icon={"check"}></Icon></Button>
                    <Button data-tooltip-id='main-tooltips' data-tooltip-content={opt.isDisabled ? "恢复选项" : "禁用选项"} btnType={opt.isDisabled ? "green-r" : "red"} onClick={() => saveChanges(optionIndex, idx, true)} style={{ border: "none", boxShadow: "none" }}><Icon icon={opt.isDisabled ? "sync" : "times"}></Icon></Button>
                  </li>
                ))}
              </ul></>}
        </div>
        <Tooltip id='main-tooltips' style={{ zIndex: 1001 }} />
      </div>
    );
  }

  return (
    <div>
      <Header title="档案归档" isMenuOpen={false}>
        <HeaderMenuItem items={[
          { icon: "file-export", label: "导出数据", color: "#1362B7", id: "export", onClicked: MenuItemClicked },
          { icon: "upload", label: "导入数据", color: "#348a09", id: "import", onClicked: MenuItemClicked },
          { icon: "list-alt", label: "编辑选项", color: "#d63384", id: "options", onClicked: MenuItemClicked },
          { icon: "sign-out", label: "退出", color: "red", id: "logout", onClicked: MenuItemClicked }
        ]} />
      </Header>
      <SearchBar onSizeChanged={setTableMarginTop} />
      <MTable style={{ marginTop: tableMarginTop }} />
      {showPopup &&
        <div className="popup-background">
          <div className='popup-panel'>
            {PopupContent}
          </div>
        </div>}
        {DialogComponent}
    </div>
  );
};

export default Home;
