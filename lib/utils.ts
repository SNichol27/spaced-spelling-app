export const calculateReviewWeeks = (introductionWeek: number): number[] => {
  const reviews: number[] = [];
  let currentWeek = introductionWeek + 1;
  const intervals = [1, 2, 4, 8];
  let intervalIndex = 0;

  while (currentWeek <= 52) {
    reviews.push(currentWeek);
    if (intervalIndex < intervals.length - 1) {
      currentWeek += intervals[intervalIndex + 1];
      intervalIndex++;
    } else {
      currentWeek += intervals[intervals.length - 1];
    }
  }

  return reviews;
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
