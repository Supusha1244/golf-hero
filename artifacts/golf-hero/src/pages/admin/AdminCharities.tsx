import { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { useListCharities, useCreateCharity, useUpdateCharity, useDeleteCharity, getListCharitiesQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const charitySchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().min(10, "Description is required"),
  imageUrl: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  category: z.string().optional(),
  featured: z.boolean().default(false),
});

export default function AdminCharities() {
  const { data: charities, isLoading } = useListCharities({}, { query: { queryKey: getListCharitiesQueryKey() } });
  const createCharity = useCreateCharity();
  const updateCharity = useUpdateCharity();
  const deleteCharity = useDeleteCharity();
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm<z.infer<typeof charitySchema>>({
    resolver: zodResolver(charitySchema),
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "",
      website: "",
      category: "",
      featured: false,
    },
  });

  const onSubmit = (data: z.infer<typeof charitySchema>) => {
    if (editingId) {
      updateCharity.mutate({ id: editingId, data }, {
        onSuccess: () => {
          toast({ title: "Charity updated" });
          queryClient.invalidateQueries({ queryKey: getListCharitiesQueryKey() });
          setEditingId(null);
          form.reset();
        }
      });
    } else {
      createCharity.mutate({ data }, {
        onSuccess: () => {
          toast({ title: "Charity created" });
          queryClient.invalidateQueries({ queryKey: getListCharitiesQueryKey() });
          setIsAddOpen(false);
          form.reset();
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    if(confirm("Delete this charity?")) {
      deleteCharity.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Charity deleted" });
          queryClient.invalidateQueries({ queryKey: getListCharitiesQueryKey() });
        }
      });
    }
  };

  const openEdit = (charity: any) => {
    form.reset({
      name: charity.name,
      description: charity.description,
      imageUrl: charity.imageUrl || "",
      website: charity.website || "",
      category: charity.category || "",
      featured: charity.featured,
    });
    setEditingId(charity.id);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Charity Management</h1>
          <p className="text-muted-foreground">Manage partner charities and organizations.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) form.reset();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" /> Add Charity
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Add New Charity</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem><FormLabel>Category</FormLabel><FormControl><Input {...field} placeholder="e.g. Environment, Health" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="imageUrl" render={({ field }) => (
                    <FormItem><FormLabel>Image URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="website" render={({ field }) => (
                    <FormItem><FormLabel>Website</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="featured" render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border/50 p-4">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Featured Charity</FormLabel>
                      <p className="text-sm text-muted-foreground">Show prominently on the homepage and list.</p>
                    </div>
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={createCharity.isPending}>Save Charity</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border border-border/50 rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Raised</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : charities && charities.length > 0 ? (
              charities.map((charity) => (
                <TableRow key={charity.id}>
                  <TableCell className="font-medium">{charity.name}</TableCell>
                  <TableCell>{charity.category}</TableCell>
                  <TableCell className="font-bold text-primary">${charity.totalReceived.toLocaleString()}</TableCell>
                  <TableCell>
                    {charity.featured && <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/20">Featured</Badge>}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Dialog open={editingId === charity.id} onOpenChange={(open) => !open && setEditingId(null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => openEdit(charity)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-xl">
                        <DialogHeader>
                          <DialogTitle>Edit Charity</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                            <FormField control={form.control} name="name" render={({ field }) => (
                              <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="category" render={({ field }) => (
                              <FormItem><FormLabel>Category</FormLabel><FormControl><Input {...field} placeholder="e.g. Environment, Health" /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="description" render={({ field }) => (
                              <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <div className="grid grid-cols-2 gap-4">
                              <FormField control={form.control} name="imageUrl" render={({ field }) => (
                                <FormItem><FormLabel>Image URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                              )} />
                              <FormField control={form.control} name="website" render={({ field }) => (
                                <FormItem><FormLabel>Website</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                              )} />
                            </div>
                            <FormField control={form.control} name="featured" render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border/50 p-4">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>Featured Charity</FormLabel>
                                </div>
                              </FormItem>
                            )} />
                            <Button type="submit" className="w-full" disabled={updateCharity.isPending}>Save Changes</Button>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(charity.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={5} className="text-center py-8">No charities found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
