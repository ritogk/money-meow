import { fetchLatestBillingAmount } from './gmail';
import { buildMessage } from './calculator';
import { sendLineMessage } from './line';

async function main() {
  const gasCreds = {
    url: process.env.GAS_URL!,
    apiKey: process.env.GAS_API_KEY!,
  };

  const lineCreds = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
    userId: process.env.LINE_USER_ID!,
  };

  console.log('Fetching latest billing from GAS...');
  const billingAmount = await fetchLatestBillingAmount(gasCreds);

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
