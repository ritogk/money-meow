function doGet(
  e: GoogleAppsScript.Events.DoGet,
): GoogleAppsScript.Content.TextOutput {
  const props = PropertiesService.getScriptProperties();
  const apiKey = props.getProperty('API_KEY');

  if (e.parameter.key !== apiKey) {
    return jsonResponse({ error: 'unauthorized' });
  }

  const action = e.parameter.action || 'latest';

  if (action === 'latest') {
    return jsonResponse(getLatestBilling());
  }

  if (action === 'history') {
    const months = Number(e.parameter.months) || 6;
    return jsonResponse(getBillingHistory(months));
  }

  return jsonResponse({ error: 'unknown action' });
}

function getLatestBilling(): {
  billingAmount: number | null;
  date: string | null;
  subject: string | null;
} {
  const threads = GmailApp.search(
    'subject:"の請求予定金額のお知らせ" newer_than:10d',
    0,
    1,
  );
  if (threads.length === 0) {
    return { billingAmount: null, date: null, subject: null };
  }

  const messages = threads[0].getMessages();
  const message = messages[messages.length - 1];
  const body = message.getPlainBody();

  return {
    billingAmount: parseBillingAmount(body),
    date: message.getDate().toISOString(),
    subject: message.getSubject(),
  };
}

function getBillingHistory(
  months: number,
): { billingAmount: number | null; date: string; subject: string }[] {
  const threads = GmailApp.search(
    `subject:"の請求予定金額のお知らせ" newer_than:${months * 30}d`,
    0,
    50,
  );

  return threads.map((thread) => {
    const messages = thread.getMessages();
    const message = messages[messages.length - 1];
    const body = message.getPlainBody();
    return {
      billingAmount: parseBillingAmount(body),
      date: message.getDate().toISOString(),
      subject: message.getSubject(),
    };
  });
}

function parseBillingAmount(body: string): number | null {
  const patterns = [
    /(?:ご請求予定金額|ご請求金額|請求予定金額)[：:\s]*([0-9,]+)\s*円/,
    /([0-9,]+)\s*円/,
  ];

  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (match) {
      return parseInt(match[1].replace(/,/g, ''), 10);
    }
  }

  return null;
}

function jsonResponse(
  data: object,
): GoogleAppsScript.Content.TextOutput {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function setupApiKey(): void {
  const key = Utilities.getUuid();
  PropertiesService.getScriptProperties().setProperty('API_KEY', key);
  Logger.log(`API Key: ${key}`);
}
