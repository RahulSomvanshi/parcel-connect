import { Request } from "express";

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 5;
export const MAX_LIMIT = 100;

export const getPagination = (req: Request) => {
  const page = Math.max(DEFAULT_PAGE, parseInt(String(req.query.page || ""), 10) || DEFAULT_PAGE);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(String(req.query.limit || ""), 10) || DEFAULT_LIMIT)
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const paginationMeta = (total: number, page: number, limit: number) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});
