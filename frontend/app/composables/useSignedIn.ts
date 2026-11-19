import { useAuthStore } from '~~/stores/auth'

/**
 * Whether the visitor is signed in, for the public pages' calls to action ("Get started" becomes
 * "dashboard"). False on the server and until the page has mounted, so the server HTML and
 * the first browser render always match; it switches right after.
 */
export function useSignedIn() {
  const auth = useAuthStore()
  const mounted = ref(false)
  onMounted(() => { mounted.value = true })
  return computed(() => mounted.value && auth.getIsAuthenticated)
}
