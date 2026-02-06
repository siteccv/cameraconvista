import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

export interface TeaserSectionData {
  subtitleIt: string;
  subtitleEn: string;
  titleIt: string;
  titleEn: string;
  bodyIt: string;
  bodyEn: string;
  ctaLabelIt: string;
  ctaLabelEn: string;
  ctaHref: string;
  imageUrl: string;
  testId: string;
}

interface TeaserSectionProps {
  data: TeaserSectionData;
  reverse?: boolean;
  alternate?: boolean;
  isMobile?: boolean;
}

export function TeaserSection({ data, reverse = false, alternate = false, isMobile = false }: TeaserSectionProps) {
  const { t } = useLanguage();

  const textOrderClass = reverse ? "order-1 md:order-2" : "order-1";
  const imageOrderClass = reverse ? "order-2 md:order-1" : "order-2";

  return (
    <section
      className={`${isMobile ? "py-10" : "py-16 md:py-24 lg:py-32"} ${alternate ? "bg-card" : "bg-background"}`}
      data-testid={`section-${data.testId}`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className={`grid ${isMobile ? "grid-cols-1 gap-8" : "md:grid-cols-2 gap-12"} items-center`}>
          <div className={isMobile ? "" : textOrderClass}>
            <p
              className={`uppercase tracking-widest font-medium mb-3 ${isMobile ? "text-[11px]" : "text-[11px] md:text-base"}`}
              style={{ color: '#c7902f' }}
            >
              {t(data.subtitleIt, data.subtitleEn)}
            </p>

            <h2 className={`font-display font-light ${isMobile ? "text-3xl" : "text-4xl md:text-5xl"}`} style={{ color: '#2f2b2a' }}>
              {t(data.titleIt, data.titleEn)}
            </h2>

            <div className="mt-6 h-px max-w-24" style={{ backgroundColor: 'rgba(199, 144, 47, 0.3)' }} />

            <p className={`${isMobile ? "text-sm" : "text-sm md:text-lg"} text-muted-foreground mb-8 mt-6 leading-relaxed`}>
              {t(data.bodyIt, data.bodyEn)}
            </p>

            <Link href={data.ctaHref}>
              <Button
                variant="outline"
                className="group rounded-full px-6"
                data-testid={`button-cta-${data.testId}`}
              >
                {t(data.ctaLabelIt, data.ctaLabelEn)}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          <div className={isMobile ? "" : imageOrderClass}>
            <div className="aspect-[4/3] rounded-2xl overflow-hidden relative">
              <img
                src={data.imageUrl}
                alt={t(data.titleIt, data.titleEn) || data.titleIt}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
