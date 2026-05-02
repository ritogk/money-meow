import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'node:path';

interface MoneyMeowStackProps extends cdk.StackProps {
  alertEmail: string;
}

export class MoneyMeowStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MoneyMeowStackProps) {
    super(scope, id, props);

    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: 'money-meow-alerts',
    });

    alertTopic.addSubscription(
      new subscriptions.EmailSubscription(props.alertEmail),
    );

    const fn = new nodejs.NodejsFunction(this, 'GmailFetcher', {
      functionName: 'money-meow-gmail-fetcher',
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, '../../api/src/handler.ts'),
      projectRoot: path.join(__dirname, '../../api'),
      depsLockFilePath: path.join(__dirname, '../../api/package-lock.json'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      architecture: lambda.Architecture.ARM_64,
      environment: {
        SNS_ALERT_TOPIC_ARN: alertTopic.topicArn,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        forceDockerBundling: false,
      },
    });

    alertTopic.grantPublish(fn);

    const ssmParamNames = [
      '/money-meow/google-client-id',
      '/money-meow/google-client-secret',
      '/money-meow/google-refresh-token',
      '/money-meow/line-channel-access-token',
      '/money-meow/line-user-id',
    ];

    fn.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ssm:GetParameter'],
        resources: ssmParamNames.map(
          (name) =>
            `arn:aws:ssm:${this.region}:${this.account}:parameter${name}`,
        ),
      }),
    );

    new events.Rule(this, 'MonthlySchedule', {
      ruleName: 'money-meow-monthly',
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '0',
        day: '5',
        month: '*',
        year: '*',
      }),
      targets: [new targets.LambdaFunction(fn)],
    });

    new cdk.CfnOutput(this, 'FunctionName', {
      value: fn.functionName,
    });

    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: alertTopic.topicArn,
    });
  }
}
