import { watchDebounced } from '@vueuse/core'

export type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken'

/**
 * Live "is this username free?" for sign-up (ISS-009). Asks GET /auth/username-available
 * once the user pauses typing (500 ms) on a name that already passes the format rules,
 * so a taken name shows before they submit — and the error clears as soon as they change it.
 */
export function useUsernameAvailability(username: Ref<string>) {
  const status = ref<UsernameStatus>('idle')
  let latest = 0

  watchDebounced(username, async (value) => {
    const name = value.trim()
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(name)) { status.value = 'idle'; return }
    const ticket = ++latest
    status.value = 'checking'
    const res = await useHttp<{ data: { available: boolean } }>({
      method: 'GET',
      url: `/auth/username-available?username=${encodeURIComponent(name)}`,
    })
    if (ticket !== latest) return // a newer name was typed meanwhile
    status.value = res.success && res.data?.data ? (res.data.data.available ? 'available' : 'taken') : 'idle'
  }, { debounce: 500 })

  // Any edit invalidates the previous answer straight away.
  watch(username, () => { if (status.value !== 'checking') status.value = 'idle' })

  return { status }
}
