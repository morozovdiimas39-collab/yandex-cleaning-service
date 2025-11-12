export interface Phrase {
  phrase: string;
  count: number;
  sourceCluster?: string;
  sourceColor?: string;
  isTemporary?: boolean;
  removedPhrases?: Phrase[];
  isMinusWord?: boolean;
  minusTerm?: string;
}

export interface Cluster {
  name: string;
  intent: string;
  color: string;
  icon: string;
  phrases: Phrase[];
  bgColor?: string;
  searchText?: string;
  hovering?: boolean;
}

export interface ResultsStepProps {
  clusters: Cluster[];
  minusWords: Phrase[];
  onExport: () => void;
  onNewProject: () => void;
  projectId?: number;
  onSaveChanges?: (clusters: Cluster[], minusWords: Phrase[]) => void;
  regions?: string[];
  onWordstatClick?: () => void;
  specificAddress?: string;
}

export const CLUSTER_BG_COLORS = [
  "#E8F4F8",
  "#F5E8F8",
  "#E8F8E8",
  "#FFF8E0",
  "#FCE8F0",
  "#E0F8F5",
  "#F9FBE7",
  "#E1F5FE",
];
