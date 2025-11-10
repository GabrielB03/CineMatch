import React from 'react';
import { useTheme } from '../utils/ThemeContext';

const ThemeSwitch = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="theme-switch-wrapper">
            <input
                type="checkbox"
                id="theme-toggle"
                checked={theme === 'dark'}
                onChange={toggleTheme}
                aria-label="Alternar modo escuro/claro"
                style={{ display: 'none' }}
            ></input>
            <label htmlFor="theme-toggle" className="theme-switch-label">
                <span className="sun-icon">☀️</span>
                <span className="moon-icon">🌙</span>
                <span className="slider-ball"></span>
            </label>
        </div>
    );
};

export default ThemeSwitch;