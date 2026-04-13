export type ServiceCode = 'SxGW' | 'SxUS' | 'SxTK' | 'SxGR';

export function buildResponse<T>(
  statusCode: number,
  service: ServiceCode,
  data: T | null = null,
): { statusCode: number; intOpCode: string; data: T | null } {
  return {
    statusCode,
    intOpCode: `${service}${statusCode}`,
    data,
  };
}
