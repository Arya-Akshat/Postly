export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const successResponse = <T>(data: T, meta: PaginationMeta | null = null) => {
  return {
    data,
    meta,
    error: null,
  };
};

export const errorResponse = (message: string, code: string, details?: any) => {
  return {
    data: null,
    meta: null,
    error: {
      message,
      code,
      details,
    },
  };
};
