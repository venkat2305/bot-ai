import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Github, Loader2, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

interface GitHubImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (repoUrl: string, branch?: string) => Promise<void>;
}

export default function GitHubImportModal({
  isOpen,
  onClose,
  onImport,
}: GitHubImportModalProps) {
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

    setIsLoading(true);
    setError('');

    try {
      await onImport(repoUrl.trim(), branch.trim() || undefined);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import repository');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setRepoUrl('');
      setBranch('');
      setError('');
      onClose();
    }
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
            className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-6 w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Github className="w-6 h-6 text-[var(--primary-color)]" />
                <h2 className="text-xl font-semibold text-[var(--text-color)]">
                  Import GitHub Repository
                </h2>
              </div>
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  disabled={isLoading}
                  className={clsx(
                    "w-full px-3 py-2 border rounded-lg bg-[var(--bg-tertiary)] border-[var(--border-color)]",
                    "text-[var(--text-color)] placeholder-[var(--text-muted)]",
                    "focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
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
                  disabled={isLoading}
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

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className={clsx(
                    "flex-1 px-4 py-2 rounded-lg border border-[var(--border-color)]",
                    "text-[var(--text-color)] hover:bg-[var(--bg-tertiary)] transition-colors",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !repoUrl.trim()}
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
                      Import
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-4 p-3 bg-[var(--bg-tertiary)] rounded-lg">
              <p className="text-xs text-[var(--text-muted)]">
                <strong>Supported file types:</strong> .js, .py, .java, .cpp, .html, .css, .ts, .jsx, .tsx
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 