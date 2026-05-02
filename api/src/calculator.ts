import { CONFIG } from './config';

export function calculateAvailableMoney(billingAmount: number): number {
  return (
    billingAmount -
    CONFIG.TRANSPORTATION_COST +
    CONFIG.YUCHO_AMOUNT +
    CONFIG.RAKUTEN_AMOUNT
  );
}

export function formatYen(amount: number): string {
  return `¥${amount.toLocaleString()}`;
}

export function buildMessage(billingAmount: number): string {
  const available = calculateAvailableMoney(billingAmount);

  return [
    '【今月使えるお金】',
    '',
    `クレカ確定金額: ${formatYen(billingAmount)}`,
    `交通費: -${formatYen(CONFIG.TRANSPORTATION_COST)}`,
    `ゆうちょ: +${formatYen(CONFIG.YUCHO_AMOUNT)}`,
    `楽天カード: +${formatYen(CONFIG.RAKUTEN_AMOUNT)}`,
    '―――――――――――',
    `今月使えるお金: ${formatYen(available)}`,
  ].join('\n');
}
