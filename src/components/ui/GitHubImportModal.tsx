import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Github, Loader2, AlertCircle, CheckSquare, Square, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import FileTreeNode, { FileTreeItem } from './FileTreeNode';
import ProFeatureGate from './ProFeatureGate';

interface GitHubImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (repoUrl: string, selectedFiles: string[], branch?: string) => Promise<void>;
}

export default function GitHubImportModal({
  isOpen,
  onClose,
  onImport,
}: GitHubImportModalProps) {
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingStructure, setIsFetchingStructure] = useState(false);
  const [error, setError] = useState('');
  const [fileStructure, setFileStructure] = useState<FileTreeItem[] | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [defaultBranch, setDefaultBranch] = useState<string>('');
  const [step, setStep] = useState<'url' | 'files'>('url');

  const fetchRepositoryStructure = async () => {
    if (!repoUrl.trim()) {
      setError('Please enter a GitHub repository URL');
      return;
    }

    // Basic URL validation
    const githubUrlPattern = /^https:\/\/github\.com\/[^\/]+\/[^\/]+\/?$/;
    if (!githubUrlPattern.test(repoUrl.trim())) {
      setError('Please enter a valid GitHub repository URL (e.g., https://github.com/user/repo)');
      return;
    }

    setIsFetchingStructure(true);
    setError('');

    try {
      const response = await fetch('/api/github/structure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repoUrl: repoUrl.trim(),
          branch: branch.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch repository structure');
      }

      setFileStructure(data.structure);
      setDefaultBranch(data.defaultBranch);
      
      // Auto-select only supported files (excludes config files, lock files, etc.)
      const supportedFiles = new Set<string>();
      const collectSupportedFiles = (items: FileTreeItem[]) => {
        items.forEach(item => {
          if (item.type === 'file' && item.isSupported) {
            supportedFiles.add(item.path);
          }
          if (item.children) {
            collectSupportedFiles(item.children);
          }
        });
      };
      collectSupportedFiles(data.structure);
      setSelectedFiles(supportedFiles);
      
      setStep('files');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch repository structure');
    } finally {
      setIsFetchingStructure(false);
    }
  };

  const handleImport = async () => {
    if (selectedFiles.size === 0) {
      setError('Please select at least one file to import');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onImport(repoUrl.trim(), Array.from(selectedFiles), branch.trim() || defaultBranch);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import repository');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading && !isFetchingStructure) {
      setRepoUrl('');
      setBranch('');
      setError('');
      setFileStructure(null);
      setSelectedFiles(new Set());
      setDefaultBranch('');
      setStep('url');
      onClose();
    }
  };

  const handleFileToggle = (path: string, selected: boolean) => {
    const newSelected = new Set(selectedFiles);
    if (selected) {
      newSelected.add(path);
    } else {
      newSelected.delete(path);
    }
    setSelectedFiles(newSelected);
  };

  const handleFolderToggle = (folderPath: string, selected: boolean) => {
    const newSelected = new Set(selectedFiles);
    
    const toggleFilesInFolder = (items: FileTreeItem[], pathPrefix: string) => {
      items.forEach(item => {
        if (item.path.startsWith(pathPrefix)) {
          if (item.type === 'file') {
            if (selected) {
              newSelected.add(item.path);
            } else {
              newSelected.delete(item.path);
            }
          }
          if (item.children) {
            toggleFilesInFolder(item.children, pathPrefix);
          }
        }
      });
    };
    
    if (fileStructure) {
      toggleFilesInFolder(fileStructure, folderPath);
    }
    
    setSelectedFiles(newSelected);
  };

  const handleSelectAll = () => {
    const allFiles = new Set<string>();
    const collectAllFiles = (items: FileTreeItem[]) => {
      items.forEach(item => {
        if (item.type === 'file') {
          allFiles.add(item.path);
        }
        if (item.children) {
          collectAllFiles(item.children);
        }
      });
    };
    
    if (fileStructure) {
      collectAllFiles(fileStructure);
    }
    
    setSelectedFiles(allFiles);
  };

  const handleSelectNone = () => {
    setSelectedFiles(new Set());
  };

  const handleSelectSupported = () => {
    const supportedFiles = new Set<string>();
    const collectSupportedFiles = (items: FileTreeItem[]) => {
      items.forEach(item => {
        if (item.type === 'file' && item.isSupported) {
          supportedFiles.add(item.path);
        }
        if (item.children) {
          collectSupportedFiles(item.children);
        }
      });
    };
    
    if (fileStructure) {
      collectSupportedFiles(fileStructure);
    }
    
    setSelectedFiles(supportedFiles);
  };

  const handleBack = () => {
    setStep('url');
    setFileStructure(null);
    setSelectedFiles(new Set());
    setError('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={clsx(
              "bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-6 w-full shadow-xl",
              step === 'url' ? "max-w-md" : "max-w-2xl"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <ProFeatureGate 
              feature="github:import"
              upgradePromptTitle="GitHub Repository Import"
              upgradePromptDescription="Import and analyze entire GitHub repositories with AI assistance."
              fallback={
                <div className="text-center">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <Github className="w-6 h-6 text-[var(--primary-color)]" />
                      <h2 className="text-xl font-semibold text-[var(--text-color)]">
                        Import GitHub Repository
                      </h2>
                    </div>
                    <button
                      onClick={handleClose}
                      className="text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              }
            >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Github className="w-6 h-6 text-[var(--primary-color)]" />
                <h2 className="text-xl font-semibold text-[var(--text-color)]">
                  {step === 'url' ? 'Import GitHub Repository' : 'Select Files to Import'}
                </h2>
              </div>
              <button
                onClick={handleClose}
                disabled={isLoading || isFetchingStructure}
                className="text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {step === 'url' ? (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="repo-url"
                    className="block text-sm font-medium text-[var(--text-color)] mb-2"
                  >
                    Repository URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="repo-url"
                    type="url"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/user/repo"
                    disabled={isFetchingStructure}
                    className={clsx(
                      "w-full px-3 py-2 border rounded-lg bg-[var(--bg-tertiary)] border-[var(--border-color)]",
                      "text-[var(--text-color)] placeholder-[var(--text-muted)]",
                      "focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        fetchRepositoryStructure();
                      }
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="branch"
                    className="block text-sm font-medium text-[var(--text-color)] mb-2"
                  >
                    Branch (optional)
                  </label>
                  <input
                    id="branch"
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="main, master, develop..."
                    disabled={isFetchingStructure}
                    className={clsx(
                      "w-full px-3 py-2 border rounded-lg bg-[var(--bg-tertiary)] border-[var(--border-color)]",
                      "text-[var(--text-color)] placeholder-[var(--text-muted)]",
                      "focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Leave empty to use the default branch
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isFetchingStructure}
                    className={clsx(
                      "flex-1 px-4 py-2 rounded-lg border border-[var(--border-color)]",
                      "text-[var(--text-color)] hover:bg-[var(--bg-tertiary)] transition-colors",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={fetchRepositoryStructure}
                    disabled={isFetchingStructure || !repoUrl.trim()}
                    className={clsx(
                      "flex-1 px-4 py-2 rounded-lg font-medium transition-colors",
                      "bg-[var(--primary-color)] text-white hover:bg-[var(--primary-hover)]",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "flex items-center justify-center gap-2"
                    )}
                  >
                    {isFetchingStructure ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Fetching...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Next
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-4 p-3 bg-[var(--bg-tertiary)] rounded-lg">
                  <p className="text-xs text-[var(--text-muted)]">
                    <strong>Note:</strong> After fetching the repository structure, you'll be able to select specific files and folders to import.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Selection controls */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--border-color)]">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSelectSupported}
                      className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                    >
                      Select Supported
                    </button>
                    <button
                      onClick={handleSelectAll}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleSelectNone}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      Select None
                    </button>
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {selectedFiles.size} file(s) selected
                  </div>
                </div>

                {/* File tree */}
                <div className="max-h-80 overflow-y-auto border border-[var(--border-color)] rounded-lg p-2">
                  {fileStructure && fileStructure.map((item) => (
                    <FileTreeNode
                      key={item.path}
                      item={item}
                      selectedFiles={selectedFiles}
                      onFileToggle={handleFileToggle}
                      onFolderToggle={handleFolderToggle}
                    />
                  ))}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={isLoading}
                    className={clsx(
                      "px-4 py-2 rounded-lg border border-[var(--border-color)]",
                      "text-[var(--text-color)] hover:bg-[var(--bg-tertiary)] transition-colors",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={isLoading || selectedFiles.size === 0}
                    className={clsx(
                      "flex-1 px-4 py-2 rounded-lg font-medium transition-colors",
                      "bg-[var(--primary-color)] text-white hover:bg-[var(--primary-hover)]",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "flex items-center justify-center gap-2"
                    )}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Github className="w-4 h-4" />
                        Import Selected Files
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
            </ProFeatureGate>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 