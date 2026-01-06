'use client';

import { useState, useMemo } from 'react';
import { FilterOptions, Award } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Plus, Calendar, DollarSign, Filter, User } from 'lucide-react';
import Link from 'next/link';
import { useAwards } from '@/hooks/use-awards';

export default function Dashboard() {
  const { data: awards = [], isLoading: loading } = useAwards();
  const [filters, setFilters] = useState<FilterOptions>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const parseDeadline = (deadlineStr: string) => {
    if (!deadlineStr) return null;

    const lowerDeadline = deadlineStr.toLowerCase();

    // Handle text values like 'rolling', 'floating', 'ongoing', etc.
    if (lowerDeadline === 'rolling' || lowerDeadline === 'floating' || lowerDeadline === 'ongoing') {
      return null;
    }

    const today = new Date();
    const currentYear = today.getFullYear();

    // Handle M/D or MM/DD format (e.g., "10/1", "1/15")
    if (deadlineStr.includes('/')) {
      const parts = deadlineStr.split('/');
      // Validate we have exactly 2 parts before parsing
      if (parts.length === 2) {
        const month = parseInt(parts[0]);
        const day = parseInt(parts[1]);

        // Validate parsed values are not NaN and within valid ranges
        if (!isNaN(month) && !isNaN(day) && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          let deadlineDate = new Date(currentYear, month - 1, day);

          // If deadline has passed this year, use next year
          if (deadlineDate < today) {
            deadlineDate = new Date(currentYear + 1, month - 1, day);
          }

          return deadlineDate;
        }
      }
    }

    // Try parsing as a full date string
    const date = new Date(deadlineStr);
    if (!isNaN(date.getTime())) {
      return new Date(currentYear, date.getMonth(), date.getDate());
    }

    // If we can't parse it, return null (treats it like rolling/floating)
    return null;
  };

  // Use useMemo to avoid re-creating filter function on every render
  const filteredAwards = useMemo(() => {
    let filtered = [...awards];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (award) =>
          award.awardOrPrize.toLowerCase().includes(search) ||
          award.sponsor.toLowerCase().includes(search) ||
          award.description.toLowerCase().includes(search) ||
          award.fieldOrDiscipline.toLowerCase().includes(search)
      );
    }

    // Division filter
    if (filters.division) {
      filtered = filtered.filter((award) => award.division === filters.division);
    }

    // Deadline month filter
    if (filters.deadlineMonth) {
      filtered = filtered.filter((award) => award.deadlineMonth === filters.deadlineMonth);
    }

    // Career level filter
    if (filters.academicCareerLevel) {
      filtered = filtered.filter((award) =>
        award.academicCareerLevel.includes(filters.academicCareerLevel!)
      );
    }

    // Sort by deadline
    filtered.sort((a, b) => {
      const dateA = parseDeadline(a.deadlineMonth);
      const dateB = parseDeadline(b.deadlineMonth);

      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;

      return sortOrder === 'asc'
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    });

    return filtered;
  }, [awards, filters, searchTerm, sortOrder]);

  const uniqueValues = (field: keyof Award): string[] => {
    return Array.from(
      new Set(
        awards
          .map((a) => a[field])
          .filter((value): value is string => Boolean(value) && typeof value === 'string')
      )
    );
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
            <Skeleton className="h-10 w-32" />
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
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
            <h1 className="text-4xl font-bold tracking-tight">Award Nominations</h1>
            <p className="text-muted-foreground mt-2">
              Manage and track academic award nominations
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/nominations" className="cursor-pointer">
              <Button variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Nominations
              </Button>
            </Link>
            <Link href="/candidates" className="cursor-pointer">
              <Button variant="outline">
                <User className="mr-2 h-4 w-4" />
                Candidates
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 flex-col md:flex-row">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search awards by name, sponsor, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="division">Division</Label>
                <Select
                  value={filters.division || 'all'}
                  onValueChange={(value) =>
                    setFilters({ ...filters, division: value === 'all' ? undefined : value })
                  }
                >
                  <SelectTrigger id="division">
                    <SelectValue placeholder="All Divisions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Divisions</SelectItem>
                    {uniqueValues('division').map((div) => (
                      <SelectItem key={div} value={div}>
                        {div}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline Month</Label>
                <Select
                  value={filters.deadlineMonth || 'all'}
                  onValueChange={(value) =>
                    setFilters({ ...filters, deadlineMonth: value === 'all' ? undefined : value })
                  }
                >
                  <SelectTrigger id="deadline">
                    <SelectValue placeholder="All Months" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Months</SelectItem>
                    {uniqueValues('deadlineMonth').map((month) => (
                      <SelectItem key={month} value={month}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="career">Career Level</Label>
                <Select
                  value={filters.academicCareerLevel || 'all'}
                  onValueChange={(value) =>
                    setFilters({ ...filters, academicCareerLevel: value === 'all' ? undefined : value })
                  }
                >
                  <SelectTrigger id="career">
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="Early Career">Early Career</SelectItem>
                    <SelectItem value="Mid-Career">Mid-Career</SelectItem>
                    <SelectItem value="Late Career">Late Career</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Awards Table */}
        <Card>
          <CardHeader>
            <CardTitle>Awards ({filteredAwards.length})</CardTitle>
            <CardDescription>
              Click on an award to view details and manage nominations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Award Name</TableHead>
                    <TableHead>Sponsor</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      Deadline {sortOrder === 'asc' ? '↑' : '↓'}
                    </TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Career Level</TableHead>
                    <TableHead>Honorifics Office</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAwards.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No awards found. Try adjusting your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAwards.map((award) => (
                      <TableRow key={award.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/awards/${award.id}`}
                            className="hover:underline text-primary cursor-pointer"
                          >
                            {award.awardOrPrize}
                          </Link>
                        </TableCell>
                        <TableCell>{award.sponsor}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {award.deadlineMonth || '-'}
                        </TableCell>
                        <TableCell>
                          {award.monetaryAmount && (
                            <span className="text-sm font-medium">{award.monetaryAmount}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {award.priorityRanking ? (
                            <Badge variant="outline">
                              {award.priorityRanking}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {award.academicCareerLevel}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground max-w-[150px] truncate">
                            {award.honorificsOfficeAssistance || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link href={`/awards/${award.id}`} className="cursor-pointer">
                            <Button variant="ghost" size="sm">
                              View
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
  );
}
