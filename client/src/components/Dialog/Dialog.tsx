import React, { FC, ReactNode, useState } from 'react';
import Button from '../Button/button';
import Icon from '../Icon/icon';

interface DialogProps {
  title: string;
  message:string|null;
  onConfirm: () => void;
  onCancel: () => void;
}

const Dialog: FC<DialogProps> = ({ title, message, onConfirm, onCancel }) => {

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <div className="dialog-header">
          <div className='dialog-title'><Icon icon={"info-circle"} style={{marginRight:5,color:'green'}}></Icon>{title}</div>
        </div>
        <div className="dialog-content">
            <p>{message}</p>
            <Button onClick={onConfirm} style={{marginRight:10,marginBottom:5,width:100}} btnType="blue">确认</Button>
            <Button onClick={onCancel} style={{marginBottom:5,width:100}} >取消</Button>
        </div>
      </div>
    </div>
  );
};
export const useDialog = () => {
  const [dialogMessage, setDialogMessage] = useState<string | null>(null);
  const [dialogPromise, setDialogPromise] = useState<{ resolve: (value: boolean) => void, reject: () => void } | null>(null);

  const handleConfirm = () => {
    if (dialogPromise) {
      dialogPromise.resolve(true);
    }
    setDialogMessage(null);
  };

  const handleCancel = () => {
    if (dialogPromise) {
      dialogPromise.resolve(false);
    }
    setDialogMessage(null);
  };

  const showDialog = (mesg: string | null) => {
    setDialogMessage(mesg);
    return new Promise<boolean>((resolve, reject) => {
      setDialogPromise({ resolve, reject });
    });
  };

  const DialogComponent = dialogMessage && (
    <Dialog
      title="消息"
      message={dialogMessage}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return {
    showDialog,
    DialogComponent
  };
};
export default Dialog;