import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { SpellingList } from '@/lib/types';
import jsPDF from 'jspdf';

export default function ReviewList() {
  const router = useRouter();
  const { id: classId, listId } = router.query;
  const [spellingList, setSpellingList] = useState<SpellingList | null>(null);
  const [words, setWords] = useState<string[]>([]);
  const [selectedWorksheets, setSelectedWorksheets] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [definitionsCache, setDefinitionsCache] = useState<{ [key: string]: string }>({});

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

  // Get definition from database or generate with OpenAI
  const getDefinition = async (word: string): Promise<string> => {
    const lowerWord = word.toLowerCase().trim();

    // Check cache first
    if (definitionsCache[lowerWord]) {
      return definitionsCache[lowerWord];
    }

    // Check Supabase database
    const { data, error } = await supabase
      .from('word_definitions')
      .select('definition')
      .eq('word', lowerWord)
      .single();

    if (!error && data) {
      // Found in database, cache it
      setDefinitionsCache((prev) => ({
        ...prev,
        [lowerWord]: data.definition,
      }));
      return data.definition;
    }

    // Not in database, generate with OpenAI
    try {
      const response = await fetch('/api/generate-definition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word }),
      });

      if (response.ok) {
        const { definition } = await response.json();

        // Save to database for next time
        await supabase.from('word_definitions').insert({
          word: lowerWord,
          definition,
        });

        // Cache it
        setDefinitionsCache((prev) => ({
          ...prev,
          [lowerWord]: definition,
        }));

        return definition;
      }
    } catch (error) {
      console.error(`Error generating definition for ${word}:`, error);
    }

    return `${word} is a word we use to describe or name something.`;
  };

  // Generate PDF for Match Words to Definitions worksheet
  const generateDefinitionsWorksheet = async () => {
    const pdf = new jsPDF();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPosition = 20;

    // Title
    pdf.setFontSize(18);
    pdf.text('Match Words to Definitions', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    pdf.setFontSize(11);
    pdf.text('Name: ______________________     Date: ________________', 20, yPosition);
    yPosition += 15;

    // Get definitions for all words
    const definitions: { [key: string]: string } = {};
    for (const word of words) {
      if (word.trim()) {
        const definition = await getDefinition(word);
        definitions[word] = definition;
      }
    }

    // Create shuffled list of definitions for matching
    const shuffledDefinitions = [...Object.values(definitions)].sort(() => Math.random() - 0.5);

    // Left side - Words
    pdf.setFontSize(12);
    pdf.text('Words:', 20, yPosition);
    yPosition += 8;

    words.forEach((word, index) => {
      if (word.trim()) {
        pdf.setFontSize(11);
        pdf.text(`${index + 1}. ${word}`, 25, yPosition);
        yPosition += 7;
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
      }
    });

    yPosition += 5;

    // Right side - Definitions
    pdf.setFontSize(12);
    pdf.text('Definitions:', 20, yPosition);
    yPosition += 8;

    shuffledDefinitions.forEach((definition, index) => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.setFontSize(9);
      const letterCode = String.fromCharCode(65 + index); // A, B, C, D...
      const wrappedText = pdf.splitTextToSize(`${letterCode}. ${definition}`, 100);
      pdf.text(wrappedText, 25, yPosition);
      yPosition += wrappedText.length * 3.5 + 5;
    });

    pdf.save('matching-definitions-worksheet.pdf');
  };

  // Generate PDF for Select Correct Spelling worksheet
  const generateSpellingSelectWorksheet = () => {
    const pdf = new jsPDF();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPosition = 20;

    // Title
    pdf.setFontSize(18);
    pdf.text('Select Correct Spelling', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    pdf.setFontSize(11);
    pdf.text('Name: ______________________     Date: ________________', 20, yPosition);
    yPosition += 15;

    // Instructions
    pdf.setFontSize(10);
    pdf.text('Circle the correct spelling and write it on the line:', 20, yPosition);
    yPosition += 10;

    // Generate questions for each word
    words.forEach((word, index) => {
      if (word.trim()) {
        if (yPosition > pageHeight - 15) {
          pdf.addPage();
          yPosition = 20;
        }

        // Create misspelled versions
        const misspellings = generatePhoneticMisspellings(word);
        const allOptions = [word, ...misspellings].sort(() => Math.random() - 0.5);

        pdf.setFontSize(11);
        // Format options with line breaks if needed
        const optionsText = allOptions.join('     ');
        const wrappedOptions = pdf.splitTextToSize(optionsText, 160);
        
        pdf.text(`${index + 1}.`, 20, yPosition);
        pdf.text(wrappedOptions, 25, yPosition + 5);
        
        yPosition += wrappedOptions.length * 5 + 8;

        // Add line for writing the correct spelling
        pdf.setFontSize(10);
        pdf.text('Write the correct spelling: _______________________________', 20, yPosition);
        yPosition += 10;
      }
    });

    pdf.save('select-spelling-worksheet.pdf');
  };

  // Helper function to generate phonologically plausible misspellings
  const generatePhoneticMisspellings = (word: string): string[] => {
    const misspellings = new Set<string>();
    const lowerWord = word.toLowerCase();

    // Vowel substitutions (phonetically similar sounds)
    const vowelMap: { [key: string]: string[] } = {
      a: ['ay', 'ae', 'ai'],
      e: ['ea', 'ee', 'ie'],
      i: ['ie', 'y', 'igh'],
      o: ['oa', 'oe', 'ow'],
      u: ['oo', 'ou', 'ew'],
    };

    // Generate vowel-based misspellings
    for (let i = 0; i < lowerWord.length; i++) {
      const char = lowerWord[i].toLowerCase();
      if (vowelMap[char] && Math.random() > 0.5) {
        const alternatives = vowelMap[char];
        const randomAlt = alternatives[Math.floor(Math.random() * alternatives.length)];
        const newWord = lowerWord.slice(0, i) + randomAlt + lowerWord.slice(i + 1);
        misspellings.add(newWord);
      }
    }

    // Consonant substitutions (phonetically similar sounds)
    const consonantMap: { [key: string]: string[] } = {
      c: ['k', 'ck', 'ch'],
      k: ['c', 'ck'],
      s: ['z', 'ss', 'c'],
      z: ['s', 'ss'],
      f: ['ph', 'ff', 'v'],
      v: ['f', 'ph'],
      j: ['g', 'dge'],
      g: ['j', 'dge'],
      ch: ['tch'],
      sh: ['ch'],
      th: ['f'],
      ph: ['f', 'v'],
      ck: ['c', 'k'],
    };

    // Generate consonant-based misspellings
    for (const [key, alts] of Object.entries(consonantMap)) {
      if (lowerWord.includes(key) && Math.random() > 0.5) {
        const idx = lowerWord.indexOf(key);
        const randomAlt = alts[Math.floor(Math.random() * alts.length)];
        const newWord = lowerWord.slice(0, idx) + randomAlt + lowerWord.slice(idx + key.length);
        misspellings.add(newWord);
      }
    }

    // Common phonetic patterns (silent letters, doubled letters, etc.)
    const phoneticPatterns: { [key: string]: string[] } = {
      // Silent letters
      'night': ['nite', 'nght'],
      'write': ['rite', 'writ'],
      'know': ['no', 'noe'],
      // Doubled consonants
      'double': 'dubble',
      'letter': 'leter',
    };

    // Silent letter handling
    if (lowerWord.includes('gh')) {
      misspellings.add(lowerWord.replace('gh', 'h'));
    }
    if (lowerWord.includes('ght')) {
      misspellings.add(lowerWord.replace('ght', 't'));
    }
    if (lowerWord.includes('kn')) {
      misspellings.add(lowerWord.replace('kn', 'n'));
    }
    if (lowerWord.includes('wr')) {
      misspellings.add(lowerWord.replace('wr', 'r'));
    }

    // Double consonants for short vowels
    for (let i = 1; i < lowerWord.length - 1; i++) {
      if ('aeiou'.includes(lowerWord[i]) && 'bcdfghjklmnpqrstvwxyz'.includes(lowerWord[i + 1])) {
        if (Math.random() > 0.7) {
          misspellings.add(
            lowerWord.slice(0, i + 1) + lowerWord[i + 1] + lowerWord.slice(i + 1)
          );
        }
      }
    }

    // Convert Set to Array and limit to 3 misspellings
    let misspellingArray = Array.from(misspellings)
      .filter((m) => m !== lowerWord && m.length > 0)
      .slice(0, 3);

    // If we don't have enough phonetically plausible ones, generate more
    while (misspellingArray.length < 3) {
      // Common spelling pattern errors
      const patternErrors = [
        lowerWord.replace(/ing$/, 'in'),
        lowerWord.replace(/ed$/, 'ed'),
        lowerWord.replace(/ly$/, 'le'),
        lowerWord.replace(/tion$/, 'shun'),
        lowerWord.replace(/sion$/, 'shun'),
      ];

      for (const error of patternErrors) {
        if (error !== lowerWord && !misspellingArray.includes(error) && error.length > 0) {
          misspellingArray.push(error);
          if (misspellingArray.length >= 3) break;
        }
      }

      // If still not enough, add vowel swaps
      if (misspellingArray.length < 3) {
        const vowels = 'aeiou';
        const randomPos = Math.floor(Math.random() * lowerWord.length);
        if ('aeiou'.includes(lowerWord[randomPos])) {
          const randomVowel = vowels[Math.floor(Math.random() * vowels.length)];
          const newWord = lowerWord.slice(0, randomPos) + randomVowel + lowerWord.slice(randomPos + 1);
          if (newWord !== lowerWord && !misspellingArray.includes(newWord)) {
            misspellingArray.push(newWord);
          }
        }
      }

      break;
    }

    return misspellingArray.slice(0, 3);
  };

  const handleGenerateWorksheets = async () => {
    if (selectedWorksheets.length === 0) {
      alert('Please select at least one worksheet type');
      return;
    }

    try {
      setGenerating(true);
      if (selectedWorksheets.includes('definitions')) {
        await generateDefinitionsWorksheet();
      }
      if (selectedWorksheets.includes('spelling-select')) {
        generateSpellingSelectWorksheet();
      }
      alert('Worksheets generated and downloaded successfully!');
      setGenerating(false);
    } catch (error) {
      console.error('Error generating worksheets:', error);
      alert('Error generating worksheets. Please try again.');
      setGenerating(false);
    }
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
          <Link
            href={`/classes/${classId}/review-schedule`}
            className="text-blue-600 hover:text-blue-700"
          >
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
              <span className="ml-3 text-gray-700">Select Correct Spelling (multiple choice)</span>
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
            disabled={selectedWorksheets.length === 0 || generating}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium"
          >
            {generating ? 'Generating...' : 'Generate & Download PDFs'}
          </button>
        </div>
      </main>
    </div>
  );
}
