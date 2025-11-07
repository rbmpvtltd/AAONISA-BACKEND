export class TokenEntity {
  token: string;     // Expo token
  userId?: string | null;   // null = not assigned
  createdAt: Date;   // when token first registered
}
