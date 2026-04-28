// useAutoScroll.js
import { useRef, useState, useEffect, useCallback } from "react";

export const useAutoScroll = (dependencyArray = []) => {
  const containerRef = useRef(null);
  const endRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [currentScroll, setCurrentScroll] = useState(0);
  const [userScrolled, setUserScrolled] = useState(false);
  const scrollTimeoutRef = useRef(null);

  const checkIfAtBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return true;
    return (
      container.scrollHeight - container.scrollTop - container.clientHeight < 50
    );
  }, []);

  const scrollToBottom = useCallback((behavior = "smooth") => {
    endRef.current?.scrollIntoView({ behavior });
  }, []);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    // 判断用户介入滚动，如果用户滚动了，就不自动滚动了，除非用户滚动到最底部了
    setUserScrolled(container.scrollTop < currentScroll);

    scrollTimeoutRef.current = window.setTimeout(() => {
      setCurrentScroll(container.scrollTop);
      const atBottom = checkIfAtBottom();
      setAutoScroll(atBottom);
    }, 20);
  }, [checkIfAtBottom, currentScroll]);

  useEffect(() => {
    if (autoScroll && !userScrolled) {
      scrollToBottom();
    }
  }, [userScrolled, autoScroll, scrollToBottom, ...dependencyArray]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => {
        container.removeEventListener("scroll", handleScroll);
      };
    }
  }, [handleScroll]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    containerRef,
    endRef,
    autoScroll,
    scrollToBottom,
    setAutoScroll,
    setUserScrolled,
    checkIfAtBottom,
  };
};

export default useAutoScroll;
