import { google } from 'googleapis';
import { CONFIG } from './config';

interface GmailCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export async function fetchLatestBillingAmount(
  credentials: GmailCredentials,
): Promise<number | null> {
  const oauth2Client = new google.auth.OAuth2(
    credentials.clientId,
    credentials.clientSecret,
  );
  oauth2Client.setCredentials({ refresh_token: credentials.refreshToken });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const res = await gmail.users.messages.list({
    userId: 'me',
    q: CONFIG.EMAIL_SEARCH_QUERY,
    maxResults: 1,
  });

  const messages = res.data.messages;
  if (!messages || messages.length === 0) return null;

  const msg = await gmail.users.messages.get({
    userId: 'me',
    id: messages[0].id!,
    format: 'full',
  });

  const body = extractPlainTextBody(msg.data);
  if (!body) return null;

  return parseBillingAmount(body);
}

function extractPlainTextBody(
  message: ReturnType<typeof Object>,
): string | null {
  const payload = (message as any).payload;
  if (!payload) return null;

  if (payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8');
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
    }
  }

  return null;
}

function parseBillingAmount(body: string): number | null {
  const patterns = [
    /(?:ご請求予定金額|ご請求金額|請求予定金額)[：:\s]*([0-9,]+)\s*円/,
    /([0-9,]+)\s*円/,
  ];

  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (match) {
      return parseInt(match[1].replace(/,/g, ''), 10);
    }
  }

  return null;
}
