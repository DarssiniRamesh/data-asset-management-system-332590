import { apiRequest } from "./client";
import type {
  AdditionalAssetIdDto,
  AssetDto,
  AssetPropertyDto,
  AssetStatusLogDto,
  ControlDeviceMappingDto,
  ControlDeviceMasterDto,
  CopyAssetRequest,
  CreateAdditionalAssetIdRequest,
  CreateAssetPropertyRequest,
  CreateAssetRequest,
  CreateAssetStatusLogRequest,
  CreateControlDeviceMappingRequest,
  CreateDataInputValueRequest,
  CreateEfSourceMappingRequest,
  CreateParentInputMappingRequest,
  CreateReportingAttributeMappingRequest,
  CreateThroughputEquationRequest,
  CreateThroughputScalarRequest,
  DeleteAssetRequest,
  DevLoginRequest,
  DevLoginResponse,
  EquationMasterDto,
  InputEfMappingRow,
  InputParameterDto,
  ParentInputMappingDto,
  ReportingAttributeMappingDto,
  ReportingProgramMasterDto,
  SiteAssetRow,
  StatusCodeMasterDto,
  ThroughputEquationDto,
  ThroughputRow,
  ThroughputScalarDto,
  UomMasterDto,
  UpdateAdditionalAssetIdRequest,
  UpdateAssetPropertyRequest,
  UpdateAssetRequest,
  UpdateAssetStatusLogRequest,
  UpdateControlDeviceMappingRequest,
  UpdateDataInputValueRequest,
  UpdateEfSourceMappingRequest,
  UpdateParentInputMappingRequest,
  UpdateReportingAttributeMappingRequest,
  UpdateThroughputEquationRequest,
  UpdateThroughputScalarRequest,
  DataInputValueDto,
  EfSourceMappingDto,
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

type BackendId = number | string;

/**
 * Generic helper to map child-resource IDs that may come back as int64 (number) or string,
 * and/or in PascalCase.
 */
function toIdString(v: BackendId | null | undefined): string {
  return v === null || v === undefined ? "" : String(v);
}

// PUBLIC_INTERFACE
export async function login(req: DevLoginRequest): Promise<DevLoginResponse> {
  /** Contract:
   * Inputs: { username, role }
   * Outputs: DevLoginResponse (accessToken, role, expiry)
   * Errors: ApiError on non-2xx
   */
  return apiRequest<DevLoginResponse>({
    method: "POST",
    path: "/api/auth/login",
    body: req,
  });
}

// PUBLIC_INTERFACE
export async function listAssets(): Promise<AssetDto[]> {
  /** Contract: returns all assets (server-side may cap). */
  const list = await apiRequest<BackendAssetDto[]>({
    method: "GET",
    path: "/api/assets",
  });
  return Array.isArray(list) ? list.map(mapAssetFromBackend) : [];
}

// PUBLIC_INTERFACE
export async function getAsset(assetId: string): Promise<AssetDto> {
  /** Contract: assetId must be a non-empty string. */
  const a = await apiRequest<BackendAssetDto>({
    method: "GET",
    path: `/api/assets/${encodeURIComponent(assetId)}`,
  });
  return mapAssetFromBackend(a);
}

// PUBLIC_INTERFACE
export async function createAsset(req: CreateAssetRequest): Promise<AssetDto> {
  /** Contract: creates an asset and returns created AssetDto. */
  const created = await apiRequest<BackendAssetDto>({
    method: "POST",
    path: "/api/assets",
    body: req,
  });
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
export async function deleteAsset(
  assetId: string,
  body: DeleteAssetRequest,
): Promise<void> {
  /** Contract: deletes by assetId (requires body with audit fields). */
  return apiRequest<void>({
    method: "DELETE",
    path: `/api/assets/${encodeURIComponent(assetId)}`,
    body,
  });
}

// PUBLIC_INTERFACE
export async function copyAsset(
  assetId: string,
  req: CopyAssetRequest,
): Promise<unknown> {
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
  return apiRequest<unknown>({
    method: "POST",
    path: "/api/siteassets/managesiteassets",
    body: payload,
  });
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

function mapInputParameterFromBackend(
  p: BackendInputParameterDto,
): InputParameterDto {
  const idNum = p.inputParameterId ?? p.InputParameterId;
  return {
    inputParameterId: idNum !== undefined && idNum !== null ? String(idNum) : "",
    inputParameterName: (p.inputParameterName ?? p.InputParameterName ?? "") as string,
    uomId: p.uomId ?? p.UomId ?? null,
    isActive: p.isActive ?? p.IsActive ?? true,
  };
}

// PUBLIC_INTERFACE
export async function listInputParameters(
  assetId: string,
): Promise<InputParameterDto[]> {
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

  return Array.isArray(rows)
    ? rows.map(mapInputParameterFromBackend).filter((r) => r.inputParameterId)
    : [];
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
    )}/${encodeURIComponent(
      inputParameterId,
    )}/generatethroughputforinputparameter`,
    body: payload,
  });
}

/**
 * ---- Canonical child-resource endpoints (new for step 05.01) ----
 */

type BackendAssetStatusLogDto = {
  assetStatusLogId?: BackendId;
  statusCodeId?: number | null;
  statusStartDate?: string | null;
  statusEndDate?: string | null;
  comment?: string | null;
  createdBy?: string | null;
  createdAt?: string | null;
  modifiedBy?: string | null;
  modifiedAt?: string | null;

  AssetStatusLogId?: BackendId;
  StatusCodeId?: number | null;
  StatusStartDate?: string | null;
  StatusEndDate?: string | null;
  Comment?: string | null;
  CreatedBy?: string | null;
  CreatedAt?: string | null;
  ModifiedBy?: string | null;
  ModifiedAt?: string | null;
};

function mapStatusLogFromBackend(b: BackendAssetStatusLogDto): AssetStatusLogDto {
  return {
    assetStatusLogId: toIdString(b.assetStatusLogId ?? b.AssetStatusLogId),
    statusCodeId: b.statusCodeId ?? b.StatusCodeId ?? null,
    statusStartDate: b.statusStartDate ?? b.StatusStartDate ?? null,
    statusEndDate: b.statusEndDate ?? b.StatusEndDate ?? null,
    comment: b.comment ?? b.Comment ?? null,
    createdBy: b.createdBy ?? b.CreatedBy ?? null,
    createdAt: b.createdAt ?? b.CreatedAt ?? null,
    modifiedBy: b.modifiedBy ?? b.ModifiedBy ?? null,
    modifiedAt: b.modifiedAt ?? b.ModifiedAt ?? null,
  };
}

// PUBLIC_INTERFACE
export async function listAssetStatusLogs(
  assetId: string,
): Promise<AssetStatusLogDto[]> {
  /** GET /api/assets/{assetId}/status-logs */
  const rows = await apiRequest<BackendAssetStatusLogDto[]>({
    method: "GET",
    path: `/api/assets/${encodeURIComponent(assetId)}/status-logs`,
  });
  return Array.isArray(rows) ? rows.map(mapStatusLogFromBackend) : [];
}

// PUBLIC_INTERFACE
export async function createAssetStatusLog(
  assetId: string,
  req: CreateAssetStatusLogRequest,
): Promise<AssetStatusLogDto> {
  /** POST /api/assets/{assetId}/status-logs */
  const created = await apiRequest<BackendAssetStatusLogDto>({
    method: "POST",
    path: `/api/assets/${encodeURIComponent(assetId)}/status-logs`,
    body: req,
  });
  return mapStatusLogFromBackend(created);
}

// PUBLIC_INTERFACE
export async function updateAssetStatusLog(
  assetId: string,
  assetStatusLogId: string,
  req: UpdateAssetStatusLogRequest,
): Promise<AssetStatusLogDto> {
  /** PUT /api/assets/{assetId}/status-logs/{assetStatusLogId} */
  const updated = await apiRequest<BackendAssetStatusLogDto>({
    method: "PUT",
    path: `/api/assets/${encodeURIComponent(assetId)}/status-logs/${encodeURIComponent(
      assetStatusLogId,
    )}`,
    body: req,
  });
  return mapStatusLogFromBackend(updated);
}

type BackendAdditionalAssetIdDto = {
  additionalAssetId?: BackendId;
  idType?: string | null;
  idValue?: string | null;
  isActive?: boolean;
  createdBy?: string | null;
  createdAt?: string | null;
  modifiedBy?: string | null;
  modifiedAt?: string | null;

  AdditionalAssetId?: BackendId;
  IdType?: string | null;
  IdValue?: string | null;
  IsActive?: boolean;
  CreatedBy?: string | null;
  CreatedAt?: string | null;
  ModifiedBy?: string | null;
  ModifiedAt?: string | null;
};

function mapAdditionalIdFromBackend(
  b: BackendAdditionalAssetIdDto,
): AdditionalAssetIdDto {
  return {
    additionalAssetId: toIdString(b.additionalAssetId ?? b.AdditionalAssetId),
    idType: b.idType ?? b.IdType ?? null,
    idValue: b.idValue ?? b.IdValue ?? null,
    isActive: b.isActive ?? b.IsActive ?? true,
    createdBy: b.createdBy ?? b.CreatedBy ?? null,
    createdAt: b.createdAt ?? b.CreatedAt ?? null,
    modifiedBy: b.modifiedBy ?? b.ModifiedBy ?? null,
    modifiedAt: b.modifiedAt ?? b.ModifiedAt ?? null,
  };
}

// PUBLIC_INTERFACE
export async function listAdditionalAssetIds(
  assetId: string,
): Promise<AdditionalAssetIdDto[]> {
  const rows = await apiRequest<BackendAdditionalAssetIdDto[]>({
    method: "GET",
    path: `/api/assets/${encodeURIComponent(assetId)}/additional-ids`,
  });
  return Array.isArray(rows) ? rows.map(mapAdditionalIdFromBackend) : [];
}

// PUBLIC_INTERFACE
export async function createAdditionalAssetId(
  assetId: string,
  req: CreateAdditionalAssetIdRequest,
): Promise<AdditionalAssetIdDto> {
  const created = await apiRequest<BackendAdditionalAssetIdDto>({
    method: "POST",
    path: `/api/assets/${encodeURIComponent(assetId)}/additional-ids`,
    body: req,
  });
  return mapAdditionalIdFromBackend(created);
}

// PUBLIC_INTERFACE
export async function updateAdditionalAssetId(
  assetId: string,
  additionalAssetId: string,
  req: UpdateAdditionalAssetIdRequest,
): Promise<AdditionalAssetIdDto> {
  const updated = await apiRequest<BackendAdditionalAssetIdDto>({
    method: "PUT",
    path: `/api/assets/${encodeURIComponent(assetId)}/additional-ids/${encodeURIComponent(
      additionalAssetId,
    )}`,
    body: req,
  });
  return mapAdditionalIdFromBackend(updated);
}

type BackendAssetPropertyDto = {
  assetPropertyId?: BackendId;
  propertyName?: string | null;
  propertyValue?: string | null;
  isActive?: boolean;
  createdBy?: string | null;
  createdAt?: string | null;
  modifiedBy?: string | null;
  modifiedAt?: string | null;

  AssetPropertyId?: BackendId;
  PropertyName?: string | null;
  PropertyValue?: string | null;
  IsActive?: boolean;
  CreatedBy?: string | null;
  CreatedAt?: string | null;
  ModifiedBy?: string | null;
  ModifiedAt?: string | null;
};

function mapAssetPropertyFromBackend(
  b: BackendAssetPropertyDto,
): AssetPropertyDto {
  return {
    assetPropertyId: toIdString(b.assetPropertyId ?? b.AssetPropertyId),
    propertyName: b.propertyName ?? b.PropertyName ?? null,
    propertyValue: b.propertyValue ?? b.PropertyValue ?? null,
    isActive: b.isActive ?? b.IsActive ?? true,
    createdBy: b.createdBy ?? b.CreatedBy ?? null,
    createdAt: b.createdAt ?? b.CreatedAt ?? null,
    modifiedBy: b.modifiedBy ?? b.ModifiedBy ?? null,
    modifiedAt: b.modifiedAt ?? b.ModifiedAt ?? null,
  };
}

// PUBLIC_INTERFACE
export async function listAssetProperties(
  assetId: string,
): Promise<AssetPropertyDto[]> {
  const rows = await apiRequest<BackendAssetPropertyDto[]>({
    method: "GET",
    path: `/api/assets/${encodeURIComponent(assetId)}/properties`,
  });
  return Array.isArray(rows) ? rows.map(mapAssetPropertyFromBackend) : [];
}

// PUBLIC_INTERFACE
export async function createAssetProperty(
  assetId: string,
  req: CreateAssetPropertyRequest,
): Promise<AssetPropertyDto> {
  const created = await apiRequest<BackendAssetPropertyDto>({
    method: "POST",
    path: `/api/assets/${encodeURIComponent(assetId)}/properties`,
    body: req,
  });
  return mapAssetPropertyFromBackend(created);
}

// PUBLIC_INTERFACE
export async function updateAssetProperty(
  assetId: string,
  assetPropertyId: string,
  req: UpdateAssetPropertyRequest,
): Promise<AssetPropertyDto> {
  const updated = await apiRequest<BackendAssetPropertyDto>({
    method: "PUT",
    path: `/api/assets/${encodeURIComponent(assetId)}/properties/${encodeURIComponent(
      assetPropertyId,
    )}`,
    body: req,
  });
  return mapAssetPropertyFromBackend(updated);
}

type BackendControlDeviceMappingDto = {
  controlDeviceMappingId?: BackendId;
  controlDeviceId?: number | null;
  controlDeviceTag?: string | null;
  isActive?: boolean;
  createdBy?: string | null;
  createdAt?: string | null;
  modifiedBy?: string | null;
  modifiedAt?: string | null;

  ControlDeviceMappingId?: BackendId;
  ControlDeviceId?: number | null;
  ControlDeviceTag?: string | null;
  IsActive?: boolean;
  CreatedBy?: string | null;
  CreatedAt?: string | null;
  ModifiedBy?: string | null;
  ModifiedAt?: string | null;
};

function mapControlDeviceMappingFromBackend(
  b: BackendControlDeviceMappingDto,
): ControlDeviceMappingDto {
  return {
    controlDeviceMappingId: toIdString(
      b.controlDeviceMappingId ?? b.ControlDeviceMappingId,
    ),
    controlDeviceId: b.controlDeviceId ?? b.ControlDeviceId ?? null,
    controlDeviceTag: b.controlDeviceTag ?? b.ControlDeviceTag ?? null,
    isActive: b.isActive ?? b.IsActive ?? true,
    createdBy: b.createdBy ?? b.CreatedBy ?? null,
    createdAt: b.createdAt ?? b.CreatedAt ?? null,
    modifiedBy: b.modifiedBy ?? b.ModifiedBy ?? null,
    modifiedAt: b.modifiedAt ?? b.ModifiedAt ?? null,
  };
}

// PUBLIC_INTERFACE
export async function listControlDeviceMappings(
  assetId: string,
): Promise<ControlDeviceMappingDto[]> {
  const rows = await apiRequest<BackendControlDeviceMappingDto[]>({
    method: "GET",
    path: `/api/assets/${encodeURIComponent(assetId)}/control-device-mappings`,
  });
  return Array.isArray(rows) ? rows.map(mapControlDeviceMappingFromBackend) : [];
}

// PUBLIC_INTERFACE
export async function createControlDeviceMapping(
  assetId: string,
  req: CreateControlDeviceMappingRequest,
): Promise<ControlDeviceMappingDto> {
  const created = await apiRequest<BackendControlDeviceMappingDto>({
    method: "POST",
    path: `/api/assets/${encodeURIComponent(assetId)}/control-device-mappings`,
    body: req,
  });
  return mapControlDeviceMappingFromBackend(created);
}

// PUBLIC_INTERFACE
export async function updateControlDeviceMapping(
  assetId: string,
  controlDeviceMappingId: string,
  req: UpdateControlDeviceMappingRequest,
): Promise<ControlDeviceMappingDto> {
  const updated = await apiRequest<BackendControlDeviceMappingDto>({
    method: "PUT",
    path: `/api/assets/${encodeURIComponent(
      assetId,
    )}/control-device-mappings/${encodeURIComponent(controlDeviceMappingId)}`,
    body: req,
  });
  return mapControlDeviceMappingFromBackend(updated);
}

type BackendReportingAttributeMappingDto = {
  reportingAttributeMappingId?: BackendId;
  reportingProgramId?: number | null;
  reportingAttributeName?: string | null;
  reportingAttributeValue?: string | null;
  isActive?: boolean;
  createdBy?: string | null;
  createdAt?: string | null;
  modifiedBy?: string | null;
  modifiedAt?: string | null;

  ReportingAttributeMappingId?: BackendId;
  ReportingProgramId?: number | null;
  ReportingAttributeName?: string | null;
  ReportingAttributeValue?: string | null;
  IsActive?: boolean;
  CreatedBy?: string | null;
  CreatedAt?: string | null;
  ModifiedBy?: string | null;
  ModifiedAt?: string | null;
};

function mapReportingAttributeMappingFromBackend(
  b: BackendReportingAttributeMappingDto,
): ReportingAttributeMappingDto {
  return {
    reportingAttributeMappingId: toIdString(
      b.reportingAttributeMappingId ?? b.ReportingAttributeMappingId,
    ),
    reportingProgramId: b.reportingProgramId ?? b.ReportingProgramId ?? null,
    reportingAttributeName:
      b.reportingAttributeName ?? b.ReportingAttributeName ?? null,
    reportingAttributeValue:
      b.reportingAttributeValue ?? b.ReportingAttributeValue ?? null,
    isActive: b.isActive ?? b.IsActive ?? true,
    createdBy: b.createdBy ?? b.CreatedBy ?? null,
    createdAt: b.createdAt ?? b.CreatedAt ?? null,
    modifiedBy: b.modifiedBy ?? b.ModifiedBy ?? null,
    modifiedAt: b.modifiedAt ?? b.ModifiedAt ?? null,
  };
}

// PUBLIC_INTERFACE
export async function listReportingAttributeMappings(
  assetId: string,
): Promise<ReportingAttributeMappingDto[]> {
  const rows = await apiRequest<BackendReportingAttributeMappingDto[]>({
    method: "GET",
    path: `/api/assets/${encodeURIComponent(assetId)}/reporting-attribute-mappings`,
  });
  return Array.isArray(rows) ? rows.map(mapReportingAttributeMappingFromBackend) : [];
}

// PUBLIC_INTERFACE
export async function createReportingAttributeMapping(
  assetId: string,
  req: CreateReportingAttributeMappingRequest,
): Promise<ReportingAttributeMappingDto> {
  const created = await apiRequest<BackendReportingAttributeMappingDto>({
    method: "POST",
    path: `/api/assets/${encodeURIComponent(assetId)}/reporting-attribute-mappings`,
    body: req,
  });
  return mapReportingAttributeMappingFromBackend(created);
}

// PUBLIC_INTERFACE
export async function updateReportingAttributeMapping(
  assetId: string,
  reportingAttributeMappingId: string,
  req: UpdateReportingAttributeMappingRequest,
): Promise<ReportingAttributeMappingDto> {
  const updated = await apiRequest<BackendReportingAttributeMappingDto>({
    method: "PUT",
    path: `/api/assets/${encodeURIComponent(
      assetId,
    )}/reporting-attribute-mappings/${encodeURIComponent(reportingAttributeMappingId)}`,
    body: req,
  });
  return mapReportingAttributeMappingFromBackend(updated);
}

type BackendParentInputMappingDto = {
  parentInputMappingId?: BackendId;
  parentInputParameterId?: number | null;
  isActive?: boolean;
  createdBy?: string | null;
  createdAt?: string | null;
  modifiedBy?: string | null;
  modifiedAt?: string | null;

  ParentInputMappingId?: BackendId;
  ParentInputParameterId?: number | null;
  IsActive?: boolean;
  CreatedBy?: string | null;
  CreatedAt?: string | null;
  ModifiedBy?: string | null;
  ModifiedAt?: string | null;
};

function mapParentInputMappingFromBackend(
  b: BackendParentInputMappingDto,
): ParentInputMappingDto {
  return {
    parentInputMappingId: toIdString(
      b.parentInputMappingId ?? b.ParentInputMappingId,
    ),
    parentInputParameterId:
      b.parentInputParameterId ?? b.ParentInputParameterId ?? null,
    isActive: b.isActive ?? b.IsActive ?? true,
    createdBy: b.createdBy ?? b.CreatedBy ?? null,
    createdAt: b.createdAt ?? b.CreatedAt ?? null,
    modifiedBy: b.modifiedBy ?? b.ModifiedBy ?? null,
    modifiedAt: b.modifiedAt ?? b.ModifiedAt ?? null,
  };
}

// PUBLIC_INTERFACE
export async function listParentInputMappings(
  assetId: string,
  childInputParameterId: string,
): Promise<ParentInputMappingDto[]> {
  const rows = await apiRequest<BackendParentInputMappingDto[]>({
    method: "GET",
    path: `/api/assets/${encodeURIComponent(
      assetId,
    )}/input-parameters/${encodeURIComponent(
      childInputParameterId,
    )}/parent-input-mappings`,
  });
  return Array.isArray(rows) ? rows.map(mapParentInputMappingFromBackend) : [];
}

// PUBLIC_INTERFACE
export async function createParentInputMapping(
  assetId: string,
  childInputParameterId: string,
  req: CreateParentInputMappingRequest,
): Promise<ParentInputMappingDto> {
  const created = await apiRequest<BackendParentInputMappingDto>({
    method: "POST",
    path: `/api/assets/${encodeURIComponent(
      assetId,
    )}/input-parameters/${encodeURIComponent(
      childInputParameterId,
    )}/parent-input-mappings`,
    body: req,
  });
  return mapParentInputMappingFromBackend(created);
}

// PUBLIC_INTERFACE
export async function updateParentInputMapping(
  assetId: string,
  childInputParameterId: string,
  parentInputMappingId: string,
  req: UpdateParentInputMappingRequest,
): Promise<ParentInputMappingDto> {
  const updated = await apiRequest<BackendParentInputMappingDto>({
    method: "PUT",
    path: `/api/assets/${encodeURIComponent(
      assetId,
    )}/input-parameters/${encodeURIComponent(
      childInputParameterId,
    )}/parent-input-mappings/${encodeURIComponent(parentInputMappingId)}`,
    body: req,
  });
  return mapParentInputMappingFromBackend(updated);
}

type BackendEfSourceMappingDto = {
  efSourceMappingId?: BackendId;
  efSourceId?: string | null;
  isActive?: boolean;
  createdBy?: string | null;
  createdAt?: string | null;
  modifiedBy?: string | null;
  modifiedAt?: string | null;

  EfSourceMappingId?: BackendId;
  EfSourceId?: string | null;
  IsActive?: boolean;
  CreatedBy?: string | null;
  CreatedAt?: string | null;
  ModifiedBy?: string | null;
  ModifiedAt?: string | null;
};

function mapEfSourceMappingFromBackend(
  b: BackendEfSourceMappingDto,
): EfSourceMappingDto {
  return {
    efSourceMappingId: toIdString(b.efSourceMappingId ?? b.EfSourceMappingId),
    efSourceId: b.efSourceId ?? b.EfSourceId ?? null,
    isActive: b.isActive ?? b.IsActive ?? true,
    createdBy: b.createdBy ?? b.CreatedBy ?? null,
    createdAt: b.createdAt ?? b.CreatedAt ?? null,
    modifiedBy: b.modifiedBy ?? b.ModifiedBy ?? null,
    modifiedAt: b.modifiedAt ?? b.ModifiedAt ?? null,
  };
}

// PUBLIC_INTERFACE
export async function listEfSourceMappings(
  assetId: string,
  inputParameterId: string,
): Promise<EfSourceMappingDto[]> {
  const rows = await apiRequest<BackendEfSourceMappingDto[]>({
    method: "GET",
    path: `/api/assets/${encodeURIComponent(
      assetId,
    )}/input-parameters/${encodeURIComponent(inputParameterId)}/ef-source-mappings`,
  });
  return Array.isArray(rows) ? rows.map(mapEfSourceMappingFromBackend) : [];
}

// PUBLIC_INTERFACE
export async function createEfSourceMapping(
  assetId: string,
  inputParameterId: string,
  req: CreateEfSourceMappingRequest,
): Promise<EfSourceMappingDto> {
  const created = await apiRequest<BackendEfSourceMappingDto>({
    method: "POST",
    path: `/api/assets/${encodeURIComponent(
      assetId,
    )}/input-parameters/${encodeURIComponent(inputParameterId)}/ef-source-mappings`,
    body: req,
  });
  return mapEfSourceMappingFromBackend(created);
}

// PUBLIC_INTERFACE
export async function updateEfSourceMapping(
  assetId: string,
  inputParameterId: string,
  efSourceMappingId: string,
  req: UpdateEfSourceMappingRequest,
): Promise<EfSourceMappingDto> {
  const updated = await apiRequest<BackendEfSourceMappingDto>({
    method: "PUT",
    path: `/api/assets/${encodeURIComponent(
      assetId,
    )}/input-parameters/${encodeURIComponent(
      inputParameterId,
    )}/ef-source-mappings/${encodeURIComponent(efSourceMappingId)}`,
    body: req,
  });
  return mapEfSourceMappingFromBackend(updated);
}

type BackendThroughputEquationDto = {
  throughputEquationId?: BackendId;
  equationMasterId?: number | null;
  equationText?: string | null;
  isActive?: boolean;

  ThroughputEquationId?: BackendId;
  EquationMasterId?: number | null;
  EquationText?: string | null;
  IsActive?: boolean;
};

function mapThroughputEquationFromBackend(
  b: BackendThroughputEquationDto,
): ThroughputEquationDto {
  return {
    throughputEquationId: toIdString(b.throughputEquationId ?? b.ThroughputEquationId),
    equationMasterId: b.equationMasterId ?? b.EquationMasterId ?? null,
    equationText: b.equationText ?? b.EquationText ?? null,
    isActive: b.isActive ?? b.IsActive ?? true,
  };
}

// PUBLIC_INTERFACE
export async function listThroughputEquations(
  assetId: string,
  inputParameterId: string,
): Promise<ThroughputEquationDto[]> {
  const rows = await apiRequest<BackendThroughputEquationDto[]>({
    method: "GET",
    path: `/api/assets/${encodeURIComponent(
      assetId,
    )}/input-parameters/${encodeURIComponent(
      inputParameterId,
    )}/throughput-equations`,
  });
  return Array.isArray(rows) ? rows.map(mapThroughputEquationFromBackend) : [];
}

// PUBLIC_INTERFACE
export async function createThroughputEquation(
  assetId: string,
  inputParameterId: string,
  req: CreateThroughputEquationRequest,
): Promise<ThroughputEquationDto> {
  const created = await apiRequest<BackendThroughputEquationDto>({
    method: "POST",
    path: `/api/assets/${encodeURIComponent(
      assetId,
    )}/input-parameters/${encodeURIComponent(
      inputParameterId,
    )}/throughput-equations`,
    body: req,
  });
  return mapThroughputEquationFromBackend(created);
}

// PUBLIC_INTERFACE
export async function updateThroughputEquation(
  assetId: string,
  inputParameterId: string,
  throughputEquationId: string,
  req: UpdateThroughputEquationRequest,
): Promise<ThroughputEquationDto> {
  const updated = await apiRequest<BackendThroughputEquationDto>({
    method: "PUT",
    path: `/api/assets/${encodeURIComponent(
      assetId,
    )}/input-parameters/${encodeURIComponent(
      inputParameterId,
    )}/throughput-equations/${encodeURIComponent(throughputEquationId)}`,
    body: req,
  });
  return mapThroughputEquationFromBackend(updated);
}

type BackendThroughputScalarDto = {
  throughputScalarId?: BackendId;
  scalarName?: string | null;
  scalarValue?: number | null;
  uomId?: number | null;
  isActive?: boolean;

  ThroughputScalarId?: BackendId;
  ScalarName?: string | null;
  ScalarValue?: number | null;
  UomId?: number | null;
  IsActive?: boolean;
};

function mapThroughputScalarFromBackend(
  b: BackendThroughputScalarDto,
): ThroughputScalarDto {
  return {
    throughputScalarId: toIdString(b.throughputScalarId ?? b.ThroughputScalarId),
    scalarName: b.scalarName ?? b.ScalarName ?? null,
    scalarValue: b.scalarValue ?? b.ScalarValue ?? null,
    uomId: b.uomId ?? b.UomId ?? null,
    isActive: b.isActive ?? b.IsActive ?? true,
  };
}

// PUBLIC_INTERFACE
export async function listThroughputScalars(
  assetId: string,
  inputParameterId: string,
  throughputEquationId: string,
): Promise<ThroughputScalarDto[]> {
  const rows = await apiRequest<BackendThroughputScalarDto[]>({
    method: "GET",
    path: `/api/assets/${encodeURIComponent(
      assetId,
    )}/input-parameters/${encodeURIComponent(
      inputParameterId,
    )}/throughput-equations/${encodeURIComponent(
      throughputEquationId,
    )}/throughput-scalars`,
  });
  return Array.isArray(rows) ? rows.map(mapThroughputScalarFromBackend) : [];
}

// PUBLIC_INTERFACE
export async function createThroughputScalar(
  assetId: string,
  inputParameterId: string,
  throughputEquationId: string,
  req: CreateThroughputScalarRequest,
): Promise<ThroughputScalarDto> {
  const created = await apiRequest<BackendThroughputScalarDto>({
    method: "POST",
    path: `/api/assets/${encodeURIComponent(
      assetId,
    )}/input-parameters/${encodeURIComponent(
      inputParameterId,
    )}/throughput-equations/${encodeURIComponent(
      throughputEquationId,
    )}/throughput-scalars`,
    body: req,
  });
  return mapThroughputScalarFromBackend(created);
}

// PUBLIC_INTERFACE
export async function updateThroughputScalar(
  assetId: string,
  inputParameterId: string,
  throughputEquationId: string,
  throughputScalarId: string,
  req: UpdateThroughputScalarRequest,
): Promise<ThroughputScalarDto> {
  const updated = await apiRequest<BackendThroughputScalarDto>({
    method: "PUT",
    path: `/api/assets/${encodeURIComponent(
      assetId,
    )}/input-parameters/${encodeURIComponent(
      inputParameterId,
    )}/throughput-equations/${encodeURIComponent(
      throughputEquationId,
    )}/throughput-scalars/${encodeURIComponent(throughputScalarId)}`,
    body: req,
  });
  return mapThroughputScalarFromBackend(updated);
}

type BackendDataInputValueDto = {
  dataInputValueId?: BackendId;
  valueText?: string | null;
  valueNumber?: number | null;
  valueDateTime?: string | null;
  isActive?: boolean;

  DataInputValueId?: BackendId;
  ValueText?: string | null;
  ValueNumber?: number | null;
  ValueDateTime?: string | null;
  IsActive?: boolean;
};

function mapDataInputValueFromBackend(
  b: BackendDataInputValueDto,
): DataInputValueDto {
  return {
    dataInputValueId: toIdString(b.dataInputValueId ?? b.DataInputValueId),
    valueText: b.valueText ?? b.ValueText ?? null,
    valueNumber: b.valueNumber ?? b.ValueNumber ?? null,
    valueDateTime: b.valueDateTime ?? b.ValueDateTime ?? null,
    isActive: b.isActive ?? b.IsActive ?? true,
  };
}

// PUBLIC_INTERFACE
export async function listDataInputValues(
  assetId: string,
  inputParameterId: string,
): Promise<DataInputValueDto[]> {
  const rows = await apiRequest<BackendDataInputValueDto[]>({
    method: "GET",
    path: `/api/assets/${encodeURIComponent(
      assetId,
    )}/input-parameters/${encodeURIComponent(inputParameterId)}/data-input-values`,
  });
  return Array.isArray(rows) ? rows.map(mapDataInputValueFromBackend) : [];
}

// PUBLIC_INTERFACE
export async function createDataInputValue(
  assetId: string,
  inputParameterId: string,
  req: CreateDataInputValueRequest,
): Promise<DataInputValueDto> {
  const created = await apiRequest<BackendDataInputValueDto>({
    method: "POST",
    path: `/api/assets/${encodeURIComponent(
      assetId,
    )}/input-parameters/${encodeURIComponent(inputParameterId)}/data-input-values`,
    body: req,
  });
  return mapDataInputValueFromBackend(created);
}

// PUBLIC_INTERFACE
export async function updateDataInputValue(
  assetId: string,
  inputParameterId: string,
  dataInputValueId: string,
  req: UpdateDataInputValueRequest,
): Promise<DataInputValueDto> {
  const updated = await apiRequest<BackendDataInputValueDto>({
    method: "PUT",
    path: `/api/assets/${encodeURIComponent(
      assetId,
    )}/input-parameters/${encodeURIComponent(
      inputParameterId,
    )}/data-input-values/${encodeURIComponent(dataInputValueId)}`,
    body: req,
  });
  return mapDataInputValueFromBackend(updated);
}

/**
 * ---- Master data endpoints (new for step 05.01) ----
 * These are needed by certain tabs (e.g. control devices, UOMs, equations, status codes, reporting programs).
 */

type BackendMasterBase = Record<string, unknown>;

// Helpers map potentially PascalCase IDs as strings
function pickId(
  obj: BackendMasterBase,
  ...keys: string[]
): string {
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null) return String(v);
  }
  return "";
}

// PUBLIC_INTERFACE
export async function queryUomMasters(params?: {
  activeOnly?: boolean;
  limit?: number;
}): Promise<UomMasterDto[]> {
  const qs = new URLSearchParams();
  if (params?.activeOnly !== undefined) qs.set("ActiveOnly", String(params.activeOnly));
  if (params?.limit !== undefined) qs.set("Limit", String(params.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";

  const rows = await apiRequest<BackendMasterBase[]>({
    method: "GET",
    path: `/api/masters/uoms${suffix}`,
  });

  return Array.isArray(rows)
    ? rows.map((r) => ({
        uomId: pickId(r, "uomId", "UomId"),
        uomName: (r["uomName"] ?? r["UomName"] ?? null) as string | null,
        uomCode: (r["uomCode"] ?? r["UomCode"] ?? null) as string | null,
        isActive: (r["isActive"] ?? r["IsActive"] ?? true) as boolean,
      }))
    : [];
}

// PUBLIC_INTERFACE
export async function queryReportingProgramMasters(params?: {
  activeOnly?: boolean;
  limit?: number;
}): Promise<ReportingProgramMasterDto[]> {
  const qs = new URLSearchParams();
  if (params?.activeOnly !== undefined) qs.set("ActiveOnly", String(params.activeOnly));
  if (params?.limit !== undefined) qs.set("Limit", String(params.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";

  const rows = await apiRequest<BackendMasterBase[]>({
    method: "GET",
    path: `/api/masters/reporting-programs${suffix}`,
  });

  return Array.isArray(rows)
    ? rows.map((r) => ({
        reportingProgramId: pickId(r, "reportingProgramId", "ReportingProgramId"),
        programName: (r["programName"] ?? r["ProgramName"] ?? null) as string | null,
        isActive: (r["isActive"] ?? r["IsActive"] ?? true) as boolean,
      }))
    : [];
}

// PUBLIC_INTERFACE
export async function queryControlDeviceMasters(params?: {
  siteId?: string;
  activeOnly?: boolean;
  limit?: number;
}): Promise<ControlDeviceMasterDto[]> {
  const qs = new URLSearchParams();
  if (params?.siteId) qs.set("siteId", params.siteId);
  if (params?.activeOnly !== undefined) qs.set("ActiveOnly", String(params.activeOnly));
  if (params?.limit !== undefined) qs.set("Limit", String(params.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";

  const rows = await apiRequest<BackendMasterBase[]>({
    method: "GET",
    path: `/api/masters/control-devices${suffix}`,
  });

  return Array.isArray(rows)
    ? rows.map((r) => ({
        controlDeviceId: pickId(r, "controlDeviceId", "ControlDeviceId"),
        siteId: (r["siteId"] ?? r["SiteId"] ?? null) as string | null,
        deviceName: (r["deviceName"] ?? r["DeviceName"] ?? null) as string | null,
        deviceTag: (r["deviceTag"] ?? r["DeviceTag"] ?? null) as string | null,
        isActive: (r["isActive"] ?? r["IsActive"] ?? true) as boolean,
      }))
    : [];
}

// PUBLIC_INTERFACE
export async function queryEquationMasters(params?: {
  activeOnly?: boolean;
  limit?: number;
}): Promise<EquationMasterDto[]> {
  const qs = new URLSearchParams();
  if (params?.activeOnly !== undefined) qs.set("ActiveOnly", String(params.activeOnly));
  if (params?.limit !== undefined) qs.set("Limit", String(params.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";

  const rows = await apiRequest<BackendMasterBase[]>({
    method: "GET",
    path: `/api/masters/equations${suffix}`,
  });

  return Array.isArray(rows)
    ? rows.map((r) => ({
        equationMasterId: pickId(r, "equationMasterId", "EquationMasterId"),
        equationName: (r["equationName"] ?? r["EquationName"] ?? null) as string | null,
        equationText: (r["equationText"] ?? r["EquationText"] ?? null) as string | null,
        isActive: (r["isActive"] ?? r["IsActive"] ?? true) as boolean,
      }))
    : [];
}

// PUBLIC_INTERFACE
export async function queryStatusCodeMasters(params?: {
  activeOnly?: boolean;
  limit?: number;
}): Promise<StatusCodeMasterDto[]> {
  const qs = new URLSearchParams();
  if (params?.activeOnly !== undefined) qs.set("ActiveOnly", String(params.activeOnly));
  if (params?.limit !== undefined) qs.set("Limit", String(params.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";

  const rows = await apiRequest<BackendMasterBase[]>({
    method: "GET",
    path: `/api/masters/status-codes${suffix}`,
  });

  return Array.isArray(rows)
    ? rows.map((r) => ({
        statusCodeId: pickId(r, "statusCodeId", "StatusCodeId"),
        statusCode: (r["statusCode"] ?? r["StatusCode"] ?? null) as string | null,
        statusDescription: (r["statusDescription"] ?? r["StatusDescription"] ?? null) as string | null,
        isActive: (r["isActive"] ?? r["IsActive"] ?? true) as boolean,
      }))
    : [];
}
