import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { SpellingList } from '@/lib/types';
import jsPDF from 'jspdf';

// Simple child-friendly definitions database
const childFriendlyDefinitions: { [key: string]: string } = {
  'red': 'A bright color like a stop sign or an apple.',
  'dog': 'A furry animal that barks and likes to play fetch.',
  'cat': 'A furry animal with whiskers that says meow.',
  'money': 'Paper or coins that you use to buy things.',
  'happy': 'Feeling joy and smiling.',
  'sad': 'Feeling unhappy or wanting to cry.',
  'big': 'Very large or taking up a lot of space.',
  'small': 'Tiny or not very big.',
  'fast': 'Moving very quickly.',
  'slow': 'Moving without rushing.',
  'hot': 'Having a high temperature, like fire.',
  'cold': 'Having a low temperature, like ice.',
  'run': 'To move your legs quickly.',
  'jump': 'To push your body up in the air.',
  'walk': 'To move forward by putting one foot in front of the other.',
  'eat': 'To put food in your mouth and chew it.',
  'sleep': 'To rest with your eyes closed.',
  'play': 'To have fun and do enjoyable activities.',
  'read': 'To look at words and understand them.',
  'write': 'To make letters and words on paper or a screen.',
  'book': 'Pages with words and pictures that you read.',
  'school': 'A place where children learn.',
  'friend': 'Someone you like and enjoy spending time with.',
  'family': 'Your parents, brothers, sisters, and relatives.',
  'house': 'A building where people live.',
  'tree': 'A tall plant with a brown trunk and green leaves.',
  'flower': 'A colorful plant with soft petals.',
  'sun': 'The bright star in the sky during the day.',
  'moon': 'The bright object in the sky at night.',
  'star': 'A tiny bright light in the night sky.',
  'water': 'A clear liquid that you drink and swim in.',
  'fire': 'Hot flames that give light and warmth.',
  'rain': 'Water falling from the clouds.',
  'snow': 'Cold white flakes that fall from the sky in winter.',
  'wind': 'Moving air that you can feel.',
  'apple': 'A round red or green fruit that is sweet.',
  'banana': 'A yellow fruit that is soft inside.',
  'orange': 'A round orange fruit that is juicy and sweet.',
  'bird': 'An animal with feathers and wings that can fly.',
  'fish': 'An animal that lives in water.',
  'horse': 'A large animal with four legs that people can ride.',
  'cow': 'A large farm animal that gives milk.',
  'pig': 'A farm animal with a pink nose and curly tail.',
  'chicken': 'A bird that lays eggs and goes cluck cluck.',
  'teacher': 'A person who helps children learn in school.',
  'doctor': 'A person who helps sick people feel better.',
  'parent': 'A mother or father.',
  'baby': 'A very young child.',
  'color': 'Something like red, blue, yellow, or green.',
  'number': 'A symbol like 1, 2, 3, or 10.',
  'letter': 'A symbol used to make words, like A, B, or C.',
  'word': 'A group of letters that means something.',
  'picture': 'An image or drawing of something.',
  'toy': 'Something fun to play with.',
  'ball': 'A round object that you can bounce or throw.',
  'car': 'A vehicle with four wheels that people drive.',
  'bike': 'A two-wheeled vehicle that you ride.',
  'door': 'An entrance to a room or building.',
  'window': 'An opening to see outside.',
  'table': 'Furniture where you eat or work.',
  'chair': 'Furniture where you sit.',
  'bed': 'Furniture where you sleep.',
  'cup': 'A container for drinking.',
  'plate': 'A flat dish for food.',
  'spoon': 'An utensil for eating soup.',
  'fork': 'An utensil with prongs for eating.',
  'knife': 'A tool with a sharp blade for cutting.',
  'hand': 'The part of your body at the end of your arm.',
  'foot': 'The part of your body at the end of your leg.',
  'head': 'The part of your body above your neck.',
  'nose': 'The part of your face that smells.',
  'eye': 'The part of your face that sees.',
  'ear': 'The part of your head that hears.',
  'mouth': 'The part of your face where you eat and talk.',
  'tooth': 'A hard white thing in your mouth for chewing.',
  'hair': 'The strands on top of your head.',
  'skin': 'The outer covering of your body.',
  'heart': 'The part inside your body that pumps blood.',
  'brain': 'The part inside your head that thinks.',
  'good': 'Nice or doing the right thing.',
  'bad': 'Not nice or doing the wrong thing.',
  'nice': 'Pleasant and kind.',
  'mean': 'Unkind or hurtful.',
  'brave': 'Not being afraid to do something hard.',
  'shy': 'Being quiet and not wanting to talk to people.',
  'smart': 'Able to learn things easily.',
  'strong': 'Having a lot of power or muscles.',
  'weak': 'Not having much strength.',
  'loud': 'Making a lot of noise.',
  'quiet': 'Not making much noise.',
  'clean': 'Not dirty or messy.',
  'dirty': 'Not clean or covered in dirt.',
  'wet': 'Covered in water.',
  'dry': 'Not wet.',
  'new': 'Just made or never used before.',
  'old': 'Not new or very aged.',
  'heavy': 'Weighing a lot.',
  'light': 'Not weighing much.',
};

export default function ReviewList() {
  const router = useRouter();
  const { id: classId, listId } = router.query;
  const [spellingList, setSpellingList] = useState<SpellingList | null>(null);
  const [words, setWords] = useState<string[]>([]);
  const [selectedWorksheets, setSelectedWorksheets] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

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

  // Get child-friendly definition
  const getDefinition = (word: string): string => {
    const lowerWord = word.toLowerCase().trim();
    return childFriendlyDefinitions[lowerWord] || `${word} is a word we use to describe or name something.`;
  };

  // Generate PDF for Match Words to Definitions worksheet
  const generateDefinitionsWorksheet = () => {
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
    words.forEach((word) => {
      if (word.trim()) {
        definitions[word] = getDefinition(word);
      }
    });

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
    pdf.text('Circle the correct spelling of each word:', 20, yPosition);
    yPosition += 10;

    // Generate questions for each word
    words.forEach((word, index) => {
      if (word.trim()) {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }

        // Create misspelled versions
        const misspellings = generateMisspellings(word);
        const allOptions = [word, ...misspellings].sort(() => Math.random() - 0.5);

        pdf.setFontSize(11);
        pdf.text(`${index + 1}. ${allOptions.join('   /   ')}`, 20, yPosition);
        yPosition += 10;
      }
    });

    pdf.save('select-spelling-worksheet.pdf');
  };

  // Helper function to generate common misspellings
  const generateMisspellings = (word: string): string[] => {
    const misspellings = [];
    
    // Common misspelling: swap two letters
    if (word.length > 2) {
      const randomIndex = Math.floor(Math.random() * (word.length - 1));
      misspellings.push(
        word.slice(0, randomIndex) +
        word[randomIndex + 1] +
        word[randomIndex] +
        word.slice(randomIndex + 2)
      );
    }

    // Common misspelling: double a letter
    const randomIndex2 = Math.floor(Math.random() * word.length);
    misspellings.push(
      word.slice(0, randomIndex2) +
      word[randomIndex2] +
      word.slice(randomIndex2)
    );

    // Common misspelling: remove a letter
    if (word.length > 2) {
      const randomIndex3 = Math.floor(Math.random() * word.length);
      misspellings.push(
        word.slice(0, randomIndex3) +
        word.slice(randomIndex3 + 1)
      );
    }

    return misspellings;
  };

  const handleGenerateWorksheets = async () => {
    if (selectedWorksheets.length === 0) {
      alert('Please select at least one worksheet type');
      return;
    }

    try {
      setGenerating(true);
      if (selectedWorksheets.includes('definitions')) {
        generateDefinitionsWorksheet();
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
