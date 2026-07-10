export interface CertificateRegistrationPayload {
  certificateId: string;
  studentId: string;
  courseId: string;
  issuedAt: string;
}

export interface CertificateVerificationResult {
  certificateId: string;
  verified: boolean;
  status: 'verified' | 'pending' | 'failed' | 'not-found';
  message: string;
}
