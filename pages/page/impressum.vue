<template>
  <div class="mx-auto max-w-3xl px-4 py-10">
    <h1 class="text-2xl font-bold mb-2">Impressum</h1>
    <p class="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-6">
      Platzhalter — vor Go-Live durch anwaltlich geprüften Text ersetzen (§ 5 TMG / § 18 MStV).
      Firmendaten aus Admin → Settings → Firma.
    </p>
    <div v-if="c" class="card p-6 text-sm text-slate-700 space-y-4 leading-relaxed">
      <div>
        <h2 class="font-semibold text-slate-900">Diensteanbieter</h2>
        <p>
          {{ c.name }}<br />
          {{ c.street }}<br />
          {{ c.zip }} {{ c.city }}<br />
          {{ c.country }}
        </p>
      </div>
      <div>
        <h2 class="font-semibold text-slate-900">Kontakt</h2>
        <p>E-Mail: {{ c.email }}<br />Telefon: {{ c.phone }}</p>
      </div>
      <div>
        <h2 class="font-semibold text-slate-900">Vertreten durch</h2>
        <p>{{ c.managingDirector }}</p>
      </div>
      <div>
        <h2 class="font-semibold text-slate-900">Registereintrag</h2>
        <p>Registergericht: {{ c.court }}<br />Registernummer: {{ c.hrb }}</p>
      </div>
      <div>
        <h2 class="font-semibold text-slate-900">Umsatzsteuer / Steuernummer</h2>
        <p>USt-IdNr.: {{ c.ustId }}<br />Steuernummer: {{ c.steuernummer }}</p>
      </div>
      <div>
        <h2 class="font-semibold text-slate-900">Streitbeilegung</h2>
        <p>
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
          <a class="break-all text-blue-700 underline" href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener">ec.europa.eu/consumers/odr</a>.
          Wir sind nicht verpflichtet und derzeit nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen
          (Angabe prüfen / anpassen).
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: c } = await useFetch('/api/public/company')
</script>
