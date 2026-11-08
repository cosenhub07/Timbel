export const isUniversityEmail = (email) => {
  if (!email) return false;
  const lowerEmail = email.toLowerCase();
  return lowerEmail.endsWith('.ac.in') || 
         lowerEmail.endsWith('.edu') || 
         lowerEmail.endsWith('.edu.in');
};

export const matchesCampusDomain = (email, emailDomains) => {
  if (!email || !emailDomains || !Array.isArray(emailDomains)) return false;
  const lowerEmail = email.toLowerCase();
  return emailDomains.some(domain => lowerEmail.endsWith('@' + domain.toLowerCase()));
};

