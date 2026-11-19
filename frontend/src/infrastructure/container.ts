import type { Services } from '../application/ports'
import { apiServices } from './api/apiRepositories'
import { config } from './config'
import { mockServices } from './mock/mockRepositories'

export const services: Services =
  config.dataSource === 'api' ? apiServices : mockServices
