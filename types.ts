export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
}

export interface Attachment {
  type: 'image' | 'file' | 'audio';
  content: string; // Base64 data URL for UI rendering
  mimeType: string;
  name?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  attachments?: Attachment[];
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export enum LoadingState {
  IDLE = 'IDLE',
  THINKING = 'THINKING',
  STREAMING = 'STREAMING',
  ERROR = 'ERROR',
}