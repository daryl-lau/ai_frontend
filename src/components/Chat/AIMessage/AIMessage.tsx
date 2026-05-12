import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import { mermaid } from "@streamdown/mermaid";
import { math } from "@streamdown/math";
import { cjk } from "@streamdown/cjk";
import CustomMermaidError from "./CustomMermaidError.tsx";
import Loading from "@/components/Loading/Loading.tsx";
import { useIsPending, useIsStreaming } from "@/store/index.tsx";
import "streamdown/styles.css";
import "katex/dist/katex.min.css";

const translations = {
  copyCode: "复制",
  copyTable: "复制",
  downloadFile: "下载代码",
  downloadDiagram: "下载图表",
  viewFullscreen: "全屏",
  exitFullscreen: "退出全屏",
  downloadDiagramAsSvg: "下载为svg",
  downloadDiagramAsPng: "下载为png",
  downloadDiagramAsMmd: "下载为mmd",
  copyTableAsMarkdown: "复制Markdown",
  copyTableAsCsv: "复制Csv",
  copyTableAsTsv: "复制Tsv",
  downloadTableAsCsv: "下载Csv",
  downloadTableAsMarkdown: "下载Markdown",
  downloadImage: "下载图片",
  imageNotAvailable: "❗图片加载失败",
};

const AIMessage: React.FC<{ message: string }> = ({ message }) => {
  const isPending = useIsPending((s: any) => s.isPending);
  const isStreaming = useIsStreaming((s: any) => s.isStreaming);

  return (
    <div className="pb-12">
      {message.trim().length === 0 && isPending ? (
        <Loading />
      ) : (
        <Streamdown
          className="markdown-class-style"
          isAnimating={isStreaming}
          translations={translations}
          linkSafety={{ enabled: false }}
          controls={{
            table: {
              copy: true,
              download: true,
              fullscreen: true,
            },
            code: {
              copy: true,
              download: true,
            },
            mermaid: {
              copy: true,
              download: true,
              panZoom: true,
              fullscreen: true,
            },
          }}
          mermaid={{
            errorComponent: CustomMermaidError,
          }}
          plugins={{ code, mermaid, math, cjk }}
        >
          {message}
        </Streamdown>
      )}
    </div>
  );
};

AIMessage.displayName = "AIMessage";
export default AIMessage;
