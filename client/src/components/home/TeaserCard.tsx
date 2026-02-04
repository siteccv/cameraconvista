import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";

interface TeaserCardProps {
  imageUrl: string;
  titleIt: string;
  titleEn: string;
  descriptionIt: string;
  descriptionEn: string;
  href: string;
  testId: string;
}

export function TeaserCard({ imageUrl, titleIt, titleEn, descriptionIt, descriptionEn, href, testId }: TeaserCardProps) {
  const { t } = useLanguage();

  return (
    <div className="group" data-testid={testId}>
      <div className="aspect-[4/5] rounded-placeholder overflow-hidden mb-4">
        <img
          src={imageUrl}
          alt={t(titleIt, titleEn) || titleIt}
          className="w-full h-full object-cover"
        />
      </div>
      <Link href={href}>
        <h3 className="font-display text-xl mb-2 hover:text-primary transition-colors cursor-pointer">
          {t(titleIt, titleEn)}
        </h3>
      </Link>
      <p className="text-sm text-muted-foreground">
        {t(descriptionIt, descriptionEn)}
      </p>
    </div>
  );
}
