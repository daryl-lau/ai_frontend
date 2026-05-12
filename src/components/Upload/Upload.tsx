import { useRef, useState, type ChangeEvent } from "react";
import { uploadApi } from "@/api/upload";
import "./Upload.css";

const DEFAULT_CHUNK_SIZE_MB = 5;
const MAX_RETRIES = 3;
const UPLOAD_CONCURRENCY = 5;

function formatBytes(size: number) {
  if (!Number.isFinite(size) || size <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(size) / Math.log(1024)),
    units.length - 1,
  );
  const value = size / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatPercent(value: number) {
  return `${Math.min(100, Math.max(0, value)).toFixed(1)}%`;
}

function buildFileKey(file: File) {
  return [file.name, file.size, file.lastModified].join(":");
}

async function uploadChunkWithRetry(
  formData: FormData,
  signal: AbortSignal,
): Promise<unknown> {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await uploadApi.upload_chunk(formData, {
        signal,
      });
    } catch (error) {
      lastError = error;
      if (signal.aborted || attempt === MAX_RETRIES) break;
      await new Promise((resolve) => window.setTimeout(resolve, attempt * 500));
    }
  }
  throw lastError ?? new Error("Chunk upload failed");
}

async function runWithConcurrency(
  tasks: Array<() => Promise<void>>,
  limit: number,
) {
  const workerCount = Math.min(Math.max(1, limit), tasks.length);
  let nextTaskIndex = 0;

  async function worker() {
    while (nextTaskIndex < tasks.length) {
      const currentTaskIndex = nextTaskIndex;
      nextTaskIndex += 1;
      await tasks[currentTaskIndex]();
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()));
}

const Upload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [chunkSizeMb, setChunkSizeMb] = useState<number>(DEFAULT_CHUNK_SIZE_MB);
  const [progress, setProgress] = useState<number>(0);
  const [, setUploadedChunks] = useState<number>(0);
  const [, setTotalChunks] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [logs, setLogs] = useState<
    Array<{ id: string; message: string; time: string }>
  >([]);
  const [, setResult] = useState<{ uploadId: string; url: string } | null>(
    null,
  );
  const abortControllerRef = useRef<AbortController | null>(null);
  const logIdRef = useRef(0);

  function appendLog(message: string) {
    setLogs((currentLogs) =>
      [
        {
          id: `log-${logIdRef.current++}`,
          message,
          time: new Date().toLocaleTimeString(),
        },
        ...currentLogs,
      ].slice(0, 120),
    );
  }

  function resetResultState() {
    setProgress(0);
    setUploadedChunks(0);
    setTotalChunks(0);
    setResult(null);
    setLogs([]);
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
    if (nextFile) {
      resetResultState();
      appendLog(`已选择 ${nextFile.name}，大小 ${formatBytes(nextFile.size)}`);
    }
  }

  async function startUpload() {
    if (!file || file.size <= 0) return;

    const chunkSize =
      Math.max(1, Number(chunkSizeMb) || DEFAULT_CHUNK_SIZE_MB) * 1024 * 1024;
    const fileKey = buildFileKey(file);
    const nextTotalChunks = Math.ceil(file.size / chunkSize);
    const abortController = new AbortController();

    abortControllerRef.current = abortController;
    setIsUploading(true);
    setProgress(0);
    setUploadedChunks(0);
    setTotalChunks(nextTotalChunks);
    setResult(null);
    setLogs([]);

    try {
      appendLog("开始调用初始化接口");
      const initResult = await uploadApi.init(
        {
          fileKey,
          fileName: file.name,
          fileSize: file.size,
          chunkSize,
          totalChunks: nextTotalChunks,
        },
        {
          signal: abortController.signal,
        },
      );

      appendLog(`上传任务已创建，uploadId: ${initResult.uploadId}`);

      const statusResult = await uploadApi.get_status(
        { uploadId: initResult.uploadId, fileKey },
        {
          signal: abortController.signal,
        },
      );

      const uploadedSet = new Set([
        ...(initResult.uploaded ?? []),
        ...(statusResult.uploaded ?? []),
      ]);
      setUploadedChunks(uploadedSet.size);
      setProgress((uploadedSet.size / nextTotalChunks) * 100);

      if (uploadedSet.size > 0) {
        appendLog(`检测到 ${uploadedSet.size} 个已上传分片，将从断点继续`);
      }

      const pendingChunkIndexes: number[] = [];
      for (let chunkIndex = 0; chunkIndex < nextTotalChunks; chunkIndex += 1) {
        if (!uploadedSet.has(chunkIndex)) pendingChunkIndexes.push(chunkIndex);
      }

      if (pendingChunkIndexes.length > 0) {
        appendLog(
          `开始并发上传剩余 ${pendingChunkIndexes.length} 个分片，最大并发 ${UPLOAD_CONCURRENCY}`,
        );
      }

      const uploadTasks = pendingChunkIndexes.map((chunkIndex) => async () => {
        if (abortController.signal.aborted) throw new Error("上传已取消");

        const start = chunkIndex * chunkSize;
        const end = Math.min(file.size, start + chunkSize);
        const blob = file.slice(start, end);
        const formData = new FormData();
        formData.append("uploadId", initResult.uploadId);
        formData.append("fileKey", fileKey);
        formData.append("chunkIndex", String(chunkIndex));
        formData.append("totalChunks", String(nextTotalChunks));
        formData.append("chunkSize", String(chunkSize));
        formData.append("fileSize", String(file.size));
        formData.append("fileName", file.name);
        formData.append("chunk", blob, file.name);

        appendLog(`上传分片 ${chunkIndex + 1}/${nextTotalChunks}`);
        await uploadChunkWithRetry(formData, abortController.signal);

        uploadedSet.add(chunkIndex);
        setUploadedChunks(uploadedSet.size);
        setProgress((uploadedSet.size / nextTotalChunks) * 100);
      });

      await runWithConcurrency(uploadTasks, UPLOAD_CONCURRENCY);

      appendLog("所有分片上传完成，开始调用合并接口");

      const completeResult = await uploadApi.complete(
        { uploadId: initResult.uploadId, fileKey },
        {
          signal: abortController.signal,
        },
      );

      setProgress(100);
      setResult({
        uploadId: initResult.uploadId,
        url: completeResult.url,
      });
      appendLog("上传流程结束");
    } catch (error: unknown) {
      if (error instanceof Error) {
        appendLog(`上传失败：${error.message}`);
      } else {
        appendLog("上传失败：未知错误");
      }
    } finally {
      setIsUploading(false);
      abortControllerRef.current = null;
    }
  }

  function cancelUpload() {
    abortControllerRef.current?.abort();
    setIsUploading(false);
    appendLog("用户取消了当前上传任务");
  }

  return (
    <div className="upload-workspace">
      <section className="upload-card upload-form-card">
        <label className="file-dropzone">
          <input type="file" onChange={onFileChange} disabled={isUploading} />
          <span>点击选择文件</span>
          <small>
            建议使用数百 MB 以上文件验证断点续传流程，当前最多并发 5 个分片
          </small>
        </label>

        <div className="field-grid">
          <label className="field">
            <span>分片大小（MB）</span>
            <input
              type="number"
              min="1"
              max="64"
              step="1"
              value={chunkSizeMb}
              onChange={(event) => setChunkSizeMb(Number(event.target.value))}
              disabled={isUploading}
            />
          </label>
          <div className="file-meta">
            <span>当前文件</span>
            <strong>{file?.name ?? "未选择文件"}</strong>
            <small>
              {file ? formatBytes(file.size) : "请选择要上传的文件"}
            </small>
          </div>
        </div>

        <div className="action-row">
          <button
            type="button"
            className="primary-button"
            onClick={startUpload}
            disabled={isUploading || !file}
          >
            开始上传
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={cancelUpload}
            disabled={!isUploading}
          >
            取消上传
          </button>
        </div>
      </section>

      <section className="upload-card upload-status-card">
        <div className="status-header">
          <div>
            <p className="upload-kicker">Progress</p>
            <h2>任务状态</h2>
          </div>
          <strong>{formatPercent(progress)}</strong>
        </div>

        <div className="progress-track" aria-hidden="true">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
      </section>

      <section className="upload-card upload-log-card">
        <div className="upload-heading">
          <div>
            <p className="upload-kicker">Timeline</p>
            <h2>上传日志</h2>
          </div>
        </div>
        <div className="log-console" role="log" aria-live="polite">
          {logs.length === 0 ? (
            <p className="log-line log-empty">
              这里会显示初始化、续传、分片上传和合并阶段的进度。
            </p>
          ) : (
            logs.map((log) => (
              <p key={log.id} className="log-line">
                <time>[{log.time}]</time> {log.message}
              </p>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default Upload;
