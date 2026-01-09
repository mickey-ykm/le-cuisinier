import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { ChefHat, History, Plus, Globe, ArrowRight, Loader2, ArrowLeft, Trash2, UtensilsCrossed, Minus, ExternalLink, Clock, List, Zap, BrainCircuit, Settings, Heart, Utensils, Smile, ChevronDown, ChevronUp } from 'lucide-react';
import { Language, MealPlan } from './types';
import { translations } from './translations';
import { fetchRecipes, generateOrchestration } from './services/geminiService';
import { ShoppingList } from './components/ShoppingList';
import { CookingTimeline } from './components/CookingTimeline';
import { RecipeCard } from './components/RecipeCard';
import { SettingsModal } from './components/SettingsModal';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsConditions } from './components/TermsConditions';

const STORAGE_KEY = 'mise-en-place-plans';
const SETTINGS_STORAGE_KEY = 'mise-en-place-settings';

const App = () => {
  const [language, setLanguage] = useState<Language>('en');
  const [view, setView] = useState<'dashboard' | 'creator' | 'assistant' | 'privacy' | 'terms'>('dashboard');
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<MealPlan | null>(null);
  
  // Settings State
  const [selectedModel, setSelectedModel] = useState<'gemini-3-flash-preview' | 'gemini-3-pro-preview'>('gemini-3-flash-preview');
  const [customApiKey, setCustomApiKey] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Tab State for Assistant View
  const [activeTab, setActiveTab] = useState<'timeline' | 'steps'>('timeline');
  const [isStepsCollapsed, setIsStepsCollapsed] = useState(false);

  // Form State
  const [planTitleInput, setPlanTitleInput] = useState('');
  const [dishesInput, setDishesInput] = useState('');
  const [headcount, setHeadcount] = useState(2);
  const [dietary, setDietary] = useState('');
  const [sideDishCount, setSideDishCount] = useState(0);
  
  // Loading State
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  
  const t = translations[language];

  useEffect(() => {
    // Load Plans
    const savedPlans = localStorage.getItem(STORAGE_KEY);
    if (savedPlans) {
      setPlans(JSON.parse(savedPlans));
    }

    // Load Settings
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (savedSettings) {
      const { model, apiKey } = JSON.parse(savedSettings);
      if (model) setSelectedModel(model);
      if (apiKey) setCustomApiKey(apiKey);
    }
  }, []);

  const handleSaveSettings = (model: 'gemini-3-flash-preview' | 'gemini-3-pro-preview', apiKey: string) => {
    setSelectedModel(model);
    setCustomApiKey(apiKey);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ model, apiKey }));
    setIsSettingsOpen(false);
  };

  const savePlan = (plan: MealPlan) => {
    const updated = [plan, ...plans];
    setPlans(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const deletePlan = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = plans.filter(p => p.id !== id);
    setPlans(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleGenerate = async () => {
    if (!dishesInput) return;
    setLoading(true);
    
    try {
      // Step 1: Research
      setLoadingStep(language === 'zh-TW' 
        ? `🔍 正在搜尋關於 "${dishesInput}" 的食譜...` 
        : `🔍 Researching recipes for "${dishesInput}"...`);
        
      const recipes = await fetchRecipes(dishesInput, headcount, dietary, sideDishCount, language, selectedModel, customApiKey);
      
      if (recipes.length === 0) {
        throw new Error("No recipes found");
      }

      // Step 2: Planning
      setLoadingStep(language === 'zh-TW'
        ? `🥬 找到 ${recipes.length} 道料理。正在規劃廚房動線與時間表...`
        : `🥬 Found ${recipes.length} dishes. Orchestrating kitchen workflow...`);

      const { timeline, shoppingList, totalTime } = await generateOrchestration(recipes, language, selectedModel, customApiKey);

      // Step 3: Finalizing
      setLoadingStep(language === 'zh-TW' 
        ? "✨ 正在完成最終計畫..." 
        : "✨ Finalizing plan...");

      const title = planTitleInput.trim() || (dishesInput + (sideDishCount > 0 ? ` + ${sideDishCount} sides` : ''));

      const newPlan: MealPlan = {
        id: Date.now().toString(),
        createdAt: Date.now(),
        title: title,
        guestCount: headcount,
        dietaryRestrictions: dietary,
        recipes,
        shoppingList,
        timeline,
        totalEstimatedTimeMinutes: totalTime,
      };

      savePlan(newPlan);
      setCurrentPlan(newPlan);
      setView('assistant');
      setActiveTab('timeline'); // Reset tab
      // Reset inputs slightly but maybe keep some preferences? Let's clear unique inputs.
      setPlanTitleInput(''); 
    } catch (err) {
      console.error(err);
      alert("Failed to generate plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openPlan = (plan: MealPlan) => {
    setCurrentPlan(plan);
    setView('assistant');
    setActiveTab('timeline');
    setIsStepsCollapsed(false);
  };

  // --- Views ---

  const renderDashboard = () => (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="bg-brand-surface rounded-3xl p-8 md:p-12 shadow-soft mb-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-secondary/20 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-primary/10 rounded-full blur-2xl -ml-12 -mb-12 transition-transform group-hover:scale-110"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-left md:w-2/3">
             <div className="inline-flex items-center gap-2 bg-brand-secondary/30 px-3 py-1 rounded-full text-brand-text text-sm font-semibold mb-4">
                <ChefHat size={16} className="text-brand-primary" />
                <span>AI Chef Assistant</span>
             </div>
             <h1 className="text-4xl md:text-6xl font-black tracking-tight text-brand-text mb-4">
               {t.appTitle}
             </h1>
             <p className="text-brand-text/70 text-lg mb-8 max-w-md font-medium leading-relaxed">
               {t.subtitle}
             </p>
             <button 
               onClick={() => setView('creator')}
               className="bg-brand-primary hover:bg-brand-primaryDark text-white px-8 py-4 rounded-full font-bold flex items-center gap-3 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
             >
               <Plus size={22} strokeWidth={3} />
               {t.startNew}
             </button>
          </div>
          <div className="hidden md:block md:w-1/3 flex justify-center">
             <div className="relative">
               <div className="absolute inset-0 bg-brand-secondary rounded-full blur-xl opacity-40"></div>
               <ChefHat size={160} className="text-brand-primary relative z-10 drop-shadow-lg" />
               <UtensilsCrossed size={60} className="text-brand-text absolute -bottom-4 -right-4 z-20 bg-brand-bg p-4 rounded-full shadow-soft" />
             </div>
          </div>
        </div>
      </div>

      {/* Share the Joy Banner */}
      <div className="bg-gradient-to-r from-brand-primary to-brand-primaryDark rounded-2xl p-6 mb-12 flex items-center justify-between shadow-soft text-white relative overflow-hidden">
         {/* decorative background shapes */}
         <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_50%_120%,#fff_0%,transparent_50%)]"></div>
         <div className="relative z-10 flex items-center gap-4 mx-auto md:mx-0">
            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
               <Heart size={24} className="text-white" fill="currentColor" />
            </div>
            <span className="font-black text-xl md:text-2xl tracking-wide uppercase">
               {t.shareJoy}
            </span>
         </div>
         <div className="hidden md:flex relative z-10 gap-3 opacity-80 mr-4">
            <Utensils size={24} />
            <Smile size={24} />
         </div>
      </div>

      {/* History */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-brand-text flex items-center gap-3 px-2">
          <History className="text-brand-primary" />
          {t.history}
        </h2>
        
        {plans.length === 0 ? (
          <div className="text-center py-20 bg-brand-surface rounded-3xl border-2 border-dashed border-brand-secondary/50">
            <p className="text-brand-muted text-lg font-medium">{t.noHistory}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map(plan => (
              <div 
                key={plan.id} 
                onClick={() => openPlan(plan)}
                className="bg-brand-surface p-6 rounded-3xl shadow-soft hover:shadow-hover transition-all cursor-pointer group relative border border-transparent hover:border-brand-secondary/30"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-xl text-brand-text line-clamp-1">{plan.title}</h3>
                  <div className="bg-brand-bg px-3 py-1 rounded-full text-xs text-brand-muted font-bold tracking-wide">
                    {new Date(plan.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="space-y-2 text-sm text-brand-text/70 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="bg-brand-secondary/20 p-1 rounded-md">👥</span> {plan.guestCount} {t.guests === '用餐人數' ? '人' : 'Guests'}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-brand-primary/20 p-1 rounded-md">⏱️</span> {plan.totalEstimatedTimeMinutes} {t.minutes}
                  </div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-brand-bg">
                  <span className="text-brand-primary text-sm font-bold group-hover:underline flex items-center gap-1">
                    {t.open} <ArrowRight size={16} />
                  </span>
                  <button 
                    onClick={(e) => deletePlan(plan.id, e)}
                    className="text-brand-muted hover:text-red-400 hover:bg-red-50 p-2 rounded-full transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderCreator = () => (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <button 
        onClick={() => setView('dashboard')}
        className="mb-8 text-brand-text/60 hover:text-brand-primary flex items-center gap-2 transition-colors font-bold"
      >
        <ArrowLeft size={20} /> {t.back}
      </button>

      <div className="bg-brand-surface rounded-3xl shadow-soft p-10 relative overflow-hidden">
        {loading && (
           <div className="absolute inset-0 bg-brand-surface/95 z-20 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300 backdrop-blur-sm">
              <div className="bg-brand-bg p-6 rounded-full shadow-soft mb-6 relative">
                 <Loader2 className="w-16 h-16 text-brand-primary animate-spin relative z-10" />
                 <div className="absolute inset-0 bg-brand-primary/20 blur-xl rounded-full animate-pulse"></div>
              </div>
              <h3 className="text-2xl font-black text-brand-text mb-2">{t.generating}</h3>
              <p className="text-brand-text/70 text-lg animate-pulse font-medium max-w-md">{loadingStep}</p>
           </div>
        )}

        <h2 className="text-3xl font-black text-brand-text mb-8 flex items-center gap-3">
          <span className="bg-brand-secondary p-2 rounded-xl text-brand-text">📝</span>
          <span>{t.step1}</span>
        </h2>
        
        <div className="space-y-8">
          {/* Plan Name Input */}
          <div>
            <label className="block text-sm font-bold text-brand-text/80 mb-3 uppercase tracking-wide">
               {t.planName} <span className="text-brand-muted normal-case font-normal ml-1">({t.optional})</span>
            </label>
            <input 
              type="text" 
              value={planTitleInput}
              onChange={(e) => setPlanTitleInput(e.target.value)}
              placeholder={t.planNamePlaceholder}
              className="w-full p-4 bg-brand-bg border-none rounded-2xl focus:ring-4 focus:ring-brand-primary/20 outline-none transition-all text-lg font-medium placeholder-brand-muted/50 text-brand-text shadow-inner"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-brand-text/80 mb-3 uppercase tracking-wide">{t.dishes}</label>
            <input 
              type="text" 
              value={dishesInput}
              onChange={(e) => setDishesInput(e.target.value)}
              placeholder="e.g., Beef Wellington, Mushroom Soup"
              className="w-full p-4 bg-brand-bg border-none rounded-2xl focus:ring-4 focus:ring-brand-primary/20 outline-none transition-all text-lg font-medium placeholder-brand-muted/50 text-brand-text shadow-inner"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-bold text-brand-text/80 mb-3 uppercase tracking-wide">{t.guests}</label>
              <input 
                type="number" 
                min={1}
                value={headcount}
                onChange={(e) => setHeadcount(parseInt(e.target.value))}
                className="w-full p-4 bg-brand-bg border-none rounded-2xl focus:ring-4 focus:ring-brand-primary/20 outline-none transition-all text-lg font-medium text-brand-text shadow-inner"
                disabled={loading}
              />
            </div>
            
            {/* Side Dish Counter Input */}
            <div>
              <label className="block text-sm font-bold text-brand-text/80 mb-3 uppercase tracking-wide">{t.sideDishCount}</label>
              <div className="flex items-center justify-between bg-brand-bg p-2 rounded-2xl shadow-inner border border-transparent">
                 <button 
                   onClick={() => setSideDishCount(Math.max(0, sideDishCount - 1))}
                   disabled={loading || sideDishCount <= 0}
                   className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm hover:shadow-md text-brand-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                 >
                   <Minus size={20} strokeWidth={3} />
                 </button>
                 <span className="font-black text-xl text-brand-text w-8 text-center">{sideDishCount}</span>
                 <button 
                   onClick={() => setSideDishCount(Math.min(5, sideDishCount + 1))}
                   disabled={loading || sideDishCount >= 5}
                   className="w-10 h-10 flex items-center justify-center bg-brand-primary text-white rounded-xl shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                 >
                   <Plus size={20} strokeWidth={3} />
                 </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-brand-text/80 mb-3 uppercase tracking-wide">
              {t.dietary} <span className="text-brand-muted normal-case font-normal ml-1">({t.optional})</span>
            </label>
            <input 
              type="text" 
              value={dietary}
              onChange={(e) => setDietary(e.target.value)}
              placeholder="e.g., No nuts, Vegetarian guest"
              className="w-full p-4 bg-brand-bg border-none rounded-2xl focus:ring-4 focus:ring-brand-primary/20 outline-none transition-all text-lg font-medium placeholder-brand-muted/50 text-brand-text shadow-inner"
              disabled={loading}
            />
          </div>

          <button 
            onClick={handleGenerate}
            disabled={!dishesInput || loading}
            className={`w-full py-5 rounded-full font-black text-lg flex items-center justify-center gap-3 transition-all mt-6
              ${!dishesInput || loading 
                ? 'bg-brand-bg text-brand-muted cursor-not-allowed' 
                : 'bg-brand-primary hover:bg-brand-primaryDark text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1'}`}
          >
            <ChefHat size={24} />
            {t.generatePlan}
          </button>
        </div>
      </div>
    </div>
  );

  const renderAssistant = () => {
    if (!currentPlan) return null;

    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4">
          <button 
            onClick={() => setView('dashboard')}
            className="text-brand-text/70 hover:text-brand-primary flex items-center gap-2 transition-colors font-bold bg-brand-surface px-5 py-3 rounded-full shadow-soft hover:shadow-hover self-start md:self-auto"
          >
            <ArrowLeft size={20} /> {t.back}
          </button>
          <div className="text-right md:text-right w-full md:w-auto">
            <h1 className="text-3xl md:text-4xl font-black text-brand-text mb-2">{currentPlan.title}</h1>
            <div className="flex items-center justify-end gap-3 text-brand-text/70 font-semibold">
               <span className="bg-brand-secondary/20 px-3 py-1 rounded-full">👥 {currentPlan.guestCount} {t.guests === '用餐人數' ? '人' : 'Guests'}</span>
               <span className="bg-brand-primary/20 px-3 py-1 rounded-full">⏱️ {currentPlan.totalEstimatedTimeMinutes} {t.minutes}</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Col: Recipes & Shopping List (4 cols) */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-brand-surface p-8 rounded-3xl shadow-soft">
               <h3 className="font-black text-brand-text mb-6 text-xl flex items-center gap-2">
                 <span>🍱</span> {t.overview}
               </h3>
               <div className="space-y-4">
                 {currentPlan.recipes.map(r => (
                   <RecipeCard key={r.id} recipe={r} language={language} apiKey={customApiKey} />
                 ))}
               </div>
            </div>

            <ShoppingList ingredients={currentPlan.shoppingList} language={language} />
          </div>

          {/* Right Col: Timeline & Steps Toggler (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Tab Switcher */}
            <div className="flex bg-brand-surface p-1.5 rounded-2xl shadow-sm w-full sm:w-auto self-start">
              <button 
                onClick={() => setActiveTab('timeline')}
                className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'timeline' 
                    ? 'bg-brand-primary text-white shadow-md' 
                    : 'text-brand-text/60 hover:bg-brand-bg'
                }`}
              >
                <Clock size={18} />
                {t.viewTimeline}
              </button>
              <button 
                onClick={() => setActiveTab('steps')}
                className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'steps' 
                    ? 'bg-brand-primary text-white shadow-md' 
                    : 'text-brand-text/60 hover:bg-brand-bg'
                }`}
              >
                <List size={18} />
                {t.viewSteps}
              </button>
            </div>

            {/* View Content */}
            {activeTab === 'timeline' ? (
              <CookingTimeline 
                events={currentPlan.timeline} 
                totalMinutes={currentPlan.totalEstimatedTimeMinutes}
                language={language}
              />
            ) : (
              <div className="bg-brand-surface p-8 rounded-3xl shadow-soft animate-in fade-in slide-in-from-bottom-4 duration-300 transition-all">
                 <div 
                   className="flex items-center justify-between cursor-pointer group mb-2" 
                   onClick={() => setIsStepsCollapsed(!isStepsCollapsed)}
                 >
                   <h3 className="font-black text-brand-text text-xl flex items-center gap-2">
                     <span>👣</span> {t.steps}
                   </h3>
                   <button className="text-brand-muted hover:text-brand-text transition-colors">
                      {isStepsCollapsed ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
                   </button>
                 </div>
                 
                 {!isStepsCollapsed && (
                   <div className="space-y-1 animate-in slide-in-from-top-4 duration-300 pt-4">
                     {currentPlan.timeline.sort((a,b) => a.startTimeOffset - b.startTimeOffset).map((event, idx) => (
                       <div key={idx} className="flex gap-5 p-4 hover:bg-brand-bg rounded-2xl transition-all group">
                          <div className="min-w-[80px] flex flex-col items-end pt-1">
                            <span className="text-lg font-bold text-brand-text">T+{event.startTimeOffset}</span>
                            <span className="text-xs text-brand-muted font-mono">{event.duration}m</span>
                          </div>
                          
                          {/* Timeline Line Decorator */}
                          <div className="relative flex flex-col items-center">
                            <div className={`w-4 h-4 rounded-full z-10 
                               ${event.type === 'active' ? 'bg-brand-primary shadow-[0_0_10px_rgba(255,158,115,0.6)]' : 'bg-brand-secondary'}`} 
                            />
                            {idx !== currentPlan.timeline.length - 1 && (
                              <div className="w-0.5 bg-brand-bg flex-grow absolute top-4 bottom-[-16px]"></div>
                            )}
                          </div>

                          <div className="pb-4 w-full">
                            <div className="font-bold text-brand-text text-lg leading-snug">
                               {event.task}
                            </div>
                            <div className="text-sm text-brand-muted mt-2 flex items-center gap-2">
                              <span className="font-semibold text-brand-text/70 bg-brand-bg px-3 py-1 rounded-lg text-xs">
                                {event.recipeName}
                              </span>
                               {event.critical && (
                                 <span className="text-xs text-brand-primary font-bold flex items-center gap-1 bg-brand-primary/5 px-2 py-1 rounded-full">
                                   ⚡ Critical Path
                                 </span>
                               )}
                            </div>
                          </div>
                       </div>
                     ))}
                   </div>
                 )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-brand-bg pb-20 font-sans flex flex-col">
      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
        language={language}
        initialModel={selectedModel}
        initialApiKey={customApiKey}
      />

      {/* Header */}
      <header className="bg-brand-surface/80 backdrop-blur-md sticky top-0 z-50 shadow-sm flex-none">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('dashboard')}>
            <div className="bg-brand-primary text-white p-2 rounded-xl group-hover:rotate-12 transition-transform shadow-lg shadow-brand-primary/30">
               <ChefHat size={24} />
            </div>
            <span className="font-black text-2xl text-brand-text tracking-tight">
              {t.appTitle}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              disabled={loading}
              className={`w-10 h-10 flex items-center justify-center rounded-full bg-brand-bg hover:bg-brand-secondary/30 text-brand-text/70 hover:text-brand-text transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Settings size={20} />
            </button>

            <button 
              onClick={() => setLanguage(l => l === 'en' ? 'zh-TW' : 'en')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-bg hover:bg-brand-secondary/30 text-brand-text text-sm font-bold transition-colors shadow-soft"
            >
              <Globe size={18} />
              {language === 'en' ? 'English' : '繁體中文'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {view === 'dashboard' && renderDashboard()}
        {view === 'creator' && renderCreator()}
        {view === 'assistant' && renderAssistant()}
        {view === 'privacy' && <PrivacyPolicy onBack={() => setView('dashboard')} language={language} />}
        {view === 'terms' && <TermsConditions onBack={() => setView('dashboard')} language={language} />}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-brand-muted/70 font-medium border-t border-brand-secondary/10 flex-none flex flex-col gap-3">
        <p>{t.copyright} {t.developedBy} <span className="text-brand-primary font-bold">MickeyYKM</span></p>
        <div className="flex justify-center gap-4">
          <button onClick={() => setView('privacy')} className="hover:text-brand-primary transition-colors hover:underline">
             {t.privacyPolicy}
          </button>
          <button onClick={() => setView('terms')} className="hover:text-brand-primary transition-colors hover:underline">
             {t.termsConditions}
          </button>
        </div>
      </footer>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);