import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Trophy, Calendar as CalendarIcon, Trash2, Plus, Edit } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { 
  useGetMyScores, useAddScore, useUpdateScore, useDeleteScore, 
  getGetMyScoresQueryKey, getGetDashboardSummaryQueryKey 
} from "@workspace/api-client-react";

const scoreSchema = z.object({
  score: z.coerce.number().min(1, "Score must be at least 1").max(45, "Score cannot exceed 45"),
  scoreDate: z.string().min(1, "Date is required"),
});

export default function Scores() {
  const { data: scores, isLoading } = useGetMyScores({ query: { queryKey: getGetMyScoresQueryKey() } });
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingScoreId, setEditingScoreId] = useState<number | null>(null);

  const addScore = useAddScore();
  const updateScore = useUpdateScore();
  const deleteScore = useDeleteScore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof scoreSchema>>({
    resolver: zodResolver(scoreSchema),
    defaultValues: {
      score: 36,
      scoreDate: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const onSubmit = (data: z.infer<typeof scoreSchema>) => {
    if (editingScoreId) {
      updateScore.mutate({ id: editingScoreId, data: { score: data.score, scoreDate: data.scoreDate } }, {
        onSuccess: () => {
          toast({ title: "Score updated successfully" });
          queryClient.invalidateQueries({ queryKey: getGetMyScoresQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          setEditingScoreId(null);
          form.reset();
        },
        onError: (err) => {
          toast({ title: "Failed to update score", description: err.message, variant: "destructive" });
        }
      });
    } else {
      addScore.mutate({ data: { score: data.score, scoreDate: new Date(data.scoreDate).toISOString() } }, {
        onSuccess: () => {
          toast({ title: "Score added successfully" });
          queryClient.invalidateQueries({ queryKey: getGetMyScoresQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          setIsAddOpen(false);
          form.reset();
        },
        onError: (err) => {
          toast({ title: "Failed to add score", description: err.message, variant: "destructive" });
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    deleteScore.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Score deleted" });
        queryClient.invalidateQueries({ queryKey: getGetMyScoresQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      }
    });
  };

  const openEdit = (score: any) => {
    form.setValue("score", score.score);
    form.setValue("scoreDate", format(new Date(score.scoreDate), "yyyy-MM-dd"));
    setEditingScoreId(score.id);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Your Scores</h1>
            <p className="text-muted-foreground mt-2">Manage your rolling 5-score history for the monthly draw.</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" /> Add Score
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Score</DialogTitle>
                <DialogDescription>
                  Enter your Stableford score. Only your 5 most recent scores are kept.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="score"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stableford Score (1-45)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="scoreDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date Played</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={addScore.isPending}>
                    {addScore.isPending ? "Adding..." : "Add Score"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : scores && scores.length > 0 ? (
          <div className="space-y-4">
            {scores.map((score, index) => (
              <Card key={score.id} className={`border-border/50 ${index === 0 ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}>
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-col">
                      <span className="text-2xl font-bold text-primary leading-none">{score.score}</span>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Pts</span>
                    </div>
                    <div>
                      <div className="flex items-center text-muted-foreground mb-1">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {format(new Date(score.scoreDate), "MMMM d, yyyy")}
                      </div>
                      <div className="text-sm font-medium">
                        {index === 0 ? "Latest Score" : `Score #${index + 1}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog open={editingScoreId === score.id} onOpenChange={(open) => !open && setEditingScoreId(null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => openEdit(score)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Score</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                            <FormField
                              control={form.control}
                              name="score"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Stableford Score (1-45)</FormLabel>
                                  <FormControl>
                                    <Input type="number" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="scoreDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Date Played</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button type="submit" className="w-full" disabled={updateScore.isPending}>
                              {updateScore.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Score?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this score? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(score.id)} className="bg-destructive text-destructive-foreground">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-card border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                <Trophy className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">No Scores Yet</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                Start tracking your performance. Add your first Stableford score to begin qualifying for the monthly draw.
              </p>
              <Button onClick={() => setIsAddOpen(true)}>Add Your First Score</Button>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
