import { apiRequest } from "./client";
import type {
  AdditionalAssetIdDto,
  AssetCopyLineageDto,
  AssetDto,
  AssetPropertyDto,
  AssetStatusLogDto,
  ChemicalRawMaterialDto,
  ChemicalSdsDto,
  ControlDeviceMappingDto,
  ControlDeviceMasterDto,
  CopyAssetRequest,
  CreateAdditionalAssetIdRequest,
  CreateAssetCopyLineageRequest,
  CreateAssetPropertyRequest,
  CreateAssetRequest,
  CreateAssetStatusLogRequest,
  CreateChemicalRawMaterialRequest,
  CreateChemicalSdsRequest,
  CreateControlDeviceMappingRequest,
  CreateControlDeviceMasterRequest,
  CreateDataInputValueRequest,
  CreateEfSourceMappingRequest,
  CreateEquationMasterRequest,
  CreateInputParameterRequest,
  CreateLabDataConfigurationRequest,
  CreateParentInputMappingRequest,
  CreateReportingAttributeMappingRequest,
  CreateReportingProgramMasterRequest,
  CreateSiteProfileRequest,
  CreateStatusCodeMasterRequest,
  CreateThroughputEquationRequest,
  CreateThroughputScalarRequest,
  CreateUomMasterRequest,
  CreateWaterProcessConfigurationRequest,
  CreateWwtsProcessStreamRequest,
  DataInputValueDto,
  DeleteAssetRequest,
  DevLoginRequest,
  DevLoginResponse,
  EfSourceMappingDto,
  EquationMasterDto,
  InputEfMappingRow,
  InputParameterDto,
  LabDataConfigurationDto,
  ParentInputMappingDto,
  ReportingAttributeMappingDto,
  ReportingProgramMasterDto,
  SiteAssetRow,
  SiteProfileDto,
  StatusCodeMasterDto,
  ThroughputEquationDto,
  ThroughputRow,
  ThroughputScalarDto,
  UomMasterDto,
  UpdateAdditionalAssetIdRequest,
  UpdateAssetPropertyRequest,
  UpdateAssetRequest,
  UpdateAssetStatusLogRequest,
  UpdateChemicalRawMaterialRequest,
  UpdateChemicalSdsRequest,
  UpdateControlDeviceMappingRequest,
  UpdateControlDeviceMasterRequest,
  UpdateDataInputValueRequest,
  UpdateEfSourceMappingRequest,
  UpdateEquationMasterRequest,
  UpdateInputParameterRequest,
  UpdateLabDataConfigurationRequest,
  UpdateParentInputMappingRequest,
  UpdateReportingAttributeMappingRequest,
  UpdateReportingProgramMasterRequest,
  UpdateSiteProfileRequest,
  UpdateStatusCodeMasterRequest,
  UpdateThroughputEquationRequest,
  UpdateThroughputScalarRequest,
  UpdateUomMasterRequest,
  UpdateWaterProcessConfigurationRequest,
  UpdateWwtsProcessStreamRequest,
  WaterProcessConfigurationDto,
  WwtsProcessStreamDto,
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

type BackendAssetCopyLineageDto = {
  assetCopyLineageId?: BackendId;
  copyOperationId?: string | null;
  sourceAssetId?: BackendId;
  targetAssetId?: BackendId;
  status?: string | null;
  statusDetail?: string | null;
  createdAt?: string | null;

  AssetCopyLineageId?: BackendId;
  CopyOperationId?: string | null;
  SourceAssetId?: BackendId;
  TargetAssetId?: BackendId;
  Status?: string | null;
  StatusDetail?: string | null;
  CreatedAt?: string | null;
};

function mapAssetCopyLineageFromBackend(
  b: BackendAssetCopyLineageDto,
): AssetCopyLineageDto {
  return {
    assetCopyLineageId: toIdString(b.assetCopyLineageId ?? b.AssetCopyLineageId) || null,
    copyOperationId: b.copyOperationId ?? b.CopyOperationId ?? null,
    sourceAssetId: toIdString(b.sourceAssetId ?? b.SourceAssetId) || null,
    targetAssetId: toIdString(b.targetAssetId ?? b.TargetAssetId) || null,
    status: b.status ?? b.Status ?? null,
    statusDetail: b.statusDetail ?? b.StatusDetail ?? null,
    createdAt: b.createdAt ?? b.CreatedAt ?? null,
  };
}

// PUBLIC_INTERFACE
export async function createAssetCopyLineage(
  req: CreateAssetCopyLineageRequest,
): Promise<AssetCopyLineageDto> {
  /** Contract: POST /api/asset-copy-lineage */
  const created = await apiRequest<BackendAssetCopyLineageDto>({
    method: "POST",
    path: "/api/asset-copy-lineage",
    body: req,
  });
  return mapAssetCopyLineageFromBackend(created);
}

// PUBLIC_INTERFACE
export async function queryAssetCopyLineage(params?: {
  copyOperationId?: string;
  sourceAssetId?: string;
  targetAssetId?: string;
  limit?: number;
}): Promise<AssetCopyLineageDto[]> {
  /** Contract: GET /api/asset-copy-lineage?CopyOperationId=&SourceAssetId=&TargetAssetId=&Limit= */
  const qs = new URLSearchParams();
  if (params?.copyOperationId) qs.set("CopyOperationId", params.copyOperationId);
  if (params?.sourceAssetId) qs.set("SourceAssetId", params.sourceAssetId);
  if (params?.targetAssetId) qs.set("TargetAssetId", params.targetAssetId);
  if (params?.limit !== undefined) qs.set("Limit", String(params.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";

  const rows = await apiRequest<BackendAssetCopyLineageDto[]>({
    method: "GET",
    path: `/api/asset-copy-lineage${suffix}`,
  });

  return Array.isArray(rows) ? rows.map(mapAssetCopyLineageFromBackend) : [];
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
  reportingProgramId?: number | null;
  inputType?: string | null;
  dataEntryFrequency?: string | null;
  isActive?: boolean;

  // PascalCase
  InputParameterId?: number;
  InputParameterName?: string;
  UomId?: number | null;
  ReportingProgramId?: number | null;
  InputType?: string | null;
  DataEntryFrequency?: string | null;
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
    reportingProgramId: p.reportingProgramId ?? p.ReportingProgramId ?? null,
    inputType: p.inputType ?? p.InputType ?? null,
    dataEntryFrequency: p.dataEntryFrequency ?? p.DataEntryFrequency ?? null,
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
export async function createInputParameter(
  assetId: string,
  req: CreateInputParameterRequest,
): Promise<InputParameterDto> {
  /** POST /api/assets/{assetId}/input-parameters */
  const created = await apiRequest<BackendInputParameterDto>({
    method: "POST",
    path: `/api/assets/${encodeURIComponent(assetId)}/input-parameters`,
    body: req,
  });
  return mapInputParameterFromBackend(created);
}

// PUBLIC_INTERFACE
export async function updateInputParameter(
  assetId: string,
  inputParameterId: string,
  req: UpdateInputParameterRequest,
): Promise<InputParameterDto> {
  /** PUT /api/assets/{assetId}/input-parameters/{inputParameterId} */
  const updated = await apiRequest<BackendInputParameterDto>({
    method: "PUT",
    path: `/api/assets/${encodeURIComponent(
      assetId,
    )}/input-parameters/${encodeURIComponent(inputParameterId)}`,
    body: req,
  });
  return mapInputParameterFromBackend(updated);
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
  efSourceSetOrTable?: string | null;
  equationSetup?: string | null;
  scalarValues?: string | null;
  reportingProgramId?: number | null;

  // Some deployments might include flags/audit in the payload
  isActive?: boolean;
  createdBy?: string | null;
  createdAt?: string | null;
  modifiedBy?: string | null;
  modifiedAt?: string | null;

  EfSourceMappingId?: BackendId;
  EfSourceSetOrTable?: string | null;
  EquationSetup?: string | null;
  ScalarValues?: string | null;
  ReportingProgramId?: number | null;

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

    efSourceSetOrTable:
      b.efSourceSetOrTable ?? b.EfSourceSetOrTable ?? null,
    equationSetup: b.equationSetup ?? b.EquationSetup ?? null,
    scalarValues: b.scalarValues ?? b.ScalarValues ?? null,
    reportingProgramId: b.reportingProgramId ?? b.ReportingProgramId ?? null,

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
function pickId(obj: BackendMasterBase, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null) return String(v);
  }
  return "";
}

/**
 * Extract a list payload from API responses that may be either:
 *  - a raw JSON array (canonical, per OpenAPI)
 *  - an object wrapper containing the array under a common key (legacy/proxy patterns)
 *
 * This is intentionally small and reusable to avoid one-off patches per endpoint.
 */
function unwrapListResponse(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  if (!v || typeof v !== "object") return [];

  const obj = v as Record<string, unknown>;
  const candidates = [obj.items, obj.data, obj.value, obj.results];

  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }

  return [];
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
        uomId: pickId(r, "uomId", "UomId", "uomId", "UomId"),
        uomKey: (r["uomKey"] ?? r["UomKey"] ?? r["uomName"] ?? r["UomName"] ?? null) as string | null,
        displayLabel: (r["displayLabel"] ??
          r["DisplayLabel"] ??
          r["uomCode"] ??
          r["UomCode"] ??
          null) as string | null,
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
        programKey: (r["programKey"] ?? r["ProgramKey"] ?? null) as string | null,
        displayLabel: (r["displayLabel"] ??
          r["DisplayLabel"] ??
          r["programName"] ??
          r["ProgramName"] ??
          null) as string | null,
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
  /** ControlDeviceMastersQuery (canonical flow)
   * Inputs:
   *  - siteId?: string (optional; normalized via trim; empty becomes undefined)
   *  - activeOnly?: boolean
   *  - limit?: number
   * Output:
   *  - ControlDeviceMasterDto[]
   * Errors:
   *  - Throws ApiError (from apiRequest) on non-2xx
   * Side effects:
   *  - Network call to GET /api/masters/control-devices
   * Observability:
   *  - Debug logs contain normalized params + returned count.
   */
  const qs = new URLSearchParams();

  // Normalize siteId to avoid “invisible mismatch” bugs (e.g. trailing whitespace on Asset.siteId).
  const normalizedSiteId =
    params?.siteId !== undefined && params?.siteId !== null
      ? params.siteId.trim()
      : undefined;

  // IMPORTANT:
  // OpenAPI uses `siteId` (lower camelCase). In practice, some environments are sensitive to query-key casing
  // (legacy binders / proxies). To be resilient, send BOTH `siteId` and `SiteId` when a value is provided.
  if (normalizedSiteId) {
    qs.set("siteId", normalizedSiteId);
    qs.set("SiteId", normalizedSiteId);
  }

  // OpenAPI for this endpoint uses `ActiveOnly` (PascalCase A/O). Use that canonical key.
  if (params?.activeOnly !== undefined)
    qs.set("ActiveOnly", String(params.activeOnly));

  // OpenAPI uses `Limit` (PascalCase). Use that canonical key.
  if (params?.limit !== undefined) qs.set("Limit", String(params.limit));

  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const path = `/api/masters/control-devices${suffix}`;

  // Lazy import to avoid circular deps / reduce bundle impact for other callers.
  const { logger } = await import("../lib/logger");

  logger.debug("ControlDeviceMastersQuery:start", {
    siteId: normalizedSiteId ?? null,
    activeOnly: params?.activeOnly ?? null,
    limit: params?.limit ?? null,
    path,
  });

  const raw = await apiRequest<unknown>({
    method: "GET",
    path,
  });

  // Some environments/proxies wrap arrays, even when the OpenAPI advertises a top-level array.
  const rows = unwrapListResponse(raw) as BackendMasterBase[];

  const mapped = rows
    .map((r) => {
      // Accept camelCase, PascalCase, and snake_case (DB schema) shapes.
      // Some dev seeds/legacy serializers may return different casing.
      // Some environments may return the primary key as `id` (generic) rather than `controlDeviceId`.
      // Treat these as equivalent to keep the UI robust across serializers/seeds.
      const controlDeviceId = pickId(
        r,
        "controlDeviceId",
        "ControlDeviceId",
        "control_device_id",
        "controlDeviceID",
        "ControlDeviceID",
        "id",
        "Id",
      ).trim();

      const siteId = (r["siteId"] ?? r["SiteId"] ?? r["site_id"] ?? null) as string | null;

      const deviceKey = (r["deviceKey"] ??
        r["DeviceKey"] ??
        r["device_key"] ??
        // legacy fallbacks
        r["deviceTag"] ??
        r["DeviceTag"] ??
        // other common variants
        r["tag"] ??
        r["Tag"] ??
        null) as string | null;

      const displayLabel = (r["displayLabel"] ??
        r["DisplayLabel"] ??
        r["display_label"] ??
        // legacy fallbacks
        r["deviceName"] ??
        r["DeviceName"] ??
        // other common variants
        r["name"] ??
        r["Name"] ??
        null) as string | null;

      return {
        controlDeviceId,
        siteId,
        deviceKey,
        displayLabel,
        isActive: (r["isActive"] ?? r["IsActive"] ?? r["is_active"] ?? true) as boolean,
      };
    })
    // Drop rows without usable IDs; prevents blank dropdown items and value mismatch issues.
    .filter((r) => Boolean(r.controlDeviceId));

  logger.debug("ControlDeviceMastersQuery:ok", {
    count: mapped.length,
    siteId: normalizedSiteId ?? null,
  });

  return mapped;
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
        equationKey: (r["equationKey"] ??
          r["EquationKey"] ??
          r["equationName"] ??
          r["EquationName"] ??
          null) as string | null,
        versionLabel: (r["versionLabel"] ??
          r["VersionLabel"] ??
          r["equationText"] ??
          r["EquationText"] ??
          null) as string | null,
        effectiveFrom: (r["effectiveFrom"] ?? r["EffectiveFrom"] ?? null) as string | null,
        effectiveTo: (r["effectiveTo"] ?? r["EffectiveTo"] ?? null) as string | null,
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
        businessMeaning: (r["businessMeaning"] ??
          r["BusinessMeaning"] ??
          r["statusDescription"] ??
          r["StatusDescription"] ??
          null) as string | null,
        isActive: (r["isActive"] ?? r["IsActive"] ?? true) as boolean,
      }))
    : [];
}

// PUBLIC_INTERFACE
export async function createUomMaster(
  req: CreateUomMasterRequest,
): Promise<UomMasterDto> {
  /** POST /api/masters/uoms */
  const created = await apiRequest<BackendMasterBase>({
    method: "POST",
    path: "/api/masters/uoms",
    body: req,
  });

  return {
    uomId: pickId(created, "uomId", "UomId"),
    uomKey: (created["uomKey"] ?? created["UomKey"] ?? created["uomName"] ?? created["UomName"] ?? null) as
      | string
      | null,
    displayLabel: (created["displayLabel"] ??
      created["DisplayLabel"] ??
      created["uomCode"] ??
      created["UomCode"] ??
      null) as string | null,
    isActive: (created["isActive"] ?? created["IsActive"] ?? true) as boolean,
  };
}

// PUBLIC_INTERFACE
export async function updateUomMaster(
  uomId: string,
  req: UpdateUomMasterRequest,
): Promise<UomMasterDto> {
  /** PUT /api/masters/uoms/{uomId} */
  const updated = await apiRequest<BackendMasterBase>({
    method: "PUT",
    path: `/api/masters/uoms/${encodeURIComponent(uomId)}`,
    body: req,
  });

  return {
    uomId: pickId(updated, "uomId", "UomId") || uomId,
    uomKey: (updated["uomKey"] ?? updated["UomKey"] ?? updated["uomName"] ?? updated["UomName"] ?? null) as
      | string
      | null,
    displayLabel: (updated["displayLabel"] ??
      updated["DisplayLabel"] ??
      updated["uomCode"] ??
      updated["UomCode"] ??
      null) as string | null,
    isActive: (updated["isActive"] ?? updated["IsActive"] ?? true) as boolean,
  };
}

// PUBLIC_INTERFACE
export async function disableUomMaster(
  uomId: string,
  modifiedBy: string,
  correlationId: string,
): Promise<UomMasterDto> {
  /** Soft-disable by updating IsActive=false (backend does not expose DELETE). */
  return updateUomMaster(uomId, {
    uomKey: "",
    displayLabel: "",
    isActive: false,
    modifiedBy,
    correlationId,
  });
}

// PUBLIC_INTERFACE
export async function createReportingProgramMaster(
  req: CreateReportingProgramMasterRequest,
): Promise<ReportingProgramMasterDto> {
  /** POST /api/masters/reporting-programs */
  const created = await apiRequest<BackendMasterBase>({
    method: "POST",
    path: "/api/masters/reporting-programs",
    body: req,
  });

  return {
    reportingProgramId: pickId(created, "reportingProgramId", "ReportingProgramId"),
    programKey: (created["programKey"] ?? created["ProgramKey"] ?? null) as string | null,
    displayLabel: (created["displayLabel"] ??
      created["DisplayLabel"] ??
      created["programName"] ??
      created["ProgramName"] ??
      null) as string | null,
    isActive: (created["isActive"] ?? created["IsActive"] ?? true) as boolean,
  };
}

// PUBLIC_INTERFACE
export async function updateReportingProgramMaster(
  reportingProgramId: string,
  req: UpdateReportingProgramMasterRequest,
): Promise<ReportingProgramMasterDto> {
  /** PUT /api/masters/reporting-programs/{reportingProgramId} */
  const updated = await apiRequest<BackendMasterBase>({
    method: "PUT",
    path: `/api/masters/reporting-programs/${encodeURIComponent(reportingProgramId)}`,
    body: req,
  });

  return {
    reportingProgramId:
      pickId(updated, "reportingProgramId", "ReportingProgramId") || reportingProgramId,
    programKey: (updated["programKey"] ?? updated["ProgramKey"] ?? null) as string | null,
    displayLabel: (updated["displayLabel"] ??
      updated["DisplayLabel"] ??
      updated["programName"] ??
      updated["ProgramName"] ??
      null) as string | null,
    isActive: (updated["isActive"] ?? updated["IsActive"] ?? true) as boolean,
  };
}

// PUBLIC_INTERFACE
export async function disableReportingProgramMaster(
  reportingProgramId: string,
  modifiedBy: string,
  correlationId: string,
): Promise<ReportingProgramMasterDto> {
  return updateReportingProgramMaster(reportingProgramId, {
    programKey: "",
    displayLabel: "",
    isActive: false,
    modifiedBy,
    correlationId,
  });
}

// PUBLIC_INTERFACE
export async function createControlDeviceMaster(
  req: CreateControlDeviceMasterRequest,
): Promise<ControlDeviceMasterDto> {
  /** POST /api/masters/control-devices */
  const created = await apiRequest<BackendMasterBase>({
    method: "POST",
    path: "/api/masters/control-devices",
    body: req,
  });

  return {
    controlDeviceId: pickId(created, "controlDeviceId", "ControlDeviceId"),
    siteId: (created["siteId"] ?? created["SiteId"] ?? null) as string | null,
    deviceKey: (created["deviceKey"] ??
      created["DeviceKey"] ??
      created["deviceTag"] ??
      created["DeviceTag"] ??
      null) as string | null,
    displayLabel: (created["displayLabel"] ??
      created["DisplayLabel"] ??
      created["deviceName"] ??
      created["DeviceName"] ??
      null) as string | null,
    isActive: (created["isActive"] ?? created["IsActive"] ?? true) as boolean,
  };
}

// PUBLIC_INTERFACE
export async function updateControlDeviceMaster(
  controlDeviceId: string,
  req: UpdateControlDeviceMasterRequest,
): Promise<ControlDeviceMasterDto> {
  /** PUT /api/masters/control-devices/{controlDeviceId} */
  const updated = await apiRequest<BackendMasterBase>({
    method: "PUT",
    path: `/api/masters/control-devices/${encodeURIComponent(controlDeviceId)}`,
    body: req,
  });

  return {
    controlDeviceId:
      pickId(updated, "controlDeviceId", "ControlDeviceId") || controlDeviceId,
    siteId: (updated["siteId"] ?? updated["SiteId"] ?? null) as string | null,
    deviceKey: (updated["deviceKey"] ??
      updated["DeviceKey"] ??
      updated["deviceTag"] ??
      updated["DeviceTag"] ??
      null) as string | null,
    displayLabel: (updated["displayLabel"] ??
      updated["DisplayLabel"] ??
      updated["deviceName"] ??
      updated["DeviceName"] ??
      null) as string | null,
    isActive: (updated["isActive"] ?? updated["IsActive"] ?? true) as boolean,
  };
}

// PUBLIC_INTERFACE
export async function disableControlDeviceMaster(
  controlDeviceId: string,
  modifiedBy: string,
  correlationId: string,
): Promise<ControlDeviceMasterDto> {
  return updateControlDeviceMaster(controlDeviceId, {
    siteId: "",
    deviceKey: "",
    displayLabel: "",
    isActive: false,
    modifiedBy,
    correlationId,
  });
}

// PUBLIC_INTERFACE
export async function createEquationMaster(
  req: CreateEquationMasterRequest,
): Promise<EquationMasterDto> {
  /** POST /api/masters/equations */
  const created = await apiRequest<BackendMasterBase>({
    method: "POST",
    path: "/api/masters/equations",
    body: req,
  });

  return {
    equationMasterId: pickId(created, "equationMasterId", "EquationMasterId"),
    equationKey: (created["equationKey"] ??
      created["EquationKey"] ??
      created["equationName"] ??
      created["EquationName"] ??
      null) as string | null,
    versionLabel: (created["versionLabel"] ??
      created["VersionLabel"] ??
      created["equationText"] ??
      created["EquationText"] ??
      null) as string | null,
    effectiveFrom: (created["effectiveFrom"] ?? created["EffectiveFrom"] ?? null) as string | null,
    effectiveTo: (created["effectiveTo"] ?? created["EffectiveTo"] ?? null) as string | null,
  };
}

// PUBLIC_INTERFACE
export async function updateEquationMaster(
  equationMasterId: string,
  req: UpdateEquationMasterRequest,
): Promise<EquationMasterDto> {
  /** PUT /api/masters/equations/{equationMasterId} */
  const updated = await apiRequest<BackendMasterBase>({
    method: "PUT",
    path: `/api/masters/equations/${encodeURIComponent(equationMasterId)}`,
    body: req,
  });

  return {
    equationMasterId:
      pickId(updated, "equationMasterId", "EquationMasterId") || equationMasterId,
    equationKey: (updated["equationKey"] ??
      updated["EquationKey"] ??
      updated["equationName"] ??
      updated["EquationName"] ??
      null) as string | null,
    versionLabel: (updated["versionLabel"] ??
      updated["VersionLabel"] ??
      updated["equationText"] ??
      updated["EquationText"] ??
      null) as string | null,
    effectiveFrom: (updated["effectiveFrom"] ?? updated["EffectiveFrom"] ?? null) as string | null,
    effectiveTo: (updated["effectiveTo"] ?? updated["EffectiveTo"] ?? null) as string | null,
  };
}

// PUBLIC_INTERFACE
export async function disableEquationMaster(
  equationMasterId: string,
  modifiedBy: string,
  correlationId: string,
): Promise<EquationMasterDto> {
  return updateEquationMaster(equationMasterId, {
    equationKey: "",
    versionLabel: "",
    effectiveFrom: null,
    effectiveTo: null,
    modifiedBy,
    correlationId,
  });
}

// PUBLIC_INTERFACE
export async function createStatusCodeMaster(
  req: CreateStatusCodeMasterRequest,
): Promise<StatusCodeMasterDto> {
  /** POST /api/masters/status-codes */
  const created = await apiRequest<BackendMasterBase>({
    method: "POST",
    path: "/api/masters/status-codes",
    body: req,
  });

  return {
    statusCodeId: pickId(created, "statusCodeId", "StatusCodeId"),
    statusCode: (created["statusCode"] ?? created["StatusCode"] ?? null) as string | null,
    businessMeaning: (created["businessMeaning"] ??
      created["BusinessMeaning"] ??
      created["statusDescription"] ??
      created["StatusDescription"] ??
      null) as string | null,
    isActive: (created["isActive"] ?? created["IsActive"] ?? true) as boolean,
  };
}

// PUBLIC_INTERFACE
export async function updateStatusCodeMaster(
  statusCodeId: string,
  req: UpdateStatusCodeMasterRequest,
): Promise<StatusCodeMasterDto> {
  /** PUT /api/masters/status-codes/{statusCodeId} */
  const updated = await apiRequest<BackendMasterBase>({
    method: "PUT",
    path: `/api/masters/status-codes/${encodeURIComponent(statusCodeId)}`,
    body: req,
  });

  return {
    statusCodeId: pickId(updated, "statusCodeId", "StatusCodeId") || statusCodeId,
    statusCode: (updated["statusCode"] ?? updated["StatusCode"] ?? null) as string | null,
    businessMeaning: (updated["businessMeaning"] ??
      updated["BusinessMeaning"] ??
      updated["statusDescription"] ??
      updated["StatusDescription"] ??
      null) as string | null,
    isActive: (updated["isActive"] ?? updated["IsActive"] ?? true) as boolean,
  };
}

// PUBLIC_INTERFACE
export async function disableStatusCodeMaster(
  statusCodeId: string,
  modifiedBy: string,
  correlationId: string,
): Promise<StatusCodeMasterDto> {
  return updateStatusCodeMaster(statusCodeId, {
    statusCode: "",
    businessMeaning: "",
    isActive: false,
    modifiedBy,
    correlationId,
  });
}

/**
 * ---- BRD Section 4 module endpoints ----
 * These pages/modules were requested to be implemented end-to-end with CRUD + RBAC.
 */

type BackendSiteProfileDto = {
  siteProfileId?: BackendId;
  siteId?: string | null;

  createdBy?: string | null;
  createdAt?: string | null;
  modifiedBy?: string | null;
  modifiedAt?: string | null;
  correlationId?: string | null;

  SiteProfileId?: BackendId;
  SiteId?: string | null;
  CreatedBy?: string | null;
  CreatedAt?: string | null;
  ModifiedBy?: string | null;
  ModifiedAt?: string | null;
  CorrelationId?: string | null;
};

function mapSiteProfileFromBackend(b: BackendSiteProfileDto): SiteProfileDto {
  return {
    siteProfileId: toIdString(b.siteProfileId ?? b.SiteProfileId),
    siteId: (b.siteId ?? b.SiteId ?? "") as string,
    createdBy: b.createdBy ?? b.CreatedBy ?? null,
    createdAt: b.createdAt ?? b.CreatedAt ?? null,
    modifiedBy: b.modifiedBy ?? b.ModifiedBy ?? null,
    modifiedAt: b.modifiedAt ?? b.ModifiedAt ?? null,
    correlationId: (b.correlationId ?? b.CorrelationId ?? "") as string,
  };
}

// PUBLIC_INTERFACE
export async function listSiteProfiles(params?: { siteId?: string; limit?: number }): Promise<SiteProfileDto[]> {
  const qs = new URLSearchParams();
  if (params?.siteId) qs.set("siteId", params.siteId);
  if (params?.limit !== undefined) qs.set("limit", String(params.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const rows = await apiRequest<BackendSiteProfileDto[]>({ method: "GET", path: `/api/section4/site-profiles${suffix}` });
  return Array.isArray(rows) ? rows.map(mapSiteProfileFromBackend) : [];
}

// PUBLIC_INTERFACE
export async function createSiteProfile(req: CreateSiteProfileRequest): Promise<SiteProfileDto> {
  const created = await apiRequest<BackendSiteProfileDto>({ method: "POST", path: "/api/section4/site-profiles", body: req });
  return mapSiteProfileFromBackend(created);
}

// PUBLIC_INTERFACE
export async function updateSiteProfile(siteProfileId: string, req: UpdateSiteProfileRequest): Promise<SiteProfileDto> {
  const updated = await apiRequest<BackendSiteProfileDto>({
    method: "PUT",
    path: `/api/section4/site-profiles/${encodeURIComponent(siteProfileId)}`,
    body: req,
  });
  return mapSiteProfileFromBackend(updated);
}

// PUBLIC_INTERFACE
export async function deleteSiteProfile(siteProfileId: string, body: DeleteAssetRequest): Promise<void> {
  return apiRequest<void>({
    method: "DELETE",
    path: `/api/section4/site-profiles/${encodeURIComponent(siteProfileId)}`,
    body,
  });
}

type BackendWwtsProcessStreamDto = {
  wwtsProcessStreamId?: BackendId;
  siteId?: string | null;
  streamName?: string | null;

  createdBy?: string | null;
  createdAt?: string | null;
  modifiedBy?: string | null;
  modifiedAt?: string | null;
  correlationId?: string | null;

  WwtsProcessStreamId?: BackendId;
  SiteId?: string | null;
  StreamName?: string | null;
  CreatedBy?: string | null;
  CreatedAt?: string | null;
  ModifiedBy?: string | null;
  ModifiedAt?: string | null;
  CorrelationId?: string | null;
};

function mapWwtsProcessStreamFromBackend(b: BackendWwtsProcessStreamDto): WwtsProcessStreamDto {
  return {
    wwtsProcessStreamId: toIdString(b.wwtsProcessStreamId ?? b.WwtsProcessStreamId),
    siteId: (b.siteId ?? b.SiteId ?? "") as string,
    streamName: (b.streamName ?? b.StreamName ?? "") as string,
    createdBy: b.createdBy ?? b.CreatedBy ?? null,
    createdAt: b.createdAt ?? b.CreatedAt ?? null,
    modifiedBy: b.modifiedBy ?? b.ModifiedBy ?? null,
    modifiedAt: b.modifiedAt ?? b.ModifiedAt ?? null,
    correlationId: (b.correlationId ?? b.CorrelationId ?? "") as string,
  };
}

// PUBLIC_INTERFACE
export async function listWwtsProcessStreams(params?: { siteId?: string; limit?: number }): Promise<WwtsProcessStreamDto[]> {
  const qs = new URLSearchParams();
  if (params?.siteId) qs.set("siteId", params.siteId);
  if (params?.limit !== undefined) qs.set("limit", String(params.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const rows = await apiRequest<BackendWwtsProcessStreamDto[]>({ method: "GET", path: `/api/section4/wwts-process-streams${suffix}` });
  return Array.isArray(rows) ? rows.map(mapWwtsProcessStreamFromBackend) : [];
}

// PUBLIC_INTERFACE
export async function createWwtsProcessStream(req: CreateWwtsProcessStreamRequest): Promise<WwtsProcessStreamDto> {
  const created = await apiRequest<BackendWwtsProcessStreamDto>({ method: "POST", path: "/api/section4/wwts-process-streams", body: req });
  return mapWwtsProcessStreamFromBackend(created);
}

// PUBLIC_INTERFACE
export async function updateWwtsProcessStream(wwtsProcessStreamId: string, req: UpdateWwtsProcessStreamRequest): Promise<WwtsProcessStreamDto> {
  const updated = await apiRequest<BackendWwtsProcessStreamDto>({
    method: "PUT",
    path: `/api/section4/wwts-process-streams/${encodeURIComponent(wwtsProcessStreamId)}`,
    body: req,
  });
  return mapWwtsProcessStreamFromBackend(updated);
}

// PUBLIC_INTERFACE
export async function deleteWwtsProcessStream(wwtsProcessStreamId: string, body: DeleteAssetRequest): Promise<void> {
  return apiRequest<void>({
    method: "DELETE",
    path: `/api/section4/wwts-process-streams/${encodeURIComponent(wwtsProcessStreamId)}`,
    body,
  });
}

type BackendChemicalRawMaterialDto = {
  chemicalRawMaterialId?: BackendId;
  siteId?: string | null;
  chemicalName?: string | null;

  createdBy?: string | null;
  createdAt?: string | null;
  modifiedBy?: string | null;
  modifiedAt?: string | null;
  correlationId?: string | null;

  ChemicalRawMaterialId?: BackendId;
  SiteId?: string | null;
  ChemicalName?: string | null;
  CreatedBy?: string | null;
  CreatedAt?: string | null;
  ModifiedBy?: string | null;
  ModifiedAt?: string | null;
  CorrelationId?: string | null;
};

function mapChemicalRawMaterialFromBackend(b: BackendChemicalRawMaterialDto): ChemicalRawMaterialDto {
  return {
    chemicalRawMaterialId: toIdString(b.chemicalRawMaterialId ?? b.ChemicalRawMaterialId),
    siteId: (b.siteId ?? b.SiteId ?? "") as string,
    chemicalName: (b.chemicalName ?? b.ChemicalName ?? "") as string,
    createdBy: b.createdBy ?? b.CreatedBy ?? null,
    createdAt: b.createdAt ?? b.CreatedAt ?? null,
    modifiedBy: b.modifiedBy ?? b.ModifiedBy ?? null,
    modifiedAt: b.modifiedAt ?? b.ModifiedAt ?? null,
    correlationId: (b.correlationId ?? b.CorrelationId ?? "") as string,
  };
}

// PUBLIC_INTERFACE
export async function listChemicalRawMaterials(params?: { siteId?: string; limit?: number }): Promise<ChemicalRawMaterialDto[]> {
  const qs = new URLSearchParams();
  if (params?.siteId) qs.set("siteId", params.siteId);
  if (params?.limit !== undefined) qs.set("limit", String(params.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const rows = await apiRequest<BackendChemicalRawMaterialDto[]>({ method: "GET", path: `/api/section4/chemical-raw-materials${suffix}` });
  return Array.isArray(rows) ? rows.map(mapChemicalRawMaterialFromBackend) : [];
}

// PUBLIC_INTERFACE
export async function createChemicalRawMaterial(req: CreateChemicalRawMaterialRequest): Promise<ChemicalRawMaterialDto> {
  const created = await apiRequest<BackendChemicalRawMaterialDto>({ method: "POST", path: "/api/section4/chemical-raw-materials", body: req });
  return mapChemicalRawMaterialFromBackend(created);
}

// PUBLIC_INTERFACE
export async function updateChemicalRawMaterial(chemicalRawMaterialId: string, req: UpdateChemicalRawMaterialRequest): Promise<ChemicalRawMaterialDto> {
  const updated = await apiRequest<BackendChemicalRawMaterialDto>({
    method: "PUT",
    path: `/api/section4/chemical-raw-materials/${encodeURIComponent(chemicalRawMaterialId)}`,
    body: req,
  });
  return mapChemicalRawMaterialFromBackend(updated);
}

// PUBLIC_INTERFACE
export async function deleteChemicalRawMaterial(chemicalRawMaterialId: string, body: DeleteAssetRequest): Promise<void> {
  return apiRequest<void>({
    method: "DELETE",
    path: `/api/section4/chemical-raw-materials/${encodeURIComponent(chemicalRawMaterialId)}`,
    body,
  });
}

type BackendChemicalSdsDto = {
  chemicalSdsId?: BackendId;
  siteId?: string | null;
  chemicalName?: string | null;

  createdBy?: string | null;
  createdAt?: string | null;
  modifiedBy?: string | null;
  modifiedAt?: string | null;
  correlationId?: string | null;

  ChemicalSdsId?: BackendId;
  SiteId?: string | null;
  ChemicalName?: string | null;
  CreatedBy?: string | null;
  CreatedAt?: string | null;
  ModifiedBy?: string | null;
  ModifiedAt?: string | null;
  CorrelationId?: string | null;
};

function mapChemicalSdsFromBackend(b: BackendChemicalSdsDto): ChemicalSdsDto {
  return {
    chemicalSdsId: toIdString(b.chemicalSdsId ?? b.ChemicalSdsId),
    siteId: (b.siteId ?? b.SiteId ?? "") as string,
    chemicalName: (b.chemicalName ?? b.ChemicalName ?? "") as string,
    createdBy: b.createdBy ?? b.CreatedBy ?? null,
    createdAt: b.createdAt ?? b.CreatedAt ?? null,
    modifiedBy: b.modifiedBy ?? b.ModifiedBy ?? null,
    modifiedAt: b.modifiedAt ?? b.ModifiedAt ?? null,
    correlationId: (b.correlationId ?? b.CorrelationId ?? "") as string,
  };
}

// PUBLIC_INTERFACE
export async function listChemicalSds(params?: { siteId?: string; limit?: number }): Promise<ChemicalSdsDto[]> {
  const qs = new URLSearchParams();
  if (params?.siteId) qs.set("siteId", params.siteId);
  if (params?.limit !== undefined) qs.set("limit", String(params.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const rows = await apiRequest<BackendChemicalSdsDto[]>({ method: "GET", path: `/api/section4/chemical-sds${suffix}` });
  return Array.isArray(rows) ? rows.map(mapChemicalSdsFromBackend) : [];
}

// PUBLIC_INTERFACE
export async function createChemicalSds(req: CreateChemicalSdsRequest): Promise<ChemicalSdsDto> {
  const created = await apiRequest<BackendChemicalSdsDto>({ method: "POST", path: "/api/section4/chemical-sds", body: req });
  return mapChemicalSdsFromBackend(created);
}

// PUBLIC_INTERFACE
export async function updateChemicalSds(chemicalSdsId: string, req: UpdateChemicalSdsRequest): Promise<ChemicalSdsDto> {
  const updated = await apiRequest<BackendChemicalSdsDto>({
    method: "PUT",
    path: `/api/section4/chemical-sds/${encodeURIComponent(chemicalSdsId)}`,
    body: req,
  });
  return mapChemicalSdsFromBackend(updated);
}

// PUBLIC_INTERFACE
export async function deleteChemicalSds(chemicalSdsId: string, body: DeleteAssetRequest): Promise<void> {
  return apiRequest<void>({
    method: "DELETE",
    path: `/api/section4/chemical-sds/${encodeURIComponent(chemicalSdsId)}`,
    body,
  });
}

type BackendLabDataConfigurationDto = {
  labDataConfigurationId?: BackendId;
  siteId?: string | null;
  configurationName?: string | null;

  createdBy?: string | null;
  createdAt?: string | null;
  modifiedBy?: string | null;
  modifiedAt?: string | null;
  correlationId?: string | null;

  LabDataConfigurationId?: BackendId;
  SiteId?: string | null;
  ConfigurationName?: string | null;
  CreatedBy?: string | null;
  CreatedAt?: string | null;
  ModifiedBy?: string | null;
  ModifiedAt?: string | null;
  CorrelationId?: string | null;
};

function mapLabDataConfigurationFromBackend(b: BackendLabDataConfigurationDto): LabDataConfigurationDto {
  return {
    labDataConfigurationId: toIdString(b.labDataConfigurationId ?? b.LabDataConfigurationId),
    siteId: (b.siteId ?? b.SiteId ?? "") as string,
    configurationName: (b.configurationName ?? b.ConfigurationName ?? "") as string,
    createdBy: b.createdBy ?? b.CreatedBy ?? null,
    createdAt: b.createdAt ?? b.CreatedAt ?? null,
    modifiedBy: b.modifiedBy ?? b.ModifiedBy ?? null,
    modifiedAt: b.modifiedAt ?? b.ModifiedAt ?? null,
    correlationId: (b.correlationId ?? b.CorrelationId ?? "") as string,
  };
}

// PUBLIC_INTERFACE
export async function listLabDataConfigurations(params?: { siteId?: string; limit?: number }): Promise<LabDataConfigurationDto[]> {
  const qs = new URLSearchParams();
  if (params?.siteId) qs.set("siteId", params.siteId);
  if (params?.limit !== undefined) qs.set("limit", String(params.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const rows = await apiRequest<BackendLabDataConfigurationDto[]>({ method: "GET", path: `/api/section4/lab-data-configurations${suffix}` });
  return Array.isArray(rows) ? rows.map(mapLabDataConfigurationFromBackend) : [];
}

// PUBLIC_INTERFACE
export async function createLabDataConfiguration(req: CreateLabDataConfigurationRequest): Promise<LabDataConfigurationDto> {
  const created = await apiRequest<BackendLabDataConfigurationDto>({ method: "POST", path: "/api/section4/lab-data-configurations", body: req });
  return mapLabDataConfigurationFromBackend(created);
}

// PUBLIC_INTERFACE
export async function updateLabDataConfiguration(labDataConfigurationId: string, req: UpdateLabDataConfigurationRequest): Promise<LabDataConfigurationDto> {
  const updated = await apiRequest<BackendLabDataConfigurationDto>({
    method: "PUT",
    path: `/api/section4/lab-data-configurations/${encodeURIComponent(labDataConfigurationId)}`,
    body: req,
  });
  return mapLabDataConfigurationFromBackend(updated);
}

// PUBLIC_INTERFACE
export async function deleteLabDataConfiguration(labDataConfigurationId: string, body: DeleteAssetRequest): Promise<void> {
  return apiRequest<void>({
    method: "DELETE",
    path: `/api/section4/lab-data-configurations/${encodeURIComponent(labDataConfigurationId)}`,
    body,
  });
}

type BackendWaterProcessConfigurationDto = {
  waterProcessConfigurationId?: BackendId;
  siteId?: string | null;
  configurationName?: string | null;

  createdBy?: string | null;
  createdAt?: string | null;
  modifiedBy?: string | null;
  modifiedAt?: string | null;
  correlationId?: string | null;

  WaterProcessConfigurationId?: BackendId;
  SiteId?: string | null;
  ConfigurationName?: string | null;
  CreatedBy?: string | null;
  CreatedAt?: string | null;
  ModifiedBy?: string | null;
  ModifiedAt?: string | null;
  CorrelationId?: string | null;
};

function mapWaterProcessConfigurationFromBackend(b: BackendWaterProcessConfigurationDto): WaterProcessConfigurationDto {
  return {
    waterProcessConfigurationId: toIdString(b.waterProcessConfigurationId ?? b.WaterProcessConfigurationId),
    siteId: (b.siteId ?? b.SiteId ?? "") as string,
    configurationName: (b.configurationName ?? b.ConfigurationName ?? "") as string,
    createdBy: b.createdBy ?? b.CreatedBy ?? null,
    createdAt: b.createdAt ?? b.CreatedAt ?? null,
    modifiedBy: b.modifiedBy ?? b.ModifiedBy ?? null,
    modifiedAt: b.modifiedAt ?? b.ModifiedAt ?? null,
    correlationId: (b.correlationId ?? b.CorrelationId ?? "") as string,
  };
}

// PUBLIC_INTERFACE
export async function listWaterProcessConfigurations(params?: { siteId?: string; limit?: number }): Promise<WaterProcessConfigurationDto[]> {
  const qs = new URLSearchParams();
  if (params?.siteId) qs.set("siteId", params.siteId);
  if (params?.limit !== undefined) qs.set("limit", String(params.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const rows = await apiRequest<BackendWaterProcessConfigurationDto[]>({ method: "GET", path: `/api/section4/water-process-configurations${suffix}` });
  return Array.isArray(rows) ? rows.map(mapWaterProcessConfigurationFromBackend) : [];
}

// PUBLIC_INTERFACE
export async function createWaterProcessConfiguration(req: CreateWaterProcessConfigurationRequest): Promise<WaterProcessConfigurationDto> {
  const created = await apiRequest<BackendWaterProcessConfigurationDto>({ method: "POST", path: "/api/section4/water-process-configurations", body: req });
  return mapWaterProcessConfigurationFromBackend(created);
}

// PUBLIC_INTERFACE
export async function updateWaterProcessConfiguration(waterProcessConfigurationId: string, req: UpdateWaterProcessConfigurationRequest): Promise<WaterProcessConfigurationDto> {
  const updated = await apiRequest<BackendWaterProcessConfigurationDto>({
    method: "PUT",
    path: `/api/section4/water-process-configurations/${encodeURIComponent(waterProcessConfigurationId)}`,
    body: req,
  });
  return mapWaterProcessConfigurationFromBackend(updated);
}

// PUBLIC_INTERFACE
export async function deleteWaterProcessConfiguration(waterProcessConfigurationId: string, body: DeleteAssetRequest): Promise<void> {
  return apiRequest<void>({
    method: "DELETE",
    path: `/api/section4/water-process-configurations/${encodeURIComponent(waterProcessConfigurationId)}`,
    body,
  });
}
