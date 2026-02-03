import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/contexts/AdminContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EditableText } from "@/components/admin/EditableText";
import { EditableImage } from "@/components/admin/EditableImage";

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
  const [sectionTitle, setSectionTitle] = useState({
    it: "Vieni a trovarci", en: "Come visit us",
    fontSizeDesktop: 36, fontSizeMobile: 28
  });
  const [introText, setIntroText] = useState({
    it: "Siamo sempre felici di accoglierti. Contattaci per informazioni, prenotazioni o per organizzare il tuo evento privato.",
    en: "We are always happy to welcome you. Contact us for information, reservations, or to organize your private event.",
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
      case "sectionTitle":
        setSectionTitle({ it: data.textIt, en: data.textEn, fontSizeDesktop: data.fontSizeDesktop, fontSizeMobile: data.fontSizeMobile });
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
      <section className="relative h-[40vh] md:h-[50vh] flex items-center justify-center overflow-hidden">
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

      <section className="py-8 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <div>
              <EditableText
                textIt={sectionTitle.it}
                textEn={sectionTitle.en}
                fontSizeDesktop={sectionTitle.fontSizeDesktop}
                fontSizeMobile={sectionTitle.fontSizeMobile}
                as="h2"
                className="font-display mb-6"
                applyFontSize
                onSave={(data) => handleTextSave("sectionTitle", data)}
              />
              <EditableText
                textIt={introText.it}
                textEn={introText.en}
                fontSizeDesktop={introText.fontSizeDesktop}
                fontSizeMobile={introText.fontSizeMobile}
                as="p"
                className="text-muted-foreground mb-8"
                multiline
                applyFontSize
                onSave={(data) => handleTextSave("introText", data)}
              />

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">{t("Indirizzo", "Address")}</h3>
                    <p className="text-muted-foreground">
                      Via del Pratello, 42<br />
                      40122 Bologna, Italia
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">{t("Telefono", "Phone")}</h3>
                    <a href="tel:+390512345678" className="text-muted-foreground hover:text-foreground transition-colors">
                      +39 051 234 5678
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Email</h3>
                    <a href="mailto:info@cameraconvista.it" className="text-muted-foreground hover:text-foreground transition-colors">
                      info@cameraconvista.it
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">{t("Orari", "Hours")}</h3>
                    <div className="text-muted-foreground">
                      <p>{t("Martedì - Domenica", "Tuesday - Sunday")}: 18:00 - 02:00</p>
                      <p>{t("Lunedì", "Monday")}: {t("Chiuso", "Closed")}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 aspect-[16/9] rounded-placeholder overflow-hidden bg-muted">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2846.0661234567!2d11.3333!3d44.4944!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDTCsDI5JzM5LjgiTiAxMcKwMTknNTkuOSJF!5e0!3m2!1sen!2sit!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={t("Mappa", "Map") || "Map"}
                />
              </div>
            </div>

            <div>
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
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
