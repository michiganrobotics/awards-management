'use client';

import { use, useEffect, useState } from 'react';
import { Award, Nomination, NominationFile, SupportLetter } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, FileText, Users, CheckCircle, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { FileUpload } from '@/components/file-upload';

export default function NominationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
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
      }
    } catch (error) {
      console.error('Error updating nomination:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
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
          <Link href={`/awards/${award.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-4xl font-bold tracking-tight">{nomination.candidateName}</h1>
            <p className="text-muted-foreground mt-2">
              {award.awardOrPrize} - {nomination.nominationYear}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Nomination Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Candidate Name</label>
                <Input
                  value={nomination.candidateName}
                  onChange={(e) =>
                    setNomination({ ...nomination, candidateName: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nominated By</label>
                <Input
                  value={nomination.nominatedBy}
                  onChange={(e) =>
                    setNomination({ ...nomination, nominatedBy: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Year</label>
                <Input
                  type="number"
                  value={nomination.nominationYear}
                  onChange={(e) =>
                    setNomination({ ...nomination, nominationYear: parseInt(e.target.value) })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <select
                  value={nomination.status}
                  onChange={(e) =>
                    setNomination({ ...nomination, status: e.target.value as Nomination['status'] })
                  }
                  className="w-full mt-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="submitted">Submitted</option>
                  <option value="successful">Successful</option>
                  <option value="unsuccessful">Unsuccessful</option>
                </select>
              </div>
              <Button onClick={() => handleUpdate(nomination)} disabled={saving} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>

          {/* Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle>Important Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Deadline Date</label>
                <Input
                  type="date"
                  value={nomination.deadlineDate || ''}
                  onChange={(e) =>
                    setNomination({ ...nomination, deadlineDate: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Submission Date
                </label>
                <Input
                  type="date"
                  value={nomination.submissionDate || ''}
                  onChange={(e) =>
                    setNomination({ ...nomination, submissionDate: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <Button onClick={() => handleUpdate(nomination)} disabled={saving} className="w-full">
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
              <div>
                <label className="text-sm font-medium text-muted-foreground">Writer Name</label>
                <Input
                  value={nomination.letterWriterName || ''}
                  onChange={(e) =>
                    setNomination({ ...nomination, letterWriterName: e.target.value })
                  }
                  className="mt-1"
                  placeholder="Enter writer's name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Writer Contact</label>
                <Input
                  value={nomination.letterWriterContact || ''}
                  onChange={(e) =>
                    setNomination({ ...nomination, letterWriterContact: e.target.value })
                  }
                  className="mt-1"
                  placeholder="Email or phone"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <select
                  value={nomination.letterStatus}
                  onChange={(e) =>
                    handleUpdate({
                      letterStatus: e.target.value as Nomination['letterStatus'],
                      letterWriterName: nomination.letterWriterName,
                      letterWriterContact: nomination.letterWriterContact
                    })
                  }
                  className="w-full mt-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="not_started">Not Started</option>
                  <option value="requested">Requested</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
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
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Name</label>
                        <Input
                          value={letter.name}
                          onChange={(e) => {
                            const updatedLetters = [...(nomination.supportLetters || [])];
                            updatedLetters[index] = { ...letter, name: e.target.value };
                            setNomination({ ...nomination, supportLetters: updatedLetters });
                          }}
                          className="mt-1"
                          placeholder="Writer's name"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Contact</label>
                        <Input
                          value={letter.contact}
                          onChange={(e) => {
                            const updatedLetters = [...(nomination.supportLetters || [])];
                            updatedLetters[index] = { ...letter, contact: e.target.value };
                            setNomination({ ...nomination, supportLetters: updatedLetters });
                          }}
                          className="mt-1"
                          placeholder="Email or phone"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <select
                        value={letter.status}
                        onChange={(e) => {
                          const updatedLetters = [...(nomination.supportLetters || [])];
                          updatedLetters[index] = { ...letter, status: e.target.value as SupportLetter['status'] };
                          setNomination({ ...nomination, supportLetters: updatedLetters });
                        }}
                        className="w-full mt-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                      >
                        <option value="not_started">Not Started</option>
                        <option value="requested">Requested</option>
                        <option value="received">Received</option>
                      </select>
                    </div>
                  </div>
                ))
              )}
              {nomination.supportLetters && nomination.supportLetters.length > 0 && (
                <Button onClick={() => handleUpdate({ supportLetters: nomination.supportLetters })} disabled={saving} className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  Save Support Letters
                </Button>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Package Files and Notes */}
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
              <textarea
                value={nomination.notes || ''}
                onChange={(e) => setNomination({ ...nomination, notes: e.target.value })}
                className="w-full min-h-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Add notes about this nomination, including file links, contacts, etc."
              />
              <Button onClick={() => handleUpdate(nomination)} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                Save Notes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
