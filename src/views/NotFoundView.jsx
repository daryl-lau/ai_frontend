import { Link } from 'react-router-dom'

function NotFoundView() {
  return (
    <section className="page page-not-found">
      <p className="eyebrow">404</p>
      <h1>页面不存在</h1>
      <p className="hero-copy">当前地址没有匹配到页面，你可以回到首页重新开始。</p>
      <Link className="primary-link" to="/">
        回到首页
      </Link>
    </section>
  )
}

export default NotFoundView
