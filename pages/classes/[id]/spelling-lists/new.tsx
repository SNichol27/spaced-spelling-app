import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { calculateReviewWeeks } from '@/lib/utils';
import type { Class } from '@/lib/types';

export default function NewSpellingList() {
  const router = useRouter();
  const { id: classId } = router.query;
  const [classData, setClassData] = useState<Class | null>(null);
  const [words, setWords] = useState('');
  const [week, setWeek] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingClass, setFetchingClass] = useState(true);

  useEffect(() => {
    if (!classId) return;
    fetchClass();
  }, [classId]);

  const fetchClass = async () => {
    if (!classId) return;
    setFetchingClass(true);
    const { data, error: err } = await supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .single();

    if (!err && data) {
      setClassData(data as Class);
    }
    setFetchingClass(false);
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!classData || !words.trim()) {
      setError('Please enter some words');
      return;
    }

    const wordList = words
      .split('\n')
      .map((w) => w.trim())
      .filter((w) => w.length > 0)
      .slice(0, 20);

    if (wordList.length === 0) {
      setError('Please enter at least one word');
      return;
    }

    setLoading(true);

    // Create the spelling list
    const { data: listData, error: listError } = await supabase
      .from('spelling_lists')
      .insert([
        {
          class_id: classId,
          words: wordList,
          week_introduced: week,
        },
      ])
      .select()
      .single();

    if (listError) {
      setError(listError.message);
      setLoading(false);
      return;
    }

    // Create review schedule entries
    const reviewWeeks = calculateReviewWeeks(week);
    const reviewEntries = reviewWeeks
      .filter((w) => w <= classData.weeks)
      .map((reviewWeek) => ({
        spelling_list_id: listData.id,
        review_week: reviewWeek,
        status: 'pending',
      }));

    if (reviewEntries.length > 0) {
      const { error: scheduleError } = await supabase
        .from('review_schedules')
        .insert(reviewEntries);

      if (scheduleError) {
        setError(scheduleError.message);
        setLoading(false);
        return;
      }
    }

    router.push(`/classes/${classId}`);
    setLoading(false);
  };

  if (fetchingClass) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!classData) {
    return <div className="text-center py-12">Class not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Create Spelling List</h1>
        <p className="text-gray-600 mb-8">Class: {classData.name}</p>

        <form onSubmit={handleCreateList} className="space-y-6">
          <div>
            <label htmlFor="words" className="block text-sm font-medium text-gray-700 mb-2">
              Spelling Words (one per line, max 20)
            </label>
            <textarea
              id="words"
              value={words}
              onChange={(e) => setWords(e.target.value)}
              placeholder="Enter each word on a new line..."
              rows={10}
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-2 text-xs text-gray-500">
              Words entered: {words.split('\n').filter((w) => w.trim().length > 0).length} / 20
            </p>
          </div>

          <div>
            <label htmlFor="week" className="block text-sm font-medium text-gray-700">
              Week of Academic Year
            </label>
            <input
              id="week"
              type="number"
              value={week}
              onChange={(e) => setWeek(parseInt(e.target.value))}
              min="1"
              max={classData.weeks}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Creating...' : 'Create Spelling List'}
            </button>
            <Link
              href={`/classes/${classId}`}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
