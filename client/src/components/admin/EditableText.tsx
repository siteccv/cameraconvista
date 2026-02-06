import { useState } from "react";
import { useAdmin } from "@/contexts/AdminContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";
import { TranslateButton } from "./TranslateButton";

interface EditableTextProps {
  blockId?: number;
  textIt: string;
  textEn: string;
  fontSizeDesktop?: number;
  fontSizeMobile?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  style?: React.CSSProperties;
  multiline?: boolean;
  applyFontSize?: boolean;
  onSave?: (data: {
    textIt: string;
    textEn: string;
    fontSizeDesktop: number;
    fontSizeMobile: number;
  }) => void;
}

export function EditableText({
  blockId,
  textIt,
  textEn,
  fontSizeDesktop = 16,
  fontSizeMobile = 14,
  as: Component = "span",
  className = "",
  style,
  multiline = false,
  applyFontSize = false,
  onSave,
}: EditableTextProps) {
  const { adminPreview, deviceView, forceMobileLayout } = useAdmin();
  const { t, language } = useLanguage();
  const viewportIsMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [editTextIt, setEditTextIt] = useState(textIt);
  const [editTextEn, setEditTextEn] = useState(textEn);
  const [editFontDesktop, setEditFontDesktop] = useState(fontSizeDesktop);
  const [editFontMobile, setEditFontMobile] = useState(fontSizeMobile);

  const displayText = t(textIt, textEn);
  
  // Use mobile font size when: admin forces mobile layout OR real viewport is mobile
  const isMobile = forceMobileLayout || viewportIsMobile;
  const currentFontSize = isMobile ? fontSizeMobile : fontSizeDesktop;
  const fontSizeStyle = applyFontSize ? { fontSize: `${currentFontSize}px` } : {};
  const combinedStyle = { ...style, ...fontSizeStyle };

  const handleClick = (e: React.MouseEvent) => {
    if (adminPreview) {
      e.preventDefault();
      e.stopPropagation();
      setEditTextIt(textIt);
      setEditTextEn(textEn);
      setEditFontDesktop(fontSizeDesktop);
      setEditFontMobile(fontSizeMobile);
      setIsOpen(true);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        textIt: editTextIt,
        textEn: editTextEn,
        fontSizeDesktop: editFontDesktop,
        fontSizeMobile: editFontMobile,
      });
    }
    setIsOpen(false);
  };

  const TextInput = multiline ? Textarea : Input;

  const textStyle = multiline ? { ...combinedStyle, whiteSpace: 'pre-line' as const } : combinedStyle;

  if (!adminPreview) {
    return <Component className={className} style={textStyle}>{displayText}</Component>;
  }

  return (
    <>
      <Component
        className={`${className} relative cursor-pointer group`}
        style={textStyle}
        onClick={handleClick}
      >
        {displayText}
        <span className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground rounded-full p-1">
          <Pencil className="h-3 w-3" />
        </span>
        <span className="absolute inset-0 ring-2 ring-primary/50 ring-offset-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </Component>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("Modifica testo", "Edit Text")}</DialogTitle>
            <DialogDescription>
              {t("Modifica il contenuto (IT/EN) e la dimensione del testo.", "Edit the content (IT/EN) and text size.")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("Testo IT", "Text IT")}</Label>
              <TextInput
                value={editTextIt}
                onChange={(e) => setEditTextIt(e.target.value)}
                placeholder="Testo italiano..."
                className={multiline ? "min-h-[100px]" : ""}
                data-testid="input-text-it"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="flex-1">{t("Testo EN", "Text EN")}</Label>
                <TranslateButton
                  textIt={editTextIt}
                  onTranslated={setEditTextEn}
                  context="website content for a restaurant and cocktail bar"
                />
              </div>
              <TextInput
                value={editTextEn}
                onChange={(e) => setEditTextEn(e.target.value)}
                placeholder="English text..."
                className={multiline ? "min-h-[100px]" : ""}
                data-testid="input-text-en"
              />
            </div>

            <div className="space-y-2">
              <Label>
                {deviceView === "mobile" 
                  ? t("Dimensione testo Mobile (px)", "Mobile Text Size (px)")
                  : t("Dimensione testo Desktop (px)", "Desktop Text Size (px)")}
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (deviceView === "mobile") {
                      setEditFontMobile(Math.max(8, editFontMobile - 1));
                    } else {
                      setEditFontDesktop(Math.max(8, editFontDesktop - 1));
                    }
                  }}
                  data-testid="button-decrease-font"
                >
                  -
                </Button>
                <Input
                  type="number"
                  value={deviceView === "mobile" ? editFontMobile : editFontDesktop}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (deviceView === "mobile") {
                      setEditFontMobile(val);
                    } else {
                      setEditFontDesktop(val);
                    }
                  }}
                  min={8}
                  max={200}
                  className="w-20 text-center"
                  data-testid="input-font-size"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (deviceView === "mobile") {
                      setEditFontMobile(Math.min(200, editFontMobile + 1));
                    } else {
                      setEditFontDesktop(Math.min(200, editFontDesktop + 1));
                    }
                  }}
                  data-testid="button-increase-font"
                >
                  +
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (deviceView === "mobile") {
                      setEditFontMobile(14);
                    } else {
                      setEditFontDesktop(16);
                    }
                  }}
                  data-testid="button-reset-font"
                >
                  Reset px
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {deviceView === "mobile" 
                  ? t("Stai modificando la dimensione per mobile", "You are editing mobile size")
                  : t("Stai modificando la dimensione per desktop", "You are editing desktop size")}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} data-testid="button-cancel">
              {t("Annulla", "Cancel")}
            </Button>
            <Button onClick={handleSave} data-testid="button-save">
              {t("Salva", "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
