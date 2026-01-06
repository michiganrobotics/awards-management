'use client';

import { useState, useMemo } from 'react';
import { Nomination, Award } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, User, Calendar, Award as AwardIcon } from 'lucide-react';
import Link from 'next/link';
import { useNominations } from '@/hooks/use-nominations';
import { useAwards } from '@/hooks/use-awards';

interface CandidateGroup {
  name: string;
  nominations: Array<Nomination & { award?: Award }>;
}

export default function CandidatesPage() {
  const { data: nominations = [], isLoading: nominationsLoading } = useNominations();
  const { data: awards = [], isLoading: awardsLoading } = useAwards();
  const [searchTerm, setSearchTerm] = useState('');

  const loading = nominationsLoading || awardsLoading;

  // Group nominations by candidate with memoization
  const candidates = useMemo(() => {
    // Group nominations by candidate
    const grouped = nominations.reduce((acc, nomination) => {
      const candidateName = nomination.candidateName;
      if (!acc[candidateName]) {
        acc[candidateName] = [];
      }
      // Attach award info to nomination
      const award = awards.find((a) => a.id === nomination.awardId);
      acc[candidateName].push({ ...nomination, award });
      return acc;
    }, {} as Record<string, Array<Nomination & { award?: Award }>>);

    // Convert to array and sort by candidate name
    return Object.entries(grouped)
      .map(([name, nominations]) => ({
        name,
        nominations: nominations.sort((a, b) => b.nominationYear - a.nominationYear),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [nominations, awards]);

  const filteredCandidates = useMemo(() => {
    if (!searchTerm) {
      return candidates;
    }

    const search = searchTerm.toLowerCase();
    return candidates.filter((candidate) =>
      candidate.name.toLowerCase().includes(search) ||
      candidate.nominations.some((nom) =>
        nom.award?.awardOrPrize.toLowerCase().includes(search)
      )
    );
  }, [candidates, searchTerm]);

  const getStatusColor = (status: Nomination['status']) => {
    switch (status) {
      case 'successful':
        return 'default';
      case 'submitted':
        return 'default';
      case 'unsuccessful':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-4 w-80" />
            </div>
          </div>
          <Skeleton className="h-10 w-full" />
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Candidates</h1>
            <p className="text-muted-foreground mt-2">
              View all candidates and their nomination history
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="cursor-pointer">
              <Button variant="outline">
                <AwardIcon className="mr-2 h-4 w-4" />
                Awards
              </Button>
            </Link>
            <Link href="/nominations" className="cursor-pointer">
              <Button variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Nominations
              </Button>
            </Link>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Search Candidates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by candidate name or award..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Candidates List */}
        <div className="space-y-4">
          {filteredCandidates.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  No candidates found. Try adjusting your search.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredCandidates.map((candidate) => (
              <Card key={candidate.name}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle>{candidate.name}</CardTitle>
                      <CardDescription>
                        {candidate.nominations.length} nomination{candidate.nominations.length !== 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {candidate.nominations.map((nomination) => (
                      <div
                        key={nomination.id}
                        className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/nominations/${nomination.id}`}
                              className="font-medium hover:underline text-primary cursor-pointer"
                            >
                              {nomination.award?.awardOrPrize || 'Unknown Award'}
                            </Link>
                            <Badge
                              variant={getStatusColor(nomination.status)}
                              className={
                                nomination.status === 'successful'
                                  ? 'bg-green-600 text-white hover:bg-green-700'
                                  : nomination.status === 'pending'
                                  ? 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200'
                                  : nomination.status === 'unsuccessful'
                                  ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                                  : nomination.status === 'submitted'
                                  ? 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200'
                                  : nomination.status === 'ineligible'
                                  ? 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200'
                                  : ''
                              }
                            >
                              {nomination.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {nomination.award?.sponsor && (
                              <span>{nomination.award.sponsor} • </span>
                            )}
                            <span>Year: {nomination.nominationYear}</span>
                            {nomination.nominatedBy && (
                              <span> • Nominated by: {nomination.nominatedBy}</span>
                            )}
                          </div>
                        </div>
                        <Link href={`/nominations/${nomination.id}`} className="cursor-pointer">
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="text-2xl font-bold">{candidates.length}</div>
                <div className="text-sm text-muted-foreground">Total Candidates</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {candidates.reduce((acc, c) => acc + c.nominations.length, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Nominations</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {candidates.reduce(
                    (acc, c) => acc + c.nominations.filter((n) => n.status === 'successful').length,
                    0
                  )}
                </div>
                <div className="text-sm text-muted-foreground">Successful Nominations</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
