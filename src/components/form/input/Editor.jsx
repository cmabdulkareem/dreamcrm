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
    height = 300,
    disabled = false
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
            className={`relative w-full rounded-2xl border border-gray-200 dark:border-gray-800 overflow-visible shadow-theme-xs transition-all quill-editor-wrapper ${theme === 'dark' ? 'quill-dark' : ''}`}
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
                            <>
                                {/* Backdrop */}
                                <div
                                    style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
                                    onMouseDown={() => setDropdownOpen(false)}
                                />
                                {/* Dropdown panel */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: 'calc(100% + 6px)',
                                        right: 0,
                                        minWidth: '210px',
                                        background: theme === 'dark' ? '#111827' : '#ffffff',
                                        border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                                        zIndex: 9999,
                                        overflow: 'hidden',
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: '8px 12px',
                                            borderBottom: `1px solid ${theme === 'dark' ? '#1f2937' : '#f3f4f6'}`,
                                            background: theme === 'dark' ? '#0f172a' : '#f9fafb',
                                        }}
                                    >
                                        <span style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af' }}>
                                            Available Variables
                                        </span>
                                    </div>
                                    {VARIABLES.map((v) => (
                                        <button
                                            key={v.value}
                                            type="button"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                insertVariable(v.value);
                                            }}
                                            style={{
                                                display: 'flex',
                                                width: '100%',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '10px 14px',
                                                background: 'transparent',
                                                border: 'none',
                                                borderBottom: `1px solid ${theme === 'dark' ? '#1f2937' : '#f9fafb'}`,
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                gap: '12px',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = theme === 'dark' ? '#1e1b4b' : '#f5f3ff'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <span style={{ fontSize: '12px', fontWeight: 600, color: theme === 'dark' ? '#e5e7eb' : '#374151' }}>
                                                {v.label}
                                            </span>
                                            <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#818cf8', whiteSpace: 'nowrap' }}>
                                                {v.value}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </>
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
        </div>
    );
};

export default TinyEditor;
