import React, { useState, useEffect, useRef } from "react";

const DynamicScrollList = () => {
  const containerRef = useRef(null);
  const [items, setItems] = useState(Array(10).fill("初始项目"));

  // --- 状态管理 ---
  const rafId = useRef(null);
  const resizeObserver = useRef(null);
  const isAutoScrolling = useRef(false);
  const userScrolledUp = useRef(false);

  // 模拟延迟加载的内容（比如图片加载后撑开高度）
  const loadMoreContent = () => {
    setTimeout(() => {
      setItems((prev) => [
        ...prev,
        "新加载的动态内容 (高度可能变化)",
        "更多内容...",
      ]);
    }, 1000);
  };

  /**
   * 核心：自适应平滑滚动函数
   */
  const smoothScrollToBottom = () => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // 1. 检查用户意图：如果用户向上滚动了，不要自动滚动
    if (userScrolledUp.current) return;

    // 2. 启动/继续动画
    const animate = () => {
      if (!containerRef.current) return;

      // 【关键点】每一帧都重新获取最新的 scrollHeight
      // 这样即使内容突然变高，目标位置也会自动修正，不会出现跳动
      const currentScrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      const targetPosition = currentScrollHeight - clientHeight;

      const currentPos = container.scrollTop;
      const distance = targetPosition - currentPos;

      // 如果已经到底部（误差范围内），停止动画
      if (Math.abs(distance) < 1) {
        container.scrollTop = targetPosition;
        isAutoScrolling.current = false;
        rafId.current = null;
        return;
      }

      // 简单的线性插值：每次移动剩余距离的 15%
      // 这种算法能很好地适应目标位置的动态变化
      container.scrollTop += distance * 0.15;

      rafId.current = requestAnimationFrame(animate);
    };

    if (!isAutoScrolling.current) {
      isAutoScrolling.current = true;
      animate();
    }
  };

  // --- 监听高度变化 (ResizeObserver) ---
  useEffect(() => {
    if (!containerRef.current) return;

    // 当容器内容高度发生变化时（例如图片加载完成撑大了容器）
    resizeObserver.current = new ResizeObserver(() => {
      // 只有当用户原本就在底部附近，或者正在进行自动滚动时，才跟随滚动
      // 如果用户在很远的地方看历史消息，高度变化不应触发滚动
      if (!userScrolledUp.current) {
        // 注意：这里直接调用 animate 可能会导致冲突，
        // 更好的方式是让 smoothScrollToBottom 去处理，
        // 或者直接在这里触发一次“瞬移”到底部（如果是流式输出通常希望紧跟最新内容）

        // 策略：如果正在进行平滑滚动，让它自然继续（因为它每帧都会更新 target）；
        // 如果没有滚动但高度变了，说明是新内容插入，尝试平滑滚动
        if (!isAutoScrolling.current) {
          smoothScrollToBottom();
        }
      }
    });

    resizeObserver.current.observe(containerRef.current);

    return () => {
      if (resizeObserver.current) resizeObserver.current.disconnect();
    };
  }, []);

  // --- 监听用户手动滚动 ---
  const handleScroll = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const isNearBottom =
      container.scrollHeight - container.clientHeight - container.scrollTop <
      150;

    userScrolledUp.current = !isNearBottom;
  };

  // 监听数据变化触发滚动
  useEffect(() => {
    // 数据来了，尝试滚动
    smoothScrollToBottom();
  }, [items]);

  // 清理 rAF
  useEffect(() => {
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center p-10">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-80 h-96 overflow-y-auto border border-gray-300 rounded shadow-inner p-4 space-y-4 bg-gray-50"
      >
        {items.map((item, i) => (
          <div
            key={i}
            className="p-3 bg-white rounded shadow text-sm wrap-break-word"
          >
            {item}
            {/* 模拟一个可能会延迟加载的高图 */}
            {i === items.length - 1 && (
              <img
                src="https://via.placeholder.com/300x150"
                alt="loading"
                className="mt-2 w-full h-auto block"
                loading="lazy"
              />
            )}
          </div>
        ))}
      </div>

      <button
        onClick={loadMoreContent}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        模拟延迟加载内容
      </button>
    </div>
  );
};

export default DynamicScrollList;
