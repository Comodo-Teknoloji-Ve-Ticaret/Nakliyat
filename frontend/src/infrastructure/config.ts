export type DataSource = 'mock' | 'api'

export const config = {
  dataSource: (import.meta.env.VITE_DATA_SOURCE as DataSource | undefined) ?? 'mock',
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api',
}
