import React, { useRef, useMemo, useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useTheme } from '../../../context/ThemeContext';
import { ChevronDown, Tag } from 'lucide-react';

const VARIABLES = [
    { label: 'Candidate Name', value: '{{full_name}}' },
    { label: 'Designation', value: '{{designation}}' },
    { label: 'Location', value: '{{location}}' },
    { label: 'Joining Date', value: '{{date_of_joining}}' },
    { label: 'Salary', value: '{{salary}}' },
    { label: 'Working Hours', value: '{{working_hours}}' },
];

const TinyEditor = ({
    value,
    onChange,
    placeholder = "Start typing...",
    height = 500,
    disabled = false,
    isAgreementMode = false
}) => {
    const { theme } = useTheme();
    const quillRef = useRef(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const toolbarId = useMemo(() => 'ql-toolbar-' + Math.random().toString(36).substring(7), []);

    const modules = useMemo(() => ({
        toolbar: { container: '#' + toolbarId }
    }), [toolbarId]);

    const insertVariable = (variableValue) => {
        const quill = quillRef.current?.getEditor();
        if (!quill) return;
        const range = quill.getSelection();
        const index = range ? range.index : quill.getLength();
        quill.insertText(index, variableValue);
        quill.setSelection(index + variableValue.length);
        setDropdownOpen(false);
        setTimeout(() => quill.focus(), 0);
    };

    return (
        <div
            className={`relative w-full rounded-2xl border border-gray-200 dark:border-gray-800 overflow-visible shadow-theme-xs transition-all quill-editor-wrapper ${theme === 'dark' ? 'quill-dark' : ''} ${isAgreementMode ? 'quill-agreement-mode' : ''}`}
        >
            {/* Quill Toolbar — standard controls only */}
            <div className="relative">
                <div
                    id={toolbarId}
                    className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 rounded-t-2xl"
                >
                    <span className="ql-formats">
                        <select className="ql-header" defaultValue=""></select>
                    </span>
                    <span className="ql-formats">
                        <button className="ql-bold"></button>
                        <button className="ql-italic"></button>
                        <button className="ql-underline"></button>
                        <button className="ql-strike"></button>
                    </span>
                    <span className="ql-formats">
                        <button className="ql-list" value="ordered"></button>
                        <button className="ql-list" value="bullet"></button>
                    </span>
                    <span className="ql-formats">
                        <select className="ql-color"></select>
                        <select className="ql-background"></select>
                    </span>
                    <span className="ql-formats">
                        <button className="ql-link"></button>
                        <button className="ql-clean"></button>
                    </span>
                </div>

                {/* Variables Button — positioned absolutely in top-right of toolbar row, OUTSIDE ql-toolbar */}
                {!disabled && (
                    <div
                        style={{ position: 'absolute', top: '50%', right: '45px', transform: 'translateY(-50%)', zIndex: 100 }}
                    >
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDropdownOpen(prev => !prev);
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '4px 10px',
                                fontSize: '11px',
                                fontWeight: 700,
                                color: '#4f46e5',
                                background: '#eef2ff',
                                border: '1px solid #c7d2fe',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <Tag size={11} />
                            Variables
                            <ChevronDown
                                size={11}
                                style={{
                                    transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.2s',
                                }}
                            />
                        </button>

                        {dropdownOpen && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 5px)',
                                    right: 0,
                                    width: '220px',
                                    background: '#fff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                    padding: '8px',
                                    zIndex: 200,
                                    maxHeight: '300px',
                                    overflowY: 'auto'
                                }}
                            >
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 pb-2 border-b border-gray-50 mb-2">
                                    Available Variables
                                </div>
                                <div className="space-y-1">
                                    {VARIABLES.map((v) => (
                                        <button
                                            key={v.value}
                                            type="button"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                insertVariable(v.value);
                                            }}
                                            className="w-full text-left px-3 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-500/10 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg transition-all flex items-center justify-between group border border-transparent hover:border-brand-100 dark:hover:border-brand-500/20"
                                        >
                                            <span>{v.label}</span>
                                            <span className="text-[9px] font-mono text-gray-400 group-hover:text-brand-400 opacity-60 group-hover:opacity-100">
                                                {v.value}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                .quill-editor-wrapper .ql-toolbar {
                    border: none !important;
                    padding: 6px 8px 6px 8px !important;
                    padding-right: 120px !important;
                }
                .quill-editor-wrapper .ql-container {
                    border: none !important;
                    height: ${height}px;
                    background: ${theme === 'dark' ? '#111827' : '#ffffff'};
                    color: ${theme === 'dark' ? '#e5e7eb' : '#111827'};
                    font-family: 'Outfit', sans-serif;
                }
                .quill-editor-wrapper .ql-editor.ql-blank::before {
                    color: #9ca3af !important;
                    font-style: normal;
                }
                .quill-dark .ql-stroke { stroke: #9ca3af !important; }
                .quill-dark .ql-fill { fill: #9ca3af !important; }
                .quill-dark .ql-picker { color: #9ca3af !important; }
                .quill-dark .ql-picker-options {
                    background-color: #1f2937 !important;
                    border-color: #374151 !important;
                }
                .quill-editor-wrapper .ql-toolbar.ql-snow {
                    border-radius: 12px 12px 0 0;
                }
                
                /* AGREEMENT MODE - PRECISE PDF ALIGNMENT */
                .quill-agreement-mode .ql-container {
                    background: #f8fafc !important;
                    display: flex !important;
                    justify-content: center !important;
                    padding: 60px 0 !important;
                    height: auto !important;
                    min-height: calc(100vh - 200px) !important;
                }
                
                .quill-agreement-mode .ql-editor {
                    width: 210mm !important;
                    min-height: 297mm !important;
                    margin: 0 auto !important;
                    padding: 25mm 15mm !important; /* MATCH PDF MARGINS */
                    background: white !important;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
                    
                    /* PDF TYPOGRAPHY MATCH */
                    font-family: 'Inter', -apple-system, sans-serif !important;
                    font-size: 11pt !important;
                    line-height: 1.0 !important;
                    color: #1a1a1b !important;
                    
                    /* PDF WRAPPING MATCH */
                    word-break: normal !important;
                    overflow-wrap: break-word !important;
                    white-space: normal !important;
                }
                
                .quill-agreement-mode .ql-editor p,
                .quill-agreement-mode .ql-editor li {
                    margin-bottom: 8px !important;
                }
                
                .quill-agreement-mode .ql-editor h3 {
                    font-size: 13pt !important;
                    font-weight: 700 !important;
                    margin-top: 12px !important;
                    margin-bottom: 6px !important;
                    text-transform: uppercase !important;
                }
            `}</style>

            <ReactQuill
                ref={quillRef}
                theme="snow"
                value={value}
                onChange={onChange}
                modules={modules}
                readOnly={disabled}
                placeholder={placeholder}
            />
        </div >
    );
};

export default TinyEditor;
