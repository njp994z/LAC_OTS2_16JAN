import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: fetchBaseQuery({ baseUrl: `${window.location.origin}/api` }),
  tagTypes: ['Layouts', 'Layout'],
  endpoints: () => ({})
})

export const { } = baseApi