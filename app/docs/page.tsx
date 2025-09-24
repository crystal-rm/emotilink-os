'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  Search, 
  Filter,
  Calendar,
  ArrowLeft,
  Brain
} from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { downloadPDF, PDFOptions } from '../../lib/pdfGenerator';

interface Document {
  name: string;
  filename: string;
  path: string;
  size: number;
  lastModified: string;
  type: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch('/api/documents');
        const data = await response.json();
        
        if (response.ok) {
          setDocuments(data.documents);
          setFilteredDocs(data.documents);
        } else {
          // Fallback to empty array if API fails
          setDocuments([]);
          setFilteredDocs([]);
        }
      } catch {
        setDocuments([]);
        setFilteredDocs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  useEffect(() => {
    const filtered = documents.filter(doc =>
      doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDocs(filtered);
  }, [searchTerm, documents]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleViewDocument = (doc: Document) => {
    setSelectedDoc(doc);
  };

  const handleDownloadDocument = async (doc: Document) => {
    try {
      // Fetch document content
      const response = await fetch(`/api/documents/${doc.filename}`);
      const data = await response.json();
      
      if (response.ok) {
        const pdfOptions: PDFOptions = {
          title: doc.name,
          author: 'EmotiLink OS',
          subject: 'Documentation',
          keywords: 'documentation, emotilink, blockchain, oracle'
        };
        
        await downloadPDF(data.content, doc.name, pdfOptions);
      } else {
        alert('Failed to load document for PDF generation.');
      }
    } catch {
      alert('Failed to generate PDF. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-effect">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                <ArrowLeft className="h-6 w-6 text-gray-300" />
                <span className="text-gray-300">Back to Home</span>
              </Link>
              <div className="flex items-center space-x-2">
                <Brain className="h-8 w-8 text-primary-400" />
                <span className="text-xl font-bold gradient-text">EmotiLink OS</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <FileText className="h-6 w-6 text-primary-400" />
              <span className="text-lg font-semibold">Documentation</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Documentation</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl">
              Comprehensive documentation for EmotiLink OS including API guides, 
              architecture overview, and implementation details.
            </p>
          </div>

          {/* Search and Filter */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white hover:bg-gray-700/50 transition-colors flex items-center space-x-2">
                  <Filter className="h-5 w-5" />
                  <span>Filter</span>
                </button>
              </div>
            </div>
          </div>

          {/* Documents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocs.map((doc, index) => (
              <div key={index} className="card group hover:scale-105 transition-transform duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary-600/20 rounded-lg">
                      <FileText className="h-6 w-6 text-primary-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">{doc.name}</h3>
                      <p className="text-sm text-gray-400 capitalize">{doc.type}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-sm text-gray-400">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Modified: {doc.lastModified}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <span>Size: {formatFileSize(doc.size)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewDocument(doc)}
                    className="flex-1 btn-primary flex items-center justify-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => handleDownloadDocument(doc)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors flex items-center space-x-2"
                    title="Download as PDF"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredDocs.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No documents found</h3>
              <p className="text-gray-500">Try adjusting your search terms</p>
            </div>
          )}
        </div>
      </div>

      {/* Document Viewer Modal */}
      {selectedDoc && (
        <DocumentViewer
          document={selectedDoc}
          onClose={() => setSelectedDoc(null)}
        />
      )}
    </div>
  );
}

// Document Viewer Component
interface DocumentViewerProps {
  document: Document;
  onClose: () => void;
}

function DocumentViewer({ document, onClose }: DocumentViewerProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/documents/${document.filename}`);
        const data = await response.json();
        
        if (response.ok) {
          setContent(data.content);
        } else {
          setContent(`# ${document.name}\n\nError loading document. Please try again.`);
        }
      } catch {
        setContent(`# ${document.name}\n\nError loading document. Please try again.`);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [document]);

  const handleDownloadPDF = async () => {
    if (!content) return;
    
    setGeneratingPDF(true);
    try {
      const pdfOptions: PDFOptions = {
        title: document.name,
        author: 'EmotiLink OS',
        subject: 'Documentation',
        keywords: 'documentation, emotilink, blockchain, oracle'
      };
      
      await downloadPDF(content, document.name, pdfOptions);
    } catch {
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPDF(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-7xl h-[95vh] mx-4 flex flex-col border border-gray-700">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gray-800/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-600/20 rounded-lg">
              <FileText className="h-6 w-6 text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{document.name}</h2>
              <p className="text-sm text-gray-400">Document Viewer</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-400">
              {Math.round(document.size / 1024)} KB
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <span className="text-xl">&times;</span>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400"></div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto bg-white">
              <div className="max-w-4xl mx-auto p-8 bg-white text-gray-900 shadow-inner">
                <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl prose-p:text-gray-700 prose-strong:text-gray-900 prose-code:text-blue-600 prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-pre:bg-gray-100 prose-blockquote:border-l-blue-500 prose-blockquote:text-gray-600 prose-blockquote:bg-blue-50">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-4xl font-bold text-gray-900 mb-8 mt-12 first:mt-0 border-b-2 border-gray-300 pb-3">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-3xl font-semibold text-gray-900 mb-6 mt-10 border-b border-gray-200 pb-2">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-gray-700 mb-6 leading-relaxed text-lg">
                        {children}
                      </p>
                    ),
                    code: ({ children, className }) => {
                      const isInline = !className;
                      return isInline ? (
                        <code className="bg-gray-100 text-blue-600 px-2 py-1 rounded text-sm font-mono">
                          {children}
                        </code>
                      ) : (
                        <code className={className}>
                          {children}
                        </code>
                      );
                    },
                    pre: ({ children }) => (
                      <pre className="bg-gray-100 rounded-lg p-6 overflow-x-auto mb-6 border border-gray-200">
                        {children}
                      </pre>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside text-gray-700 mb-6 space-y-3 text-lg">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside text-gray-700 mb-6 space-y-3 text-lg">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-gray-700">
                        {children}
                      </li>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-blue-500 pl-6 py-4 mb-6 bg-blue-50 rounded-r-lg text-gray-600 italic">
                        {children}
                      </blockquote>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto mb-6">
                        <table className="min-w-full border border-gray-300 rounded-lg shadow-sm">
                          {children}
                        </table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="border border-gray-300 px-6 py-3 bg-gray-50 text-gray-900 font-semibold text-left">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-gray-300 px-6 py-3 text-gray-700">
                        {children}
                      </td>
                    ),
                    a: ({ children, href }) => (
                      <a 
                        href={href} 
                        className="text-blue-600 hover:text-blue-800 underline font-medium"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    ),
                    strong: ({ children }) => (
                      <strong className="text-gray-900 font-semibold">
                        {children}
                      </strong>
                    ),
                    em: ({ children }) => (
                      <em className="text-gray-600 italic">
                        {children}
                      </em>
                    )
                  }}
                >
                  {content}
                </ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700 bg-gray-800/50">
          <div className="text-sm text-gray-400">
            Last modified: {document.lastModified} • Size: {Math.round(document.size / 1024)} KB
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadPDF}
              disabled={generatingPDF}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>{generatingPDF ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
