import { useRef, useState } from 'react'
import './Upload.css'

const DEFAULT_CHUNK_SIZE_MB = 5
const MAX_RETRIES = 3
const UPLOAD_CONCURRENCY = 5

function formatBytes(size) {
  if (!Number.isFinite(size) || size <= 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.min(
    Math.floor(Math.log(size) / Math.log(1024)),
    units.length - 1,
  )
  const value = size / 1024 ** index
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
}

function formatPercent(value) {
  return `${Math.min(100, Math.max(0, value)).toFixed(1)}%`
}

function buildFileKey(file) {
  return [file.name, file.size, file.lastModified].join(':')
}

function buildApiUrl(path) {
  const base = import.meta.env.VITE_API_BASE_URL?.trim() ?? ''
  return `${base}${path}`
}

function resolveAssetUrl(path) {
  if (!path) {
    return ''
  }

  if (/^https?:\/\//.test(path)) {
    return path
  }

  const base = import.meta.env.VITE_API_BASE_URL?.trim()
  if (base) {
    return new URL(path, `${base}/`).toString()
  }

  return path
}

async function requestJson(path, options = {}) {
  const response = await fetch(buildApiUrl(path), {
    headers: {
      Accept: 'application/json',
      ...(options.body instanceof FormData
        ? {}
        : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`

    try {
      const payload = await response.json()
      if (typeof payload?.detail === 'string') {
        detail = payload.detail
      } else if (payload?.detail) {
        detail = JSON.stringify(payload.detail)
      }
    } catch {
      // Keep default error text when the response is not JSON.
    }

    throw new Error(detail)
  }

  return response.json()
}

async function uploadChunkWithRetry(formData, signal) {
  let lastError = null

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await requestJson('/api/upload/chunk', {
        method: 'POST',
        body: formData,
        signal,
      })
    } catch (error) {
      lastError = error
      if (signal.aborted || attempt === MAX_RETRIES) {
        break
      }
      await new Promise((resolve) =>
        window.setTimeout(resolve, attempt * 500),
      )
    }
  }

  throw lastError ?? new Error('Chunk upload failed')
}

async function runWithConcurrency(tasks, limit) {
  const workerCount = Math.min(Math.max(1, limit), tasks.length)
  let nextTaskIndex = 0

  async function worker() {
    while (nextTaskIndex < tasks.length) {
      const currentTaskIndex = nextTaskIndex
      nextTaskIndex += 1
      await tasks[currentTaskIndex]()
    }
  }

  await Promise.all(
    Array.from({ length: workerCount }, () => worker()),
  )
}

function Upload() {
  const [file, setFile] = useState(null)
  const [chunkSizeMb, setChunkSizeMb] = useState(DEFAULT_CHUNK_SIZE_MB)
  const [statusText, setStatusText] = useState('等待选择文件')
  const [progress, setProgress] = useState(0)
  const [uploadedChunks, setUploadedChunks] = useState(0)
  const [totalChunks, setTotalChunks] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [logs, setLogs] = useState([])
  const [result, setResult] = useState(null)
  const abortControllerRef = useRef(null)
  const logIdRef = useRef(0)

  function appendLog(message) {
    setLogs((currentLogs) =>
      [
        {
          id: `log-${logIdRef.current++}`,
          message,
          time: new Date().toLocaleTimeString(),
        },
        ...currentLogs,
      ].slice(0, 12),
    )
  }

  function resetResultState(nextStatus) {
    setStatusText(nextStatus)
    setProgress(0)
    setUploadedChunks(0)
    setTotalChunks(0)
    setResult(null)
    setLogs([])
  }

  function onFileChange(event) {
    const nextFile = event.target.files?.[0] ?? null
    setFile(nextFile)
    if (nextFile) {
      resetResultState('文件已选择，准备上传')
      appendLog(`已选择 ${nextFile.name}，大小 ${formatBytes(nextFile.size)}`)
    }
  }

  async function startUpload() {
    if (!file) {
      setStatusText('请先选择文件')
      return
    }

    if (file.size <= 0) {
      setStatusText('暂不支持空文件上传')
      return
    }

    const chunkSize =
      Math.max(1, Number(chunkSizeMb) || DEFAULT_CHUNK_SIZE_MB) * 1024 * 1024
    const fileKey = buildFileKey(file)
    const nextTotalChunks = Math.ceil(file.size / chunkSize)
    const abortController = new AbortController()

    abortControllerRef.current = abortController
    setIsUploading(true)
    setStatusText('正在初始化上传任务')
    setProgress(0)
    setUploadedChunks(0)
    setTotalChunks(nextTotalChunks)
    setResult(null)
    setLogs([])

    try {
      appendLog('开始调用初始化接口')
      const initPayload = {
        fileKey,
        fileName: file.name,
        fileSize: file.size,
        chunkSize,
        totalChunks: nextTotalChunks,
      }

      const initResult = await requestJson('/api/upload/init', {
        method: 'POST',
        body: JSON.stringify(initPayload),
        signal: abortController.signal,
      })

      appendLog(`上传任务已创建，uploadId: ${initResult.uploadId}`)

      const statusResult = await requestJson(
        `/api/upload/status?uploadId=${encodeURIComponent(initResult.uploadId)}&fileKey=${encodeURIComponent(fileKey)}`,
        {
          method: 'GET',
          signal: abortController.signal,
        },
      )

      const uploadedSet = new Set([
        ...(initResult.uploaded ?? []),
        ...(statusResult.uploaded ?? []),
      ])

      setUploadedChunks(uploadedSet.size)
      setProgress((uploadedSet.size / nextTotalChunks) * 100)

      if (uploadedSet.size > 0) {
        appendLog(`检测到 ${uploadedSet.size} 个已上传分片，将从断点继续`)
      }

      const pendingChunkIndexes = []
      for (let chunkIndex = 0; chunkIndex < nextTotalChunks; chunkIndex += 1) {
        if (!uploadedSet.has(chunkIndex)) {
          pendingChunkIndexes.push(chunkIndex)
        }
      }

      if (pendingChunkIndexes.length > 0) {
        setStatusText(`正在并发上传分片（最多 ${UPLOAD_CONCURRENCY} 个）`)
        appendLog(
          `开始并发上传剩余 ${pendingChunkIndexes.length} 个分片，最大并发 ${UPLOAD_CONCURRENCY}`,
        )
      }

      const uploadTasks = pendingChunkIndexes.map((chunkIndex) => async () => {
        if (abortController.signal.aborted) {
          throw new Error('上传已取消')
        }

        const start = chunkIndex * chunkSize
        const end = Math.min(file.size, start + chunkSize)
        const blob = file.slice(start, end)
        const formData = new FormData()
        formData.append('uploadId', initResult.uploadId)
        formData.append('fileKey', fileKey)
        formData.append('chunkIndex', String(chunkIndex))
        formData.append('totalChunks', String(nextTotalChunks))
        formData.append('chunkSize', String(chunkSize))
        formData.append('fileSize', String(file.size))
        formData.append('fileName', file.name)
        formData.append('chunk', blob, file.name)

        appendLog(`上传分片 ${chunkIndex + 1}/${nextTotalChunks}`)
        await uploadChunkWithRetry(formData, abortController.signal)

        uploadedSet.add(chunkIndex)
        setUploadedChunks(uploadedSet.size)
        setProgress((uploadedSet.size / nextTotalChunks) * 100)
        setStatusText(
          `正在上传分片，已完成 ${uploadedSet.size} / ${nextTotalChunks}（并发 ${UPLOAD_CONCURRENCY}）`,
        )
      })

      await runWithConcurrency(uploadTasks, UPLOAD_CONCURRENCY)

      setStatusText('分片上传完成，正在合并文件')
      appendLog('所有分片上传完成，开始调用合并接口')

      const completeResult = await requestJson('/api/upload/complete', {
        method: 'POST',
        body: JSON.stringify({
          uploadId: initResult.uploadId,
          fileKey,
        }),
        signal: abortController.signal,
      })

      setStatusText(
        completeResult.alreadyUploaded ? '文件已存在，已秒传完成' : '上传完成',
      )
      setProgress(100)
      setResult({
        uploadId: initResult.uploadId,
        url: completeResult.url,
        absoluteUrl: resolveAssetUrl(completeResult.url),
      })
      appendLog('上传流程结束')
    } catch (error) {
      setStatusText(error.message || '上传失败')
      appendLog(`上传失败：${error.message || '未知错误'}`)
    } finally {
      setIsUploading(false)
      abortControllerRef.current = null
    }
  }

  function cancelUpload() {
    abortControllerRef.current?.abort()
    setIsUploading(false)
    setStatusText('上传已取消')
    appendLog('用户取消了当前上传任务')
  }

  return (
    <div className="upload-workspace">
      <section className="upload-card upload-form-card">
        <div className="upload-heading">
          <div>
            <p className="upload-kicker">Uploader</p>
            <h2>选择一个大文件开始上传</h2>
          </div>
          <div className="badge">{isUploading ? '上传中' : '空闲'}</div>
        </div>

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
              onChange={(event) => setChunkSizeMb(event.target.value)}
              disabled={isUploading}
            />
          </label>
          <div className="file-meta">
            <span>当前文件</span>
            <strong>{file?.name ?? '未选择文件'}</strong>
            <small>{file ? formatBytes(file.size) : '请选择要上传的文件'}</small>
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
          <div
            className="progress-bar"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="stats-grid">
          <div className="stat-tile">
            <span>状态</span>
            <strong>{statusText}</strong>
          </div>
          <div className="stat-tile">
            <span>已完成分片</span>
            <strong>
              {uploadedChunks} / {totalChunks || '--'}
            </strong>
          </div>
        </div>

        {result ? (
          <div className="result-panel">
            <span>文件已完成上传</span>
            <strong>{result.uploadId}</strong>
            <a href={result.absoluteUrl} target="_blank" rel="noreferrer">
              打开文件地址
            </a>
          </div>
        ) : null}
      </section>

      <section className="upload-card upload-log-card">
        <div className="upload-heading">
          <div>
            <p className="upload-kicker">Timeline</p>
            <h2>上传日志</h2>
          </div>
        </div>
        <ul className="log-list">
          {logs.length === 0 ? (
            <li className="log-empty">
              这里会显示初始化、续传、分片上传和合并阶段的进度。
            </li>
          ) : (
            logs.map((log) => (
              <li key={log.id} className="log-item">
                <span>{log.message}</span>
                <time>{log.time}</time>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  )
}

export default Upload
