const HISTORY_KEY = 'org_chart_history';
const MAX_HISTORY_ITEMS = 10;

export const saveChartToHistory = (data) => {
    try {
        const history = getHistory();
        const newItem = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            data: data,
            summary: `${data.length} Employees`
        };

        // Add to beginning, limit to MAX_HISTORY_ITEMS
        const newHistory = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
        return newHistory;
    } catch (e) {
        console.error("Failed to save history:", e);
        return [];
    }
};

export const getHistory = () => {
    try {
        const stored = localStorage.getItem(HISTORY_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to load history:", e);
        return [];
    }
};

export const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
};
