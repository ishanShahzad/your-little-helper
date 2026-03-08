import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

const FACEBOOK_APP_ID = Constants.expoConfig?.extra?.facebookAppId || process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;

export interface FacebookAuthResult {
  type: 'success' | 'error' | 'cancel';
  token?: string;
  error?: string;
}

export async function loginWithFacebook(): Promise<FacebookAuthResult> {
  try {
    if (!FACEBOOK_APP_ID) {
      return {
        type: 'error',
        error: 'Facebook App ID not configured. Please add EXPO_PUBLIC_FACEBOOK_APP_ID to your .env file.',
      };
    }

    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'bumbee',
      path: 'auth/facebook',
    });

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=public_profile,email`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (result.type === 'success') {
      const url = result.url;
      const match = url.match(/access_token=([^&]+)/);
      
      if (match && match[1]) {
        return {
          type: 'success',
          token: match[1],
        };
      }
      
      return {
        type: 'error',
        error: 'Failed to extract access token from Facebook response',
      };
    }

    if (result.type === 'cancel') {
      return { type: 'cancel' };
    }

    return {
      type: 'error',
      error: 'Facebook authentication failed',
    };
  } catch (error: any) {
    return {
      type: 'error',
      error: error.message || 'An unexpected error occurred during Facebook login',
    };
  }
}
