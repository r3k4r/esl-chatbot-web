<template>
  <div style="font-family:monospace;max-width:720px;margin:48px auto;padding:0 24px;background:#0f0f0f;color:#e0e0e0;min-height:100vh">
    <h1 style="color:#fff;font-size:1.2rem;margin-bottom:4px">Google OAuth Test</h1>
    <span style="display:inline-block;background:#f59e0b;color:#000;font-size:11px;padding:2px 8px;border-radius:4px;margin-bottom:24px">DEV ONLY</span>

    <div v-if="!clientId" style="background:#2a0a0a;border:1px solid #7f1d1d;border-radius:6px;padding:16px;color:#f87171;margin-bottom:24px">
      ERROR: NUXT_PUBLIC_GOOGLE_CLIENT_ID is not set in frontend/.env
    </div>

    <div style="background:#1a1a1a;border:1px solid #333;border-radius:6px;padding:16px;font-size:13px;line-height:1.7;margin-bottom:24px">
      <strong>How to use:</strong><br>
      1. Click <strong>Sign in with Google</strong> below<br>
      2. Sign in with your Google account<br>
      3. Copy the <code style="background:#2a2a2a;padding:2px 6px;border-radius:3px;color:#fbbf24">idToken</code> that appears<br>
      4. Open <a href="http://localhost:8000/api-docs" target="_blank" style="color:#60a5fa">Swagger UI</a> → <strong>POST /auth/google</strong> → paste the token
    </div>

    <div style="margin:24px 0">
      <p style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Step 1 — Sign in with Google</p>
      <!-- Google SDK renders the button into this div -->
      <div id="google-btn"></div>
    </div>

    <div style="margin:24px 0">
      <p style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Step 2 — Your ID token (copy into Swagger)</p>
      <textarea
        :value="token || 'Waiting for Google sign-in...'"
        readonly
        :style="{
          width: '100%', height: '120px', background: '#1a1a1a',
          border: '1px solid #333', color: token ? '#4ade80' : '#555',
          padding: '12px', borderRadius: '6px', fontSize: '11px',
          resize: 'none', boxSizing: 'border-box', fontFamily: 'monospace'
        }"
      />
      <button
        :disabled="!token"
        @click="copyToken"
        :style="{
          marginTop: '10px', padding: '8px 20px', border: 'none',
          borderRadius: '6px', fontFamily: 'monospace', fontSize: '13px',
          background: token ? '#2563eb' : '#333',
          color: token ? '#fff' : '#666',
          cursor: token ? 'pointer' : 'default'
        }"
      >
        Copy token
      </button>
      <p style="margin-top:8px;font-size:12px;color:#4ade80;min-height:18px">{{ copyStatus }}</p>
    </div>

    <hr style="border:none;border-top:1px solid #222;margin:28px 0">

    <div style="background:#1a1a1a;border:1px solid #333;border-radius:6px;padding:16px;font-size:13px;line-height:1.7">
      <strong>New user?</strong> First call returns <code style="background:#2a2a2a;padding:2px 6px;border-radius:3px;color:#fbbf24">needsRegistration: true</code>.
      Call again with a <code style="background:#2a2a2a;padding:2px 6px;border-radius:3px;color:#fbbf24">username</code> to finish.<br>
      <em style="color:#888">Tokens expire after 1 hour — refresh this page to get a new one.</em>
    </div>
  </div>
</template>

<script setup lang="ts">
// Disable SSR for this page — it's a dev-only client-side tool
definePageMeta({ ssr: false })
useSeo({ title: 'Google token test', noindex: true })

const config = useRuntimeConfig()
const clientId = config.public.googleClientId as string
const token = ref('')
const copyStatus = ref('')

onMounted(async () => {
  if (!clientId) return

  // Dynamically load Google Identity Services SDK (client-side only)
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google SDK'))
    document.head.appendChild(script)
  })

  // Programmatic initialization — no global callback needed
  const google = (window as any).google
  google.accounts.id.initialize({
    client_id: clientId,
    callback: (response: { credential: string }) => {
      token.value = response.credential
    },
  })

  google.accounts.id.renderButton(
    document.getElementById('google-btn'),
    { theme: 'filled_blue', size: 'large', text: 'signin_with', shape: 'rectangular' }
  )
})

function copyToken() {
  if (!token.value) return
  navigator.clipboard.writeText(token.value).then(() => {
    copyStatus.value = '✓ Copied to clipboard'
    setTimeout(() => { copyStatus.value = '' }, 2000)
  })
}
</script>
