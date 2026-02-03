import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Phone, Mail, Clock, Instagram, Facebook, Twitter, Linkedin, Youtube } from "lucide-react";
import { SiTiktok } from "react-icons/si";
import type { FooterSettings } from "@shared/schema";
import { defaultFooterSettings } from "@shared/schema";

const socialIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
  tiktok: SiTiktok,
};

export function Footer() {
  const { t, language } = useLanguage();
  const { forceMobileLayout } = useAdmin();

  const { data: settings } = useQuery<FooterSettings>({
    queryKey: ["/api/footer-settings"],
    staleTime: 1000 * 60 * 5,
  });

  const footer = settings || defaultFooterSettings;
  const isMobile = forceMobileLayout;

  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className={`grid gap-8 ${isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4 lg:gap-12"}`}>
          <div>
            <h3 className="font-display text-2xl mb-4">Camera con Vista</h3>
            <p className="text-background/70 text-sm leading-relaxed">
              {language === "it" ? footer.about.it : footer.about.en}
            </p>
          </div>

          <div>
            <h4 className="font-medium uppercase tracking-wider text-sm mb-4">
              {t("Contatti", "Contact")}
            </h4>
            <ul className="space-y-3 text-sm text-background/70">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span style={{ whiteSpace: "pre-line" }}>{footer.contacts.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0" />
                <a href={`tel:${footer.contacts.phone.replace(/\s/g, "")}`} className="hover:text-background transition-colors">
                  {footer.contacts.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0" />
                <a href={`mailto:${footer.contacts.email}`} className="hover:text-background transition-colors">
                  {footer.contacts.email}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium uppercase tracking-wider text-sm mb-4">
              {t("Orari", "Hours")}
            </h4>
            <ul className="space-y-2 text-sm text-background/70">
              {footer.hours.map((entry, index) => (
                <li key={index} className={index === 0 ? "flex items-start gap-3" : "ml-7"}>
                  {index === 0 && <Clock className="h-4 w-4 mt-0.5 shrink-0" />}
                  <div>
                    <p className="font-medium text-background">
                      {language === "it" ? entry.dayKeyIt : entry.dayKeyEn}
                    </p>
                    <p>{entry.isClosed ? t("Chiuso", "Closed") : entry.hours}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium uppercase tracking-wider text-sm mb-4">
              {t("Seguici", "Follow Us")}
            </h4>
            <div className="flex gap-4">
              {footer.social.map((link, index) => {
                const IconComponent = socialIcons[link.type];
                return IconComponent ? (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors"
                    data-testid={`link-${link.type}`}
                  >
                    <IconComponent className="h-5 w-5" />
                  </a>
                ) : null;
              })}
            </div>

            {footer.quickLinks.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium uppercase tracking-wider text-sm mb-3">
                  {t("Link Rapidi", "Quick Links")}
                </h4>
                <ul className="space-y-2 text-sm text-background/70">
                  {footer.quickLinks.map((link, index) => (
                    <li key={index}>
                      <Link href={link.url} className="hover:text-background transition-colors">
                        {language === "it" ? link.labelIt : link.labelEn}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className={`mt-8 pt-6 border-t border-background/10 flex flex-col items-center gap-3 text-xs text-background/50 ${isMobile ? "" : "md:flex-row md:justify-between"}`}>
          <p className="text-center">© {new Date().getFullYear()} Camera con Vista. {t("Tutti i diritti riservati.", "All rights reserved.")}</p>
          <div className="flex gap-4">
            <Link href={footer.legalLinks.privacyUrl} className="hover:text-background transition-colors">
              {language === "it" ? footer.legalLinks.privacyLabelIt : footer.legalLinks.privacyLabelEn}
            </Link>
            <Link href={footer.legalLinks.cookieUrl} className="hover:text-background transition-colors">
              {language === "it" ? footer.legalLinks.cookieLabelIt : footer.legalLinks.cookieLabelEn}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
