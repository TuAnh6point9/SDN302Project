export const getPagination = (page?: unknown, limit?: unknown) => {
  const currentPage = Math.max(Number(page ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(limit ?? 12), 1), 100);

  return {
    page: currentPage,
    limit: pageSize,
    skip: (currentPage - 1) * pageSize
  };
};
