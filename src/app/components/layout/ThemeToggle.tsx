import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle({ collapsed }: { collapsed?: boolean }) {
    const { theme, setTheme } = useTheme();

    const cycleTheme = () => {
        if (theme === 'system') setTheme('light');
        else if (theme === 'light') setTheme('dark');
        else setTheme('system');
    };

    const getIcon = () => {
        if (theme === 'light') return <Sun size={17} />;
        if (theme === 'dark') return <Moon size={17} />;
        return <Monitor size={17} />;
    };

    const getLabel = () => {
        if (theme === 'light') return 'Light Theme';
        if (theme === 'dark') return 'Dark Theme';
        return 'System Default';
    };

    return (
        <button
            onClick={cycleTheme}
            type="button"
            className={[
                'flex w-full items-center gap-3 rounded-[10px] text-left transition-colors px-3 py-2 cursor-pointer',
                'bg-transparent text-[var(--ba-text-secondary)] hover:bg-[var(--ba-bg-tertiary)]',
                collapsed ? 'justify-center px-[18px]' : ''
            ].join(' ')}
            title={getLabel()}
            aria-label={getLabel()}
        >
            <div className="shrink-0">{getIcon()}</div>
            {!collapsed && (
                <span className="truncate font-dm-sans text-[13px] font-medium">
                    {getLabel()}
                </span>
            )}
        </button>
    );
}
