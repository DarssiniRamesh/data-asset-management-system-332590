import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardLayout } from "./layout/DashboardLayout";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { DashboardHomePage } from "./pages/DashboardHomePage";
import { AssetsListPage } from "./pages/AssetsListPage";
import { CreateAssetPage } from "./pages/CreateAssetPage";
import { EditAssetPage } from "./pages/EditAssetPage";
import { CopyAssetPage } from "./pages/CopyAssetPage";
import { AssetDetailsPage } from "./pages/AssetDetailsPage";
import { AuthProvider } from "./state/AuthContext";
import { ThemeProvider } from "./state/ThemeContext";
import { ToastProvider } from "./state/ToastContext";
import { NotificationToasts } from "./components/NotificationToasts";

// PUBLIC_INTERFACE
function App() {
  /** App entrypoint contract:
   * - Provides Theme/Auth/Toast contexts
   * - Sets up React Router pages
   * - Dashboard routes are protected (JWT required)
   */
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <NotificationToasts />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/app" element={<DashboardLayout />}>
                  <Route index element={<DashboardHomePage />} />
                  <Route path="assets" element={<AssetsListPage />} />
                  <Route path="assets/create" element={<CreateAssetPage />} />
                  <Route path="assets/:assetId" element={<AssetDetailsPage />} />
                  <Route path="assets/:assetId/edit" element={<EditAssetPage />} />
                  <Route path="assets/:assetId/copy" element={<CopyAssetPage />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
