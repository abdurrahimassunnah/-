import React from 'react';

const BoldIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path d="M5.5 4.5a2.5 2.5 0 0 1 2.413 2.012A3.501 3.501 0 0 1 11 6.5h1.5a.5.5 0 0 1 0 1H11a2.5 2.5 0 0 1-2.5 2.5h-1A1.5 1.5 0 0 1 6 11.5v2a.5.5 0 0 1-1 0v-2A2.5 2.5 0 0 1 7.5 9h1a1.5 1.5 0 0 0 1.5-1.5 2.5 2.5 0 0 0-2.09-2.45A2.5 2.5 0 0 1 5.5 4.5Z" />
        <path d="M8 11.5a1.5 1.5 0 0 1 1.5 1.5v1.5a.5.5 0 0 1-1 0V13a.5.5 0 0 0-.5-.5h-2a.5.5 0 0 0-.5.5v1.5a.5.5 0 0 1-1 0V13A1.5 1.5 0 0 1 6.5 11.5H8Z" />
    </svg>
);

const ItalicIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path d="M7.75 4.5a.75.75 0 0 1 .75.75v.5h1v-.5a.75.75 0 0 1 1.5 0v.5h1.25a.75.75 0 0 1 0 1.5H11v6h1.25a.75.75 0 0 1 0 1.5H9.5v.5a.75.75 0 0 1-1.5 0v-.5h-1v.5a.75.75 0 0 1-1.5 0v-.5H4.25a.75.75 0 0 1 0-1.5H5.5v-6H4.25a.75.75 0 0 1 0-1.5H5.5v-.5a.75.75 0 0 1 .75-.75h1.5Z" />
    </svg>
);

const BulletListIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M2 5.75A.75.75 0 0 1 2.75 5h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 5.75Zm0 4A.75.75 0 0 1 2.75 9h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 9.75Zm0 4A.75.75 0 0 1 2.75 13h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 13.75Z" clipRule="evenodd" />
    </svg>
);

interface FormattingToolbarProps {
    onFormat: (command: string) => void;
}

const FormattingToolbar: React.FC<FormattingToolbarProps> = ({ onFormat }) => {
    const handleMouseDown = (e: React.MouseEvent) => {
        // Prevents the editor from losing focus when a button is clicked
        e.preventDefault();
    };

    const commands = [
        { command: 'bold', icon: BoldIcon, label: 'Bold' },
        { command: 'italic', icon: ItalicIcon, label: 'Italic' },
        { command: 'insertUnorderedList', icon: BulletListIcon, label: 'Bullet List' },
    ];

    return (
        <div 
            className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white rounded-lg shadow-lg flex p-1 z-20"
            onMouseDown={handleMouseDown}
        >
            {commands.map(({ command, icon: Icon, label }) => (
                <button
                    key={command}
                    onClick={() => onFormat(command)}
                    className="p-2 rounded-md hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
                    aria-label={label}
                    title={label}
                >
                    <Icon className="w-5 h-5" />
                </button>
            ))}
        </div>
    );
};

export default FormattingToolbar;
