import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, File, Check, Minus } from 'lucide-react';
import clsx from 'clsx';

export interface FileTreeItem {
  path: string;
  type: 'file' | 'directory';
  size?: number;
  isSupported?: boolean;
  children?: FileTreeItem[];
}

interface FileTreeNodeProps {
  item: FileTreeItem;
  selectedFiles: Set<string>;
  onFileToggle: (path: string, selected: boolean) => void;
  onFolderToggle: (folderPath: string, selected: boolean) => void;
  level?: number;
}

export default function FileTreeNode({
  item,
  selectedFiles,
  onFileToggle,
  onFolderToggle,
  level = 0
}: FileTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels

  const isFile = item.type === 'file';
  const hasChildren = item.children && item.children.length > 0;
  const fileName = item.path.split('/').pop() || item.path;
  
  // For files: check if selected
  const isSelected = isFile ? selectedFiles.has(item.path) : false;
  
  // For folders: check selection state of children
  const getSelectionState = () => {
    if (isFile) return isSelected;
    
    if (!hasChildren) return false;
    
    const allFiles = getAllFilesInFolder(item);
    const selectedCount = allFiles.filter(file => selectedFiles.has(file)).length;
    
    if (selectedCount === 0) return false;
    if (selectedCount === allFiles.length) return true;
    return 'partial'; // Some but not all selected
  };

  const getAllFilesInFolder = (folder: FileTreeItem): string[] => {
    const files: string[] = [];
    
    if (folder.children) {
      folder.children.forEach(child => {
        if (child.type === 'file') {
          files.push(child.path);
        } else if (child.children) {
          files.push(...getAllFilesInFolder(child));
        }
      });
    }
    
    return files;
  };

  const handleToggle = () => {
    if (isFile) {
      onFileToggle(item.path, !isSelected);
    } else {
      const selectionState = getSelectionState();
      const shouldSelect = selectionState !== true;
      onFolderToggle(item.path, shouldSelect);
    }
  };

  const handleExpand = () => {
    if (!isFile && hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const selectionState = getSelectionState();

  const getFileIcon = () => {
    if (isFile) {
      return <File className="w-4 h-4 text-gray-500" />;
    }
    
    if (isExpanded) {
      return <FolderOpen className="w-4 h-4 text-blue-500" />;
    }
    
    return <Folder className="w-4 h-4 text-blue-500" />;
  };

  const getCheckboxIcon = () => {
    if (selectionState === true) {
      return <Check className="w-3 h-3 text-white" />;
    }
    if (selectionState === 'partial') {
      return <Minus className="w-3 h-3 text-white" />;
    }
    return null;
  };

  return (
    <div className="select-none">
      <div 
        className={clsx(
          "flex items-center gap-2 py-1 px-2 rounded-md hover:bg-[var(--bg-tertiary)] cursor-pointer",
          "transition-colors duration-150"
        )}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
      >
        {/* Expand/Collapse button for folders */}
        {!isFile && hasChildren && (
          <button
            onClick={handleExpand}
            className="p-0.5 hover:bg-gray-200 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-gray-600" />
            ) : (
              <ChevronRight className="w-3 h-3 text-gray-600" />
            )}
          </button>
        )}
        
        {/* Spacer for files or folders without children */}
        {(isFile || !hasChildren) && (
          <div className="w-4" />
        )}

        {/* Checkbox */}
        <button
          onClick={handleToggle}
          className={clsx(
            "w-4 h-4 border rounded flex items-center justify-center transition-all duration-150",
            selectionState === true 
              ? "bg-[var(--primary-color)] border-[var(--primary-color)]"
              : selectionState === 'partial'
              ? "bg-[var(--primary-color)] border-[var(--primary-color)]"
              : "border-gray-300 hover:border-gray-400"
          )}
        >
          {getCheckboxIcon()}
        </button>

        {/* File/Folder icon */}
        {getFileIcon()}

        {/* File/Folder name */}
        <span 
          className={clsx(
            "text-sm truncate flex-1",
            isFile 
              ? item.isSupported 
                ? "text-[var(--text-color)]" 
                : "text-[var(--text-muted)]"
              : "text-[var(--text-color)] font-medium"
          )}
          onClick={!isFile && hasChildren ? handleExpand : handleToggle}
        >
          {fileName}
        </span>

        {/* File size for files */}
        {isFile && item.size !== undefined && (
          <span className="text-xs text-[var(--text-muted)] ml-2">
            {item.size > 1024 ? `${(item.size / 1024).toFixed(1)}KB` : `${item.size}B`}
          </span>
        )}

        {/* Supported indicator for files */}
        {isFile && (
          <span className={clsx(
            "text-xs px-1.5 py-0.5 rounded",
            item.isSupported 
              ? "bg-green-100 text-green-700" 
              : "bg-gray-100 text-gray-500"
          )}>
            {item.isSupported ? "✓" : "—"}
          </span>
        )}
      </div>

      {/* Children (for expanded folders) */}
      {!isFile && hasChildren && isExpanded && (
        <div>
          {item.children!.map((child) => (
            <FileTreeNode
              key={child.path}
              item={child}
              selectedFiles={selectedFiles}
              onFileToggle={onFileToggle}
              onFolderToggle={onFolderToggle}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}