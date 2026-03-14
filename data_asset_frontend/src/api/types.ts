export type Role = "Admin" | "Editor" | "Viewer";

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

export type SiteAssetRow = Record<string, unknown>;
export type InputEfMappingRow = Record<string, unknown>;
export type ThroughputRow = Record<string, unknown>;
