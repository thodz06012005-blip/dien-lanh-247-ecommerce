export interface ApiPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccessResponse<TData, TMeta = Record<string, unknown>> {
  success: true;
  data: TData;
  message?: string;
  meta?: TMeta;
  pagination?: ApiPaginationMeta;
  requestId?: string;
  timestamp?: string;
  path?: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  error: ApiErrorBody;
  requestId?: string;
  timestamp?: string;
  method?: string;
  path?: string;
}
