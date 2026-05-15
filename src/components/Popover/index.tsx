// Popover.tsx - 无箭头版本
import React, { useState, useRef } from "react";
import { Popover as TinyPopover } from "react-tiny-popover";
import "./index.css";

export interface PopoverProps {
  children: React.ReactNode;
  content: React.ReactNode;
  trigger?: "click" | "hover";
  clickOutside?: (e: MouseEvent) => void;
  onContentClick?: (e: React.MouseEvent) => void;
  closeAfterClickContent?: boolean;
  stopContentPropagation?: boolean;
  disabled?: boolean;
  className?: string;
  transformMode?: "relative" | "absolute";
  transform?: { top?: number; left?: number } | ((popoverState: any) => { top: number; left: number });
  align?: "start" | "center" | "end"; // 对齐方式
  positions?: Array<"top" | "right" | "bottom" | "left">; // 可选的弹窗位置
  popoverClassName?: string;
  padding?: number;
  enterDelay?: number;
  leaveDelay?: number;
  maxWidth?: number | string;
}

const Popover: React.FC<PopoverProps> = ({
  children,
  content,
  trigger = "click",
  disabled = false,
  className = "",
  popoverClassName = "",
  clickOutside,
  onContentClick,
  padding = 12,
  enterDelay = 100,
  leaveDelay = 200,
  closeAfterClickContent = true,
  stopContentPropagation = false,
  maxWidth = 320,
  ...restProps
}) => {
  const [visible, setVisible] = useState(false);

  // 使用 ref 来存储最新状态，避免闭包问题
  const isHoveringTriggerRef = useRef(false);
  const isHoveringPopoverRef = useRef(false);
  const enterTimeoutRef = useRef<any>(null);
  const leaveTimeoutRef = useRef<any>(null);

  const clearTimeouts = () => {
    if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);
    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
  };

  // 统一的关闭逻辑
  const scheduleClose = () => {
    if (trigger !== "hover") return;
    clearTimeouts();
    leaveTimeoutRef.current = setTimeout(() => {
      // 使用 ref 获取最新值
      if (!isHoveringTriggerRef.current && !isHoveringPopoverRef.current) {
        setVisible(false);
      }
    }, leaveDelay);
  };

  // hover 触发逻辑
  const handleTriggerMouseEnter = () => {
    if (trigger !== "hover" || disabled) return;
    isHoveringTriggerRef.current = true;
    clearTimeouts();
    enterTimeoutRef.current = setTimeout(() => {
      setVisible(true);
    }, enterDelay);
  };

  const handleTriggerMouseLeave = () => {
    if (trigger !== "hover" || disabled) return;
    isHoveringTriggerRef.current = false;
    scheduleClose();
  };

  const handlePopoverMouseEnter = () => {
    if (trigger !== "hover" || disabled) return;
    isHoveringPopoverRef.current = true;
    clearTimeouts();
    // 确保弹窗保持打开
    setVisible(true);
  };

  const handlePopoverMouseLeave = () => {
    if (trigger !== "hover" || disabled) return;
    isHoveringPopoverRef.current = false;
    scheduleClose();
  };

  // click 触发逻辑
  const handleClick = () => {
    if (trigger !== "click" || disabled) return;
    setVisible(!visible);
  };

  const onClickOutside = (e: MouseEvent) => {
    if (trigger === "click") {
      if (clickOutside) clickOutside(e);
      setVisible(false);
    }
  };

  // 处理 children 克隆
  const enhancedChildren = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<any>, {
        onClick: trigger === "click" ? handleClick : undefined,
        onMouseEnter: trigger === "hover" ? handleTriggerMouseEnter : undefined,
        onMouseLeave: trigger === "hover" ? handleTriggerMouseLeave : undefined,
      })
    : children;

  const handleContentClick = (e: React.MouseEvent) => {
    if (onContentClick) onContentClick(e);
    if (closeAfterClickContent) {
      if (stopContentPropagation) {
        e.stopPropagation();
      }
      setVisible(false);
    }
  };
  // 弹窗内容包装
  const popoverContent = React.useMemo(() => {
    return (
      <div
        onClick={handleContentClick}
        onMouseEnter={trigger === "hover" ? handlePopoverMouseEnter : undefined}
        onMouseLeave={trigger === "hover" ? handlePopoverMouseLeave : undefined}
        className={`bg-white rounded-lg shadow-md border border-gray-200 popper-show ${popoverClassName}`}
        style={{
          maxWidth: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth,
        }}
      >
        <div className="p-1 text-sm text-gray-700">{content}</div>
      </div>
    );
  }, [content, trigger, popoverClassName, maxWidth]);

  return (
    <TinyPopover
      isOpen={visible}
      padding={padding}
      onClickOutside={onClickOutside}
      content={popoverContent}
      {...restProps}
    >
      <div className={`popover-trigger`}>{enhancedChildren}</div>
    </TinyPopover>
  );
};

export default Popover;
