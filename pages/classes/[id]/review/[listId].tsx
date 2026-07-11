import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { SpellingList } from '@/lib/types';

export default function ReviewList() {
  const router = useRouter();
  const { id: classId, listId } = router.query;
  const [spellingList, setSpellingList] = useState<SpellingList | null>(null);
  const [words, setWords] = useState<string[]>([]);
  const [selectedWorksheets, setSelectedWorksheets] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!listId) return;
    fetchSpellingList();
  }, [listId]);

  const fetchSpellingList = async () => {
    if (!listId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('spelling_lists')
      .select('*')
      .eq('id', listId)
      .single();

    if (!error && data) {
      setSpellingList(data as SpellingList);
      setWords(data.words);
    }
    setLoading(false);
  };

  const handleWordChange = (index: number, value: string) => {
    const newWords = [...words];
    newWords[index] = value;
    setWords(newWords);
  };

  const handleSaveWords = async () => {
    if (!spellingList) return;
    const { error } = await supabase
      .from('spelling_lists')
      .update({ words })
      .eq('id', spellingList.id);

    if (!error) {
      alert('Words updated successfully!');
    }
  };

  const handleGenerateWorksheets = async () => {
    if (selectedWorksheets.length === 0) {
      alert('Please select at least one worksheet type');
      return;
    }
    // TODO: Implement worksheet generation and PDF download
    alert('Worksheet generation coming soon!');
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!spellingList) {
    return <div className="text-center py-12">Spelling list not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href={`/classes/${classId}/review-schedule`} className="text-blue-600 hover:text-blue-700">
            ← Back to Schedule
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Review Spelling List</h1>

        {/* Word Editing Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Words</h2>
          <div className="space-y-4 mb-6">
            {words.map((word, index) => (
              <div key={index}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Word {index + 1}
                </label>
                <input
                  type="text"
                  value={word}
                  onChange={(e) => handleWordChange(index, e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleSaveWords}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
          >
            Save Changes
          </button>
        </div>

        {/* Worksheet Selection */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Generate Worksheets</h2>
          
          <div className="space-y-4 mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedWorksheets.includes('spelling-select')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedWorksheets([...selectedWorksheets, 'spelling-select']);
                  } else {
                    setSelectedWorksheets(selectedWorksheets.filter((w) => w !== 'spelling-select'));
                  }
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-3 text-gray-700">
                Select Correct Spelling (multiple choice)
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedWorksheets.includes('definitions')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedWorksheets([...selectedWorksheets, 'definitions']);
                  } else {
                    setSelectedWorksheets(selectedWorksheets.filter((w) => w !== 'definitions'));
                  }
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-3 text-gray-700">Match Words to Definitions</span>
            </label>
          </div>

          <button
            onClick={handleGenerateWorksheets}
            disabled={selectedWorksheets.length === 0}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium"
          >
            Generate & Download PDFs
          </button>
        </div>
      </main>
    </div>
  );
}
