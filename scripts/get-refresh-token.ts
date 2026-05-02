import { google } from 'googleapis';
import http from 'node:http';
import { URL } from 'node:url';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const PORT = 3000;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    'GOOGLE_CLIENT_ID と GOOGLE_CLIENT_SECRET を環境変数にセットしてください',
  );
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI,
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/gmail.readonly'],
});

console.log('\n以下のURLをブラウザで開いてください:\n');
console.log(authUrl);
console.log('\n認可が完了するとリフレッシュトークンが表示されます...\n');

const server = http.createServer(async (req, res) => {
  if (!req.url?.startsWith('/callback')) return;

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const code = url.searchParams.get('code');

  if (!code) {
    res.end('Error: no code received');
    server.close();
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(
      '<h1>認可完了！</h1><p>このページを閉じてターミナルを確認してください。</p>',
    );

    console.log('='.repeat(60));
    console.log('リフレッシュトークン取得成功！');
    console.log('='.repeat(60));
    console.log(`\nRefresh Token:\n${tokens.refresh_token}\n`);
    console.log('以下のコマンドでSSMに保存してください:\n');
    console.log(
      `aws ssm put-parameter --name "/money-meow/google-refresh-token" --type SecureString --value "${tokens.refresh_token}" --overwrite`,
    );
    console.log(
      `\naws ssm put-parameter --name "/money-meow/google-client-id" --type SecureString --value "${CLIENT_ID}" --overwrite`,
    );
    console.log(
      `\naws ssm put-parameter --name "/money-meow/google-client-secret" --type SecureString --value "${CLIENT_SECRET}" --overwrite`,
    );
    console.log();
  } catch (err) {
    res.end('Error exchanging code for tokens');
    console.error('Token exchange failed:', err);
  }

  server.close();
});

server.listen(PORT, () => {
  console.log(`Callback server listening on port ${PORT}`);
});
