#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { MoneyMeowStack } from '../lib/money-meow-stack';

const app = new cdk.App();

new MoneyMeowStack(app, 'MoneyMeowStack', {
  alertEmail: 'homing0321r4cfw@gmail.com',
  env: {
    region: 'ap-northeast-1',
  },
});
