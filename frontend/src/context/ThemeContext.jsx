import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    return useContext(ThemeContext);
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'dark';
    });
    const [fontSize, setFontSize] = useState(() => {
        return localStorage.getItem('font-size') || 'medium';
    });
    const [codeFont, setCodeFont] = useState(() => {
        return localStorage.getItem('code-font') || 'JetBrains Mono';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        document.documentElement.setAttribute('data-font-size', fontSize);
        localStorage.setItem('font-size', fontSize);
    }, [fontSize]);

    useEffect(() => {
        document.documentElement.setAttribute('data-code-font', codeFont);
        localStorage.setItem('code-font', codeFont);
    }, [codeFont]);

    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, fontSize, setFontSize, codeFont, setCodeFont }}>
            {children}
        </ThemeContext.Provider>
    );
};
