import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Use the Vite proxy for development
const baseQuery = fetchBaseQuery({ 
  baseUrl: "/api",
  credentials: "include",
});

// Custom base query with error handling
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  if (result.error && result.error.status === 401) {
    // Unauthorized - clear user data and redirect to login
    localStorage.removeItem("userInfo");
    window.location.href = "/login";
  }
  
  return result;
};

export const apiSlice = createApi({
  baseQuery: baseQueryWithReauth,
  tagTypes: [],
  endpoints: (builder) => ({}),
});
