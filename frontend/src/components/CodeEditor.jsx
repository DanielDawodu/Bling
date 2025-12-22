import React from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup'; // html
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/themes/prism-tomorrow.css'; // Dark theme
import './CodeEditor.css';

const CodeEditor = ({ code, setCode, language, readOnly = false }) => {
    const highlightCode = (code) => {
        const grammar = Prism.languages[language] || Prism.languages.javascript;
        return Prism.highlight(code, grammar, language);
    };

    return (
        <div className="code-editor-wrapper">
            <Editor
                value={code}
                onValueChange={code => !readOnly && setCode(code)}
                highlight={highlightCode}
                padding={15}
                style={{
                    fontFamily: '"Fira Code", "Fira Mono", monospace',
                    fontSize: 14,
                    backgroundColor: '#1e1e1e',
                    color: '#d4d4d4',
                    borderRadius: '8px',
                    minHeight: '200px'
                }}
                disabled={readOnly}
                className="prism-editor"
            />
        </div>
    );
};

export default CodeEditor;
