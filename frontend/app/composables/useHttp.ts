import { toast } from 'vue-sonner'
import { useAuthStore } from '~~/stores/auth';
import { inApp, parseRetryAfter, waitText } from '~/lib/utils';

type HttpOptions = {
  method: 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH'
  baseUrl?: string
  url: string
  body?: any
  requireAuth?: boolean
  headers?: Record<string, string>
  showToast?: boolean
  toastDelayMs?: number
  includeCredentials?: boolean
  ignoreResponse?: boolean
}

type HttpResponse<T = any> = {
  success: boolean
  message: string
  data: T | null
  status?: number
  /** Seconds to wait before retrying — set on 429s from the `Retry-After` header or body. */
  retryAfter?: number
}
const FALLBACK_BASE_URL = 'http://localhost:8000/api/v1'

type NuxtAppOrNull = ReturnType<typeof tryUseNuxtApp>

function buildHeaders(app: NuxtAppOrNull, requireAuth: boolean, body?: any, extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept-Language': 'en',
    ...(extra || {}),
  }
  // Let the browser set Content-Type automatically for FormData (multipart + boundary)
  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  if (requireAuth) {
    const store = useAuthStore()
    const token =
      store.getAccessToken ||
      (import.meta.client ? localStorage.getItem('accessToken') : null) ||
      inApp(app, () => useCookie('accessToken').value)
    if (token) headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

async function executeRequest(
  url: string,
  method: string,
  headers: Record<string, string>,
  body: any,
  includeCredentials: boolean
): Promise<Response> {
  return fetch(url, {
    method,
    headers,
    body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    credentials: includeCredentials ? 'include' : 'same-origin',
  })
}

/** Body as JSON when possible — empty bodies (204) and plain-text errors don't throw. */
async function readBody(res: Response): Promise<any> {
  const text = await res.text()
  if (!text) return null
  try { return JSON.parse(text) } catch { return { message: text } }
}

function showToastHandler(success: boolean, message: string, showToast: boolean) {
  if (!showToast || !import.meta.client) return
  if (!success) toast.error(message)
  else toast.success(message)
}

async function waitForToast(showToast: boolean, delayMs: number) {
  if (!showToast || !import.meta.client) return
  if (!Number.isFinite(delayMs) || delayMs <= 0) return
  await new Promise((r) => setTimeout(r, delayMs))
}

/** Turns any non-2xx response into the uniform failure shape. */
async function toFailure<T>(res: Response): Promise<HttpResponse<T>> {
  const data = await readBody(res)
  const serverMessage: string | undefined = data?.error?.message || data?.message

  if (res.status === 429) {
    // The server says *what* was limited (a plan cap, a sign-in limiter…) — show that.
    // Only when it says nothing do we fall back to a generic line with the wait.
    const retryAfter =
      parseRetryAfter(res.headers.get('Retry-After')) ??
      (typeof data?.retryAfter === 'number' && data.retryAfter > 0 ? Math.ceil(data.retryAfter) : undefined)
    return {
      success: false,
      message: serverMessage || (retryAfter
        ? `Too many requests. Please try again in ${waitText(retryAfter)}.`
        : 'Too many requests. Please wait a moment and try again.'),
      data,
      status: 429,
      retryAfter,
    }
  }

  return { success: false, message: serverMessage || `Request failed: ${res.status}`, data, status: res.status }
}

async function toSuccess<T>(res: Response, ignoreResponse: boolean): Promise<HttpResponse<T>> {
  if (ignoreResponse) return { success: true, message: 'Success', data: null, status: res.status }
  const data = await readBody(res)
  return { success: true, message: data?.message || 'Success', data, status: res.status }
}

export const useHttp = async <T = any>(options: HttpOptions): Promise<HttpResponse<T>> => {
  const {
    baseUrl,
    url,
    method,
    body,
    requireAuth = false,
    headers: extraHeaders,
    showToast = false,
    toastDelayMs = 0,
    includeCredentials = false,
    ignoreResponse = false,
  } = options

  const app = tryUseNuxtApp()
  const resolvedBase = baseUrl ?? inApp(app, () => useRuntimeConfig().public.baseUrl as string | undefined) ?? FALLBACK_BASE_URL
  const apiUrl = `${resolvedBase}${url.startsWith('/') ? url : `/${url}`}`

  const finish = async (response: HttpResponse<T>) => {
    showToastHandler(response.success, response.message, showToast)
    await waitForToast(showToast, toastDelayMs)
    return response
  }

  try {
    let res = await executeRequest(apiUrl, method, buildHeaders(app, requireAuth, body, extraHeaders), body, includeCredentials)

    // An expired access token on an authenticated call: refresh once, then retry.
    // Unauthenticated calls (login, refresh itself…) report their 401 as-is.
    if (res.status === 401 && requireAuth) {
      const outcome = await useAuthStore().refreshTokens(app)
      if (outcome === 'ended') {
        return finish({ success: false, message: 'Session expired. Please log in again.', data: null, status: 401 })
      }
      if (outcome === 'unavailable') {
        // The refresh got no usable answer (offline, 429, 5xx): stay signed in, report it.
        // 503, not 401: callers must not treat this as "signed out".
        return finish({ success: false, message: 'Could not reach the server. Please try again.', data: null, status: 503 })
      }
      res = await executeRequest(apiUrl, method, buildHeaders(app, requireAuth, body, extraHeaders), body, includeCredentials)
    }

    return finish(res.ok ? await toSuccess<T>(res, ignoreResponse) : await toFailure<T>(res))
  } catch (error: any) {
    return finish({
      success: false,
      message: error.message || 'Network error occurred',
      data: null,
      status: error.status || 500,
    })
  }
}
