export const MAKE_SEARCH_QUERY = 'MAKE_SEARCH_QUERY'
export const makeSearchQuery = (q, assembly) => ({ type: MAKE_SEARCH_QUERY, q, assembly });