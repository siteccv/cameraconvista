import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMobile: boolean;
}

export function BookingDialog({ open, onOpenChange, isMobile }: BookingDialogProps) {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-xl ${isMobile ? "mx-4 rounded-xl" : ""}`}>
        <DialogHeader>
          <DialogTitle className="text-center font-display text-xl">
            {t("Prima di prenotare", "Before you book")}
          </DialogTitle>
          <DialogDescription className={`text-center pt-4 space-y-1 ${isMobile ? "text-[11px]" : "text-sm"}`}>
            <p className="whitespace-nowrap">{t("Accettiamo prenotazioni esclusivamente per la cena.", "We accept reservations exclusively for dinner.")}</p>
            <p className="whitespace-nowrap">{t("Verrà richiesta una carta di credito a garanzia,", "A credit card will be required as a guarantee,")}</p>
            <p className="whitespace-nowrap">{t("con addebito della penale SOLO in caso di mancata presentazione,", "and a penalty will be charged ONLY in the event of a no-show,")}</p>
            <p className="whitespace-nowrap">{t("senza preventiva comunicazione.", "without prior notice.")}</p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-row justify-center gap-3 sm:justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-booking"
          >
            {t("Annulla", "Cancel")}
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              window.open("https://cameraconvista.resos.com/booking", "_blank");
            }}
            style={{ backgroundColor: '#722f37' }}
            className="text-white"
            data-testid="button-continue-booking"
          >
            {t("Continua", "Continue")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
