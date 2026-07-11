import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Class } from '@/lib/types';

export default function ClassDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [classData, setClassData] = useState<Class | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchClass();
  }, [id]);

  const fetchClass = async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      setClassData(data as Class);
    }
    setLoading(false);
  };

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
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{classData.name}</h1>
          <p className="text-gray-600">{classData.weeks} weeks</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Spelling List</h2>
            <p className="text-gray-600 mb-6">
              Add a new spelling list for your class. You can add up to 20 words.
            </p>
            <Link
              href={`/classes/${classData.id}/spelling-lists/new`}
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Create New List
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Review Schedule</h2>
            <p className="text-gray-600 mb-6">
              View and manage your spelling list review schedule across all weeks.
            </p>
            <Link
              href={`/classes/${classData.id}/review-schedule`}
              className="inline-block px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
            >
              View Schedule
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
