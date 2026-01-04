import { Outlet } from "react-router-dom";
import AceSidebar from "../../components/ace/AceSidebar";

export default function AceLayout() {
  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-[#050812]
                    text-slate-900 dark:text-slate-100">
      <AceSidebar />
      <main className="flex-1 px-10 py-8">
        <Outlet />
      </main>
    </div>
  );
}
