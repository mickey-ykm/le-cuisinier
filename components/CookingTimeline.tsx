import React, { useState } from 'react';
import { TimelineEvent } from '../types';
import { Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  events: TimelineEvent[];
  totalMinutes: number;
  language: 'en' | 'zh-TW';
}

export const CookingTimeline: React.FC<Props> = ({ events, totalMinutes, language }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const sortedEvents = [...events].sort((a, b) => a.startTimeOffset - b.startTimeOffset);

  // Generate time markers for the graph header
  const markers: number[] = [];
  const markerCount = 6; // How many time labels to show
  for (let i = 0; i <= markerCount; i++) {
    markers.push(Math.round((totalMinutes / markerCount) * i));
  }

  return (
    <div className="bg-brand-surface p-8 rounded-3xl shadow-soft transition-all">
      <div 
        className="flex items-center justify-between cursor-pointer group" 
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3 text-brand-primary">
          <div className="bg-brand-primary/10 p-3 rounded-2xl group-hover:bg-brand-primary/20 transition-colors">
            <Clock size={24} />
          </div>
          <h2 className="text-2xl font-black text-brand-text">{language === 'zh-TW' ? '烹飪時程表' : 'Execution Timeline'}</h2>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="text-sm bg-brand-secondary/30 text-brand-text px-5 py-2 rounded-full font-bold">
             {language === 'zh-TW' ? '總耗時' : 'Total Time'}: {totalMinutes} {language === 'zh-TW' ? '分鐘' : 'mins'}
           </div>
           <button className="text-brand-muted hover:text-brand-text transition-colors">
              {isCollapsed ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
           </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="animate-in slide-in-from-top-4 duration-300 mt-8">
          <div className="w-full">
            {/* Header Row */}
            <div className="flex pb-4 mb-2 text-xs font-bold text-brand-muted uppercase tracking-wider">
              <div className="w-[60%] pl-2">{language === 'zh-TW' ? '任務詳情' : 'Task Details'}</div>
              <div className="w-[40%] relative h-6">
                {markers.map((m, i) => (
                   <div 
                     key={i} 
                     className="absolute transform -translate-x-1/2 text-brand-muted/60 font-mono" 
                     style={{ left: `${(m / totalMinutes) * 100}%` }}
                   >
                     T+{m}
                   </div>
                ))}
              </div>
            </div>

            {/* Rows */}
            <div className="space-y-4">
              {sortedEvents.map((event, idx) => {
                const startPercent = (event.startTimeOffset / totalMinutes) * 100;
                const widthPercent = (event.duration / totalMinutes) * 100;
                
                return (
                  <div key={idx} className="flex group hover:bg-brand-bg rounded-2xl p-3 transition-colors -mx-3 items-center">
                    {/* Left: Text Content (60%) */}
                    <div className="w-[60%] pr-6 flex flex-col justify-center">
                      <div className="font-bold text-brand-text text-lg leading-tight mb-1">
                        {event.task}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm">
                         <span className="text-brand-text/60 font-medium bg-brand-surface px-2 py-0.5 rounded-lg text-xs shadow-sm">
                           {event.recipeName}
                         </span>
                         <span className="text-brand-muted text-xs font-mono">
                           {event.duration}m
                         </span>
                         {event.critical && (
                           <span className="text-brand-primary font-bold text-xs bg-brand-primary/10 px-2 py-0.5 rounded-full">
                             Critical
                           </span>
                         )}
                      </div>
                    </div>

                    {/* Right: Bar Chart (40%) */}
                    <div className="w-[40%] relative h-10 bg-brand-bg rounded-xl overflow-hidden my-auto">
                       {/* Grid lines for context */}
                       {markers.map((m, i) => (
                          <div 
                            key={i} 
                            className="absolute top-0 bottom-0 border-r border-brand-muted/10" 
                            style={{ left: `${(m / totalMinutes) * 100}%` }}
                          />
                       ))}

                       {/* The Actual Bar */}
                       <div 
                         className={`absolute top-2 bottom-2 rounded-lg shadow-sm transition-all group-hover:scale-y-110
                           ${event.type === 'active' 
                             ? 'bg-brand-primary' 
                             : 'bg-brand-secondary'
                           }
                         `}
                         style={{ 
                           left: `${startPercent}%`, 
                           width: `${widthPercent}%`,
                           minWidth: '6px' // Ensure visibility for very short tasks
                         }}
                       >
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-8 mt-10 justify-center text-sm border-t border-brand-muted/10 pt-6">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-brand-primary rounded-full shadow-sm"></div>
              <span className="text-brand-text font-bold">{language === 'zh-TW' ? '主動操作 (切菜/炒)' : 'Active (Prep/Cook)'}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-brand-secondary rounded-full shadow-sm"></div>
              <span className="text-brand-text font-bold">{language === 'zh-TW' ? '被動等待 (烤/煮)' : 'Passive (Roast/Simmer)'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
