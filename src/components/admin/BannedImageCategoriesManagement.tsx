import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, ImageOff, Shield } from "lucide-react";

interface BannedImageCategory {
  id: string;
  name: string;
  description: string | null;
  severity: string;
  active: boolean;
  created_at: string;
}

export const BannedImageCategoriesManagement = () => {
  const queryClient = useQueryClient();
  const [newCategory, setNewCategory] = useState({ name: "", description: "", severity: "high" });
  const [editingCategory, setEditingCategory] = useState<BannedImageCategory | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["banned-image-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banned_image_categories")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as BannedImageCategory[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (category: { name: string; description: string; severity: string }) => {
      const { error } = await supabase
        .from("banned_image_categories")
        .insert({
          name: category.name,
          description: category.description || null,
          severity: category.severity,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banned-image-categories"] });
      setNewCategory({ name: "", description: "", severity: "high" });
      setIsAddDialogOpen(false);
      toast.success("Catégorie ajoutée avec succès");
    },
    onError: (error: any) => {
      if (error.message?.includes("duplicate")) {
        toast.error("Cette catégorie existe déjà");
      } else {
        toast.error("Erreur lors de l'ajout de la catégorie");
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (category: BannedImageCategory) => {
      const { error } = await supabase
        .from("banned_image_categories")
        .update({
          name: category.name,
          description: category.description,
          severity: category.severity,
          active: category.active,
        })
        .eq("id", category.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banned-image-categories"] });
      setEditingCategory(null);
      setIsEditDialogOpen(false);
      toast.success("Catégorie mise à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("banned_image_categories")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banned-image-categories"] });
      toast.success("Catégorie supprimée");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("banned_image_categories")
        .update({ active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banned-image-categories"] });
      toast.success("Statut mis à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return <Badge variant="destructive">Haute</Badge>;
      case "medium":
        return <Badge variant="default" className="bg-orange-500">Moyenne</Badge>;
      case "low":
        return <Badge variant="secondary">Basse</Badge>;
      default:
        return <Badge>{severity}</Badge>;
    }
  };

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) {
      toast.error("Le nom de la catégorie est requis");
      return;
    }
    addMutation.mutate(newCategory);
  };

  const handleUpdateCategory = () => {
    if (!editingCategory) return;
    updateMutation.mutate(editingCategory);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ImageOff className="h-5 w-5" />
          Catégories d'images interdites
        </CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une catégorie interdite</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la catégorie</Label>
                <Input
                  id="name"
                  placeholder="Ex: Contenu violent"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optionnel)</Label>
                <Textarea
                  id="description"
                  placeholder="Description détaillée de ce qui est interdit..."
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="severity">Sévérité</Label>
                <Select
                  value={newCategory.severity}
                  onValueChange={(value) => setNewCategory({ ...newCategory, severity: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Haute - Rejet immédiat</SelectItem>
                    <SelectItem value="medium">Moyenne - Alerte admin</SelectItem>
                    <SelectItem value="low">Basse - Avertissement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleAddCategory} 
                disabled={addMutation.isPending}
                className="w-full"
              >
                {addMutation.isPending ? "Ajout..." : "Ajouter la catégorie"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Chargement...</div>
        ) : categories?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune catégorie définie</p>
            <p className="text-sm">Ajoutez des catégories pour activer la modération d'images</p>
          </div>
        ) : (
          <div className="space-y-3">
            {categories?.map((category) => (
              <div
                key={category.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  !category.active ? "opacity-50 bg-muted" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{category.name}</span>
                    {getSeverityBadge(category.severity)}
                    {!category.active && <Badge variant="outline">Désactivé</Badge>}
                  </div>
                  {category.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {category.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Switch
                    checked={category.active}
                    onCheckedChange={(checked) => 
                      toggleActiveMutation.mutate({ id: category.id, active: checked })
                    }
                  />
                  <Dialog open={isEditDialogOpen && editingCategory?.id === category.id} onOpenChange={(open) => {
                    setIsEditDialogOpen(open);
                    if (!open) setEditingCategory(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingCategory(category)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Modifier la catégorie</DialogTitle>
                      </DialogHeader>
                      {editingCategory && (
                        <div className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-name">Nom</Label>
                            <Input
                              id="edit-name"
                              value={editingCategory.name}
                              onChange={(e) => setEditingCategory({ 
                                ...editingCategory, 
                                name: e.target.value 
                              })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea
                              id="edit-description"
                              value={editingCategory.description || ""}
                              onChange={(e) => setEditingCategory({ 
                                ...editingCategory, 
                                description: e.target.value 
                              })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-severity">Sévérité</Label>
                            <Select
                              value={editingCategory.severity}
                              onValueChange={(value) => setEditingCategory({ 
                                ...editingCategory, 
                                severity: value 
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="high">Haute</SelectItem>
                                <SelectItem value="medium">Moyenne</SelectItem>
                                <SelectItem value="low">Basse</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button 
                            onClick={handleUpdateCategory}
                            disabled={updateMutation.isPending}
                            className="w-full"
                          >
                            {updateMutation.isPending ? "Mise à jour..." : "Enregistrer"}
                          </Button>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm("Supprimer cette catégorie ?")) {
                        deleteMutation.mutate(category.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
