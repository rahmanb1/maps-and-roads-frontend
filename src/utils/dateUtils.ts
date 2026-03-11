export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);

    if (minutes < 1) return 'Az əvvəl';
    if (minutes < 60) return `${minutes} dəqiqə əvvəl`;
    if (hours < 24) return `${hours} saat əvvəl`;
    if (days < 7) return `${days} gün əvvəl`;
    if (weeks < 4) return `${weeks} həftə əvvəl`;
    if (months < 12) return `${months} ay əvvəl`;

    return date.toLocaleDateString('az-AZ', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
};