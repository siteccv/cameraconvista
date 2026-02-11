import { useLanguage } from "@/contexts/LanguageContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Link } from "wouter";

export default function CookiePolicy() {
  const { language } = useLanguage();

  if (language === "en") {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-12 max-w-3xl" data-testid="page-cookie-policy">
          <h1 className="font-display text-3xl md:text-4xl mb-8 text-[#2f2b2a]">Cookie Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">Last updated: February 2026</p>

          <div className="prose prose-sm max-w-none space-y-6 text-foreground/90">
            <section>
              <h2 className="font-display text-xl mb-3 text-[#2f2b2a]">What Are Cookies</h2>
              <p>Cookies are small text files stored on your device when you visit a website. They are widely used to make websites work more efficiently and to provide information to site owners.</p>
            </section>

            <section>
              <h2 className="font-display text-xl mb-3 text-[#2f2b2a]">Cookie Categories</h2>

              <h3 className="font-semibold mt-4 mb-2">Technical / Essential Cookies</h3>
              <p>These cookies are necessary for the basic operation of the website (e.g. session management, cookie consent preference, language selection). They do not require your consent and cannot be deactivated.</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><strong>ccv_cookie_consent</strong> – stores your cookie preference (duration: 365 days).</li>
                <li><strong>ccv_language</strong> – stores your language preference.</li>
                <li><strong>session_id</strong> – admin session (httpOnly, 24 h).</li>
              </ul>

              <h3 className="font-semibold mt-4 mb-2">Statistical / Analytics Cookies</h3>
              <p>These cookies allow us to measure traffic and analyse browsing behaviour in aggregate form to improve the site. They are activated <strong>only after your consent</strong>.</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><strong>Google Analytics</strong> (_ga, _ga_*, _gid) – usage statistics. Duration: up to 2 years. Provider: Google LLC.</li>
              </ul>

              <h3 className="font-semibold mt-4 mb-2">Marketing / Profiling Cookies</h3>
              <p>These cookies are used to build audiences and measure advertising campaigns. They are activated <strong>only after your consent</strong>.</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><strong>Meta (Facebook) Pixel</strong> (_fbp, fr) – remarketing and ad measurement. Duration: up to 90 days. Provider: Meta Platforms, Inc.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl mb-3 text-[#2f2b2a]">Managing Consent</h2>
              <p>When you first visit the site, a cookie banner lets you choose between:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Accept All</strong> – enables all cookie categories.</li>
                <li><strong>Essential Only</strong> – only technical cookies, no analytics or marketing.</li>
                <li><strong>Preferences</strong> – choose individually which non-essential categories to enable (Statistics, Marketing).</li>
              </ul>
              <p className="mt-2">Non-essential cookies (Google Analytics, Meta Pixel) are <strong>never loaded before you give consent</strong>. If you choose "Essential Only", no analytics or advertising scripts will run.</p>
              <p className="mt-2">You can change your choice at any time by clicking the "Cookie preferences" link in the site footer, which re-opens the consent banner.</p>
            </section>

            <section>
              <h2 className="font-display text-xl mb-3 text-[#2f2b2a]">Browser Settings</h2>
              <p>You can also manage cookies through your browser settings. Note that disabling essential cookies may affect the functionality of the site.</p>
            </section>

            <section>
              <h2 className="font-display text-xl mb-3 text-[#2f2b2a]">Third-Party Opt-Out</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Google Analytics: <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="underline">https://tools.google.com/dlpage/gaoptout</a></li>
                <li>Meta / Facebook: <a href="https://www.facebook.com/help/568137493302217" target="_blank" rel="noopener noreferrer" className="underline">https://www.facebook.com/help/568137493302217</a></li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl mb-3 text-[#2f2b2a]">More Information</h2>
              <p>For further details about how we process your personal data, please read our <Link href="/privacy" className="underline">Privacy Policy</Link>.</p>
              <p className="mt-2">
                Data controller: <strong>CAMERA CON VISTA S.A.S.</strong> di Matteo Bonetti Camera Roda &amp; C.<br />
                Email: <a href="mailto:info@cameraconvista.it" className="underline">info@cameraconvista.it</a>
              </p>
            </section>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-12 max-w-3xl" data-testid="page-cookie-policy">
        <h1 className="font-display text-3xl md:text-4xl mb-8 text-[#2f2b2a]">Cookie Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Ultimo aggiornamento: Febbraio 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground/90">
          <section>
            <h2 className="font-display text-xl mb-3 text-[#2f2b2a]">Cosa sono i cookie</h2>
            <p>I cookie sono piccoli file di testo memorizzati sul tuo dispositivo quando visiti un sito web. Vengono ampiamente utilizzati per far funzionare i siti in modo più efficiente e per fornire informazioni ai proprietari del sito.</p>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3 text-[#2f2b2a]">Categorie di cookie</h2>

            <h3 className="font-semibold mt-4 mb-2">Cookie tecnici / essenziali</h3>
            <p>Questi cookie sono necessari per il funzionamento base del sito (es. gestione sessione, preferenza consenso cookie, selezione lingua). Non richiedono il tuo consenso e non possono essere disattivati.</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>ccv_cookie_consent</strong> – memorizza la tua preferenza sui cookie (durata: 365 giorni).</li>
              <li><strong>ccv_language</strong> – memorizza la tua preferenza lingua.</li>
              <li><strong>session_id</strong> – sessione admin (httpOnly, 24 h).</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">Cookie statistici / analytics</h3>
            <p>Questi cookie ci permettono di misurare il traffico e analizzare il comportamento di navigazione in forma aggregata per migliorare il sito. Vengono attivati <strong>solo dopo il tuo consenso</strong>.</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>Google Analytics</strong> (_ga, _ga_*, _gid) – statistiche di utilizzo. Durata: fino a 2 anni. Fornitore: Google LLC.</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">Cookie di marketing / profilazione</h3>
            <p>Questi cookie vengono utilizzati per creare audience e misurare le campagne pubblicitarie. Vengono attivati <strong>solo dopo il tuo consenso</strong>.</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>Meta (Facebook) Pixel</strong> (_fbp, fr) – remarketing e misurazione inserzioni. Durata: fino a 90 giorni. Fornitore: Meta Platforms, Inc.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3 text-[#2f2b2a]">Gestione del consenso</h2>
            <p>Alla prima visita del sito, un banner cookie ti permette di scegliere tra:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Accetta tutti</strong> – abilita tutte le categorie di cookie.</li>
              <li><strong>Solo essenziali</strong> – solo cookie tecnici, nessun analytics o marketing.</li>
              <li><strong>Preferenze</strong> – scegli individualmente quali categorie non essenziali abilitare (Statistiche, Marketing).</li>
            </ul>
            <p className="mt-2">I cookie non essenziali (Google Analytics, Meta Pixel) <strong>non vengono mai caricati prima del tuo consenso</strong>. Se scegli "Solo essenziali", nessuno script di analytics o pubblicità verrà eseguito.</p>
            <p className="mt-2">Puoi modificare la tua scelta in qualsiasi momento cliccando il link "Preferenze cookie" nel footer del sito, che riaprirà il banner di consenso.</p>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3 text-[#2f2b2a]">Impostazioni del browser</h2>
            <p>Puoi anche gestire i cookie attraverso le impostazioni del tuo browser. Nota che la disattivazione dei cookie essenziali potrebbe compromettere il funzionamento del sito.</p>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3 text-[#2f2b2a]">Opt-out servizi terzi</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Google Analytics: <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="underline">https://tools.google.com/dlpage/gaoptout</a></li>
              <li>Meta / Facebook: <a href="https://www.facebook.com/help/568137493302217" target="_blank" rel="noopener noreferrer" className="underline">https://www.facebook.com/help/568137493302217</a></li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3 text-[#2f2b2a]">Maggiori informazioni</h2>
            <p>Per ulteriori dettagli su come trattiamo i tuoi dati personali, consulta la nostra <Link href="/privacy" className="underline">Privacy Policy</Link>.</p>
            <p className="mt-2">
              Titolare del trattamento: <strong>CAMERA CON VISTA S.A.S.</strong> di Matteo Bonetti Camera Roda &amp; C.<br />
              Email: <a href="mailto:info@cameraconvista.it" className="underline">info@cameraconvista.it</a>
            </p>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
