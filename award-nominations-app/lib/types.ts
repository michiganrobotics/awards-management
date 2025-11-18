export interface Award {
  id?: string;
  awardOrPrize: string;
  sponsor: string;
  link: string;
  division: string;
  deadlineMonth: string;
  monetaryAmount: string;
  description: string;
  fieldOrDiscipline: string;
  callStartDate: string;
  priorityRanking: string;
  typeOfImpact: string;
  awardType: string;
  academicCareerLevel: string;
  nominator: string;
  notes: string;
  awardRotation: string;
  awardAnalysis: string;
  honorificsOfficeAssistance: string;
}

export interface NominationFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime: string;
  webViewLink?: string;
  category?: 'letter' | 'support_letter' | 'cv' | 'publication' | 'other';
}

export interface SupportLetter {
  name: string;
  contact: string;
  status: 'not_started' | 'requested' | 'received';
}

export interface Nomination {
  id?: string;
  awardId: string;
  candidateName: string;
  nominatedBy: string;
  nominationYear: number;
  status: 'pending' | 'submitted' | 'successful' | 'unsuccessful';
  letterStatus: 'not_started' | 'requested' | 'in_progress' | 'completed';
  letterWriterName?: string;
  letterWriterContact?: string;
  supportLetters?: SupportLetter[];
  supportLettersStatus: 'not_started' | 'requested' | 'received';
  supportLettersCount?: number;
  packageFiles?: string[];
  driveFolderId?: string;
  deadlineDate?: string;
  submissionDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NominationTask {
  id?: string;
  nominationId: string;
  taskType: 'letter' | 'support_letter' | 'document' | 'review' | 'other';
  description: string;
  assignedTo?: string;
  dueDate?: string;
  completed: boolean;
  completedAt?: string;
  notes?: string;
}

export type FilterOptions = {
  division?: string;
  deadlineMonth?: string;
  academicCareerLevel?: string;
  awardType?: string;
  priorityRanking?: string;
  search?: string;
};
