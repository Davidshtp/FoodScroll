export interface GoogleUserInfo {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  givenName: string;
  familyName: string;
  picture: string;
}

export interface GoogleOAuthPort {
  verifyIdToken(idToken: string, clientId: string): Promise<GoogleUserInfo>;
}

export const GOOGLE_OAUTH = Symbol('GoogleOAuth');
