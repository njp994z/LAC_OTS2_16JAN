import { baseApi } from "..";

const layoutManagerServices = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getLayouts: builder.query<any, void>({
            query: () => ({
                url: "/layouts",
                method: "GET",
            }),
            providesTags: ['Layouts']
        }),
        getLayoutById: builder.query<any, string>({
            query: (id: string) => ({
                url: `/layout/${id}`,
                method: "GET",
            }),
            providesTags: ['Layout']
        }),
        updateLayout: builder.mutation<any, { id: string; layout: any }>({
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
