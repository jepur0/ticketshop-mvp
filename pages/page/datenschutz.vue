<template>
  <div class="mx-auto max-w-3xl px-4 py-10">
    <h1 class="page-title mb-6">Datenschutzerklärung</h1>
    <p class="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-6">
      MVP-Platzhalter (DSGVO). Kein Ersatz für eine vollständige Datenschutzdokumentation.
    </p>
    <div class="card p-6 text-sm text-slate-700 space-y-4 leading-relaxed">
      <section>
        <h2 class="font-semibold text-slate-900">1. Verantwortlicher</h2>
        <p>
          {{ c?.name || '[FIRMA]' }}<br />
          {{ c?.street || '[STRASSE]' }}, {{ c?.zip || '[PLZ]' }} {{ c?.city || '[ORT]' }}<br />
          E-Mail: {{ c?.email || '[EMAIL]' }}<br />
          Datenschutz: {{ c?.privacyEmail || '[PRIVACY-EMAIL]' }}
        </p>
      </section>
      <section>
        <h2 class="font-semibold text-slate-900">2. Zwecke der Verarbeitung</h2>
        <ul class="list-disc pl-5 space-y-1">
          <li>Ticketverkauf und Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO)</li>
          <li>Zahlungsabwicklung über Stripe / OTP VPOS</li>
          <li>Sitzplatzverwaltung über seats.io</li>
          <li>E-Mail-Versand der Tickets (SMTP / Resend)</li>
          <li>Essenzielle Cookies für Warenkorb und Login (Session)</li>
          <li>Statistik nur nach Einwilligung (Cookie-Banner „Alle akzeptieren“)</li>
        </ul>
      </section>
      <section>
        <h2 class="font-semibold text-slate-900">3. Empfänger / Auftragsverarbeiter</h2>
        <p>
          Zahlungsdienstleister (Stripe), seats.io, Hosting, E-Mail-Versand — AVV vor Live abschließen.
          Bei Stripe Connect können Daten an den verbundenen Veranstalter-Account übermittelt werden.
        </p>
      </section>
      <section>
        <h2 class="font-semibold text-slate-900">4. Speicherdauer</h2>
        <p>Bestelldaten gemäß handels-/steuerrechtlicher Fristen; Holds temporär; Sessions zeitlich begrenzt.</p>
      </section>
      <section>
        <h2 class="font-semibold text-slate-900">5. Betroffenenrechte</h2>
        <p>
          Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch, Beschwerde bei einer Aufsichtsbehörde.
          Anfragen an {{ c?.privacyEmail || '[PRIVACY-EMAIL]' }}.
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: c } = await useFetch('/api/public/company')
</script>
