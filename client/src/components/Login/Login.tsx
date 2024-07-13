import React, { useEffect, useState } from 'react';
import Input from '../Input/input';
import Button from '../Button/button';
import { serverIp, serverPort } from '../../utils/config';
import CryptoJS from 'crypto-js';

import { useNavigate,useLocation } from 'react-router-dom';

const keyStr = 'it@glory.com'
const ivStr = 'it@glory.com'
interface FormState {
  username: string;
  password: string;
}
function encrypt(data: string, keyS?: string, ivS?: string): string {
  const key = CryptoJS.enc.Utf8.parse(keyS || keyStr);
  const iv = CryptoJS.enc.Utf8.parse(ivS || ivStr);
  const src = CryptoJS.enc.Utf8.parse(data);
  
  const cipher = CryptoJS.AES.encrypt(src, key, {
    iv: iv, // Initialization vector
    mode: CryptoJS.mode.CBC, // Encryption mode
    padding: CryptoJS.pad.Pkcs7, // Padding
  });
  
  const encrypted = cipher.toString();
  return encrypted;
}
const Login: React.FC = () => {
  const [form, setForm] = useState<FormState>({
    username: '',
    password: '',
  });

  const location = useLocation();
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [warning, setWarning] = useState<string|null>(null);
  //const [submitted, setSubmitted] = useState(false);
  const queryParams = new URLSearchParams(location.search);
  const user = queryParams.get('user');
  const token = queryParams.get('token');
  console.log("user",user,"token",token)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setErrors({
        ...errors,
        [name]: undefined
      });
    setForm({
      ...form,
      [name]: value
    });
  };

  const validate = () => {
    const newErrors: Partial<FormState> = {};
    if (!form.username) newErrors.username = 'Username is required';
    //if (!form.userFullname) newErrors.userFullname = 'Full name is required';
    if (!form.password) newErrors.password = 'Password is required';
    return newErrors;
  };
  const navigate = useNavigate();
  useEffect(() => {
    if(token!==null && token==="G5xEcmNCRnJ3Cxv7VEh2Xw=="){
      const query=`select * from user_list where userName = N'${user}' AND isDisabled = 0;`
        console.log("saveData",query)
        setWarning(null)
        fetch("http://"+serverIp+":"+serverPort+"/getData",{
          headers:{
            'Content-Type': 'application/json'
          },
          method: 'POST',
          body: JSON.stringify({ type: 'mssql',query:query})
        })
        .then(response => response.json())
        .then(data => {
            console.log("saveData",data,query,data.data.recordset.length)
            if(data.data.recordset.length>0){
              console.log('Form submitted successfully', form);
              navigate('/');
            }else{
              navigate('/login');
              setWarning("账户有问题，请与管理员联系!")
            }
  
        })
    }else{
      if(user!==null){

        navigate('/login');
        setWarning("账户有问题，请与管理员联系!")
      }
    }
  }, []);
  
  const handleSubmit = (e: React.FormEvent) => {
    
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
    } else {
      console.log("handleSubmit")
      setErrors({});
      //setSubmitted(true);
      const query=`select * from user_list where userName = N'${form.username}' AND pass = N'${encrypt(form.password)}' AND isDisabled = 0;`
      console.log("saveData",query)
      setWarning(null)
      fetch("http://"+serverIp+":"+serverPort+"/getData",{
        headers:{
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({ type: 'mssql',query:query})
      })
      .then(response => response.json())
      .then(data => {
          console.log("saveData",data,query,data.data.recordset.length)
          if(data.data.recordset.length>0){
            console.log('Form submitted successfully', form);
            navigate('/');
          }else{
            setWarning("用户名不存在或和密码不匹配!")
          }

      })
      
      // Handle form submission, e.g., send data to server
    }
  };

  return (
    <div className='login-container'>
        <h4>档案归档</h4>
        {warning && <p style={{color:"red",marginTop:"20px",marginBottom:"-20px"}}>{warning}</p>}
      <form className="form-user-login" onSubmit={handleSubmit}>
        <div className='form-item-container'>
          <label><span style={{color:"red"}}>*</span>用户名</label>
          <Input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            style={errors.username?{boxShadow:"0 0px 4px rgba(206, 0, 0, 0.8)"}:{}}
          />
        </div>
        <div className='form-item-container'>
          <label><span style={{color:"red"}}>*</span>密码</label>
          <Input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            style={errors.password?{boxShadow:"0 0px 4px rgba(206, 0, 0, 0.8)"}:{}}
          />
        </div>
        <Button className='form-submiter' type="submit" btnType="green">登录</Button>
      </form>
    </div>
  );
};

export default Login;