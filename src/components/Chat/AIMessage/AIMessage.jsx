import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import { mermaid } from "@streamdown/mermaid";
import { math } from "@streamdown/math";
import { cjk } from "@streamdown/cjk";
import CustomMermaidError from "./CustomMermaidError.jsx";
import "streamdown/styles.css";
import "katex/dist/katex.min.css";
// import { RemarMarkdown } from "remar-stream";
// import ReactMarkdown from "react-markdown";
import Loading from "../../Loading/Loading.jsx";

const AIMessage = ({ message, isStreaming }) => {
  return (
    <div className="pb-12">
      {message.trim().length === 0 && isStreaming ? (
        <Loading />
      ) : (
        // <RemarMarkdown content={message} />
        <Streamdown
          className="markdown-class-style"
          isAnimating={isStreaming}
          linkSafety={{ enabled: false }}
          controls={{
            table: {
              copy: true,
              download: true,
              fullscreen: false,
            },
            code: {
              copy: true,
              download: true,
            },
            mermaid: {
              copy: true,
              download: true,
              panZoom: true,
              fullscreen: false,
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
