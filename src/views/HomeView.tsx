import { Link } from "react-router";

function HomeView() {
  return (
    <section className="page page-home">
      <div className="hero-panel">
        <p className="eyebrow">React Upload Console</p>
        <h1>面向大文件的分片上传工作台</h1>
        <p className="hero-copy">
          前端按 `service`
          提供的上传协议完成初始化、断点续传、分片提交和最终合并，
          适合直接接到当前 FastAPI 服务上。
        </p>
        <div className="hero-actions">
          <Link className="primary-link" to="/upload">
            打开上传页
          </Link>
          <a
            className="secondary-link"
            href="http://127.0.0.1:8000/health"
            target="_blank"
            rel="noreferrer"
          >
            查看服务健康检查
          </a>
        </div>
      </div>

      <div className="info-grid">
        <article className="info-card">
          <h2>路由已接入</h2>
          <p>
            首页和上传页已经拆成独立路由，后续继续扩展进度历史、文件列表或权限页会更自然。
          </p>
        </article>
        <article className="info-card">
          <h2>接口已对齐</h2>
          <p>
            组件按 `/api/upload/init`、`/status`、`/chunk`、`/complete`
            这套协议工作，并保留了断点续传能力。
          </p>
        </article>
        <article className="info-card">
          <h2>开发代理已配置</h2>
          <p>
            Vite 开发环境会把 `/api` 和 `/uploads`
            代理到本地服务，前端可以直接用相对路径请求。
          </p>
        </article>
      </div>
    </section>
  );
}

export default HomeView;
