import React from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useTheme } from '../../../context/ThemeContext';

const TinyEditor = ({
    value,
    onChange,
    placeholder = "Start typing...",
    height = 300,
    disabled = false
}) => {
    const { theme } = useTheme();

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'color': [] }, { 'background': [] }],
            ['link', 'clean']
        ],
    };

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike',
        'list',
        'link', 'color', 'background'
    ];

    return (
        <div className={`relative w-full rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden shadow-theme-xs transition-colors quill-editor-wrapper ${theme === 'dark' ? 'quill-dark' : ''}`}>
            <style>
                {`
                    .quill-editor-wrapper .ql-toolbar {
                        border-top: none !important;
                        border-left: none !important;
                        border-right: none !important;
                        border-bottom: 1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'} !important;
                        background: ${theme === 'dark' ? '#1f2937' : '#f9fafb'};
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
                    .quill-dark .ql-stroke {
                        stroke: #9ca3af !important;
                    }
                    .quill-dark .ql-fill {
                        fill: #9ca3af !important;
                    }
                    .quill-dark .ql-picker {
                        color: #9ca3af !important;
                    }
                    .quill-dark .ql-picker-options {
                        background-color: #1f2937 !important;
                        border-color: #374151 !important;
                    }
                `}
            </style>
            <ReactQuill
                theme="snow"
                value={value}
                onChange={onChange}
                modules={modules}
                formats={formats}
                readOnly={disabled}
                placeholder={placeholder}
            />
        </div>
    );
};

export default TinyEditor;
