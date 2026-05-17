"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationMeta = exports.getPagination = exports.MAX_LIMIT = exports.DEFAULT_LIMIT = exports.DEFAULT_PAGE = void 0;
exports.DEFAULT_PAGE = 1;
exports.DEFAULT_LIMIT = 5;
exports.MAX_LIMIT = 100;
const getPagination = (req) => {
    const page = Math.max(exports.DEFAULT_PAGE, parseInt(String(req.query.page || ""), 10) || exports.DEFAULT_PAGE);
    const limit = Math.min(exports.MAX_LIMIT, Math.max(1, parseInt(String(req.query.limit || ""), 10) || exports.DEFAULT_LIMIT));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};
exports.getPagination = getPagination;
const paginationMeta = (total, page, limit) => ({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
});
exports.paginationMeta = paginationMeta;
