import { useState } from "react";
import { useAdmin } from "@/contexts/AdminContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";

interface EditableTextProps {
  blockId?: number;
  textIt: string;
  textEn: string;
  fontSizeDesktop?: number;
  fontSizeMobile?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  multiline?: boolean;
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
  multiline = false,
  onSave,
}: EditableTextProps) {
  const { adminPreview } = useAdmin();
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [editTextIt, setEditTextIt] = useState(textIt);
  const [editTextEn, setEditTextEn] = useState(textEn);
  const [editFontDesktop, setEditFontDesktop] = useState(fontSizeDesktop);
  const [editFontMobile, setEditFontMobile] = useState(fontSizeMobile);

  const displayText = t(textIt, textEn);

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

  if (!adminPreview) {
    return <Component className={className}>{displayText}</Component>;
  }

  return (
    <>
      <Component
        className={`${className} relative cursor-pointer group`}
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
            <DialogTitle>{t("Modifica Testo", "Edit Text")}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Italiano</Label>
              <TextInput
                value={editTextIt}
                onChange={(e) => setEditTextIt(e.target.value)}
                placeholder="Testo italiano..."
                className={multiline ? "min-h-[100px]" : ""}
              />
            </div>
            
            <div className="space-y-2">
              <Label>English</Label>
              <TextInput
                value={editTextEn}
                onChange={(e) => setEditTextEn(e.target.value)}
                placeholder="English text..."
                className={multiline ? "min-h-[100px]" : ""}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("Font Desktop (px)", "Desktop Font (px)")}</Label>
                <Input
                  type="number"
                  value={editFontDesktop}
                  onChange={(e) => setEditFontDesktop(Number(e.target.value))}
                  min={8}
                  max={200}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("Font Mobile (px)", "Mobile Font (px)")}</Label>
                <Input
                  type="number"
                  value={editFontMobile}
                  onChange={(e) => setEditFontMobile(Number(e.target.value))}
                  min={8}
                  max={200}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              {t("Annulla", "Cancel")}
            </Button>
            <Button onClick={handleSave}>
              {t("Salva", "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
