import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Plus, Check, X, Loader2 } from "lucide-react";
import { TranslateButton } from "./TranslateButton";
import type { MediaCategory, InsertMediaCategory } from "@shared/schema";

interface ManageCategoriesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageCategoriesModal({ open, onOpenChange }: ManageCategoriesModalProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabelIt, setEditLabelIt] = useState("");
  const [editLabelEn, setEditLabelEn] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [newLabelIt, setNewLabelIt] = useState("");
  const [newLabelEn, setNewLabelEn] = useState("");

  const { data: categories = [], isLoading } = useQuery<MediaCategory[]>({
    queryKey: ["/api/admin/media-categories"],
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertMediaCategory) => {
      const response = await apiRequest("POST", "/api/admin/media-categories", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/media-categories"] });
      toast({ title: t("Cartella creata", "Folder created") });
      resetCreateForm();
    },
    onError: () => {
      toast({ title: t("Errore", "Error"), variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertMediaCategory> }) => {
      const response = await apiRequest("PUT", `/api/admin/media-categories/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/media-categories"] });
      toast({ title: t("Cartella aggiornata", "Folder updated") });
      setEditingId(null);
    },
    onError: () => {
      toast({ title: t("Errore", "Error"), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/media-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/media-categories"] });
      toast({ title: t("Cartella eliminata", "Folder deleted") });
    },
    onError: () => {
      toast({ title: t("Errore", "Error"), variant: "destructive" });
    },
  });

  const resetCreateForm = () => {
    setIsCreating(false);
    setNewSlug("");
    setNewLabelIt("");
    setNewLabelEn("");
  };

  const handleCreate = () => {
    if (!newSlug.trim() || !newLabelIt.trim() || !newLabelEn.trim()) return;
    createMutation.mutate({
      slug: newSlug.toLowerCase().replace(/\s+/g, "-"),
      labelIt: newLabelIt,
      labelEn: newLabelEn,
      sortOrder: categories.length,
    });
  };

  const handleStartEdit = (category: MediaCategory) => {
    setEditingId(category.id);
    setEditLabelIt(category.labelIt);
    setEditLabelEn(category.labelEn);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editLabelIt.trim() || !editLabelEn.trim()) return;
    updateMutation.mutate({
      id: editingId,
      data: { labelIt: editLabelIt, labelEn: editLabelEn },
    });
  };

  const handleDelete = (id: number) => {
    if (confirm(t("Eliminare questa cartella?", "Delete this folder?"))) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Gestisci cartelle", "Manage folders")}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {categories.length === 0 && !isCreating && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("Nessuna cartella. Crea la prima!", "No folders. Create the first one!")}
                </p>
              )}
              
              <div className="space-y-2">
                {categories.map((category) => (
                  <div 
                    key={category.id} 
                    className="flex items-center gap-2 p-3 border rounded-md bg-background"
                  >
                    {editingId === category.id ? (
                      <>
                        <div className="flex-1 space-y-2">
                          <Input
                            value={editLabelIt}
                            onChange={(e) => setEditLabelIt(e.target.value)}
                            placeholder="Nome IT"
                            className="h-8"
                            data-testid="input-edit-label-it"
                          />
                          <div className="flex items-center gap-1">
                            <Input
                              value={editLabelEn}
                              onChange={(e) => setEditLabelEn(e.target.value)}
                              placeholder="Name EN"
                              className="h-8 flex-1"
                              data-testid="input-edit-label-en"
                            />
                            <TranslateButton
                              textIt={editLabelIt}
                              onTranslated={setEditLabelEn}
                              context="media folder name for restaurant website"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                            />
                          </div>
                        </div>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={handleSaveEdit}
                          disabled={updateMutation.isPending}
                          data-testid="button-save-edit"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                          data-testid="button-cancel-edit"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{category.labelIt}</p>
                          <p className="text-xs text-muted-foreground">{category.labelEn}</p>
                        </div>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => handleStartEdit(category)}
                          data-testid={`button-edit-category-${category.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => handleDelete(category.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-category-${category.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {isCreating ? (
                <div className="p-3 border rounded-md bg-muted/30 space-y-3">
                  <div>
                    <Label className="text-xs">{t("Identificatore (slug)", "Identifier (slug)")}</Label>
                    <Input
                      value={newSlug}
                      onChange={(e) => setNewSlug(e.target.value)}
                      placeholder="es: desserts"
                      className="h-8 mt-1"
                      data-testid="input-new-slug"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{t("Nome italiano", "Italian name")}</Label>
                    <Input
                      value={newLabelIt}
                      onChange={(e) => setNewLabelIt(e.target.value)}
                      placeholder="es: Dolci"
                      className="h-8 mt-1"
                      data-testid="input-new-label-it"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <Label className="text-xs flex-1">{t("Nome inglese", "English name")}</Label>
                      <TranslateButton
                        textIt={newLabelIt}
                        onTranslated={setNewLabelEn}
                        context="media folder name for restaurant website"
                        size="icon"
                        className="h-6 w-6"
                      />
                    </div>
                    <Input
                      value={newLabelEn}
                      onChange={(e) => setNewLabelEn(e.target.value)}
                      placeholder="e.g: Desserts"
                      className="h-8 mt-1"
                      data-testid="input-new-label-en"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={handleCreate}
                      disabled={createMutation.isPending || !newSlug.trim() || !newLabelIt.trim() || !newLabelEn.trim()}
                      data-testid="button-confirm-create"
                    >
                      {createMutation.isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                      {t("Crea", "Create")}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={resetCreateForm} data-testid="button-cancel-create">
                      {t("Annulla", "Cancel")}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setIsCreating(true)}
                  data-testid="button-add-category"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t("Aggiungi cartella", "Add folder")}
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
