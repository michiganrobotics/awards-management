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
  callForNoms: string;
  priorityRanking: string;
  addedFrom: string;
  typeOfImpact: string;
  awardType: string;
  academicCareerLevel: string;
  reasonsToRemove: string;
  limited: string;
  nominator: string;
  nominationViability: string;
  selfNominations: string;
  confidential: string;
  currentlyManagedBy: string;
  notes: string;
  toBeManagedBy: string;
  mitPaper: string;
  nominationRequestFrom: string;
  logo: string;
  nominations: string;
  awardRotation: string;
  awardAnalysis: string;
  heritageAward: string;
  faculty: string;
  faculty2: string;
  faculty3: string;
  candidateSuggestions2024: string;
  candidateSuggestions: string;
  suggestedCandidate: string;
}

export interface Nomination {
  id?: string;
  awardId: string;
  candidateName: string;
  nominatedBy: string;
  nominationYear: number;
  status: 'pending' | 'submitted' | 'successful' | 'unsuccessful';
  letterStatus: 'not_started' | 'in_progress' | 'completed';
  supportLettersStatus: 'not_started' | 'requested' | 'received';
  supportLettersCount?: number;
  packageFiles?: string[];
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
