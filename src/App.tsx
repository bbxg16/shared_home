import { Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { HomePage } from "@/pages/HomePage";
import { PurchasesPage } from "@/pages/PurchasesPage";
import { PurchaseDetailPage } from "@/pages/PurchaseDetailPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { ReportDetailPage } from "@/pages/ReportDetailPage";
import { HousePage } from "@/pages/HousePage";

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/purchases" element={<PurchasesPage />} />
        <Route path="/purchases/:id" element={<PurchaseDetailPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/reports/:id" element={<ReportDetailPage />} />
        <Route path="/house" element={<HousePage />} />
      </Route>
    </Routes>
  );
}

export default App;
