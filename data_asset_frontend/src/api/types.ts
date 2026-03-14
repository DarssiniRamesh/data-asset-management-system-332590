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
  assetId: string;
  siteId: string;
  assetGroup: string;
  processGroup: string;
  assetName: string;
  permitEuId: string;
  globalUniqueAssetId: string;
  createdBy?: string | null;
  correlationId?: string | null;
  createdAtUtc?: string | null;
  updatedAtUtc?: string | null;
};

export type CreateAssetRequest = Omit<AssetDto, "assetId" | "createdAtUtc" | "updatedAtUtc">;

export type UpdateAssetRequest = Partial<CreateAssetRequest> & { assetId: string };

export type CopyAssetRequest = {
  newAssetName: string;
};

export type SiteAssetRow = Record<string, unknown>;
export type InputEfMappingRow = Record<string, unknown>;
export type ThroughputRow = Record<string, unknown>;
