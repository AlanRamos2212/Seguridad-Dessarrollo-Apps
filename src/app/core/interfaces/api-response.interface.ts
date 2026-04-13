export interface ApiResponse<T = any> {
  statusCode: number;
  intOpCode: string;
  data: T;
}
