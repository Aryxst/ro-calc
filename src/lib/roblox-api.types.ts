export const AssetTypeEnum = {
 T_SHIRT: 2,
 AUDIO: 3,
 HAT: 8,
 PLACE: 9,
 MODEL: 10,
 SHIRT: 11,
 PANTS: 12,
 DECAL: 13,
 HEAD: 17,
 FACE: 18,
 GEAR: 19,
 PASS: 34,
 PLUGIN: 38,
 HEAD_ACCESSORY: 41,
 FACE_ACCESSORY: 42,
 NECK_ACCESSORY: 43,
 SHOULDER_ACCESSORY: 44,
 FRONT_ACCESSORY: 45,
 BACK_ACCESSORY: 46,
 WAIST_ACCESSORY: 47,
 // TODO: Check for outage
 CLIMB_ANIMATION: 48,
 DEATH_ANIMATION: 49,
 FALL_ANIMATION: 50,
 IDLE_ANIMATION: 51,
 JUMP_ANIMATION: 52,
 RUN_ANIMATION: 53,
 SWIM_ANIMATION: 54,
 WALK_ANIMATION: 55,
 POSE_ANIMATION: 56,
 // till here
 EMOTE_ANIMATION: 61,
 T_SHIRT_ACCESSORY: 64,
 SHIRT_ACCESSORY: 65,
 PANTS_ACCESSORY: 66,
 JACKET_ACCESSORY: 67,
 SWEATER_ACCESSORY: 68,
 SHORTS_ACCESSORY: 69,
 LEFT_SHOE_ACCESSORY: 70,
 RIGHT_SHOE_ACCESSORY: 71,
 DRESS_SKIRT_ACCESSORY: 72,
 EYEBROW_ACCESSORY: 76,
 EYELASH_ACCESSORY: 77,
 MOOD_ANIMATION: 78,
 DYNAMIC_HEAD: 79,
};

export const SpecialAssetTypeEnum = {
 BADGE: 21,
};

export interface InventoryAPIResponse {
 IsValid: boolean;
 Data: InventoryData;
}

export interface InventoryData {
 Start: number;
 End: number;
 Page: number;
 nextPageCursor: number | null;
 previousPageCursor: string;
 ItemsPerPage: number;
 PageType: string;
 Items: ItemElement[];
}

export interface ItemElement {
 AssetRestrictionIcon: null;
 Item: Item;
 Creator: Creator;
 Product: Product;
 PrivateServer: null;
 Thumbnail: Thumbnail;
 UserItem: null;
}

export interface Creator {
 Id: number;
 Name: string;
 Type: number;
 CreatorProfileLink: string;
 HasVerifiedBadge: boolean;
}

export interface Item {
 AssetId: number;
 UniverseId: null;
 Name: string;
 AbsoluteUrl: string;
 AssetType: number;
 AssetTypeDisplayName: null;
 AssetTypeFriendlyLabel: null;
 Description: null;
 Genres: null;
 GearAttributes: null;
 AssetCategory: number;
 CurrentVersionId: number;
 IsApproved: boolean;
 LastUpdated: string;
 LastUpdatedBy: null;
 AudioUrl: null;
}

export interface Product {
 Id: number;
 PriceInRobux: number;
 PremiumDiscountPercentage: null;
 PremiumPriceInRobux: null;
 IsForSale: boolean;
 IsPublicDomain: boolean;
 IsResellable: boolean;
 IsLimited: boolean;
 IsLimitedUnique: boolean;
 SerialNumber: null;
 BcRequirement: number;
 TotalPrivateSales: number;
 SellerId: number;
 SellerName: null;
 LowestPrivateSaleUserAssetId: null;
 OffsaleDeadline: null;
 NoPriceText: null;
 IsFree: boolean;
}

export interface Thumbnail {
 Final: boolean;
 Url: string;
 RetryUrl: string;
 IsApproved: boolean;
}

export interface ThumnailAPIResponse {
 data: Array<{
  targetId: number;
  state: string;
  imageUrl: string;
  version: string;
 }>;
}

export interface UserAPIResponse {
 hasVerifiedBadge: boolean;
 id: number;
 name: string;
 displayName: string;
}

export interface UserSearchAPIResponse {
 previousPageCursor: null;
 nextPageCursor: string;
 data: Array<{
  previousUsernames: Array<string>;
  hasVerifiedBadge: boolean;
  id: number;
  name: string;
  displayName: string;
 }>;
}
