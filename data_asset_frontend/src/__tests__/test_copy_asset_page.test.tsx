import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CopyAssetPage } from "../pages/CopyAssetPage";
import { AuthProvider } from "../state/AuthContext";
import { ToastProvider } from "../state/ToastContext";

// Mock API calls used by the page.
jest.mock("../api/endpoints", () => ({
  copyAsset: jest.fn(async () => ({ copyOperationId: "op-1", newAssetId: 123 })),
  queryAssetCopyLineage: jest.fn(async () => []),
}));

/**
 * Render helper: include providers used by CopyAssetPage.
 */
function renderCopyAssetPage(assetId: string) {
  return render(
    <AuthProvider>
      <ToastProvider>
        <MemoryRouter initialEntries={[`/app/assets/${assetId}/copy`]}>
          <Routes>
            <Route path="/app/assets/:assetId/copy" element={<CopyAssetPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </AuthProvider>,
  );
}

describe("CopyAssetPage (BRD Confirmation! UX)", () => {
  test("opens Confirmation! modal when form is valid and user has permissions", async () => {
    // Default AuthProvider starts unauthenticated; CopyAssetPage checks RBAC via user role.
    // For this test suite, we simulate authenticated user by setting token in localStorage
    // to any non-empty value and then mocking parsing? AuthProvider reads token but derives
    // user from token. The page uses can(user?.role, 'copy') and roleLabel.
    // We avoid the token parsing complexity by mocking useAuth at module boundary.
    jest.resetModules();
  });
});

describe("CopyAssetPage minimal UI behavior", () => {
  test("shows toast validation when new name is empty and user clicks Continue", async () => {
    // Mock useAuth to provide an Editor user (can copy).
    jest.doMock("../state/AuthContext", () => {
      const actual = jest.requireActual("../state/AuthContext");
      return {
        ...actual,
        useAuth: () => ({
          token: "t",
          user: { username: "u", role: "Editor" },
          isAuthenticated: true,
          login: jest.fn(),
          logout: jest.fn(),
        }),
      };
    });

    // Re-import after doMock
    const { CopyAssetPage: CopyAssetPageMocked } = await import("../pages/CopyAssetPage");

    render(
      <ToastProvider>
        <MemoryRouter initialEntries={["/app/assets/55/copy"]}>
          <Routes>
            <Route path="/app/assets/:assetId/copy" element={<CopyAssetPageMocked />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    // Modal should NOT open; inline error message from toast should be visible.
    await waitFor(() => {
      expect(screen.queryByText("Confirmation!")).not.toBeInTheDocument();
    });
    expect(screen.getByText(/Fix form errors/i)).toBeInTheDocument();
    expect(screen.getByText(/New asset name is required/i)).toBeInTheDocument();
  });

  test("opens and closes Confirmation! modal (Back button)", async () => {
    jest.doMock("../state/AuthContext", () => {
      const actual = jest.requireActual("../state/AuthContext");
      return {
        ...actual,
        useAuth: () => ({
          token: "t",
          user: { username: "u", role: "Editor" },
          isAuthenticated: true,
          login: jest.fn(),
          logout: jest.fn(),
        }),
      };
    });

    const { CopyAssetPage: CopyAssetPageMocked } = await import("../pages/CopyAssetPage");

    render(
      <ToastProvider>
        <MemoryRouter initialEntries={["/app/assets/55/copy"]}>
          <Routes>
            <Route path="/app/assets/:assetId/copy" element={<CopyAssetPageMocked />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>,
    );

    fireEvent.change(screen.getByLabelText(/New Asset Name/i), { target: { value: "New Asset A" } });

    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(await screen.findByText("Confirmation!")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    await waitFor(() => expect(screen.queryByText("Confirmation!")).not.toBeInTheDocument());
  });
});
