import React, { useState } from 'react';
import { FileUp, File, Trash2, Maximize2, Minimize2 } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import mammoth from 'mammoth';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  url: string;
  content?: string;
}

function App() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [expandedView, setExpandedView] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) return;

    const newFiles: UploadedFile[] = await Promise.all(
      Array.from(uploadedFiles).map(async (file) => {
        let content = '';
        if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          content = result.value;
        }
        return {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          url: URL.createObjectURL(file),
          content,
        };
      })
    );

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDelete = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
    if (selectedFile?.id === id) {
      setSelectedFile(null);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  return (
    <div className="min-h-screen bg-sky-50 p-8 relative">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 border border-sky-100">
          <h1 className="text-3xl font-bold mb-6 text-sky-800 flex items-center gap-3">
            <FileUp className="w-8 h-8" />
            File Viewer
          </h1>
          
          <label className="block w-full border-2 border-dashed border-sky-200 rounded-xl p-8 text-center cursor-pointer hover:border-sky-400 hover:bg-sky-50 transition-all duration-300">
            <input
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx"
              onChange={handleFileUpload}
              multiple
            />
            <div className="text-sky-600">
              <FileUp className="w-16 h-16 mx-auto mb-4 text-sky-400" />
              <p className="text-lg font-medium mb-2">Drop files here or click to upload</p>
              <p className="text-sm text-sky-400">Supported formats: PDF, DOC, DOCX</p>
            </div>
          </label>
        </div>

        <div className={`grid gap-6 transition-all duration-300 ${expandedView ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
          <div className={`bg-white rounded-2xl shadow-lg p-6 border border-sky-100 ${expandedView ? 'hidden md:block' : ''}`}>
            <h2 className="text-xl font-semibold mb-4 text-sky-800">Files</h2>
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedFile?.id === file.id ? 'bg-sky-100' : 'hover:bg-sky-50'
                  }`}
                  onClick={() => setSelectedFile(file)}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <File className="w-4 h-4 shrink-0 text-sky-600" />
                    <span className="text-sm text-sky-900 truncate" title={file.name}>
                      {file.name}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(file.id);
                    }}
                    className="text-sky-400 hover:text-sky-600 transition-colors ml-2 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {files.length === 0 && (
                <p className="text-sky-400 text-sm text-center py-4">No files uploaded yet</p>
              )}
            </div>
          </div>

          <div className={`bg-white rounded-2xl shadow-lg p-6 border border-sky-100 ${expandedView ? 'col-span-full' : 'md:col-span-2'}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-sky-800">Preview</h2>
              {selectedFile?.type === 'application/pdf' && (
                <button
                  onClick={() => setExpandedView(!expandedView)}
                  className="flex items-center gap-2 text-sky-600 hover:text-sky-800 transition-colors"
                >
                  {expandedView ? (
                    <>
                      <Minimize2 className="w-4 h-4" />
                      <span className="text-sm">Normal view</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-4 h-4" />
                      <span className="text-sm">Full width</span>
                    </>
                  )}
                </button>
              )}
            </div>
            {selectedFile ? (
              <div className="overflow-auto max-h-[calc(100vh-300px)]">
                {selectedFile.type === 'application/pdf' ? (
                  <Document
                    file={selectedFile.url}
                    onLoadSuccess={onDocumentLoadSuccess}
                    className="mx-auto"
                  >
                    {Array.from(new Array(numPages || 0), (_, index) => (
                      <Page
                        key={`page_${index + 1}`}
                        pageNumber={index + 1}
                        width={expandedView ? window.innerWidth - 200 : 500}
                      />
                    ))}
                  </Document>
                ) : (
                  <div className="text-left p-8">
                    <p className="mb-4 text-sky-600 whitespace-pre-wrap">{selectedFile.content}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-sky-400 p-12 bg-sky-50 rounded-xl">
                Select a file to preview
              </div>
            )}
          </div>
        </div>
      </div>
      
      <footer className="absolute bottom-4 right-8 text-sky-500 text-sm">
        Made with ♥ by Akshat
      </footer>
    </div>
  );
}

export default App;