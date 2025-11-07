'use client';

import { useEffect, useState } from 'react';
import { Award, FilterOptions } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Calendar, DollarSign, Filter } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [awards, setAwards] = useState<Award[]>([]);
  const [filteredAwards, setFilteredAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAwards();
  }, []);

  useEffect(() => {
    filterAwards();
  }, [awards, filters, searchTerm]);

  const fetchAwards = async () => {
    try {
      const response = await fetch('/api/awards');
      if (!response.ok) throw new Error('Failed to fetch awards');
      const data = await response.json();
      setAwards(data);
    } catch (error) {
      console.error('Error fetching awards:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAwards = () => {
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

    setFilteredAwards(filtered);
  };

  const uniqueValues = (field: keyof Award) => {
    return Array.from(new Set(awards.map((a) => a[field]).filter(Boolean)));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading awards...</div>
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
            <Link href="/nominations">
              <Button variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Nominations
              </Button>
            </Link>
            <Link href="/deadlines">
              <Button variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Deadlines
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Awards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{awards.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {awards.filter((a) => a.priorityRanking?.toLowerCase().includes('high')).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {awards.filter((a) => a.deadlineMonth).length}
              </div>
            </CardContent>
          </Card>
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
              <div>
                <label className="text-sm font-medium mb-2 block">Division</label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={filters.division || ''}
                  onChange={(e) =>
                    setFilters({ ...filters, division: e.target.value || undefined })
                  }
                >
                  <option value="">All Divisions</option>
                  {uniqueValues('division').map((div) => (
                    <option key={div} value={div}>
                      {div}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Deadline Month</label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={filters.deadlineMonth || ''}
                  onChange={(e) =>
                    setFilters({ ...filters, deadlineMonth: e.target.value || undefined })
                  }
                >
                  <option value="">All Months</option>
                  {uniqueValues('deadlineMonth').map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Career Level</label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={filters.academicCareerLevel || ''}
                  onChange={(e) =>
                    setFilters({ ...filters, academicCareerLevel: e.target.value || undefined })
                  }
                >
                  <option value="">All Levels</option>
                  <option value="Early Career">Early Career</option>
                  <option value="Mid-Career">Mid-Career</option>
                  <option value="Late Career">Late Career</option>
                </select>
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
                    <TableHead>Deadline</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Career Level</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAwards.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No awards found. Try adjusting your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAwards.map((award) => (
                      <TableRow key={award.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/awards/${award.id}`}
                            className="hover:underline text-primary"
                          >
                            {award.awardOrPrize}
                          </Link>
                        </TableCell>
                        <TableCell>{award.sponsor}</TableCell>
                        <TableCell>
                          {award.deadlineMonth && (
                            <Badge variant="outline">{award.deadlineMonth}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {award.monetaryAmount && (
                            <span className="text-sm font-medium">{award.monetaryAmount}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {award.priorityRanking && (
                            <Badge
                              variant={
                                award.priorityRanking.toLowerCase().includes('high')
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {award.priorityRanking}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {award.academicCareerLevel}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link href={`/awards/${award.id}`}>
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
