import { useLanguage } from "@/contexts/LanguageContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Link } from "wouter";

export default function PrivacyPolicy() {
  const { language } = useLanguage();

  if (language === "en") {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-12 max-w-3xl" data-testid="page-privacy-policy">
          <h1 className="font-display text-3xl md:text-4xl mb-8 text-[#2f2b2a]">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">Last updated: February 2026</p>

          <div className="prose prose-sm max-w-none space-y-6 text-foreground/90">
            <section>
              <h2 className="font-display text-xl mb-3 text-[#2f2b2a]">1. Data Controller</h2>
              <p>The data controller is:</p>
              <p className="pl-4 border-l-2 border-[#e5d6b6]">
                <strong>CAMERA CON VISTA S.A.S.</strong> di Matteo Bonetti Camera Roda &amp; C.<br />
                Via Santo Stefano 14/2A – 40125 Bologna (BO), Italy<br />
                VAT / Tax Code: 03488971205<br />
                Registered at the Bologna Companies Register<br />
                Email: <a href="mailto:info@cameraconvista.it" className="underline">info@cameraconvista.it</a><br />
                Phone: <a href="tel:+39051224268" className="underline">+39 051 224268</a>
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl mb-3 text-[#2f2b2a]">2. Data We Collect</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Contact form data</strong>: name, email address, phone number, message text – provided voluntarily by the user.</li>
                <li><strong>Technical / navigation data</strong>: IP address, browser type, operating system, pages visited, access times – collected automatically by our hosting infrastructure.</li>
                <li><strong>Analytics and advertising data</strong>: browsing behaviour collected via Google Analytics and Meta (Facebook) Pixel – only after the user's explicit consent.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl mb-3 text-[#2f2b2a]">3. Purpose of Processing</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Responding to enquiries</strong>: processing contact form data to answer the user's request.</li>
                <li><strong>Website operation and security</strong>: server logs and technical data to ensure proper functioning and prevent abuse.</li>
                <li><strong>Statistics</strong>: aggregate analysis of browsing behaviour to improve the site (via Google Analytics).</li>
                <li><strong>Advertising / remarketing</strong>: audience building and ad measurement via Meta Pixel.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl mb-3 text-[#2f2b2a]">4. Legal Basis</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Performance of the user's request</strong> (Art. 6(1)(b) GDPR): processing contact form data to respond to your enquiry.</li>
                <li><strong>Legitimate interest</strong> (Art. 6(1)(f) GDPR): server logs and technical measures necessary for security and site operation.</li>
                <li><strong>Consent</strong> (Art. 6(1)(a) GDPR): non-essential analytics and marketing cookies (Google Analytics, Meta Pixel) are only activated after the user gives consent via the cookie banner.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl mb-3 text-[#2f2b2a]">5. Data Retention</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Contact form data</strong>: retained until the enquiry is fully handled, then archived for a maximum of 24 months.</li>
                <li><strong>Server / technical logs</strong>: retained for a maximum of 90 days.</li>
                <li><strong>Cookie-based data</strong>: retained according to each cookie's lifetime (see our <Link href="/cookie" className="underline">Cookie Policy</Link>).</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl mb-3 text-[#2f2b2a]">6. Recipients and Processors</h2>
              <p>Your data may be shared with the following categories of recipients, acting as data processors under appropriate agreements:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Hosting provider</strong>: site infrastructure (servers, CDN).</li>
                <li><strong>Google LLC</strong>: Google Analytics for statistical analysis.</li>
                <li><strong>Meta Platforms, Inc.</strong>: Meta Pixel for advertising purposes.</li>
                <li><strong>Resos</strong>: external reservation platform (data entered directly on their site; see Resos's own privacy policy).</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl mb-3 text-[#2f2b2a]">7. Your Rights</h2>
              <p>Under the GDPR you have the right to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Access, rectify, or erase your personal data.</li>
                <li>Restrict or object to processing.</li>
                <li>Data portability.</li>
                <li>Withdraw consent at any time (without affecting the lawfulness of prior processing).</li>
                <li>Lodge a complaint with the Italian Data Protection Authority (<em>Garante per la protezione dei dati personali</em>).</li>
              </ul>
              <p className="mt-2">To exercise your rights, contact us at <a href="mailto:info@cameraconvista.it" className="underline">info@cameraconvista.it</a>.</p>
            </section>

            <section>
              <h2 className="font-display text-xl mb-3 text-[#2f2b2a]">8. Cookies</h2>
              <p>For details about the cookies used on this site, please read our <Link href="/cookie" className="underline">Cookie Policy</Link>.</p>
            </section>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-12 max-w-3xl" data-testid="page-privacy-policy">
        <h1 className="font-display text-3xl md:text-4xl mb-8 text-[#2f2b2a]">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Ultimo aggiornamento: Febbraio 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground/90">
          <section>
            <h2 className="font-display text-xl mb-3 text-[#2f2b2a]">1. Titolare del trattamento</h2>
            <p>Il titolare del trattamento dei dati è:</p>
            <p className="pl-4 border-l-2 border-[#e5d6b6]">
              <strong>CAMERA CON VISTA S.A.S.</strong> di Matteo Bonetti Camera Roda &amp; C.<br />
              Via Santo Stefano 14/2A – 40125 Bologna (BO)<br />
              P.IVA e C.F.: 03488971205<br />
              Iscritta al Registro Imprese di Bologna<br />
              Email: <a href="mailto:info@cameraconvista.it" className="underline">info@cameraconvista.it</a><br />
              Telefono: <a href="tel:+39051224268" className="underline">+39 051 224268</a>
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3 text-[#2f2b2a]">2. Dati raccolti</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Dati del form di contatto</strong>: nome, indirizzo email, numero di telefono, testo del messaggio – forniti volontariamente dall'utente.</li>
              <li><strong>Dati tecnici / di navigazione</strong>: indirizzo IP, tipo di browser, sistema operativo, pagine visitate, orari di accesso – raccolti automaticamente dall'infrastruttura di hosting.</li>
              <li><strong>Dati di analytics e pubblicità</strong>: comportamento di navigazione raccolto tramite Google Analytics e Meta (Facebook) Pixel – solo previo consenso esplicito dell'utente.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3 text-[#2f2b2a]">3. Finalità del trattamento</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Risposta alle richieste</strong>: trattamento dei dati del form per rispondere alle richieste dell'utente.</li>
              <li><strong>Funzionamento e sicurezza del sito</strong>: log del server e dati tecnici per garantire il corretto funzionamento e prevenire abusi.</li>
              <li><strong>Statistiche</strong>: analisi aggregata del comportamento di navigazione per migliorare il sito (tramite Google Analytics).</li>
              <li><strong>Pubblicità / remarketing</strong>: creazione di audience e misurazione delle inserzioni tramite Meta Pixel.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3 text-[#2f2b2a]">4. Base giuridica</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Esecuzione della richiesta dell'utente</strong> (Art. 6(1)(b) GDPR): trattamento dei dati del form per rispondere alla richiesta.</li>
              <li><strong>Interesse legittimo</strong> (Art. 6(1)(f) GDPR): log del server e misure tecniche necessarie per la sicurezza e il funzionamento del sito.</li>
              <li><strong>Consenso</strong> (Art. 6(1)(a) GDPR): cookie di analytics e marketing non essenziali (Google Analytics, Meta Pixel) attivati solo dopo il consenso tramite il banner cookie.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3 text-[#2f2b2a]">5. Conservazione dei dati</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Dati del form di contatto</strong>: conservati fino alla completa gestione della richiesta, poi archiviati per un massimo di 24 mesi.</li>
              <li><strong>Log server / tecnici</strong>: conservati per un massimo di 90 giorni.</li>
              <li><strong>Dati basati su cookie</strong>: conservati secondo la durata di ciascun cookie (vedi la nostra <Link href="/cookie" className="underline">Cookie Policy</Link>).</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3 text-[#2f2b2a]">6. Destinatari e responsabili del trattamento</h2>
            <p>I dati possono essere condivisi con le seguenti categorie di destinatari, che agiscono come responsabili del trattamento in base ad appositi accordi:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Provider di hosting</strong>: infrastruttura del sito (server, CDN).</li>
              <li><strong>Google LLC</strong>: Google Analytics per analisi statistiche.</li>
              <li><strong>Meta Platforms, Inc.</strong>: Meta Pixel per finalità pubblicitarie.</li>
              <li><strong>Resos</strong>: piattaforma esterna di prenotazione (i dati vengono inseriti direttamente sul loro sito; consultare la privacy policy di Resos).</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3 text-[#2f2b2a]">7. Diritti dell'interessato</h2>
            <p>Ai sensi del GDPR hai il diritto di:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Accedere, rettificare o cancellare i tuoi dati personali.</li>
              <li>Limitare od opporti al trattamento.</li>
              <li>Portabilità dei dati.</li>
              <li>Revocare il consenso in qualsiasi momento (senza pregiudicare la liceità del trattamento precedente).</li>
              <li>Proporre reclamo al Garante per la protezione dei dati personali.</li>
            </ul>
            <p className="mt-2">Per esercitare i tuoi diritti, contattaci a <a href="mailto:info@cameraconvista.it" className="underline">info@cameraconvista.it</a>.</p>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3 text-[#2f2b2a]">8. Cookie</h2>
            <p>Per i dettagli sui cookie utilizzati su questo sito, consulta la nostra <Link href="/cookie" className="underline">Cookie Policy</Link>.</p>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
