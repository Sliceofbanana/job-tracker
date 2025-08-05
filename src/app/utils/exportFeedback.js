// Feedback Export Script
// Run this in your browser console on the admin page to export feedback data

export const exportFeedbackToCSV = (feedback) => {
  const headers = ['ID', 'Type', 'Title', 'Description', 'Email', 'Status', 'Timestamp', 'URL', 'User Agent'];
  
  const csvContent = [
    headers.join(','),
    ...feedback.map(item => [
      item.id,
      item.type,
      `"${item.title.replace(/"/g, '""')}"`, // Escape quotes in title
      `"${item.description.replace(/"/g, '""')}"`, // Escape quotes in description
      item.email || '',
      item.status,
      item.timestamp?.toDate?.()?.toISOString() || '',
      item.url || '',
      `"${(item.userAgent || '').replace(/"/g, '""')}"` // Escape quotes in user agent
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `feedback-export-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Usage example:
// exportFeedbackToCSV(feedbackData);
