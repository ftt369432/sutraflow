import type { EmailAnalytics, EmailMessage } from '../../types';

function calculateResponseTime(email: EmailMessage, response: EmailMessage): number {
  return Math.round((response.date.getTime() - email.date.getTime()) / (1000 * 60 * 60));
}

function groupByHour(emails: EmailMessage[]): Array<{ hour: number; count: number }> {
  const hourCounts = new Array(24).fill(0);
  emails.forEach(email => {
    const hour = new Date(email.date).getHours();
    hourCounts[hour]++;
  });
  return hourCounts.map((count, hour) => ({ hour, count }));
}

function getTopRecipients(emails: EmailMessage[]): Array<{ email: string; count: number }> {
  const counts = emails.reduce((acc, email) => {
    email.to.forEach(recipient => {
      acc[recipient] = (acc[recipient] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(counts)
    .map(([email, count]) => ({ email, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

export function generateEmailAnalytics(emails: EmailMessage[]): EmailAnalytics {
  const sentEmails = emails.filter(email => email.labels.includes('sent'));
  const receivedEmails = emails.filter(email => email.labels.includes('inbox'));
  
  const responseThreads = new Map<string, { sent: EmailMessage; received?: EmailMessage }>();
  
  // Group emails by thread
  sentEmails.forEach(email => {
    const threadKey = email.subject.toLowerCase().replace(/^re:\s*/g, '');
    responseThreads.set(threadKey, { sent: email });
  });

  receivedEmails.forEach(email => {
    const threadKey = email.subject.toLowerCase().replace(/^re:\s*/g, '');
    const thread = responseThreads.get(threadKey);
    if (thread && email.date > thread.sent.date) {
      thread.received = email;
    }
  });

  const responseTimes = Array.from(responseThreads.values())
    .filter(thread => thread.received)
    .map(thread => calculateResponseTime(thread.sent, thread.received!));

  return {
    totalSent: sentEmails.length,
    totalReceived: receivedEmails.length,
    responseRate: responseTimes.length / (sentEmails.length || 1),
    averageResponseTime: responseTimes.length 
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0,
    topSenders: [],
    topRecipients: getTopRecipients(sentEmails),
    busyHours: groupByHour(sentEmails),
    emailsByDay: [] // TODO: Implement day-based analytics
  };
} 