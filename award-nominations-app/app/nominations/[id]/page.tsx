'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Award, Nomination, NominationFile, SupportLetter } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, FileText, Users, CheckCircle, Plus, Trash2, Calendar, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { FileUpload } from '@/components/file-upload';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function NominationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [nomination, setNomination] = useState<Nomination | null>(null);
  const [award, setAward] = useState<Award | null>(null);
  const [files, setFiles] = useState<NominationFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
    fetchFiles();
  }, [id]);

  const fetchData = async () => {
    try {
      const [nominationsRes, awardsRes] = await Promise.all([
        fetch('/api/nominations'),
        fetch('/api/awards'),
      ]);
      const nominations = await nominationsRes.json();
      const awards = await awardsRes.json();

      const currentNomination = nominations.find((n: Nomination) => n.id === id);
      setNomination(currentNomination || null);

      if (currentNomination) {
        const currentAward = awards.find((a: Award) => a.id === currentNomination.awardId);
        setAward(currentAward || null);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async () => {
    try {
      const response = await fetch(`/api/files/${id}`);
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const handleUpdate = async (updates: Partial<Nomination>) => {
    if (!nomination) return;

    // Auto-complete letter and support letter statuses when nomination is finalized
    if (updates.status && ['successful', 'unsuccessful', 'submitted'].includes(updates.status)) {
      updates.letterStatus = 'completed';
      updates.supportLettersStatus = 'received';
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/nominations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updated = await response.json();
        setNomination(updated);
        toast.success('Nomination updated successfully!');
      } else {
        toast.error('Failed to update nomination');
      }
    } catch (error) {
      console.error('Error updating nomination:', error);
      toast.error('Failed to update nomination');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!nomination) return;

    try {
      const response = await fetch(`/api/nominations/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Nomination deleted successfully!');
        router.push('/nominations');
      } else {
        toast.error('Failed to delete nomination');
      }
    } catch (error) {
      console.error('Error deleting nomination:', error);
      toast.error('Failed to delete nomination');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-10 w-80" />
              <Skeleton className="h-5 w-96" />
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!nomination || !award) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Nomination Not Found</h2>
          <Link href="/nominations">
            <Button>Return to Nominations</Button>
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
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-4xl font-bold tracking-tight">{nomination.candidateName}</h1>
            <p className="text-muted-foreground mt-2">
              <Link href={`/awards/${award.id}`} className="hover:underline cursor-pointer">
                {award.sponsor} - {award.awardOrPrize}
              </Link>
              {' '}- {nomination.nominationYear}
            </p>
            <div className="mt-2">
              {(() => {
                const variants: Record<Nomination['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
                  pending: 'outline',
                  submitted: 'default',
                  successful: 'default',
                  unsuccessful: 'outline',
                  ineligible: 'outline',
                };

                let className = '';
                if (nomination.status === 'successful') {
                  className = 'bg-green-600 text-white hover:bg-green-700';
                } else if (nomination.status === 'pending') {
                  className = 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200';
                } else if (nomination.status === 'unsuccessful') {
                  className = 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200';
                } else if (nomination.status === 'submitted') {
                  className = 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200';
                } else if (nomination.status === 'ineligible') {
                  className = 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200';
                }

                return <Badge variant={variants[nomination.status]} className={className}>{nomination.status}</Badge>;
              })()}
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="cursor-pointer">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Nomination?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this nomination for {nomination.candidateName}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete Nomination
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Details Section */}
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Nomination Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="candidate">Candidate Name</Label>
                <Input
                  id="candidate"
                  value={nomination.candidateName}
                  onChange={(e) =>
                    setNomination({ ...nomination, candidateName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nominator">Nominated By</Label>
                <Input
                  id="nominator"
                  value={nomination.nominatedBy}
                  onChange={(e) =>
                    setNomination({ ...nomination, nominatedBy: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={nomination.nominationYear}
                  onChange={(e) =>
                    setNomination({ ...nomination, nominationYear: parseInt(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={nomination.status}
                  onValueChange={(value) =>
                    setNomination({ ...nomination, status: value as Nomination['status'] })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="successful">Successful</SelectItem>
                    <SelectItem value="unsuccessful">Unsuccessful</SelectItem>
                    <SelectItem value="ineligible">Ineligible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => handleUpdate(nomination)} disabled={saving} className="w-full cursor-pointer">
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>

          {/* Deadlines */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <CardTitle>Important Dates</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline Date</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={nomination.deadlineDate || ''}
                  onChange={(e) =>
                    setNomination({ ...nomination, deadlineDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="submission">Submission Date</Label>
                <Input
                  id="submission"
                  type="date"
                  value={nomination.submissionDate || ''}
                  onChange={(e) =>
                    setNomination({ ...nomination, submissionDate: e.target.value })
                  }
                />
              </div>
              <Button onClick={() => handleUpdate(nomination)} disabled={saving} className="w-full cursor-pointer">
                <Save className="mr-2 h-4 w-4" />
                Update Dates
              </Button>
            </CardContent>
          </Card>
          </div>

          {/* Progress Tracking */}
          <div className="grid gap-6 md:grid-cols-3 md:grid-rows-[auto_auto]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Nomination Letter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="writer-name">Writer Name</Label>
                <Input
                  id="writer-name"
                  value={nomination.letterWriterName || ''}
                  onChange={(e) =>
                    setNomination({ ...nomination, letterWriterName: e.target.value })
                  }
                  placeholder="Enter writer's name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="writer-contact">Writer Contact</Label>
                <Input
                  id="writer-contact"
                  value={nomination.letterWriterContact || ''}
                  onChange={(e) =>
                    setNomination({ ...nomination, letterWriterContact: e.target.value })
                  }
                  placeholder="Email or phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="letter-status">Status</Label>
                <Select
                  value={nomination.letterStatus}
                  onValueChange={(value) =>
                    handleUpdate({
                      letterStatus: value as Nomination['letterStatus'],
                      letterWriterName: nomination.letterWriterName,
                      letterWriterContact: nomination.letterWriterContact
                    })
                  }
                >
                  <SelectTrigger id="letter-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="requested">Requested</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {nomination.letterStatus === 'completed' && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Letter completed</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Support Letters
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentLetters = nomination.supportLetters || [];
                    if (currentLetters.length < 5) {
                      setNomination({
                        ...nomination,
                        supportLetters: [
                          ...currentLetters,
                          { name: '', contact: '', status: 'not_started' }
                        ]
                      });
                    }
                  }}
                  disabled={(nomination.supportLetters || []).length >= 5}
                  className="cursor-pointer"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Letter
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {(!nomination.supportLetters || nomination.supportLetters.length === 0) ? (
                <p className="text-sm text-muted-foreground">No support letters added yet. Click "Add Letter" to add up to 5.</p>
              ) : (
                nomination.supportLetters.map((letter, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Letter {index + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const updatedLetters = nomination.supportLetters?.filter((_, i) => i !== index) || [];
                          handleUpdate({ supportLetters: updatedLetters });
                        }}
                        className="cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor={`support-name-${index}`}>Name</Label>
                        <Input
                          id={`support-name-${index}`}
                          value={letter.name}
                          onChange={(e) => {
                            const updatedLetters = [...(nomination.supportLetters || [])];
                            updatedLetters[index] = { ...letter, name: e.target.value };
                            setNomination({ ...nomination, supportLetters: updatedLetters });
                          }}
                          placeholder="Writer's name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`support-contact-${index}`}>Contact</Label>
                        <Input
                          id={`support-contact-${index}`}
                          value={letter.contact}
                          onChange={(e) => {
                            const updatedLetters = [...(nomination.supportLetters || [])];
                            updatedLetters[index] = { ...letter, contact: e.target.value };
                            setNomination({ ...nomination, supportLetters: updatedLetters });
                          }}
                          placeholder="Email or phone"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`support-status-${index}`}>Status</Label>
                      <Select
                        value={letter.status}
                        onValueChange={(value) => {
                          const updatedLetters = [...(nomination.supportLetters || [])];
                          updatedLetters[index] = { ...letter, status: value as SupportLetter['status'] };
                          setNomination({ ...nomination, supportLetters: updatedLetters });
                        }}
                      >
                        <SelectTrigger id={`support-status-${index}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_started">Not Started</SelectItem>
                          <SelectItem value="requested">Requested</SelectItem>
                          <SelectItem value="received">Received</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))
              )}
              {nomination.supportLetters && nomination.supportLetters.length > 0 && (
                <Button onClick={() => handleUpdate({ supportLetters: nomination.supportLetters })} disabled={saving} className="w-full cursor-pointer">
                  <Save className="mr-2 h-4 w-4" />
                  Save Support Letters
                </Button>
              )}
            </CardContent>
          </Card>
          </div>

          {/* Files & Notes Section */}
          <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Package Files</CardTitle>
                  <CardDescription>Upload nomination documents to Google Drive</CardDescription>
                </CardHeader>
                <CardContent>
                  <FileUpload
                    nominationId={id}
                    files={files}
                    onFilesChange={fetchFiles}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={nomination.notes || ''}
                    onChange={(e) => setNomination({ ...nomination, notes: e.target.value })}
                    className="min-h-[150px]"
                    placeholder="Add notes about this nomination, including file links, contacts, etc."
                  />
                  <Button onClick={() => handleUpdate(nomination)} disabled={saving} className="cursor-pointer">
                    <Save className="mr-2 h-4 w-4" />
                    Save Notes
                  </Button>
                </CardContent>
              </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
