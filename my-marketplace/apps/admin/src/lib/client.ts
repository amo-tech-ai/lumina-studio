import { createClient, type InferClient } from "@mercurjs/client"
import type { Routes } from '@acme/api/_generated'

const rawBackendUrl = import.meta.env.VITE_MEDUSA_BACKEND_URL
const backendUrl =
  typeof rawBackendUrl === "string" && rawBackendUrl.trim()
    ? rawBackendUrl.trim()
    : "http://localhost:9000"

export const client: InferClient<Routes> = createClient({
    baseUrl: backendUrl,
    fetchOptions: {
        credentials: 'include',
    }
})
