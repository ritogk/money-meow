import { fetchLatestBillingAmount } from './gmail';
import { buildMessage } from './calculator';
import { sendLineMessage } from './line';

async function main() {
  const gmailCreds = {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN!,
  };

  const lineCreds = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
    userId: process.env.LINE_USER_ID!,
  };

  console.log('Fetching latest billing email...');
  const billingAmount = await fetchLatestBillingAmount(gmailCreds);

  if (billingAmount === null) {
    console.log('No billing email found.');
    await sendLineMessage(
      lineCreds,
      'PayPayカードの確定メールが見つかりませんでした。Gmailを確認してください。',
    );
    return;
  }

  console.log(`Billing amount: ¥${billingAmount.toLocaleString()}`);
  const message = buildMessage(billingAmount);
  console.log('Sending LINE message...');
  await sendLineMessage(lineCreds, message);
  console.log('Done!');
}

main().catch(console.error);
