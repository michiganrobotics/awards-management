'use client';

import { use, useEffect, useState } from 'react';
import { Award, Nomination } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, ExternalLink, Plus, Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AwardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [award, setAward] = useState<Award | null>(null);
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddNomination, setShowAddNomination] = useState(false);
  const [newNomination, setNewNomination] = useState({
    candidateName: '',
    nominatedBy: '',
    nominationYear: new Date().getFullYear(),
  });

  useEffect(() => {
    fetchAwardAndNominations();
  }, [id]);

  const fetchAwardAndNominations = async () => {
    try {
      const [awardsRes, nominationsRes] = await Promise.all([
        fetch('/api/awards'),
        fetch('/api/nominations'),
      ]);

      const awards = await awardsRes.json();
      const allNominations = await nominationsRes.json();

      const currentAward = awards.find((a: Award) => a.id === id);
      setAward(currentAward || null);
      setNominations(allNominations.filter((n: Nomination) => n.awardId === id));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNomination = async () => {
    try {
      const response = await fetch('/api/nominations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newNomination,
          awardId: id,
          status: 'pending',
          letterStatus: 'not_started',
          supportLettersStatus: 'not_started',
        }),
      });

      if (response.ok) {
        setShowAddNomination(false);
        setNewNomination({
          candidateName: '',
          nominatedBy: '',
          nominationYear: new Date().getFullYear(),
        });
        fetchAwardAndNominations();
      }
    } catch (error) {
      console.error('Error adding nomination:', error);
    }
  };

  const getStatusIcon = (status: Nomination['status']) => {
    switch (status) {
      case 'successful':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'submitted':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'unsuccessful':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: Nomination['status']) => {
    const variants: Record<Nomination['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      submitted: 'default',
      successful: 'default',
      unsuccessful: 'secondary',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/">
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
                    className="mt-1 flex items-center gap-1 text-primary hover:underline"
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
                  <div className="text-sm font-medium text-muted-foreground">Deadline Month</div>
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
                      <Badge>{award.priorityRanking}</Badge>
                    ) : (
                      'N/A'
                    )}
                  </div>
                </div>
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
              <div>
                <div className="text-sm font-medium text-muted-foreground">Self Nominations</div>
                <div className="mt-1">{award.selfNominations || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Limited</div>
                <div className="mt-1">{award.limited || 'No'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Currently Managed By</div>
                <div className="mt-1">{award.currentlyManagedBy || 'Unassigned'}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Nominations Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Nominations History</CardTitle>
                <CardDescription>Track all nominations for this award across years</CardDescription>
              </div>
              <Button onClick={() => setShowAddNomination(!showAddNomination)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Nomination
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {showAddNomination && (
              <Card className="border-2 border-dashed">
                <CardHeader>
                  <CardTitle>New Nomination</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Candidate Name</label>
                      <Input
                        value={newNomination.candidateName}
                        onChange={(e) =>
                          setNewNomination({ ...newNomination, candidateName: e.target.value })
                        }
                        placeholder="Enter candidate name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Nominated By</label>
                      <Input
                        value={newNomination.nominatedBy}
                        onChange={(e) =>
                          setNewNomination({ ...newNomination, nominatedBy: e.target.value })
                        }
                        placeholder="Enter nominator name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Year</label>
                      <Input
                        type="number"
                        value={newNomination.nominationYear}
                        onChange={(e) =>
                          setNewNomination({
                            ...newNomination,
                            nominationYear: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddNomination}>Add Nomination</Button>
                    <Button variant="outline" onClick={() => setShowAddNomination(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

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
                    nominations.map((nomination) => (
                      <TableRow key={nomination.id}>
                        <TableCell>{nomination.nominationYear}</TableCell>
                        <TableCell className="font-medium">{nomination.candidateName}</TableCell>
                        <TableCell>{nomination.nominatedBy}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(nomination.status)}
                            {getStatusBadge(nomination.status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{nomination.letterStatus.replace('_', ' ')}</Badge>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const totalLetters = nomination.supportLetters?.length || 0;
                            const receivedLetters = nomination.supportLetters?.filter(l => l.status === 'received').length || 0;
                            return (
                              <Badge variant="outline">
                                {receivedLetters} of {totalLetters}
                              </Badge>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <Link href={`/nominations/${nomination.id}`}>
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
      </div>
    </div>
  );
}
