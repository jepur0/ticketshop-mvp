export default defineNuxtPlugin(() => {
  const ref = useState<string>('affiliate-ref', () => '')
  const route = useRoute()
  const read = () => {
    const q = route.query.ref
    if (typeof q === 'string' && q.trim()) {
      const code = q.trim().slice(0, 40)
      localStorage.setItem('ts-ref', code)
      ref.value = code
    } else if (!ref.value) {
      ref.value = localStorage.getItem('ts-ref') || ''
    }
  }
  read()
  watch(() => route.query.ref, read)
})
