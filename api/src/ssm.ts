import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const ssm = new SSMClient({});
const cache = new Map<string, string>();

async function getParameter(name: string): Promise<string> {
  const cached = cache.get(name);
  if (cached) return cached;

  const res = await ssm.send(
    new GetParameterCommand({ Name: name, WithDecryption: true }),
  );

  const value = res.Parameter?.Value;
  if (!value) throw new Error(`SSM parameter not found: ${name}`);

  cache.set(name, value);
  return value;
}

const PREFIX = '/money-meow';

export async function getGmailCredentials() {
  const [clientId, clientSecret, refreshToken] = await Promise.all([
    getParameter(`${PREFIX}/google-client-id`),
    getParameter(`${PREFIX}/google-client-secret`),
    getParameter(`${PREFIX}/google-refresh-token`),
  ]);
  return { clientId, clientSecret, refreshToken };
}

export async function getLineCredentials() {
  const [channelAccessToken, userId] = await Promise.all([
    getParameter(`${PREFIX}/line-channel-access-token`),
    getParameter(`${PREFIX}/line-user-id`),
  ]);
  return { channelAccessToken, userId };
}
