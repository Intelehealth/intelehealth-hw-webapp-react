/**
 * Postal Code Service
 * Handles fetching postal code information from external API
 */

export interface PostOffice {
  Name: string;
  Description: string | null;
  BranchType: string;
  DeliveryStatus: string;
  Circle: string;
  District: string;
  Division: string;
  Region: string;
  Block: string;
  State: string;
  Country: string;
  Pincode: string;
}

export interface PostalCodeApiResponse {
  Message: string;
  Status: 'Success' | 'Error';
  PostOffice: PostOffice[] | null;
}

export interface PostalCodeData {
  state: string;
  district: string;
  city: string;
}
