export type ActivityPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type ActivityStatus = 'DRAFT' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface StrategicIssueOption {
  id: string;
  name: string;
}

export interface PersonOption {
  id: string;
  name: string;
}

export interface KeywordOption {
  id: string;
  name: string;
}

export interface Activity {
  id: string;
  activityCode: string;
  title: string;
  strakomNumber?: string | null;
  activityDate: string;
  activityTime?: string | null;
  locationId?: string | null;
  locationName?: string | null;
  priority: ActivityPriority;
  status: ActivityStatus;
  description?: string | null;
  createdBy: string;
  createdAt: string;
  strategicIssues?: StrategicIssueOption[];
  persons?: PersonOption[];
  keywords?: KeywordOption[];
}

export interface ActivityFormData {
  activityCode?: string;
  title: string;
  strakomNumber?: string;
  activityDate: string;
  activityTime?: string;
  locationId?: string;
  priority: ActivityPriority;
  status: ActivityStatus;
  description?: string;
  strategicIssueIds?: string[];
  personIds?: string[];
  keywordIds?: string[];
}
