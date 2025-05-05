export interface PaginatedResponse {
  status: number;
  message: string;
  data: any[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    links: {
      current: string;
      next: string | null;
      prev: string | null;
      first: string;
      last: string;
    };
  };
}
