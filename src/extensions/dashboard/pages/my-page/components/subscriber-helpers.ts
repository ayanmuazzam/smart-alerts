/** Deterministic avatar gradient from email. */
export function getAvatarGradient(email: string): string {
  const gradients = [
    'linear-gradient(135deg, #6366F1 0%, #3B82F6 100%)',
    'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
    'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
    'linear-gradient(135deg, #06B6D4 0%, #0284C7 100%)',
  ];
  let hash = 0;
  for (let i = 0; i < (email || '').length; i++) {
    hash = (hash + email.charCodeAt(i)) % gradients.length;
  }
  return gradients[hash] || gradients[0]!;
}

export function getInitials(email: string): string {
  if (!email) return 'U';
  const namePart = email.split('@')[0] || '';
  const clean = namePart.replace(/[^a-zA-Z]/g, '');
  if (clean.length >= 2) return clean.slice(0, 2).toUpperCase();
  if (clean.length === 1) return clean.toUpperCase();
  return 'U';
}
