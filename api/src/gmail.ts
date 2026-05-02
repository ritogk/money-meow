interface GasCredentials {
  url: string;
  apiKey: string;
}

interface GasResponse {
  billingAmount: number | null;
  date: string | null;
  subject: string | null;
  error?: string;
}

export async function fetchLatestBillingAmount(
  credentials: GasCredentials,
): Promise<number | null> {
  const url = `${credentials.url}?key=${credentials.apiKey}&action=latest`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`GAS API error: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as GasResponse;

  if (data.error) {
    throw new Error(`GAS API returned error: ${data.error}`);
  }

  return data.billingAmount;
}
