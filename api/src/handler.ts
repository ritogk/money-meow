import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { fetchLatestBillingAmount } from './gmail';
import { buildMessage } from './calculator';
import { sendLineMessage } from './line';
import { getGasCredentials, getLineCredentials } from './ssm';

const sns = new SNSClient({});

export async function handler(): Promise<void> {
  const snsTopicArn = process.env.SNS_ALERT_TOPIC_ARN;

  try {
    const [gasCreds, lineCreds] = await Promise.all([
      getGasCredentials(),
      getLineCredentials(),
    ]);

    const billingAmount = await fetchLatestBillingAmount(gasCreds);

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
      await sns.send(
        new PublishCommand({
          TopicArn: snsTopicArn,
          Subject: '[money-meow] Lambda実行エラー',
          Message: `エラー内容:\n${error instanceof Error ? error.message : String(error)}`,
        }),
      );
    }

    throw error;
  }
}
