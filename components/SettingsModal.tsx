import React, { useState, useEffect } from 'react';
import { X, Zap, BrainCircuit, Server, Search, Save, KeyRound, Code, User, Mail } from 'lucide-react';
import { translations } from '../translations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (model: 'gemini-3-flash-preview' | 'gemini-3-pro-preview', apiKey: string) => void;
  language: 'en' | 'zh-TW';
  initialModel: 'gemini-3-flash-preview' | 'gemini-3-pro-preview';
  initialApiKey: string;
}

export const SettingsModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  onSave,
  language, 
  initialModel,
  initialApiKey
}) => {
  const [model, setModel] = useState(initialModel);
  const [apiKey, setApiKey] = useState(initialApiKey);

  // Sync state when opening
  useEffect(() => {
    if (isOpen) {
        setModel(initialModel);
        setApiKey(initialApiKey);
    }
  }, [isOpen, initialModel, initialApiKey]);

  if (!isOpen) return null;
  const t = translations[language];

  const handleSave = () => {
    onSave(model, apiKey);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-brand-surface w-full max-w-md rounded-3xl shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-brand-primary/10 p-6 flex items-center justify-between border-b border-brand-primary/10">
          <h2 className="text-xl font-black text-brand-text flex items-center gap-2">
            {t.settings}
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white hover:bg-brand-bg text-brand-text transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
          {/* Model Selection */}
          <div>
            <label className="block text-sm font-bold text-brand-text/80 mb-4 uppercase tracking-wide">
              {t.aiModel}
            </label>
            <div className="bg-brand-bg p-1.5 rounded-2xl flex relative shadow-inner">
              <button 
                onClick={() => setModel('gemini-3-flash-preview')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold flex flex-col items-center justify-center gap-1 transition-all ${model === 'gemini-3-flash-preview' ? 'bg-white shadow-sm text-brand-primary' : 'text-brand-muted hover:text-brand-text'}`}
              >
                <div className="flex items-center gap-2">
                  <Zap size={16} />
                  <span>Gemini 3 Flash</span>
                </div>
                <span className="text-[10px] opacity-70 font-medium">Fast & Efficient</span>
              </button>
              <button 
                onClick={() => setModel('gemini-3-pro-preview')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold flex flex-col items-center justify-center gap-1 transition-all ${model === 'gemini-3-pro-preview' ? 'bg-white shadow-sm text-brand-primary' : 'text-brand-muted hover:text-brand-text'}`}
              >
                 <div className="flex items-center gap-2">
                  <BrainCircuit size={16} />
                  <span>Gemini 3 Pro</span>
                </div>
                <span className="text-[10px] opacity-70 font-medium">High Reasoning</span>
              </button>
            </div>
          </div>

          {/* API Key Input */}
          <div>
            <label className="block text-sm font-bold text-brand-text/80 mb-4 uppercase tracking-wide">
              {t.apiKey}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-brand-muted">
                <KeyRound size={18} />
              </div>
              <input 
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={t.apiKeyPlaceholder}
                className="w-full pl-11 pr-4 py-3 bg-brand-bg border border-transparent focus:border-brand-primary/30 rounded-xl outline-none transition-all text-brand-text font-mono text-sm placeholder-brand-muted/50"
              />
            </div>
            <p className="text-[10px] text-brand-muted mt-2 ml-1">
              * Applies to both Gemini and Search services below.
            </p>
          </div>

          {/* API Info */}
          <div>
            <label className="block text-sm font-bold text-brand-text/80 mb-4 uppercase tracking-wide">
              {t.requiredApis}
            </label>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-brand-bg rounded-xl border border-transparent hover:border-brand-primary/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                    <Server size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-brand-text">Google Gemini API</div>
                    <div className="text-xs text-brand-muted">Generative Intelligence</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-brand-success bg-brand-success/10 px-2 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-success animate-pulse"></div>
                  Active
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-brand-bg rounded-xl border border-transparent hover:border-brand-primary/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                    <Search size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-brand-text">Google Search</div>
                    <div className="text-xs text-brand-muted">Grounding & Research</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-brand-success bg-brand-success/10 px-2 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-success animate-pulse"></div>
                  Active
                </div>
              </div>
            </div>
          </div>

          {/* About Developer Section */}
          <div>
            <label className="block text-sm font-bold text-brand-text/80 mb-4 uppercase tracking-wide">
              {t.about}
            </label>
            <div className="bg-brand-bg rounded-2xl p-4 space-y-3 border border-brand-primary/5">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="bg-brand-primary/10 p-2 rounded-lg text-brand-primary">
                      <Code size={18} />
                   </div>
                   <div>
                     <div className="text-xs text-brand-muted font-medium">{t.developedBy}</div>
                     <div className="text-sm font-bold text-brand-text">MickeyYKM</div>
                   </div>
                 </div>
              </div>
              
              <div className="w-full h-px bg-brand-text/5"></div>

              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="bg-brand-secondary/30 p-2 rounded-lg text-brand-text">
                      <Mail size={18} />
                   </div>
                   <div>
                     <div className="text-xs text-brand-muted font-medium">{t.contact}</div>
                     <div className="text-sm font-bold text-brand-text">MickeyYKM</div>
                   </div>
                 </div>
              </div>

               <div className="pt-2 text-center">
                  <p className="text-[10px] text-brand-muted/70 font-medium">
                    {t.copyright} {t.developedBy} MickeyYKM.
                  </p>
               </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-brand-primary/10 bg-brand-bg/30 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-brand-text/70 font-bold hover:bg-brand-bg transition-colors text-sm"
          >
            {t.cancel}
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-brand-primary text-white font-bold hover:bg-brand-primaryDark transition-all shadow-md hover:shadow-lg text-sm flex items-center gap-2"
          >
            <Save size={16} />
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
};