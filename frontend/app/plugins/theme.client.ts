// Re-applies the theme on every navigation, so leaving the dashboard drops dark
// mode (public pages are light-only) and entering it restores the saved theme.
export default defineNuxtPlugin(() => {
  const { paint } = useTheme()
  useRouter().afterEach((to) => paint(to.path))
})
