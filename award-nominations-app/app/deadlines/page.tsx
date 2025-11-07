'use client';

import { useEffect, useState } from 'react';
import { Award, Nomination } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Calendar, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface DeadlineItem {
  type: 'award' | 'nomination';
  id: string;
  name: string;
  awardName?: string;
  deadline: string;
  month: string;
  year?: number;
  status?: string;
  link?: string;
}

export default function DeadlinesPage() {
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeadlines();
  }, []);

  const fetchDeadlines = async () => {
    try {
      const [awardsRes, nominationsRes] = await Promise.all([
        fetch('/api/awards'),
        fetch('/api/nominations'),
      ]);
      const awards: Award[] = await awardsRes.json();
      const nominations: Nomination[] = await nominationsRes.json();

      const items: DeadlineItem[] = [];

      // Add award deadlines (call for nominations)
      awards.forEach((award) => {
        if (award.deadlineMonth) {
          items.push({
            type: 'award',
            id: award.id || '',
            name: award.awardOrPrize,
            deadline: award.deadlineMonth,
            month: award.deadlineMonth,
            link: `/awards/${award.id}`,
          });
        }
      });

      // Add nomination-specific deadlines
      nominations.forEach((nom) => {
        const award = awards.find((a) => a.id === nom.awardId);
        if (nom.deadlineDate) {
          items.push({
            type: 'nomination',
            id: nom.id || '',
            name: nom.candidateName,
            awardName: award?.awardOrPrize,
            deadline: nom.deadlineDate,
            month: new Date(nom.deadlineDate).toLocaleDateString('en-US', { month: 'long' }),
            year: nom.nominationYear,
            status: nom.status,
            link: `/nominations/${nom.id}`,
          });
        }
      });

      // Sort by month/date
      items.sort((a, b) => {
        if (a.type === 'nomination' && b.type === 'nomination') {
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
        return a.deadline.localeCompare(b.deadline);
      });

      setDeadlines(items);
    } catch (error) {
      console.error('Error fetching deadlines:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthNumber = (monthName: string): number => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months.findIndex(m => monthName.includes(m)) + 1;
  };

  const isUpcoming = (deadline: DeadlineItem): boolean => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (deadline.type === 'nomination' && deadline.deadline.includes('-')) {
      const deadlineDate = new Date(deadline.deadline);
      return deadlineDate >= now;
    }

    // For award deadlines (month-based)
    const deadlineMonth = getMonthNumber(deadline.month);
    return deadlineMonth >= currentMonth || deadlineMonth <= currentMonth + 3;
  };

  const upcomingDeadlines = deadlines.filter(isUpcoming);
  const allDeadlines = deadlines;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading deadlines...</div>
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
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Deadlines</h1>
            <p className="text-muted-foreground mt-2">
              Track all award and nomination deadlines
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Deadlines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allDeadlines.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {upcomingDeadlines.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Nominations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {deadlines.filter((d) => d.type === 'nomination' && d.status !== 'unsuccessful').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <CardTitle>Upcoming Deadlines</CardTitle>
            </div>
            <CardDescription>Deadlines in the next few months</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingDeadlines.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No upcoming deadlines found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Award</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingDeadlines.map((item) => (
                      <TableRow key={`${item.type}-${item.id}`}>
                        <TableCell>
                          <Badge variant="outline">
                            {item.type === 'award' ? 'Call for Noms' : 'Nomination'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          {item.type === 'nomination' ? item.awardName : item.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {item.type === 'nomination'
                              ? new Date(item.deadline).toLocaleDateString()
                              : item.month}
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.status && (
                            <Badge
                              variant={
                                item.status === 'successful'
                                  ? 'default'
                                  : item.status === 'submitted'
                                  ? 'default'
                                  : 'outline'
                              }
                            >
                              {item.status}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Link href={item.link || '#'}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle>All Deadlines</CardTitle>
            <CardDescription>Complete list of all award and nomination deadlines</CardDescription>
          </CardHeader>
          <CardContent>
            {allDeadlines.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No deadlines found. Add awards and nominations to see deadlines here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Award</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allDeadlines.map((item) => (
                      <TableRow key={`${item.type}-${item.id}`}>
                        <TableCell>
                          <Badge variant="outline">
                            {item.type === 'award' ? 'Call for Noms' : 'Nomination'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          {item.type === 'nomination' ? item.awardName : item.name}
                        </TableCell>
                        <TableCell>
                          {item.type === 'nomination'
                            ? new Date(item.deadline).toLocaleDateString()
                            : item.month}
                        </TableCell>
                        <TableCell>{item.year || 'Recurring'}</TableCell>
                        <TableCell>
                          {item.status && (
                            <Badge
                              variant={
                                item.status === 'successful'
                                  ? 'default'
                                  : item.status === 'submitted'
                                  ? 'default'
                                  : 'outline'
                              }
                            >
                              {item.status}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Link href={item.link || '#'}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
