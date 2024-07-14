import React, { useState, useRef, useEffect, ReactNode } from 'react';


interface PopupProps {
  children?:ReactNode
  isOpen: boolean;
  togglePopup: () => void;
  tiggerElement:React.RefObject<HTMLElement>;
  style?:React.CSSProperties
}

const MPopup: React.FC<PopupProps> = ({ isOpen, togglePopup, children,tiggerElement,style }) => {
  //const [isOpen, setIsOpen] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const calculatePosition=()=>{
    if (isOpen && tiggerElement.current && containerRef.current) {
      const buttonRect = tiggerElement.current.getBoundingClientRect();
      const conatiner = containerRef.current?.getBoundingClientRect()
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      let top = buttonRect.top - conatiner.height-10; // 假设弹出窗口的高度为100px
      let left = buttonRect.left-10;

      // 检查顶部空间
      if (top < 0) {
        top = buttonRect.bottom;
      }

      // 检查右侧空间
      if (left + conatiner.width > viewportWidth) { // 假设弹出窗口的宽度为200px
        left = viewportWidth - conatiner.width-10;
      }

      setPopupPosition({ top, left });
    }
  }
  useEffect(() => {
    calculatePosition()
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        togglePopup();
      }
    };
    //document.addEventListener('mousedown', handleClickOutside);
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, togglePopup]);

  const popupStyle = {
    top: `${popupPosition.top}px`,
    left: `${popupPosition.left}px`,
  };

  return (
    <>
      {isOpen && (
        <div className="mpopup" style={{...style,...popupStyle}} ref={containerRef}>
          <div className="mpopup-content">
            {children}
          </div>
        </div>
      )}
    </>
  );
};

export default MPopup;