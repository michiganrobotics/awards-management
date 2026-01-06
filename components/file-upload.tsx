'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Upload, X, FileText, Loader2, ExternalLink } from 'lucide-react';
import { NominationFile } from '@/lib/types';
import { toast } from 'sonner';

interface FileUploadProps {
  nominationId: string;
  files: NominationFile[];
  onFilesChange: () => void;
}

export function FileUpload({ nominationId, files, onFilesChange }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState<string>('other');
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('nominationId', nominationId);
      formData.append('category', category);

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success('File uploaded successfully');
        onFilesChange();
      } else {
        const error = await response.json();
        toast.error(`Upload failed: ${error.error}`);
      }
    } catch {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;

    try {
      const response = await fetch(`/api/files/${nominationId}?fileId=${fileToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('File deleted successfully');
        onFilesChange();
      } else {
        toast.error('Failed to delete file');
      }
    } catch {
      toast.error('Failed to delete file');
    } finally {
      setFileToDelete(null);
    }
  };

  const formatFileSize = (bytes?: string) => {
    if (!bytes) return '';
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
    return '📎';
  };

  const extractCategoryFromFilename = (filename: string): string | null => {
    const match = filename.match(/\[(.*?)\]/);
    return match ? match[1] : null;
  };

  const getCategoryLabel = (category?: string) => {
    if (!category) return null;
    const labels: Record<string, string> = {
      letter: 'Nomination Letter',
      support_letter: 'Support Letter',
      cv: 'CV/Resume',
      publication: 'Publication',
      other: 'Other'
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      letter: 'bg-blue-500 text-white',
      support_letter: 'bg-green-500 text-white',
      cv: 'bg-purple-500 text-white',
      publication: 'bg-orange-500 text-white',
      other: 'bg-gray-500 text-white'
    };
    return colors[category || 'other'] || colors.other;
  };

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      <div className="space-y-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm cursor-pointer"
        >
          <option value="letter">Nomination Letter</option>
          <option value="support_letter">Support Letter</option>
          <option value="cv">CV/Resume</option>
          <option value="publication">Publication</option>
          <option value="other">Other</option>
        </select>

        <label className="block">
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
          <Button
            variant="outline"
            className="w-full cursor-pointer"
            disabled={uploading}
            onClick={(e) => {
              e.preventDefault();
              (e.currentTarget.previousElementSibling as HTMLInputElement)?.click();
            }}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload File
              </>
            )}
          </Button>
        </label>
      </div>

      {/* Files List */}
      {files.length > 0 ? (
        <div className="space-y-2">
          {files.map((file) => (
            <Card key={file.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xl">{getFileIcon(file.mimeType)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        {(() => {
                          const category = file.category || extractCategoryFromFilename(file.name);
                          return category && (
                            <Badge className={getCategoryColor(category)} variant="secondary">
                              {getCategoryLabel(category)}
                            </Badge>
                          );
                        })()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)} • {new Date(file.createdTime).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {file.webViewLink && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(file.webViewLink, '_blank')}
                        className="cursor-pointer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFileToDelete(file.id)}
                      className="cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No files uploaded yet
        </p>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!fileToDelete} onOpenChange={(open) => !open && setFileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this file? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
