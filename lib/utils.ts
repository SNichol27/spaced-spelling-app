export const calculateReviewWeeks = (
  introductionWeek: number,
  scheduleType: string
): number[] => {
  const reviews: number[] = [];

  if (scheduleType === 'fixed8') {
    let currentWeek = introductionWeek + 8;

    while (currentWeek <= 52) {
      reviews.push(currentWeek);
      currentWeek += 8;
    }

    return reviews;
  }

  let currentWeek = introductionWeek + 1;
  const intervals = [1, 4, 9];
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
