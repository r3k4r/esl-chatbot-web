/**
 * Counts down a 429's `retryAfter` so a form can lock its submit button until the
 * rate limit lifts:
 *
 *   const cooldown = useCooldown()
 *   if (res.status === 429 && res.retryAfter) cooldown.start(res.retryAfter)
 *   <AppButton :disabled="cooldown.active.value">{{ cooldown.active.value ? `Try again in ${cooldown.label.value}` : 'Sign in' }}</AppButton>
 */
export function useCooldown() {
  const remaining = ref(0)
  let timer: ReturnType<typeof setInterval> | undefined

  function stop() {
    clearInterval(timer)
    timer = undefined
  }

  function start(seconds: number) {
    stop()
    remaining.value = Math.max(0, Math.ceil(seconds))
    if (!remaining.value || !import.meta.client) return
    timer = setInterval(() => {
      remaining.value = Math.max(0, remaining.value - 1)
      if (!remaining.value) stop()
    }, 1000)
  }

  onScopeDispose(stop)

  const active = computed(() => remaining.value > 0)
  /** m:ss, e.g. "4:05". */
  const label = computed(() => `${Math.floor(remaining.value / 60)}:${String(remaining.value % 60).padStart(2, '0')}`)

  return { remaining, active, label, start, stop }
}
