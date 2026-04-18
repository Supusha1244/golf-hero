import { useState } from "react";
import { CheckCircle, XCircle, ExternalLink, DollarSign } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { useListWinners, useVerifyWinner, useMarkWinnerPaid, getListWinnersQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminWinners() {
  const [filter, setFilter] = useState<string>("pending");
  const { data: winners, isLoading } = useListWinners(
    { status: filter as any }, 
    { query: { queryKey: getListWinnersQueryKey({ status: filter as any }) } }
  );
  
  const verifyWinner = useVerifyWinner();
  const markPaid = useMarkWinnerPaid();
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  const handleVerify = (id: number, status: 'approved' | 'rejected') => {
    verifyWinner.mutate({ id, data: { status, adminNotes: notes } }, {
      onSuccess: () => {
        toast({ title: `Claim ${status}` });
        queryClient.invalidateQueries({ queryKey: getListWinnersQueryKey() });
        setActiveId(null);
        setNotes("");
      },
      onError: (err) => {
        toast({ title: "Action failed", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleMarkPaid = (id: number) => {
    if(confirm("Confirm payment sent to user?")) {
      markPaid.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Marked as Paid" });
          queryClient.invalidateQueries({ queryKey: getListWinnersQueryKey() });
        }
      });
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Winner Verification</h1>
          <p className="text-muted-foreground">Verify handicap proofs and process prize payouts.</p>
        </div>
        
        <div className="flex bg-card border border-border/50 rounded-lg p-1">
          {['pending', 'approved', 'rejected', 'paid'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${filter === status ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="border border-border/50 rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Draw</TableHead>
              <TableHead>Prize</TableHead>
              <TableHead>Proof</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : winners && winners.length > 0 ? (
              winners.map((winner) => (
                <TableRow key={winner.id}>
                  <TableCell>
                    <div className="font-medium">{winner.userName || 'Unknown'}</div>
                    <div className="text-xs text-muted-foreground">{winner.userEmail}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{winner.drawMonth} {winner.drawYear}</div>
                    <div className="text-xs text-muted-foreground capitalize">{winner.matchType.replace('match', 'Match ')}</div>
                  </TableCell>
                  <TableCell className="font-bold text-primary">${winner.prizeAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    {winner.proofUrl ? (
                      <a href={winner.proofUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-blue-500 hover:underline text-sm">
                        View Proof <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">Not provided</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {winner.paymentStatus === 'paid' ? 'Paid' : winner.verificationStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {winner.verificationStatus === 'pending' && winner.proofUrl && (
                      <Dialog open={activeId === winner.id} onOpenChange={(o) => !o && setActiveId(null)}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setActiveId(winner.id)}>Review</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Review Claim</DialogTitle>
                            <DialogDescription>Verify the submitted handicap proof.</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div className="p-4 bg-muted/50 rounded-lg">
                              <a href={winner.proofUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 font-medium flex items-center">
                                Open Proof Link <ExternalLink className="w-4 h-4 ml-2" />
                              </a>
                            </div>
                            <div className="space-y-2">
                              <Label>Admin Notes (Optional)</Label>
                              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reason for rejection etc." />
                            </div>
                            <div className="flex gap-4 pt-4">
                              <Button variant="outline" className="flex-1 border-destructive text-destructive hover:bg-destructive/10" onClick={() => handleVerify(winner.id, 'rejected')}>
                                <XCircle className="w-4 h-4 mr-2" /> Reject
                              </Button>
                              <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleVerify(winner.id, 'approved')}>
                                <CheckCircle className="w-4 h-4 mr-2" /> Approve
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    
                    {winner.verificationStatus === 'approved' && winner.paymentStatus === 'pending' && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleMarkPaid(winner.id)}>
                        <DollarSign className="w-4 h-4 mr-1" /> Mark Paid
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={6} className="text-center py-8">No winners found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
