interface LineCredentials {
  channelAccessToken: string;
  userId: string;
}

export async function sendLineMessage(
  credentials: LineCredentials,
  message: string,
): Promise<void> {
  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${credentials.channelAccessToken}`,
    },
    body: JSON.stringify({
      to: credentials.userId,
      messages: [{ type: 'text', text: message }],
    }),
  });

  if (!res.ok) {
    throw new Error(`LINE API error: ${res.status} ${await res.text()}`);
  }
}
