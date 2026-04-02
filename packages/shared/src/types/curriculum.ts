export interface Topic {
  id: string;
  slug: string;
  title: string;
  orderIndex: number;
  parentTopicId: string | null;
  children?: Topic[];
  lessonCount: number;
  problemCount: number;
}

export interface Lesson {
  id: string;
  topicId: string;
  title: string;
  contentMd: string;
  orderIndex: number;
}
