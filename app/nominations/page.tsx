'use client';

import { useEffect, useState } from 'react';
import { Award, Nomination } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, User, Calendar } from 'lucide-react';
import Link from 'next/link';
import { NavLink } from '@/components/nav-link';

export default function NominationsPage() {
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [nominationsRes, awardsRes] = await Promise.all([
        fetch('/api/nominations'),
        fetch('/api/awards'),
      ]);
      const nominationsData = await nominationsRes.json();
      const awardsData = await awardsRes.json();
      setNominations(Array.isArray(nominationsData) ? nominationsData : []);
      setAwards(Array.isArray(awardsData) ? awardsData : []);
    } catch {
      setNominations([]);
      setAwards([]);
    } finally {
      setLoading(false);
    }
  };

  const getAwardName = (awardId: string) => {
    const award = awards.find((a) => a.id === awardId);
    return award?.awardOrPrize || 'Unknown Award';
  };

  const getStatusBadge = (status: Nomination['status']) => {
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
  };

  const groupedByYear = nominations.reduce((acc, nom) => {
    const year = nom.nominationYear;
    if (!acc[year]) acc[year] = [];
    acc[year].push(nom);
    return acc;
  }, {} as Record<number, Nomination[]>);

  const years = Object.keys(groupedByYear).sort((a, b) => parseInt(b) - parseInt(a));

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading nominations...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">All Nominations</h1>
            <p className="text-muted-foreground mt-2">View all nominations across all awards</p>
          </div>
          <div className="flex gap-2">
            <NavLink href="/" icon={<Trophy className="mr-2 h-4 w-4" />}>
              Awards
            </NavLink>
            <NavLink href="/nominations" icon={<Calendar className="mr-2 h-4 w-4" />}>
              Nominations
            </NavLink>
            <NavLink href="/candidates" icon={<User className="mr-2 h-4 w-4" />}>
              Candidates
            </NavLink>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Nominations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{nominations.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {nominations.filter((n) => n.status === 'pending').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Submitted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {nominations.filter((n) => n.status === 'submitted').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Successful</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {nominations.filter((n) => n.status === 'successful').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Nominations by Year */}
        {years.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No nominations yet. Start by adding nominations to awards.
            </CardContent>
          </Card>
        ) : (
          years.map((year) => (
            <Card key={year}>
              <CardHeader>
                <CardTitle>{year} Nominations</CardTitle>
                <CardDescription>
                  {groupedByYear[parseInt(year)].length} nomination(s) this year
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Award</TableHead>
                        <TableHead>Candidate</TableHead>
                        <TableHead>Nominated By</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Letter Status</TableHead>
                        <TableHead>Support Letters</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedByYear[parseInt(year)].map((nomination) => (
                        <TableRow key={nomination.id}>
                          <TableCell>
                            <Link
                              href={`/awards/${nomination.awardId}`}
                              className="text-primary hover:underline cursor-pointer"
                            >
                              {getAwardName(nomination.awardId)}
                            </Link>
                          </TableCell>
                          <TableCell className="font-medium">
                            {nomination.candidateName}
                          </TableCell>
                          <TableCell>{nomination.nominatedBy}</TableCell>
                          <TableCell>{getStatusBadge(nomination.status)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {nomination.letterStatus.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {nomination.supportLettersStatus.replace('_', ' ')}
                              {nomination.supportLettersCount
                                ? ` (${nomination.supportLettersCount})`
                                : ''}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Link href={`/nominations/${nomination.id}`} className="cursor-pointer">
                              <Button variant="ghost" size="sm">
                                Manage
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
