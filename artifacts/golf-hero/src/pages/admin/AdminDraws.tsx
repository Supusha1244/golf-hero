import { useState } from "react";
import { format } from "date-fns";
import { Plus, Play, RefreshCw, Eye } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { useListDraws, useCreateDraw, useSimulateDraw, usePublishDraw, getListDrawsQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const createDrawSchema = z.object({
  month: z.string().min(1, "Month is required"),
  year: z.coerce.number().min(2024),
  drawType: z.enum(["random", "algorithmic"]),
});

export default function AdminDraws() {
  const { data: draws, isLoading } = useListDraws({}, { query: { queryKey: getListDrawsQueryKey() } });
  const createDraw = useCreateDraw();
  const simulateDraw = useSimulateDraw();
  const publishDraw = usePublishDraw();
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [simulatingId, setSimulatingId] = useState<number | null>(null);

  const form = useForm<z.infer<typeof createDrawSchema>>({
    resolver: zodResolver(createDrawSchema),
    defaultValues: {
      month: format(new Date(), "MMMM"),
      year: new Date().getFullYear(),
      drawType: "algorithmic",
    },
  });

  const onSubmitCreate = (data: z.infer<typeof createDrawSchema>) => {
    createDraw.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Draw Created" });
        queryClient.invalidateQueries({ queryKey: getListDrawsQueryKey() });
        setIsCreateOpen(false);
        form.reset();
      },
      onError: (err) => {
        toast({ title: "Failed to create draw", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleSimulate = (id: number, type: "random" | "algorithmic") => {
    setSimulatingId(id);
    simulateDraw.mutate({ id, data: { drawType: type } }, {
      onSuccess: () => {
        toast({ title: "Draw Simulated", description: "Simulation results generated successfully." });
        queryClient.invalidateQueries({ queryKey: getListDrawsQueryKey() });
        setSimulatingId(null);
      },
      onError: (err) => {
        toast({ title: "Simulation failed", description: err.message, variant: "destructive" });
        setSimulatingId(null);
      }
    });
  };

  const handlePublish = (id: number) => {
    publishDraw.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Draw Published", description: "Winners have been finalized." });
        queryClient.invalidateQueries({ queryKey: getListDrawsQueryKey() });
      },
      onError: (err) => {
        toast({ title: "Publish failed", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Draw Management</h1>
          <p className="text-muted-foreground">Create, simulate, and publish monthly draws.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" /> New Draw
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Draw</DialogTitle>
              <DialogDescription>Initialize a draw for a specific month.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitCreate)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Month</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select month" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="drawType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="algorithmic">Algorithmic (Skill-based)</SelectItem>
                          <SelectItem value="random">Random (Pure chance)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createDraw.isPending}>
                  Create Draw
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border border-border/50 rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pool / Jackpot</TableHead>
              <TableHead>Entries</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading draws...</TableCell>
              </TableRow>
            ) : draws && draws.length > 0 ? (
              draws.map((draw) => (
                <TableRow key={draw.id}>
                  <TableCell className="font-medium">{draw.month} {draw.year}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {draw.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    ${draw.totalPool.toLocaleString()} / <span className="text-primary font-bold">${draw.jackpotAmount.toLocaleString()}</span>
                  </TableCell>
                  <TableCell>{draw.participantCount}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {draw.status === 'active' || draw.status === 'upcoming' ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleSimulate(draw.id, draw.drawType as 'random' | 'algorithmic')}
                        disabled={simulatingId === draw.id}
                      >
                        <RefreshCw className={`w-4 h-4 mr-1 ${simulatingId === draw.id ? 'animate-spin' : ''}`} /> Simulate
                      </Button>
                    ) : null}
                    
                    {draw.status === 'simulated' ? (
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handlePublish(draw.id)}
                        disabled={publishDraw.isPending}
                      >
                        <Play className="w-4 h-4 mr-1" /> Publish
                      </Button>
                    ) : null}
                    
                    <Button variant="ghost" size="icon" title="View details">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No draws found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
