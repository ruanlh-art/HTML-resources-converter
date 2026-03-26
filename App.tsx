import React, { useState, useCallback } from 'react';
import Button from './components/Button';
import { processHtmlContent } from './services/htmlProcessor';
import { ClipboardDocumentIcon, ArrowPathIcon, TrashIcon } from '@heroicons/react/24/outline';

function App() {
  const [inputHtml, setInputHtml] = useState<string>('');
  const [outputHtml, setOutputHtml] = useState<string>('');
  const [status, setStatus] = useState<string>('');

  const handleProcess = useCallback(() => {
    if (!inputHtml.trim()) {
      setStatus('Please enter HTML code first.');
      return;
    }

    try {
      const processed = processHtmlContent(inputHtml);
      setOutputHtml(processed);
      setStatus('Processing complete!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error(error);
      setStatus('Error processing HTML.');
    }
  }, [inputHtml]);

  const handleCopy = useCallback(() => {
    if (!outputHtml) return;
    navigator.clipboard.writeText(outputHtml);
    setStatus('Copied to clipboard!');
    setTimeout(() => setStatus(''), 2000);
  }, [outputHtml]);

  const handleClear = () => {
    setInputHtml('');
    setOutputHtml('');
    setStatus('');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-200">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-400 rounded-lg"></div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-300">
              Filmora BR HTML Cleaner
            </h1>
          </div>
          <div className="text-sm text-gray-400">
            {status && <span className="animate-pulse text-teal-400">{status}</span>}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Input Section */}
        <section className="flex-1 flex flex-col p-4 border-r border-gray-700 min-h-[50%] md:min-h-full">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm uppercase tracking-wider font-semibold text-gray-400">Original HTML</h2>
            <button 
              onClick={handleClear}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
            >
              <TrashIcon className="w-4 h-4" /> Clear
            </button>
          </div>
          <textarea
            className="flex-1 w-full bg-gray-800 border border-gray-700 rounded-lg p-4 font-mono text-sm text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none custom-scrollbar"
            placeholder="Paste raw GPT-translated HTML here..."
            value={inputHtml}
            onChange={(e) => setInputHtml(e.target.value)}
            spellCheck={false}
          />
        </section>

        {/* Controls (Middle on Desktop, Middle on Mobile) */}
        <div className="bg-gray-800 border-t border-b md:border-y-0 md:border-r border-gray-700 p-4 flex md:flex-col items-center justify-center gap-4 z-10 shadow-lg">
          <Button 
            onClick={handleProcess} 
            title="Process HTML"
            className="w-full md:w-auto flex items-center justify-center gap-2"
          >
            <ArrowPathIcon className="w-5 h-5" />
            <span className="md:hidden">Process</span>
          </Button>
        </div>

        {/* Output Section */}
        <section className="flex-1 flex flex-col p-4 min-h-[50%] md:min-h-full">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm uppercase tracking-wider font-semibold text-gray-400">Cleaned HTML</h2>
            <button 
              onClick={handleCopy}
              disabled={!outputHtml}
              className={`text-xs flex items-center gap-1 transition-colors ${!outputHtml ? 'text-gray-600 cursor-not-allowed' : 'text-teal-400 hover:text-teal-300'}`}
            >
              <ClipboardDocumentIcon className="w-4 h-4" /> Copy
            </button>
          </div>
          <textarea
            className="flex-1 w-full bg-gray-950 border border-gray-700 rounded-lg p-4 font-mono text-sm text-teal-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none custom-scrollbar"
            placeholder="Processed output will appear here..."
            value={outputHtml}
            readOnly
          />
        </section>

      </main>

      {/* Helper Styles for Scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280; 
        }
      `}</style>
    </div>
  );
}

export default App;