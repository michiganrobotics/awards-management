'use client';

import { use, useState, useMemo, useCallback } from 'react';
import { Nomination } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ExternalLink, Plus, Calendar, CheckCircle2, Clock, XCircle, Info } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAwards } from '@/hooks/use-awards';
import { useNominations, useCreateNomination } from '@/hooks/use-nominations';

export default function AwardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  // Use React Query hooks
  const { data: awards = [], isLoading: awardsLoading } = useAwards();
  const { data: allNominations = [], isLoading: nominationsLoading } = useNominations();
  const createNominationMutation = useCreateNomination();

  // Find the award and its nominations
  const award = useMemo(() =>
    awards.find((a) => a.id === id) || null,
    [awards, id]
  );

  const nominations = useMemo(() =>
    allNominations.filter((n) => n.awardId === id),
    [allNominations, id]
  );

  const loading = awardsLoading || nominationsLoading;
  const [showAddNomination, setShowAddNomination] = useState(false);
  const [newNomination, setNewNomination] = useState({
    candidateName: '',
    nominatedBy: '',
    nominationYear: new Date().getFullYear(),
  });

  const handleAddNomination = useCallback(async () => {
    try {
      await createNominationMutation.mutateAsync({
        ...newNomination,
        awardId: id,
        status: 'pending',
        letterStatus: 'not_started',
        supportLettersStatus: 'not_started',
      });

      setShowAddNomination(false);
      setNewNomination({
        candidateName: '',
        nominatedBy: '',
        nominationYear: new Date().getFullYear(),
      });
      toast.success('Nomination added successfully!');
    } catch (error) {
      console.error('Error adding nomination:', error);
      toast.error('Failed to add nomination');
    }
  }, [createNominationMutation, newNomination, id]);

  const getStatusBadge = useCallback((status: Nomination['status']) => {
    const variants: Record<Nomination['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      submitted: 'default',
      successful: 'default',
      unsuccessful: 'outline',
      ineligible: 'outline',
    };

    let className = '';
    if (status === 'successful') {
      className = 'bg-green-600 text-white hover:bg-green-700';
    } else if (status === 'pending') {
      className = 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200';
    } else if (status === 'unsuccessful') {
      className = 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200';
    } else if (status === 'submitted') {
      className = 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200';
    } else if (status === 'ineligible') {
      className = 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200';
    }

    return <Badge variant={variants[status]} className={className}>{status}</Badge>;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-10 w-96" />
              <Skeleton className="h-5 w-64" />
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-80" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!award) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Award Not Found</h2>
          <Link href="/">
            <Button>Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href="/" className="cursor-pointer">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-4xl font-bold tracking-tight">{award.awardOrPrize}</h1>
              <p className="text-muted-foreground mt-2">{award.sponsor}</p>
            </div>
          </div>

          {/* Award Details */}
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Award Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Description</div>
                <div className="mt-1">{award.description || 'No description available'}</div>
              </div>
              {award.link && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Link</div>
                  <a
                    href={award.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 flex items-center gap-1 text-primary hover:underline cursor-pointer"
                  >
                    View Award Details <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Monetary Amount</div>
                  <div className="mt-1 font-semibold">{award.monetaryAmount || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Deadline</div>
                  <div className="mt-1">
                    {award.deadlineMonth ? (
                      <Badge variant="outline">{award.deadlineMonth}</Badge>
                    ) : (
                      'N/A'
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Division</div>
                  <div className="mt-1">{award.division || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Priority</div>
                  <div className="mt-1">
                    {award.priorityRanking ? (
                      <Badge variant="outline">{award.priorityRanking}</Badge>
                    ) : (
                      'N/A'
                    )}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Honorifics Office Assistance</div>
                <div className="mt-1">{award.honorificsOfficeAssistance || 'N/A'}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Eligibility & Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Field or Discipline</div>
                <div className="mt-1">{award.fieldOrDiscipline || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Career Level</div>
                <div className="mt-1">{award.academicCareerLevel || 'N/A'}</div>
              </div>
            </CardContent>
          </Card>
              </div>

            {/* Notes Section */}
            {award.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{award.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Nominations Section */}
            <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Nominations History</CardTitle>
                <CardDescription>Track all nominations for this award across years</CardDescription>
              </div>
              <Dialog open={showAddNomination} onOpenChange={setShowAddNomination}>
                <DialogTrigger asChild>
                  <Button className="cursor-pointer">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Nomination
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader className="space-y-3">
                    <DialogTitle className="text-xl">Add New Nomination</DialogTitle>
                    <DialogDescription className="text-base">
                      Create a new nomination for {award.awardOrPrize}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-6">
                    <div className="space-y-2">
                      <Label htmlFor="candidate" className="text-sm font-semibold">Candidate Name</Label>
                      <Input
                        id="candidate"
                        value={newNomination.candidateName}
                        onChange={(e) =>
                          setNewNomination({ ...newNomination, candidateName: e.target.value })
                        }
                        placeholder="Enter candidate name"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nominator" className="text-sm font-semibold">Nominated By</Label>
                      <Input
                        id="nominator"
                        value={newNomination.nominatedBy}
                        onChange={(e) =>
                          setNewNomination({ ...newNomination, nominatedBy: e.target.value })
                        }
                        placeholder="Enter nominator name"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="year" className="text-sm font-semibold">Nomination Year</Label>
                      <Input
                        id="year"
                        type="number"
                        value={newNomination.nominationYear}
                        onChange={(e) =>
                          setNewNomination({
                            ...newNomination,
                            nominationYear: parseInt(e.target.value),
                          })
                        }
                        className="h-10"
                      />
                    </div>
                  </div>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => setShowAddNomination(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddNomination}>Add Nomination</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year</TableHead>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Nominated By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Nomination</TableHead>
                    <TableHead>Support Letters</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nominations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No nominations yet. Add one to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    nominations
                      .sort((a, b) => b.nominationYear - a.nominationYear)
                      .map((nomination) => (
                      <TableRow key={nomination.id}>
                        <TableCell>{nomination.nominationYear}</TableCell>
                        <TableCell className="font-medium">{nomination.candidateName}</TableCell>
                        <TableCell>{nomination.nominatedBy}</TableCell>
                        <TableCell>
                          {getStatusBadge(nomination.status)}
                        </TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="outline">{nomination.letterStatus.replace('_', ' ')}</Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Nomination letter status</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const totalLetters = nomination.supportLetters?.length || 0;
                            const receivedLetters = nomination.supportLetters?.filter(l => l.status === 'received').length || 0;
                            return (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="outline">
                                    {receivedLetters} of {totalLetters}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Support letters received</p>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <Link href={`/nominations/${nomination.id}`} className="cursor-pointer">
                            <Button variant="ghost" size="sm">
                              Manage
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
