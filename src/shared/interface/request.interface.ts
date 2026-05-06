export interface AuthenticatedRequest {
  applicantId: string;
  user?: {
    id: string;
    email: string;
    role: string;
  };
  ip: string;
  headers: Record<string, string>;
}
