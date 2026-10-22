export type BillCropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ProcessBillOptions = {
  uri: string;
  crop: BillCropRect;
  maxDimension?: number;
  margin?: number;
  detect?: boolean;
};

export type ProcessBillResult = {
  uri: string;
  width: number;
  height: number;
  detected: boolean;
};
