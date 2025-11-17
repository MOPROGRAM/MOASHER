import React from 'react';
import { setLocalApiKey } from '../utils/apiKeys';
import { useLanguage } from '../contexts/LanguageContext';

interface ApiKeyRequiredPromptProps {
    onApiKeySelected: () => void;
}

const ApiKeyRequiredPrompt: React.FC<ApiKeyRequiredPromptProps> = ({ onApiKeySelected }) => {
    const { t } = useLanguage();

    const handleSelectKey = async () => {
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
            await window.aistudio.openSelectKey();
            // Call the prop function, which is now responsible for re-checking the API key status
            onApiKeySelected(); 
        } else {
            console.error("window.aistudio.openSelectKey is not available.");
            // Provide a user-friendly message or fallback in this rare case
            const manual = confirm("Automatic API key selection not available. Would you like to enter the API key manually?");
            if (manual) {
                const entered = prompt("Please paste your Gemini API key (it will be stored locally in your browser):");
                if (entered && entered.trim()) {
                    setLocalApiKey(entered.trim());
                    onApiKeySelected();
                    return;
                }
            }
            alert("API key selection not available in this environment. Operation cancelled.");
        }
    };

    return (
        <div 
            className="p-6 bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 rounded-lg flex flex-col items-center space-y-4 rtl:space-x-reverse shadow-md max-w-2xl mx-auto"
            role="alert"
            aria-live="polite"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-xl font-bold text-center">{t('apiKeyRequired')}</h3>
            <p className="text-sm font-medium leading-relaxed text-center max-w-prose">
                {t('apiKeyPromptText')}
            </p>
            <button
                onClick={handleSelectKey}
                className="px-6 py-3 bg-yellow-600 text-white font-bold rounded-lg shadow-md hover:bg-yellow-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-yellow-400"
                aria-label={t('selectApiKeyButton')}
            >
                {t('selectApiKeyButton')}
            </button>
            <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-yellow-700 dark:text-yellow-300 hover:underline text-sm font-medium"
                aria-label={t('billingDocsLink')}
            >
                {t('billingDocsLink')}
            </a>
        </div>
    );
};

export default ApiKeyRequiredPrompt;