import { useRef, useCallback, useEffect } from "react";

const AutoScrollTable = () => {
  const containerRef = useRef(null);
  const animationRef = useRef(null); // 存储 rAF ID
  const scrollPos = useRef(0); // 存储当前的滚动位置

  // 定义动画循环
  const animate = useCallback((time) => {
    if (!containerRef.current) return;

    // 1. 计算逻辑：每次向下滚动 1px
    scrollPos.current += 1;

    // 2. 应用样式
    containerRef.current.scrollTop = scrollPos.current;

    // 3. 判断是否到底（假设总高 500，可视高 200）
    const isBottom = scrollPos.current >= 700;

    if (!isBottom) {
      // 4. 继续下一帧
      animationRef.current = requestAnimationFrame(animate);
    } else {
      // 重置
    //   scrollPos.current = 0;
    //   animationRef.current = requestAnimationFrame(animate);
    }
  }, []);

  // 启动和停止控制
  useEffect(() => {
    // 启动动画
    animationRef.current = requestAnimationFrame(animate);

    // 清理：组件卸载时取消动画，防止内存泄漏
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  // 鼠标悬停暂停
  const handleMouseEnter = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  };

  // 鼠标离开继续
  const handleMouseLeave = () => {
    animationRef.current = requestAnimationFrame(animate);
  };

  return (
    <div
      ref={containerRef}
      style={{ height: "500px", overflow: "auto" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 长列表内容 */}
      <div
        style={{ height: "1200px", background: "linear-gradient(#eee, #ccc)" }}
      >
        内容区域...
      </div>
    </div>
  );
};

export default AutoScrollTable