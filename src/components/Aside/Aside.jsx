import "./Aside.scss";
import { PanelRightOpen } from "lucide-react";
import cn from "classnames";

const Aside = ({ isAsideShown, setAsideShown }) => {
  return (
    <aside
      className={cn(
        "w-65 h-full bg-gray-50 border-gray-200 border-r overflow-hidden",
        "transition-transform duration-260 ease",
        isAsideShown ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex h-15 justify-between items-center p-3">
        <div>
          <h1 className="text-teal-600 font-bold text-xl">Deeps.cn</h1>
        </div>
        <div className="bar">
          <button className="icon-btn" onClick={() => setAsideShown(false)}>
            <PanelRightOpen size={22} strokeWidth={1} />
          </button>
        </div>
      </div>
      {/* <h2 onClick={() => setAsideShown(false)}>功能列表</h2> */}
      <ul>
        <li>功能1功能1功能1功能1功能1</li>
        <li>功能2功能2功能2功能2功能2</li>
        <li>功能3功能3功能3功能3功能3</li>
      </ul>
    </aside>
  );
};

Aside.displayName = "Aside";
export default Aside;
