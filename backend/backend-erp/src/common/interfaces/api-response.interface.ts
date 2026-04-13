export interface ApiResponse<T> {
  statusCode: number;
  intOpCode: string;
  data: T | null;
}
