import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const TabsContext = createContext(null);
export const useTabs = () => useContext(TabsContext);

// Default tabs that always exist
const DEFAULT_TABS = [
  { id: 'feed',     label: 'feed.live',    path: '/',          icon: '◉', closable: false },
  { id: 'snippets', label: 'snippets/',    path: '/snippets',  icon: '◈', closable: false },
  { id: 'jobs',     label: 'jobs.board',   path: '/jobs',      icon: '◆', closable: false },
];

export const WorkspaceTabsProvider = ({ children }) => {
  const [tabs, setTabs] = useState(DEFAULT_TABS);
  const [activeTab, setActiveTab] = useState('feed');

  const openTab = useCallback((tab) => {
    setTabs(prev => {
      if (prev.find(t => t.id === tab.id)) return prev;
      return [...prev, { ...tab, closable: true }];
    });
    setActiveTab(tab.id);
  }, []);

  const closeTab = useCallback((tabId) => {
    setTabs(prev => {
      const idx = prev.findIndex(t => t.id === tabId);
      const next = prev.filter(t => t.id !== tabId);
      if (activeTab === tabId && next.length) {
        setActiveTab(next[Math.max(0, idx - 1)].id);
      }
      return next;
    });
  }, [activeTab]);

  return (
    <TabsContext.Provider value={{ tabs, activeTab, setActiveTab, openTab, closeTab }}>
      {children}
    </TabsContext.Provider>
  );
};
