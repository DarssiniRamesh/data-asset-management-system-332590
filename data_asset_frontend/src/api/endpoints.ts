import { apiRequest } from "./client";
import type {
  AssetDto,
  CopyAssetRequest,
  CreateAssetRequest,
  DeleteAssetRequest,
  DevLoginRequest,
  DevLoginResponse,
  InputEfMappingRow,
  InputParameterDto,
  SiteAssetRow,
  ThroughputRow,
  UpdateAssetRequest,
} from "./types";

/**
 * Backend responses may be either camelCase (typical JSON) or PascalCase (some .NET serializers / legacy DTOs).
 * We support both to keep the UI resilient across environments.
 */
type BackendAssetDto = {
  // camelCase (per OpenAPI)
  assetId?: number;
  siteId?: string;
  assetGroup?: string;
  processGroup?: string;
  processGroupOtherText?: string | null;
  assetName?: string;
  permitEuId?: string;
  globalUniqueAssetId?: string;
  assetDescription?: string | null;
  stationaryFlag?: boolean | null;
  parentPseudoAssetId?: number | null;
  createdBy?: string;
  createdAt?: string;
  modifiedBy?: string;
  modifiedAt?: string;
  isDeleted?: boolean;
  correlationId?: string;

  // PascalCase (legacy)
  AssetId?: number;
  SiteId?: string;
  AssetGroup?: string;
  ProcessGroup?: string;
  ProcessGroupOtherText?: string | null;
  AssetName?: string;
  PermitEuId?: string;
  GlobalUniqueAssetId?: string;
  AssetDescription?: string | null;
  StationaryFlag?: boolean | null;
  ParentPseudoAssetId?: number | null;
  CreatedBy?: string;
  CreatedAt?: string;
  ModifiedBy?: string;
  ModifiedAt?: string;
  IsDeleted?: boolean;
  CorrelationId?: string;
};

/**
 * Convert backend AssetDto (camelCase or PascalCase) into the UI's canonical camelCase AssetDto.
 */
function mapAssetFromBackend(a: BackendAssetDto): AssetDto {
  const assetIdNum = a.assetId ?? a.AssetId;
  const parentPseudoNum = a.parentPseudoAssetId ?? a.ParentPseudoAssetId;

  // Important: assetId can legitimately be 0 in some environments (e.g., seeded/dev data).
  // We must not collapse it to "" or it can lead to route params like "undefined".
  const assetId =
    assetIdNum !== undefined && assetIdNum !== null ? String(assetIdNum) : "";

  const hasParentPseudo =
    parentPseudoNum !== undefined && parentPseudoNum !== null;

  return {
    assetId,

    siteId: (a.siteId ?? a.SiteId ?? "") as string,
    assetGroup: (a.assetGroup ?? a.AssetGroup ?? "") as string,
    processGroup: (a.processGroup ?? a.ProcessGroup ?? "") as string,
    processGroupOtherText: a.processGroupOtherText ?? a.ProcessGroupOtherText ?? null,

    assetName: (a.assetName ?? a.AssetName ?? "") as string,
    permitEuId: (a.permitEuId ?? a.PermitEuId ?? "") as string,
    globalUniqueAssetId: (a.globalUniqueAssetId ?? a.GlobalUniqueAssetId ?? "") as string,

    assetDescription: a.assetDescription ?? a.AssetDescription ?? null,
    stationaryFlag: a.stationaryFlag ?? a.StationaryFlag ?? null,

    // Backend uses null/non-null to indicate presence, but requires an explicit flag on requests.
    // Boolean(0) is false, but 0 might still be a valid FK value in some data sets, so check nullish instead.
    requiresParentPseudo: hasParentPseudo,
    parentPseudoAssetId: hasParentPseudo ? parentPseudoNum! : null,

    createdBy: a.createdBy ?? a.CreatedBy ?? null,
    modifiedBy: a.modifiedBy ?? a.ModifiedBy ?? null,

    correlationId: (a.correlationId ?? a.CorrelationId ?? "") as string,

    createdAt: a.createdAt ?? a.CreatedAt ?? null,
    modifiedAt: a.modifiedAt ?? a.ModifiedAt ?? null,

    isDeleted: a.isDeleted ?? a.IsDeleted ?? false,
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

type BackendInputParameterDto = {
  // camelCase
  inputParameterId?: number;
  inputParameterName?: string;
  uomId?: number | null;
  isActive?: boolean;

  // PascalCase
  InputParameterId?: number;
  InputParameterName?: string;
  UomId?: number | null;
  IsActive?: boolean;
};

function mapInputParameterFromBackend(p: BackendInputParameterDto): InputParameterDto {
  const idNum = p.inputParameterId ?? p.InputParameterId;
  return {
    inputParameterId: idNum !== undefined && idNum !== null ? String(idNum) : "",
    inputParameterName: (p.inputParameterName ?? p.InputParameterName ?? "") as string,
    uomId: p.uomId ?? p.UomId ?? null,
    isActive: p.isActive ?? p.IsActive ?? true,
  };
}

// PUBLIC_INTERFACE
export async function listInputParameters(assetId: string): Promise<InputParameterDto[]> {
  /** Contract:
   * Inputs:
   *  - assetId: string
   * Output:
   *  - array of InputParameterDto
   * Notes:
   *  - Used by BRD step 04.01 as the primary selector feeding other tabs.
   */
  const rows = await apiRequest<BackendInputParameterDto[]>({
    method: "GET",
    path: `/api/assets/${encodeURIComponent(assetId)}/input-parameters`,
  });

  return Array.isArray(rows) ? rows.map(mapInputParameterFromBackend).filter((r) => r.inputParameterId) : [];
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
