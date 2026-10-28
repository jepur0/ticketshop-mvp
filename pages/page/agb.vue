<template>
  <div class="mx-auto max-w-3xl px-4 py-10">
    <h1 class="text-2xl font-bold mb-2">AGB / Ticketbedingungen</h1>
    <p class="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-6">
      Demo-AGB — vor Verkauf durch Anwalt / Veranstalter freigeben. Anbieter: {{ c?.name || '[FIRMA]' }}.
    </p>
    <div class="card p-6 text-sm text-slate-700 space-y-4 leading-relaxed">
      <section>
        <h2 class="font-semibold text-slate-900">§1 Geltungsbereich</h2>
        <p>
          Diese Bedingungen gelten für den Erwerb von Eintrittskarten über die Plattform von
          {{ c?.name || '[FIRMA]' }}, {{ c?.street || '[STRASSE]' }}, {{ c?.zip || '[PLZ]' }} {{ c?.city || '[ORT]' }}
          ({{ c?.country || 'Deutschland' }}).
        </p>
      </section>
      <section>
        <h2 class="font-semibold text-slate-900">§2 Vertragsschluss</h2>
        <p>
          Angebot durch Auswahl der Tickets; Annahme mit erfolgreicher Zahlung. Sitzplätze werden während des Holds
          (konfigurierbar, typisch 15–30 Min.) vorgemerkt und nach Ablauf freigegeben.
        </p>
      </section>
      <section>
        <h2 class="font-semibold text-slate-900">§3 Preise & Zahlung</h2>
        <p>
          Alle Preise in EUR inkl. MwSt. soweit ausgewiesen. Zahlung via Stripe und/oder OTP VPOS (je nach Konfiguration).
          Servicegebühren können ausgewiesen werden. Bei Nutzung von Stripe Connect kann der Veranstalter Zahlungsempfänger sein.
        </p>
      </section>
      <section>
        <h2 class="font-semibold text-slate-900">§4 Tickets & Einlass</h2>
        <p>
          Tickets werden per E-Mail (PDF/QR) zugestellt. Einlass nur mit gültigem, ungescanntem Code.
          Weiterverkauf kann untersagt sein. Kontakt: {{ c?.email || '[EMAIL]' }}.
        </p>
      </section>
      <section>
        <h2 class="font-semibold text-slate-900">§5 Widerruf / Storno</h2>
        <p>
          Für Freizeitveranstaltungen mit festem Termin kann das Widerrufsrecht eingeschränkt sein (§ 312g Abs. 2 Nr. 9 BGB) —
          rechtliche Prüfung erforderlich. Veranstalter-Storno: Erstattung nach Veranstalterregeln.
        </p>
      </section>
      <section>
        <h2 class="font-semibold text-slate-900">§6 Haftung</h2>
        <p>Haftung für Vorsatz und grobe Fahrlässigkeit; im Übrigen nach gesetzlichen Vorgaben (Demo-Text).</p>
      </section>
      <section>
        <h2 class="font-semibold text-slate-900">§7 Schlussbestimmungen</h2>
        <p>
          Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand, soweit zulässig:
          {{ c?.city || '[ORT]' }}. Salvatorische Klausel.
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: c } = await useFetch('/api/public/company')
</script>
