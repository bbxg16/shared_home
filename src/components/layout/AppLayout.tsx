import { Outlet } from "react-router-dom";
import { BottomNavigation } from "@/components/common/BottomNavigation";

export function AppLayout() {
  return (
    <div className="app-shell">
      <main className="flex-1 pb-4">
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  );
}
