import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Class, SpellingList } from '@/lib/types';

interface ReviewItem {
  spelling_list_id: string;
  words: string[];
  review_week: number;
  status: string;
}

export default function ReviewSchedule() {
  const router = useRouter();
  const { id: classId } = router.query;
  const [classData, setClassData] = useState<Class | null>(null);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classId) return;
    fetchClassAndSchedule();
  }, [classId]);

  const fetchClassAndSchedule = async () => {
    if (!classId) return;
    setLoading(true);

    // Fetch class
    const { data: classRes, error: classErr } = await supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .single();

    if (!classErr && classRes) {
      setClassData(classRes as Class);
    }

    // Fetch review schedule with spelling lists
    const { data: scheduleData, error: scheduleErr } = await supabase
      .from('review_schedules')
      .select('spelling_list_id, review_week, status, spelling_lists(words)')
      .eq('spelling_lists.class_id', classId);

    if (!scheduleErr && scheduleData) {
      const items = scheduleData.map((item: any) => ({
        spelling_list_id: item.spelling_list_id,
        words: item.spelling_lists?.words || [],
        review_week: item.review_week,
        status: item.status,
      }));
      setReviewItems(items);
    }

    setLoading(false);
  };

  const currentWeekItems = reviewItems.filter((item) => item.review_week === currentWeek);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!classData) {
    return <div className="text-center py-12">Class not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href={`/classes/${classId}`} className="text-blue-600 hover:text-blue-700">
            ← Back to Class
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{classData.name}</h1>
        <p className="text-gray-600 mb-8">Review Schedule</p>

        {/* Week Navigation */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
              disabled={currentWeek === 1}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              ← Previous
            </button>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">Week {currentWeek}</p>
              <p className="text-sm text-gray-600">of {classData.weeks}</p>
            </div>
            <button
              onClick={() => setCurrentWeek(Math.min(classData.weeks, currentWeek + 1))}
              disabled={currentWeek === classData.weeks}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Current Week Reviews */}
        {currentWeekItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">No spelling lists to review this week</p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentWeekItems.map((item) => (
              <div key={item.spelling_list_id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Words to review:</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {item.words.join(', ')}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    item.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.status === 'completed' ? 'Completed' : 'Pending'}
                  </span>
                </div>
                <Link
                  href={`/classes/${classId}/review/${item.spelling_list_id}`}
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                >
                  Review
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
