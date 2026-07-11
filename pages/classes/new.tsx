import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { User } from '@/lib/types';

interface NewClassProps {
  user: User | null;
}

export default function NewClass({ user }: NewClassProps) {
  const [className, setClassName] = useState('');
  const [weeks, setWeeks] = useState(36);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user || !className.trim()) {
      setError('Class name is required');
      return;
    }

    setLoading(true);
    const { error: err } = await supabase.from('classes').insert([
      {
        user_id: user.id,
        name: className,
        weeks: weeks,
      },
    ]);

    if (err) {
      setError(err.message);
    } else {
      router.push('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Class</h1>

        <form onSubmit={handleCreateClass} className="space-y-6">
          <div>
            <label htmlFor="className" className="block text-sm font-medium text-gray-700">
              Class Name
            </label>
            <input
              id="className"
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="e.g., Year 3, Period 2"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="weeks" className="block text-sm font-medium text-gray-700">
              Number of Weeks in Academic Year
            </label>
            <input
              id="weeks"
              type="number"
              value={weeks}
              onChange={(e) => setWeeks(parseInt(e.target.value))}
              min="1"
              max="52"
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
              {loading ? 'Creating...' : 'Create Class'}
            </button>
            <Link
              href="/dashboard"
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
