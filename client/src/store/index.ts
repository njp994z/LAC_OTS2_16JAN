import { baseApi } from '@/rtkServices'
import layoutManagerSlice from '@/rtkServices/layoutManagerServices/slice'
import { configureStore } from '@reduxjs/toolkit'

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    [layoutManagerSlice.reducerPath]: layoutManagerSlice.reducer,
  },
  middleware: (get) => get().concat(baseApi.middleware),
})