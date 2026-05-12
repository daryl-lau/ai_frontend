import { useNavigate } from "react-router";
import error_tps from "@/assets/imgs/tps-120-120.webp";

function NotFoundView() {
  const navigate = useNavigate();

  return (
    <section className="flex flex-col items-center justify-center">
      <div className="flex flex-col items-center justify-center mt-[10vh]">
        <div>
          <img src={error_tps} alt="" />
        </div>
        <div className=" text-lg">
          <span>页面不存在,</span>
          <span
            className="text-primary cursor-pointer"
            onClick={() => {
              navigate("/");
            }}
          >
            回到首页
          </span>
        </div>
      </div>
    </section>
  );
}

export default NotFoundView;
