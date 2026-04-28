import { Link } from 'react-router-dom'
import Upload from '../components/Upload/Upload.jsx'

function UploadView() {
  return (
    <section className="page page-upload">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Chunk Upload</p>
          <h1>上传任务</h1>
        </div>
        <Link className="ghost-link" to="/">
          返回首页
        </Link>
      </div>
      <Upload />
    </section>
  )
}

export default UploadView
