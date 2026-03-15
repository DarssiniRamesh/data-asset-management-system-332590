import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AssetsListPage } from "../pages/AssetsListPage";
import { ToastProvider } from "../state/ToastContext";

// Mock API calls used by the page.
jest.mock("../api/endpoints", () => ({
  listAssets: jest.fn(async () => [
    {
      assetId: "1",
      siteId: "S1",
      assetGroup: "AG",
      processGroup: "PG",
      assetName: "Asset 1",
      permitEuId: "P1",
      globalUniqueAssetId: "G1",
      requiresParentPseudo: false,
      parentPseudoAssetId: null,
      correlationId: "c",
      createdBy: null,
      modifiedBy: null,
      createdAt: null,
      modifiedAt: null,
      isDeleted: false,
    },
  ]),
  deleteAsset: jest.fn(async () => undefined),
}));

function renderWithRole(role: "Viewer" | "Editor" | "Admin") {
  jest.doMock("../state/AuthContext", () => {
    const actual = jest.requireActual("../state/AuthContext");
    return {
      ...actual,
      useAuth: () => ({
        token: "t",
        user: { username: "u", role },
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
      }),
    };
  });
}

describe("AssetsListPage (BRD delete confirmation + RBAC)", () => {
  test("Viewer sees disabled Create and Copy buttons", async () => {
    renderWithRole("Viewer");
    const { AssetsListPage: Mocked } = await import("../pages/AssetsListPage");

    render(
      <ToastProvider>
        <MemoryRouter initialEntries={["/app/assets"]}>
          <Mocked />
        </MemoryRouter>
      </ToastProvider>,
    );

    // Wait for row to appear
    expect(await screen.findByText("Asset 1")).toBeInTheDocument();

    // Create disabled
    expect(screen.getByRole("button", { name: /create asset/i })).toBeDisabled();

    // Copy disabled (rendered as disabled button with title)
    const copyButtons = screen.getAllByTitle(/copy requires editor or admin role/i);
    expect(copyButtons.length).toBeGreaterThan(0);
    expect(copyButtons[0]).toBeDisabled();
  });

  test("Admin can open delete confirmation modal", async () => {
    renderWithRole("Admin");
    const { AssetsListPage: Mocked } = await import("../pages/AssetsListPage");

    render(
      <ToastProvider>
        <MemoryRouter initialEntries={["/app/assets"]}>
          <Mocked />
        </MemoryRouter>
      </ToastProvider>,
    );

    expect(await screen.findByText("Asset 1")).toBeInTheDocument();

    // Open delete modal
    fireEvent.click(screen.getByTitle("Delete"));
    expect(await screen.findByText(/Delete asset\?/i)).toBeInTheDocument();

    // Confirm button should be enabled for Admin
    expect(screen.getByRole("button", { name: /confirm/i })).toBeEnabled();
  });
});
