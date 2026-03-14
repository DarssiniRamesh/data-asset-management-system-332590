import { apiRequest } from "./client";
import type {
  AssetDto,
  CopyAssetRequest,
  CreateAssetRequest,
  DeleteAssetRequest,
  DevLoginRequest,
  DevLoginResponse,
  InputEfMappingRow,
  SiteAssetRow,
  ThroughputRow,
  UpdateAssetRequest,
} from "./types";

type BackendAssetDto = {
  AssetId: number;
  SiteId: string;
  AssetGroup: string;
  ProcessGroup: string;
  ProcessGroupOtherText?: string | null;
  AssetName: string;
  PermitEuId: string;
  GlobalUniqueAssetId: string;
  AssetDescription?: string | null;
  StationaryFlag?: boolean | null;
  ParentPseudoAssetId?: number | null;

  // audit/trace
  CreatedBy: string;
  CreatedAt: string;
  ModifiedBy: string;
  ModifiedAt: string;
  IsDeleted: boolean;
  CorrelationId: string;
};

/**
 * Convert backend AssetDto (PascalCase) into the UI's canonical camelCase AssetDto.
 * This fixes create/list/get flows where the UI previously saw missing assetId.
 */
function mapAssetFromBackend(a: BackendAssetDto): AssetDto {
  return {
    assetId: String(a.AssetId),
    siteId: a.SiteId,
    assetGroup: a.AssetGroup,
    processGroup: a.ProcessGroup,
    processGroupOtherText: a.ProcessGroupOtherText ?? null,

    assetName: a.AssetName,
    permitEuId: a.PermitEuId,
    globalUniqueAssetId: a.GlobalUniqueAssetId,

    assetDescription: a.AssetDescription ?? null,
    stationaryFlag: a.StationaryFlag ?? null,

    // Backend uses null/non-null to indicate presence, but requires an explicit flag on requests.
    requiresParentPseudo: Boolean(a.ParentPseudoAssetId),
    parentPseudoAssetId: a.ParentPseudoAssetId !== null && a.ParentPseudoAssetId !== undefined ? String(a.ParentPseudoAssetId) : null,

    createdBy: a.CreatedBy,
    modifiedBy: a.ModifiedBy,

    correlationId: a.CorrelationId,

    createdAt: a.CreatedAt,
    modifiedAt: a.ModifiedAt,

    isDeleted: a.IsDeleted,
  };
}

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
  const list = await apiRequest<BackendAssetDto[]>({ method: "GET", path: "/api/assets" });
  return Array.isArray(list) ? list.map(mapAssetFromBackend) : [];
}

// PUBLIC_INTERFACE
export async function getAsset(assetId: string): Promise<AssetDto> {
  /** Contract: assetId must be a non-empty string. */
  const a = await apiRequest<BackendAssetDto>({ method: "GET", path: `/api/assets/${encodeURIComponent(assetId)}` });
  return mapAssetFromBackend(a);
}

// PUBLIC_INTERFACE
export async function createAsset(req: CreateAssetRequest): Promise<AssetDto> {
  /** Contract: creates an asset and returns created AssetDto. */
  const created = await apiRequest<BackendAssetDto>({ method: "POST", path: "/api/assets", body: req });
  return mapAssetFromBackend(created);
}

// PUBLIC_INTERFACE
export async function updateAsset(req: UpdateAssetRequest): Promise<AssetDto> {
  /** Contract: updates asset; req.assetId required. */
  const { assetId, ...rest } = req;
  const updated = await apiRequest<BackendAssetDto>({
    method: "PUT",
    path: `/api/assets/${encodeURIComponent(assetId)}`,
    body: rest,
  });
  return mapAssetFromBackend(updated);
}

// PUBLIC_INTERFACE
export async function deleteAsset(assetId: string, body: DeleteAssetRequest): Promise<void> {
  /** Contract: deletes by assetId (requires body with audit fields). */
  return apiRequest<void>({
    method: "DELETE",
    path: `/api/assets/${encodeURIComponent(assetId)}`,
    body,
  });
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
