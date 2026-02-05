import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/contexts/AdminContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Send, Navigation, X } from "lucide-react";
import { SiApple, SiGooglemaps } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { EditableText } from "@/components/admin/EditableText";
import { EditableImage } from "@/components/admin/EditableImage";
import type { FooterSettings } from "@shared/schema";
import { defaultFooterSettings } from "@shared/schema";

const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  subject: z.string().min(2, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function Contatti() {
  const { t } = useLanguage();
  const { deviceView } = useAdmin();
  const { toast } = useToast();
  const [showMapsModal, setShowMapsModal] = useState(false);

  const { data: footerSettings } = useQuery<FooterSettings>({
    queryKey: ["/api/footer-settings"],
    staleTime: 1000 * 60 * 5,
  });

  const footer = footerSettings || defaultFooterSettings;
  const address = footer.contacts.address.replace(/\n/g, ", ");

  const openAppleMaps = () => {
    const query = encodeURIComponent(address);
    window.open(`https://maps.apple.com/?q=${query}`, "_blank");
    setShowMapsModal(false);
  };

  const openGoogleMaps = () => {
    const query = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
    setShowMapsModal(false);
  };

  const [heroTitle, setHeroTitle] = useState({
    it: "Contatti", en: "Contact",
    fontSizeDesktop: 72, fontSizeMobile: 40
  });
  const [heroImage, setHeroImage] = useState({
    src: "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    zoomDesktop: 100, zoomMobile: 100,
    offsetXDesktop: 0, offsetYDesktop: 0,
    offsetXMobile: 0, offsetYMobile: 0,
  });
  const [introText, setIntroText] = useState({
    it: "Nel cuore di Bologna..\na 200 metri dalle Due Torri\nraggiungibile in 3 minuti a piedi.",
    en: "In the heart of Bologna..\n200 meters from the Two Towers\njust a 3-minute walk.",
    fontSizeDesktop: 16, fontSizeMobile: 14
  });

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
  });

  const handleTextSave = (field: string, data: { textIt: string; textEn: string; fontSizeDesktop: number; fontSizeMobile: number }) => {
    switch (field) {
      case "heroTitle":
        setHeroTitle({ it: data.textIt, en: data.textEn, fontSizeDesktop: data.fontSizeDesktop, fontSizeMobile: data.fontSizeMobile });
        break;
      case "introText":
        setIntroText({ it: data.textIt, en: data.textEn, fontSizeDesktop: data.fontSizeDesktop, fontSizeMobile: data.fontSizeMobile });
        break;
    }
    toast({ title: t("Salvato", "Saved"), description: t("Le modifiche sono state salvate.", "Changes have been saved.") });
  };

  const handleHeroImageSave = (data: typeof heroImage) => {
    setHeroImage(data);
    toast({ title: t("Salvato", "Saved"), description: t("Immagine aggiornata.", "Image updated.") });
  };

  const onSubmit = async (data: ContactFormData) => {
    toast({
      title: t("Messaggio inviato", "Message sent"),
      description: t(
        "Grazie per averci contattato. Ti risponderemo al più presto.",
        "Thank you for contacting us. We will respond as soon as possible."
      ),
    });
    form.reset();
  };

  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-80px)] flex flex-col">
        <section className="relative h-[60vh] shrink-0 flex items-center justify-center">
          <div className="absolute inset-y-0 left-4 right-4 md:left-0 md:right-0 rounded-xl md:rounded-none overflow-hidden">
            <EditableImage
              src={heroImage.src}
              zoomDesktop={heroImage.zoomDesktop}
              zoomMobile={heroImage.zoomMobile}
              offsetXDesktop={heroImage.offsetXDesktop}
              offsetYDesktop={heroImage.offsetYDesktop}
              offsetXMobile={heroImage.offsetXMobile}
              offsetYMobile={heroImage.offsetYMobile}
              deviceView={deviceView}
              containerClassName="absolute inset-0"
              className="w-full h-full object-cover"
              onSave={handleHeroImageSave}
            />
            <div 
              className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70 pointer-events-none"
            />
          </div>
          <div className="relative z-10 text-center text-white">
            <EditableText
              textIt={heroTitle.it}
              textEn={heroTitle.en}
              fontSizeDesktop={heroTitle.fontSizeDesktop}
              fontSizeMobile={heroTitle.fontSizeMobile}
              as="h1"
              className="font-display drop-shadow-lg"
              applyFontSize
              onSave={(data) => handleTextSave("heroTitle", data)}
            />
          </div>
        </section>

        <section className="flex-1 flex items-center justify-center">
          <div className="container mx-auto px-4 max-w-2xl text-center py-6">
            <EditableText
              textIt={introText.it}
              textEn={introText.en}
              fontSizeDesktop={introText.fontSizeDesktop}
              fontSizeMobile={introText.fontSizeMobile}
              as="p"
              className="text-muted-foreground whitespace-pre-line"
              multiline
              applyFontSize
              onSave={(data) => handleTextSave("introText", data)}
            />
          </div>
        </section>
      </div>

      <section className="py-8 md:py-16">
        <div className="container mx-auto px-4 max-w-2xl space-y-8">
          <div className="space-y-4">
            <div className="aspect-[16/9] rounded-placeholder overflow-hidden bg-muted">
              <iframe
                src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(address)}`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={t("Mappa", "Map") || "Map"}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowMapsModal(true)}
              className="w-full"
              data-testid="button-open-maps"
            >
              <Navigation className="h-4 w-4 mr-2" />
              {t("Apri indicazioni", "Get Directions")}
            </Button>
          </div>

          {showMapsModal && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
              onClick={() => setShowMapsModal(false)}
            >
              <div 
                className="bg-background rounded-lg p-6 w-full max-w-sm mx-4 space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl">
                    {t("Apri con", "Open with")}
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowMapsModal(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={openAppleMaps}
                    className="w-full justify-start"
                    data-testid="button-apple-maps"
                  >
                    <SiApple className="h-5 w-5 mr-3" />
                    Apple Mappe
                  </Button>
                  <Button
                    variant="outline"
                    onClick={openGoogleMaps}
                    className="w-full justify-start"
                    data-testid="button-google-maps"
                  >
                    <SiGooglemaps className="h-5 w-5 mr-3" />
                    Google Maps
                  </Button>
                </div>
              </div>
            </div>
          )}

          <Card>
            <CardContent className="p-6 md:p-8">
              <h2 className="font-display text-2xl mb-6" data-testid="text-form-title">
                {t("Inviaci un messaggio", "Send us a message")}
              </h2>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Nome", "Name")} *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Telefono", "Phone")}</FormLabel>
                        <FormControl>
                          <Input type="tel" {...field} data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Oggetto", "Subject")} *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-subject" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Messaggio", "Message")} *</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={5}
                            className="resize-none"
                            data-testid="input-message"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" data-testid="button-submit">
                    {t("Invia messaggio", "Send message")}
                    <Send className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
}
