import error_tps from "@/assets/imgs/tps-120-120.webp";

const CustomMermaidError = () => (
  <div className="w-full h-60 flex flex-col justify-center items-center">
    <div className="mt-2 text-amber-700 text-sm">
      <img className="select-none" src={error_tps} alt="" />
    </div>
    <p className="select-none text-sm text-gray-300">生成失败</p>
  </div>
);

export default CustomMermaidError;
