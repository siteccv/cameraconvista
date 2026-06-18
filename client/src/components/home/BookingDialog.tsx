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
import { useQuery } from "@tanstack/react-query";
import { type BookingSettings, defaultBookingSettings } from "@shared/schema";

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMobile: boolean;
}

export function BookingDialog({ open, onOpenChange, isMobile }: BookingDialogProps) {
  const { t } = useLanguage();
  const { data: bookingSettings } = useQuery<BookingSettings>({
    queryKey: ["/api/booking-settings"],
    staleTime: 1000 * 60 * 5,
  });
  const bookingUrl = bookingSettings?.bookingUrl || defaultBookingSettings.bookingUrl;
  const bookingNotice = t(
    `Consulta il nuovo menù prima di prenotare.
La nostra cucina cambia ritmo:
Tapas da condividere, sapori pieni e
un’esperienza più libera e conviviale.`,
    `Our kitchen is changing pace:
small plates to share, full flavours,
and a freer, more convivial experience.
Please view our new menu before booking.`,
  );
  const bookingNoticeLines = bookingNotice.split("\n");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`max-w-[90vw] sm:max-w-md mx-auto rounded-xl ${isMobile ? "px-4 py-6" : "px-6 py-8"}`}
      >
        <DialogHeader>
          <DialogTitle className="text-center font-display text-xl">
            {t("Prima di prenotare", "Before you book")}
          </DialogTitle>
          <DialogDescription className="pt-4 text-center text-[13px] sm:text-sm">
            <div className="leading-relaxed">
              {bookingNoticeLines.map((line, index) => (
                <span key={`${line}-${index}`} className="block">
                  {line}
                </span>
              ))}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-row justify-center gap-3 sm:justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full px-6"
            data-testid="button-cancel-booking"
          >
            {t("Annulla", "Cancel")}
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              window.open(bookingUrl, "_blank");
            }}
            style={{ backgroundColor: "#722f37" }}
            className="text-white rounded-full px-6"
            data-testid="button-continue-booking"
          >
            {t("Continua", "Continue")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
