import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { fetchLatestBillingAmount } from './gmail';
import { buildMessage } from './calculator';
import { sendLineMessage } from './line';
import { getGmailCredentials, getLineCredentials } from './ssm';

const sns = new SNSClient({});

export async function handler(): Promise<void> {
  const snsTopicArn = process.env.SNS_ALERT_TOPIC_ARN;

  try {
    const [gmailCreds, lineCreds] = await Promise.all([
      getGmailCredentials(),
      getLineCredentials(),
    ]);

    const billingAmount = await fetchLatestBillingAmount(gmailCreds);

    if (billingAmount === null) {
      await sendLineMessage(
        lineCreds,
        'PayPayカードの確定メールが見つかりませんでした。Gmailを確認してください。',
      );
      return;
    }

    const message = buildMessage(billingAmount);
    await sendLineMessage(lineCreds, message);
  } catch (error) {
    console.error('Lambda execution failed:', error);

    if (snsTopicArn) {
      const isAuthError =
        error instanceof Error &&
        (error.message.includes('invalid_grant') ||
          error.message.includes('Token has been expired or revoked'));

      await sns.send(
        new PublishCommand({
          TopicArn: snsTopicArn,
          Subject: isAuthError
            ? '[money-meow] Googleリフレッシュトークン失効'
            : '[money-meow] Lambda実行エラー',
          Message: isAuthError
            ? 'Googleのリフレッシュトークンが失効しました。再認可が必要です。\n\n手順:\n1. npm run auth を実行\n2. ブラウザで認可を完了\n3. SSMパラメータが自動更新されます'
            : `エラー内容:\n${error instanceof Error ? error.message : String(error)}`,
        }),
      );
    }

    throw error;
  }
}
