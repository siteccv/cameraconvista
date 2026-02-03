import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface TranslateButtonProps {
  textIt: string;
  onTranslated: (translation: string) => void;
  context?: string;
  className?: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "ghost" | "outline" | "default";
  disabled?: boolean;
}

export function TranslateButton({
  textIt,
  onTranslated,
  context,
  className,
  size = "icon",
  variant = "ghost",
  disabled = false,
}: TranslateButtonProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { translate, isTranslating } = useTranslation();

  const handleTranslate = async () => {
    if (!textIt.trim()) {
      toast({
        title: t("Attenzione", "Warning"),
        description: t("Inserisci prima il testo italiano.", "Enter the Italian text first."),
        variant: "destructive",
      });
      return;
    }

    try {
      const translation = await translate(textIt, { context });
      onTranslated(translation);
      toast({
        title: t("Tradotto", "Translated"),
        description: t("Traduzione completata.", "Translation complete."),
      });
    } catch {
      toast({
        title: t("Errore", "Error"),
        description: t("Traduzione fallita. Riprova.", "Translation failed. Try again."),
        variant: "destructive",
      });
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          size={size}
          variant={variant}
          onClick={handleTranslate}
          disabled={disabled || isTranslating || !textIt.trim()}
          className={cn("shrink-0", className)}
          data-testid="button-translate"
        >
          <RefreshCw
            className={cn(
              "h-4 w-4",
              isTranslating && "animate-spin"
            )}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{t("Traduci IT in EN", "Translate IT to EN")}</p>
      </TooltipContent>
    </Tooltip>
  );
}
