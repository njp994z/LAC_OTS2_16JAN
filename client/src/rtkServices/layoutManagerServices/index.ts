import { baseApi } from "..";
import { Layout } from "./type";

const layoutManagerServices = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getLayouts: builder.query<any, void>({
            query: () => ({
                url: "/layouts",
                method: "GET",
            }),
            providesTags: ['Layouts']
        }),
        getLayoutById: builder.query<Layout, string>({
            query: (id: string) => ({
                url: `/layout/${id}`,
                method: "GET",
            }),
            providesTags: ['Layout']
        }),
        updateLayout: builder.mutation<any, { id: string; layout: Layout }>({
            query: ({ id, layout }) => ({
                url: `/layout/${id}`,
                method: "PUT",
                body: layout,
            }),
            invalidatesTags: ['Layout']
        }),
    }),
});

export const {
    useGetLayoutsQuery,
    useGetLayoutByIdQuery,
    useUpdateLayoutMutation,
} = layoutManagerServices;
