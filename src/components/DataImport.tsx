'use client';

import React, { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react';
import { importCustomersFromFile, downloadSampleCSV, validateFileFormat, ImportResult } from '../lib/importUtils';

interface DataImportProps {
  onImportComplete?: (result: ImportResult) => void;
  onClose?: () => void;
}

export default function DataImport({ onImportComplete, onClose }: DataImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    const validation = validateFileFormat(selectedFile);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    setFile(selectedFile);
    setResult(null);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    try {
      const importResult = await importCustomersFromFile(file);
      
      // ImportResult is returned directly
      setResult(importResult);
      if (importResult.success && importResult.successfulImports > 0) {
        onImportComplete?.(importResult);
      }
    } catch (error) {
      console.error('Import error:', error);
      setResult({
        success: false,
        totalRows: 0,
        successfulImports: 0,
        failedImports: 0,
        errors: [{ row: 0, error: 'Failed to import file' }]
      });
    } finally {
      setImporting(false);
    }
  };

  const resetImport = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Import Customer Data</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {!result ? (
          <div className="space-y-6">
            {/* Instructions */}
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
              <h3 className="font-semibold text-pink-900 mb-2">Import Instructions</h3>
              <ul className="text-sm text-pink-800 space-y-1">
                <li>• Supported formats: Excel (.xlsx, .xls) and CSV (.csv)</li>
                <li>• Maximum file size: 10MB</li>
                <li>• First row should contain column headers</li>
                <li>• Required fields: Name, Email</li>
                <li>• Optional fields: Phone, Address, Preferences, etc.</li>
              </ul>
            </div>

            {/* Sample Template */}
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Need a template?</h4>
                <p className="text-sm text-gray-600">Download our sample CSV file to see the expected format</p>
              </div>
              <button
                onClick={downloadSampleCSV}
                className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Template
              </button>
            </div>

            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-pink-400 bg-pink-50'
                  : file
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-300 hover:border-pink-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileInputChange}
                className="hidden"
              />
              
              {file ? (
                <div className="space-y-2">
                  <FileSpreadsheet className="w-12 h-12 text-green-600 mx-auto" />
                  <p className="font-medium text-green-900">{file.name}</p>
                  <p className="text-sm text-green-700">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    onClick={resetImport}
                    className="text-sm text-pink-600 hover:text-pink-700 underline"
                  >
                    Choose different file
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <p className="text-lg font-medium text-gray-900">
                    Drop your file here or{' '}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-pink-600 hover:text-pink-700 underline"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports Excel (.xlsx, .xls) and CSV (.csv) files
                  </p>
                </div>
              )}
            </div>

            {/* Import Button */}
            {file && (
              <div className="flex justify-end gap-3">
                <button
                  onClick={resetImport}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {importing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Import Data
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Import Results */
          <div className="space-y-6">
            <div className={`p-4 rounded-lg border ${
              result.success
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <h3 className={`font-semibold ${
                  result.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {result.success ? 'Import Completed Successfully' : 'Import Completed with Errors'}
                </h3>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Total Rows:</span>
                  <span className="ml-2">{result.totalRows}</span>
                </div>
                <div>
                  <span className="font-medium text-green-700">Successful:</span>
                  <span className="ml-2">{result.successfulImports}</span>
                </div>
                <div>
                  <span className="font-medium text-red-700">Failed:</span>
                  <span className="ml-2">{result.failedImports}</span>
                </div>
              </div>
            </div>

            {/* Error Details */}
            {result.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 mb-3">Import Errors</h4>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {result.errors.map((error, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium text-red-800">Row {error.row}:</span>
                      <span className="ml-2 text-red-700">{error.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={resetImport}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Import Another File
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}