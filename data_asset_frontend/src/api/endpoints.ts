import { apiRequest } from "./client";
import type {
  AssetDto,
  CopyAssetRequest,
  CreateAssetRequest,
  DevLoginRequest,
  DevLoginResponse,
  InputEfMappingRow,
  SiteAssetRow,
  ThroughputRow,
  UpdateAssetRequest,
} from "./types";

// PUBLIC_INTERFACE
export async function login(req: DevLoginRequest): Promise<DevLoginResponse> {
  /** Contract:
   * Inputs: { username, role }
   * Outputs: DevLoginResponse (accessToken, role, expiry)
   * Errors: ApiError on non-2xx
   */
  return apiRequest<DevLoginResponse>({ method: "POST", path: "/api/auth/login", body: req });
}

// PUBLIC_INTERFACE
export async function listAssets(): Promise<AssetDto[]> {
  /** Contract: returns all assets (server-side may cap). */
  return apiRequest<AssetDto[]>({ method: "GET", path: "/api/assets" });
}

// PUBLIC_INTERFACE
export async function getAsset(assetId: string): Promise<AssetDto> {
  /** Contract: assetId must be a non-empty string. */
  return apiRequest<AssetDto>({ method: "GET", path: `/api/assets/${encodeURIComponent(assetId)}` });
}

// PUBLIC_INTERFACE
export async function createAsset(req: CreateAssetRequest): Promise<AssetDto> {
  /** Contract: creates an asset and returns created AssetDto. */
  return apiRequest<AssetDto>({ method: "POST", path: "/api/assets", body: req });
}

// PUBLIC_INTERFACE
export async function updateAsset(req: UpdateAssetRequest): Promise<AssetDto> {
  /** Contract: updates asset; req.assetId required. */
  const { assetId, ...rest } = req;
  return apiRequest<AssetDto>({
    method: "PUT",
    path: `/api/assets/${encodeURIComponent(assetId)}`,
    body: { assetId, ...rest },
  });
}

// PUBLIC_INTERFACE
export async function deleteAsset(assetId: string): Promise<void> {
  /** Contract: deletes by assetId. */
  return apiRequest<void>({ method: "DELETE", path: `/api/assets/${encodeURIComponent(assetId)}` });
}

// PUBLIC_INTERFACE
export async function copyAsset(assetId: string, req: CopyAssetRequest): Promise<unknown> {
  /** Contract: backend copies asset modules and returns a copy response. */
  return apiRequest<unknown>({
    method: "POST",
    path: `/api/assets/${encodeURIComponent(assetId)}/copy`,
    body: req,
  });
}

/**
 * “Module” endpoints used by required tabs.
 * Note: Backend naming is legacy; these wrappers keep the UI readable and unify error handling.
 */

// PUBLIC_INTERFACE
export async function listInputEfSourceMappings(
  assetId: string,
  inputParameterId: string,
): Promise<InputEfMappingRow[]> {
  return apiRequest<InputEfMappingRow[]>({
    method: "GET",
    path: `/api/inputefsourcemapping/${encodeURIComponent(assetId)}/${encodeURIComponent(
      inputParameterId,
    )}`,
  });
}

// PUBLIC_INTERFACE
export async function createInputEfSourceMapping(
  assetId: string,
  inputParameterId: string,
  row: InputEfMappingRow,
): Promise<unknown> {
  return apiRequest<unknown>({
    method: "POST",
    path: `/api/inputefsourcemapping/${encodeURIComponent(assetId)}/${encodeURIComponent(
      inputParameterId,
    )}`,
    body: row,
  });
}

// PUBLIC_INTERFACE
export async function manageSiteAssets(payload: SiteAssetRow): Promise<unknown> {
  return apiRequest<unknown>({ method: "POST", path: "/api/siteassets/managesiteassets", body: payload });
}

// PUBLIC_INTERFACE
export async function generateThroughputForInputParameter(
  assetId: string,
  inputParameterId: string,
  payload: ThroughputRow,
): Promise<unknown> {
  return apiRequest<unknown>({
    method: "POST",
    path: `/api/calculatedthroughputequationsetup/${encodeURIComponent(
      assetId,
    )}/${encodeURIComponent(inputParameterId)}/generatethroughputforinputparameter`,
    body: payload,
  });
}
