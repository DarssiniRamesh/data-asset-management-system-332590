export type Role = "Admin" | "Editor" | "Viewer";

export type SiteProfileDto = {
  siteProfileId: string;
  siteId: string;
  createdBy: string | null;
  createdAt: string | null;
  modifiedBy: string | null;
  modifiedAt: string | null;
  correlationId: string;
};

export type CreateSiteProfileRequest = {
  siteId: string;
  createdBy: string;
  correlationId: string;
};

export type UpdateSiteProfileRequest = {
  siteId: string;
  modifiedBy: string;
  correlationId: string;
};

export type WwtsProcessStreamDto = {
  wwtsProcessStreamId: string;
  siteId: string;
  streamName: string;
  createdBy: string | null;
  createdAt: string | null;
  modifiedBy: string | null;
  modifiedAt: string | null;
  correlationId: string;
};

export type CreateWwtsProcessStreamRequest = {
  siteId: string;
  streamName: string;
  createdBy: string;
  correlationId: string;
};

export type UpdateWwtsProcessStreamRequest = {
  siteId: string;
  streamName: string;
  modifiedBy: string;
  correlationId: string;
};

export type ChemicalRawMaterialDto = {
  chemicalRawMaterialId: string;
  siteId: string;
  chemicalName: string;
  createdBy: string | null;
  createdAt: string | null;
  modifiedBy: string | null;
  modifiedAt: string | null;
  correlationId: string;
};

export type CreateChemicalRawMaterialRequest = {
  siteId: string;
  chemicalName: string;
  createdBy: string;
  correlationId: string;
};

export type UpdateChemicalRawMaterialRequest = {
  siteId: string;
  chemicalName: string;
  modifiedBy: string;
  correlationId: string;
};

export type ChemicalSdsDto = {
  chemicalSdsId: string;
  siteId: string;
  chemicalName: string;
  createdBy: string | null;
  createdAt: string | null;
  modifiedBy: string | null;
  modifiedAt: string | null;
  correlationId: string;
};

export type CreateChemicalSdsRequest = {
  siteId: string;
  chemicalName: string;
  createdBy: string;
  correlationId: string;
};

export type UpdateChemicalSdsRequest = {
  siteId: string;
  chemicalName: string;
  modifiedBy: string;
  correlationId: string;
};

export type LabDataConfigurationDto = {
  labDataConfigurationId: string;
  siteId: string;
  configurationName: string;
  createdBy: string | null;
  createdAt: string | null;
  modifiedBy: string | null;
  modifiedAt: string | null;
  correlationId: string;
};

export type CreateLabDataConfigurationRequest = {
  siteId: string;
  configurationName: string;
  createdBy: string;
  correlationId: string;
};

export type UpdateLabDataConfigurationRequest = {
  siteId: string;
  configurationName: string;
  modifiedBy: string;
  correlationId: string;
};

export type WaterProcessConfigurationDto = {
  waterProcessConfigurationId: string;
  siteId: string;
  configurationName: string;
  createdBy: string | null;
  createdAt: string | null;
  modifiedBy: string | null;
  modifiedAt: string | null;
  correlationId: string;
};

export type CreateWaterProcessConfigurationRequest = {
  siteId: string;
  configurationName: string;
  createdBy: string;
  correlationId: string;
};

export type UpdateWaterProcessConfigurationRequest = {
  siteId: string;
  configurationName: string;
  modifiedBy: string;
  correlationId: string;
};

export type DevLoginRequest = {
  username: string;
  role: Role;
};

export type DevLoginResponse = {
  accessToken: string;
  tokenType: "Bearer";
  expiresInSeconds: number;
  username: string;
  role: string;
};

export type AssetDto = {
  /** Backend: AssetId (int64) */
  assetId: string;

  siteId: string;
  assetGroup: string;
  processGroup: string;
  processGroupOtherText?: string | null;

  assetName: string;
  permitEuId: string;
  globalUniqueAssetId: string;

  assetDescription?: string | null;
  stationaryFlag?: boolean | null;

  /** Backend requires this flag on create/update for conditional validation */
  requiresParentPseudo: boolean;
  /**
   * Backend: ParentPseudoAssetId (int64, nullable).
   * IMPORTANT: must be sent as a JSON number (or null), not a string, or ASP.NET deserialization will fail.
   */
  parentPseudoAssetId?: number | null;

  createdBy?: string | null;
  modifiedBy?: string | null;

  correlationId: string;

  /** Backend: CreatedAt/ModifiedAt */
  createdAt?: string | null;
  modifiedAt?: string | null;

  isDeleted?: boolean;
};

/** Request payload for POST /api/assets */
export type CreateAssetRequest = Omit<
  AssetDto,
  | "assetId"
  | "modifiedBy"
  | "createdAt"
  | "modifiedAt"
  | "isDeleted"
>;

/** Request payload for PUT /api/assets/{assetId} */
export type UpdateAssetRequest = Partial<CreateAssetRequest> & {
  assetId: string;
  modifiedBy: string;
  correlationId: string;
  requiresParentPseudo: boolean;
};

export type DeleteAssetRequest = {
  modifiedBy: string;
  correlationId: string;
};

export type CopyAssetRequest = {
  newAssetName: string;
};

/**
 * Asset copy lineage / replication status records.
 * Backed by /api/asset-copy-lineage.
 */
export type AssetCopyLineageDto = {
  assetCopyLineageId?: string | null;

  copyOperationId?: string | null;

  sourceAssetId?: string | null;
  targetAssetId?: string | null;

  /** e.g., Pending | InProgress | Completed | Failed (backend-defined) */
  status?: string | null;
  statusDetail?: string | null;

  createdAt?: string | null;
};

export type CreateAssetCopyLineageRequest = {
  copyOperationId: string;
  sourceAssetId: number;
  targetAssetId: number;
  status?: string | null;
  statusDetail?: string | null;
};

/**
 * ---- Canonical Asset Child Resources (BRD tabs) ----
 * These correspond to the canonical REST paths under /api/assets/{assetId}/...
 */

export type AssetStatusLogDto = {
  assetStatusLogId: string;
  statusCodeId?: number | null;
  statusStartDate?: string | null;
  statusEndDate?: string | null;
  comment?: string | null;
  createdBy?: string | null;
  createdAt?: string | null;
  modifiedBy?: string | null;
  modifiedAt?: string | null;
};

export type CreateAssetStatusLogRequest = {
  statusCodeId: number;
  statusStartDate: string;
  statusEndDate?: string | null;
  comment?: string | null;
  createdBy: string;
  correlationId: string;
};

export type UpdateAssetStatusLogRequest = {
  statusCodeId: number;
  statusStartDate: string;
  statusEndDate?: string | null;
  comment?: string | null;
  modifiedBy: string;
  correlationId: string;
};

export type AdditionalAssetIdDto = {
  additionalAssetId: string;
  idType?: string | null;
  idValue?: string | null;
  isActive?: boolean;
  createdBy?: string | null;
  createdAt?: string | null;
  modifiedBy?: string | null;
  modifiedAt?: string | null;
};

export type CreateAdditionalAssetIdRequest = {
  idType: string;
  idValue: string;
  isActive?: boolean;
  createdBy: string;
  correlationId: string;
};

export type UpdateAdditionalAssetIdRequest = {
  idType: string;
  idValue: string;
  isActive?: boolean;
  modifiedBy: string;
  correlationId: string;
};

export type AssetPropertyDto = {
  assetPropertyId: string;
  propertyName?: string | null;
  propertyValue?: string | null;
  isActive?: boolean;
  createdBy?: string | null;
  createdAt?: string | null;
  modifiedBy?: string | null;
  modifiedAt?: string | null;
};

export type CreateAssetPropertyRequest = {
  propertyName: string;
  propertyValue: string;
  isActive?: boolean;
  createdBy: string;
  correlationId: string;
};

export type UpdateAssetPropertyRequest = {
  propertyName: string;
  propertyValue: string;
  isActive?: boolean;
  modifiedBy: string;
  correlationId: string;
};

export type ControlDeviceMappingDto = {
  controlDeviceMappingId: string;
  controlDeviceId?: number | null;
  controlDeviceTag?: string | null;
  isActive?: boolean;
  createdBy?: string | null;
  createdAt?: string | null;
  modifiedBy?: string | null;
  modifiedAt?: string | null;
};

export type CreateControlDeviceMappingRequest = {
  controlDeviceId: number;
  controlDeviceTag?: string | null;
  isActive?: boolean;
  createdBy: string;
  correlationId: string;
};

export type UpdateControlDeviceMappingRequest = {
  controlDeviceId: number;
  controlDeviceTag?: string | null;
  isActive?: boolean;
  modifiedBy: string;
  correlationId: string;
};

export type ReportingAttributeMappingDto = {
  reportingAttributeMappingId: string;
  reportingProgramId?: number | null;
  reportingAttributeName?: string | null;
  reportingAttributeValue?: string | null;
  isActive?: boolean;
  createdBy?: string | null;
  createdAt?: string | null;
  modifiedBy?: string | null;
  modifiedAt?: string | null;
};

export type CreateReportingAttributeMappingRequest = {
  reportingProgramId: number;
  reportingAttributeName: string;
  reportingAttributeValue: string;
  isActive?: boolean;
  createdBy: string;
  correlationId: string;
};

export type UpdateReportingAttributeMappingRequest = {
  reportingProgramId: number;
  reportingAttributeName: string;
  reportingAttributeValue: string;
  isActive?: boolean;
  modifiedBy: string;
  correlationId: string;
};

export type ParentInputMappingDto = {
  parentInputMappingId: string;
  parentInputParameterId?: number | null;
  isActive?: boolean;
  createdBy?: string | null;
  createdAt?: string | null;
  modifiedBy?: string | null;
  modifiedAt?: string | null;
};

export type CreateParentInputMappingRequest = {
  parentInputParameterId: number;
  isActive?: boolean;
  createdBy: string;
  correlationId: string;
};

export type UpdateParentInputMappingRequest = {
  parentInputParameterId: number;
  isActive?: boolean;
  modifiedBy: string;
  correlationId: string;
};

export type EfSourceMappingDto = {
  efSourceMappingId: string;
  efSourceId?: string | null;
  isActive?: boolean;
  createdBy?: string | null;
  createdAt?: string | null;
  modifiedBy?: string | null;
  modifiedAt?: string | null;
};

export type CreateEfSourceMappingRequest = {
  efSourceId: string;
  isActive?: boolean;
  createdBy: string;
  correlationId: string;
};

export type UpdateEfSourceMappingRequest = {
  efSourceId: string;
  isActive?: boolean;
  modifiedBy: string;
  correlationId: string;
};

export type ThroughputEquationDto = {
  throughputEquationId: string;
  equationMasterId?: number | null;
  equationText?: string | null;
  isActive?: boolean;
};

export type CreateThroughputEquationRequest = {
  equationMasterId: number;
  equationText?: string | null;
  isActive?: boolean;
  createdBy: string;
  correlationId: string;
};

export type UpdateThroughputEquationRequest = {
  equationMasterId: number;
  equationText?: string | null;
  isActive?: boolean;
  modifiedBy: string;
  correlationId: string;
};

export type ThroughputScalarDto = {
  throughputScalarId: string;
  scalarName?: string | null;
  scalarValue?: number | null;
  uomId?: number | null;
  isActive?: boolean;
};

export type CreateThroughputScalarRequest = {
  scalarName: string;
  scalarValue: number;
  uomId?: number | null;
  isActive?: boolean;
  createdBy: string;
  correlationId: string;
};

export type UpdateThroughputScalarRequest = {
  scalarName: string;
  scalarValue: number;
  uomId?: number | null;
  isActive?: boolean;
  modifiedBy: string;
  correlationId: string;
};

export type DataInputValueDto = {
  dataInputValueId: string;
  valueText?: string | null;
  valueNumber?: number | null;
  valueDateTime?: string | null;
  isActive?: boolean;
};

export type CreateDataInputValueRequest = {
  valueText?: string | null;
  valueNumber?: number | null;
  valueDateTime?: string | null;
  isActive?: boolean;
  createdBy: string;
  correlationId: string;
};

export type UpdateDataInputValueRequest = {
  valueText?: string | null;
  valueNumber?: number | null;
  valueDateTime?: string | null;
  isActive?: boolean;
  modifiedBy: string;
  correlationId: string;
};

/**
 * ---- Master Data Endpoints (/api/masters/...) ----
 */

export type UomMasterDto = {
  uomId: string;
  uomName?: string | null;
  uomCode?: string | null;
  isActive?: boolean;
};

export type ReportingProgramMasterDto = {
  reportingProgramId: string;
  programName?: string | null;
  isActive?: boolean;
};

export type ControlDeviceMasterDto = {
  controlDeviceId: string;
  siteId?: string | null;
  deviceName?: string | null;
  deviceTag?: string | null;
  isActive?: boolean;
};

export type EquationMasterDto = {
  equationMasterId: string;
  equationName?: string | null;
  equationText?: string | null;
  isActive?: boolean;
};

export type StatusCodeMasterDto = {
  statusCodeId: string;
  statusCode?: string | null;
  statusDescription?: string | null;
  isActive?: boolean;
};

export type CreateUomMasterRequest = {
  uomName: string;
  uomCode: string;
  isActive?: boolean;
  createdBy: string;
  correlationId: string;
};

export type UpdateUomMasterRequest = {
  uomName: string;
  uomCode: string;
  isActive?: boolean;
  modifiedBy: string;
  correlationId: string;
};

export type CreateReportingProgramMasterRequest = {
  programName: string;
  isActive?: boolean;
  createdBy: string;
  correlationId: string;
};

export type UpdateReportingProgramMasterRequest = {
  programName: string;
  isActive?: boolean;
  modifiedBy: string;
  correlationId: string;
};

export type CreateControlDeviceMasterRequest = {
  siteId: string;
  deviceName: string;
  deviceTag: string;
  isActive?: boolean;
  createdBy: string;
  correlationId: string;
};

export type UpdateControlDeviceMasterRequest = {
  siteId: string;
  deviceName: string;
  deviceTag: string;
  isActive?: boolean;
  modifiedBy: string;
  correlationId: string;
};

export type CreateEquationMasterRequest = {
  equationName: string;
  equationText: string;
  isActive?: boolean;
  createdBy: string;
  correlationId: string;
};

export type UpdateEquationMasterRequest = {
  equationName: string;
  equationText: string;
  isActive?: boolean;
  modifiedBy: string;
  correlationId: string;
};

export type CreateStatusCodeMasterRequest = {
  statusCode: string;
  statusDescription: string;
  isActive?: boolean;
  createdBy: string;
  correlationId: string;
};

export type UpdateStatusCodeMasterRequest = {
  statusCode: string;
  statusDescription: string;
  isActive?: boolean;
  modifiedBy: string;
  correlationId: string;
};

/**
 * ---- Existing loose/legacy rows used by earlier steps ----
 * (Kept for compatibility with already-wired legacy endpoints in endpoints.ts)
 */
export type SiteAssetRow = Record<string, unknown>;
export type InputEfMappingRow = Record<string, unknown>;
export type ThroughputRow = Record<string, unknown>;

/** Input Parameter row (canonical child resource). */
export type InputParameterDto = {
  inputParameterId: string;
  inputParameterName: string;

  /** Optional master references (backend int64/int32). */
  uomId?: number | null;
  reportingProgramId?: number | null;

  /** BRD-required for in-use rows; backend may enforce */
  inputType?: string | null;
  dataEntryFrequency?: string | null;

  isActive?: boolean;
};

/** POST /api/assets/{assetId}/input-parameters */
export type CreateInputParameterRequest = {
  inputParameterName: string;
  uomId?: number | null;
  reportingProgramId?: number | null;
  inputType?: string | null;
  dataEntryFrequency?: string | null;
  isActive?: boolean;

  createdBy: string;
  correlationId: string;
};

/** PUT /api/assets/{assetId}/input-parameters/{inputParameterId} */
export type UpdateInputParameterRequest = {
  inputParameterName: string;
  uomId?: number | null;
  reportingProgramId?: number | null;
  inputType?: string | null;
  dataEntryFrequency?: string | null;
  isActive?: boolean;

  modifiedBy: string;
  correlationId: string;
};
