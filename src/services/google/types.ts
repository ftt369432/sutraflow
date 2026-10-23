/**
 * Google API types for Gmail and other Google services
 */

export interface GoogleAPIResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  historyId?: string;
  internalDate?: string;
  payload?: {
    partId?: string;
    mimeType?: string;
    filename?: string;
    headers?: Array<{
      name: string;
      value: string;
    }>;
    body?: {
      attachmentId?: string;
      size?: number;
      data?: string;
    };
    parts?: Array<any>;
  };
  sizeEstimate?: number;
  raw?: string;
}

export interface GmailListResponse {
  messages?: Array<{
    id: string;
    threadId: string;
  }>;
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

export interface GmailLabel {
  id: string;
  name: string;
  messageListVisibility?: string;
  labelListVisibility?: string;
  type?: string;
  messagesTotal?: number;
  messagesUnread?: number;
  threadsTotal?: number;
  threadsUnread?: number;
  color?: {
    textColor?: string;
    backgroundColor?: string;
  };
}

export interface GmailThread {
  id: string;
  historyId?: string;
  messages?: GmailMessage[];
}

export interface GmailAttachment {
  attachmentId: string;
  size: number;
  data?: string;
}

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token?: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
}
