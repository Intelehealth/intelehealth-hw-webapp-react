export interface AyuApiResponse {
  data: AyuJsonItem[];
}

export interface AyuJsonItem {
  id: number;
  name: string;
  json: string;
  keyName: string;
  isActive: boolean;
}
