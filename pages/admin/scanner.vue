<template>
  <div class="max-w-xl">
    <h1 class="mb-1 text-3xl font-semibold">QR Scanner</h1>
    <p class="text-sm text-slate-500 mb-2">Code manuell eingeben oder Kamera (wenn erlaubt).</p>
    <p class="mb-6 text-sm text-slate-400 break-words">
      PWA: auf dem Handy „Zum Home-Bildschirm“ / Install.
      Manifest: <code class="rounded bg-slate-100 px-1">/manifest.webmanifest</code>
      · SW: <code class="rounded bg-slate-100 px-1">/sw.js</code>
    </p>

    <div class="card p-5 space-y-4">
      <div>
        <label class="label">Ticket-Code</label>
        <input
          v-model="code"
          class="input font-mono tracking-wider uppercase"
          placeholder="ABC123…"
          @keyup.enter="scan"
        />
      </div>
      <button type="button" class="btn-primary w-full" :disabled="busy || !code.trim()" @click="scan">
        {{ busy ? 'Prüfen…' : 'Scannen / Einlass' }}
      </button>

      <div class="border-t pt-4">
        <p class="text-xs font-medium text-slate-500 mb-2">Kamera (BarcodeDetector / getUserMedia)</p>
        <video ref="videoEl" class="w-full rounded-lg bg-black aspect-video" playsinline muted />
        <div class="mt-2 flex flex-col gap-2 sm:flex-row">
          <button type="button" class="btn-secondary w-full sm:w-auto" @click="startCam">Kamera starten</button>
          <button type="button" class="btn-secondary w-full sm:w-auto" @click="stopCam">Stop</button>
        </div>
        <p v-if="camMsg" class="text-xs text-slate-400 mt-2">{{ camMsg }}</p>
      </div>
    </div>

    <div
      v-if="result"
      class="mt-4 card p-4"
      :class="result.ok ? 'border-emerald-300 bg-emerald-50' : 'border-red-300 bg-red-50'"
    >
      <p class="font-semibold" :class="result.ok ? 'text-emerald-800' : 'text-red-800'">{{ result.message }}</p>
      <pre v-if="result.ticket" class="mt-2 max-w-full overflow-x-auto text-xs break-all whitespace-pre-wrap">{{ JSON.stringify(result.ticket, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

const { user, canScan } = useAuth()
const code = ref('')
const busy = ref(false)
const result = ref<any>(null)
const videoEl = ref<HTMLVideoElement | null>(null)
const camMsg = ref('')
let stream: MediaStream | null = null
let raf = 0

onMounted(() => {
  if (!canScan.value) {
    navigateTo('/admin')
  }
})

async function scan() {
  busy.value = true
  result.value = null
  try {
    result.value = await $fetch('/api/scanner/scan', {
      method: 'POST',
      body: { code: code.value.trim(), scanner: user.value?.email || 'scanner' }
    })
    if (result.value?.ok) code.value = ''
  } catch (e: any) {
    result.value = { ok: false, message: e?.data?.statusMessage || e?.message || 'Fehler' }
  } finally {
    busy.value = false
  }
}

async function startCam() {
  camMsg.value = ''
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    if (videoEl.value) {
      videoEl.value.srcObject = stream
      await videoEl.value.play()
    }
    const BD = (window as any).BarcodeDetector
    if (!BD) {
      camMsg.value = 'BarcodeDetector nicht verfügbar — Code manuell eingeben.'
      return
    }
    const detector = new BD({ formats: ['qr_code'] })
    const loop = async () => {
      if (!videoEl.value || videoEl.value.readyState < 2) {
        raf = requestAnimationFrame(loop)
        return
      }
      try {
        const codes = await detector.detect(videoEl.value)
        if (codes?.[0]?.rawValue) {
          code.value = codes[0].rawValue
          await scan()
          stopCam()
          return
        }
      } catch {
        /* ignore frame errors */
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
  } catch (e: any) {
    camMsg.value = e?.message || 'Kamera nicht verfügbar'
  }
}

function stopCam() {
  cancelAnimationFrame(raf)
  stream?.getTracks().forEach((t) => t.stop())
  stream = null
  if (videoEl.value) videoEl.value.srcObject = null
}

onBeforeUnmount(stopCam)
</script>
