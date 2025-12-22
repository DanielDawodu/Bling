import React, { useState } from 'react';
import './FileTree.css';

const FileIcon = ({ name }) => {
    const ext = name.split('.').pop().toLowerCase();
    let icon = '📄'; // Default file icon

    if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) icon = '📜';
    if (['css', 'scss', 'less'].includes(ext)) icon = '🎨';
    if (['html', 'htm'].includes(ext)) icon = '🌐';
    if (['json', 'xml', 'yml'].includes(ext)) icon = '⚙️';
    if (['md', 'txt'].includes(ext)) icon = '📝';
    if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) icon = '🖼️';

    return <span className="file-icon">{icon}</span>;
};

const FileTreeNode = ({ node, onSelect, selectedPath }) => {
    const [isOpen, setIsOpen] = useState(true);

    if (!node.children) {
        // It's a file
        return (
            <div
                className={`file-tree-item file ${selectedPath === node.path ? 'selected' : ''}`}
                onClick={() => onSelect(node)}
            >
                <FileIcon name={node.name} />
                <span className="file-name">{node.name}</span>
            </div>
        );
    }

    // It's a folder
    return (
        <div className="file-tree-folder">
            <div
                className="file-tree-item folder"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="folder-arrow">{isOpen ? '▼' : '▶'}</span>
                <span className="folder-icon">{isOpen ? '📂' : '📁'}</span>
                <span className="folder-name">{node.name}</span>
            </div>
            {isOpen && (
                <div className="folder-children">
                    {node.children.map((child) => (
                        <FileTreeNode
                            key={child.path}
                            node={child}
                            onSelect={onSelect}
                            selectedPath={selectedPath}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const FileTree = ({ files, onSelectFile, selectedFile }) => {
    // Convert flat file list to tree structure
    const buildTree = (files) => {
        const root = { name: 'root', children: [] };

        files.forEach(file => {
            const parts = file.path.split('/');
            let current = root;

            parts.forEach((part, index) => {
                const isFile = index === parts.length - 1;

                // Check if child already exists
                let child = current.children?.find(c => c.name === part);

                if (!child) {
                    child = {
                        name: part,
                        path: parts.slice(0, index + 1).join('/'),
                        ...((isFile) ? { content: file.content, language: file.language } : { children: [] })
                    };
                    current.children.push(child);
                }

                current = child;
            });
        });

        return root.children;
    };

    const treeData = buildTree(files);

    return (
        <div className="file-tree-container">
            {treeData.map(node => (
                <FileTreeNode
                    key={node.path}
                    node={node}
                    onSelect={onSelectFile}
                    selectedPath={selectedFile?.path}
                />
            ))}
        </div>
    );
};

export default FileTree;
