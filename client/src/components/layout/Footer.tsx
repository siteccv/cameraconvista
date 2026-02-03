import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin, Phone, Mail, Clock, Instagram, Facebook } from "lucide-react";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <div>
            <h3 className="font-display text-2xl mb-4">Camera con Vista</h3>
            <p className="text-background/70 text-sm leading-relaxed">
              {t(
                "Uno dei cocktail bar più rinomati di Bologna. La nostra filosofia si basa sulla qualità degli ingredienti, l'innovazione nelle tecniche e la passione per l'ospitalità.",
                "One of the most renowned cocktail bars in Bologna. Our philosophy is based on the quality of ingredients, innovation in techniques, and passion for hospitality."
              )}
            </p>
          </div>

          <div>
            <h4 className="font-medium uppercase tracking-wider text-sm mb-4">
              {t("Contatti", "Contact")}
            </h4>
            <ul className="space-y-3 text-sm text-background/70">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Via del Pratello, 42<br />40122 Bologna, Italia</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0" />
                <a href="tel:+390512345678" className="hover:text-background transition-colors">
                  +39 051 234 5678
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0" />
                <a href="mailto:info@cameraconvista.it" className="hover:text-background transition-colors">
                  info@cameraconvista.it
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium uppercase tracking-wider text-sm mb-4">
              {t("Orari", "Hours")}
            </h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li className="flex items-start gap-3">
                <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-background">{t("Martedì - Domenica", "Tuesday - Sunday")}</p>
                  <p>18:00 - 02:00</p>
                </div>
              </li>
              <li className="ml-7">
                <p className="font-medium text-background">{t("Lunedì", "Monday")}</p>
                <p>{t("Chiuso", "Closed")}</p>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium uppercase tracking-wider text-sm mb-4">
              {t("Seguici", "Follow Us")}
            </h4>
            <div className="flex gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors"
                data-testid="link-instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors"
                data-testid="link-facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>

            <div className="mt-6">
              <h4 className="font-medium uppercase tracking-wider text-sm mb-3">
                {t("Link Rapidi", "Quick Links")}
              </h4>
              <ul className="space-y-2 text-sm text-background/70">
                <li>
                  <Link href="/eventi-privati" className="hover:text-background transition-colors">
                    {t("Prenota un evento", "Book an event")}
                  </Link>
                </li>
                <li>
                  <Link href="/contatti" className="hover:text-background transition-colors">
                    {t("Lavora con noi", "Work with us")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-background/50">
          <p>© {new Date().getFullYear()} Camera con Vista. {t("Tutti i diritti riservati.", "All rights reserved.")}</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-background transition-colors">
              Privacy Policy
            </Link>
            <Link href="/cookie" className="hover:text-background transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
