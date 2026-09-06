import React, { useEffect, useState } from 'react';
import { 
  Radio, 
  ExternalLink, 
  RefreshCw, 
  ChevronRight, 
  Landmark, 
  Search, 
  X, 
  CheckCircle2, 
  Clock,
  Pause,
  Play,
  FileText
} from 'lucide-react';
import { 
  getLiveTaxNews, 
  getFreshStatutoryFeed, 
  TaxNewsArticle 
} from '../../services/taxNewsService';

export type { TaxNewsArticle };

export function TaxNewsTicker() {
  // Initialize with verified fresh statutory articles immediately so ticker is never blank
  const [articles, setArticles] = useState<TaxNewsArticle[]>(() => getFreshStatutoryFeed());
  const [isLive, setIsLive] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Playback Control (Pause / Resume)
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const fetchNews = async (forceRefresh = false) => {
    if (forceRefresh) setIsRefreshing(true);
    try {
      const data = await getLiveTaxNews(forceRefresh);
      if (data && data.articles && data.articles.length > 0) {
        // Guarantee unique IDs across incoming articles
        const seen = new Set<string>();
        const uniqueArticles: TaxNewsArticle[] = [];
        for (const item of data.articles) {
          if (item && item.id && !seen.has(item.id)) {
            seen.add(item.id);
            uniqueArticles.push(item);
          }
        }
        setArticles(uniqueArticles);
        setIsLive(data.isLive !== false);
        setLastUpdated(data.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '');
      }
    } catch (err) {
      console.warn('Failed to fetch live tax news ticker:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews();
    // Auto-refresh feeds every 5 minutes
    const interval = setInterval(() => {
      fetchNews(false);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'GST':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'INCOME TAX':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'MCA / ROC':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'GOVT / PIB':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'AUDIT / ICAI':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default:
        return 'bg-zinc-700/50 text-zinc-300 border-zinc-600';
    }
  };

  const filteredArticles = articles.filter(a => {
    const matchesCat = selectedCategory === 'ALL' || a.category === selectedCategory;
    const matchesSearch = !searchQuery.trim() || 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.source.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const categories = ['ALL', 'GST', 'INCOME TAX', 'MCA / ROC', 'GOVT / PIB', 'AUDIT / ICAI'];

  // Steady, readable animation duration
  const ANIMATION_DURATION = '240s';

  return (
    <>
      <div 
        id="tax-live-news-ticker-bar"
        className="hidden lg:flex bg-zinc-950 text-zinc-200 items-center h-7 sm:h-7.5 shrink-0 relative overflow-hidden z-30 shadow-xs border-b border-zinc-800 select-none"
      >
        {/* Left Badge: Live Updates Status */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-indigo-900 to-indigo-800 hover:from-indigo-800 hover:to-indigo-700 text-white font-bold text-[10px] tracking-wide px-2.5 h-full flex items-center shrink-0 z-20 shadow-[2px_0_8px_rgba(0,0,0,0.3)] gap-1.5 border-r border-indigo-700/40 transition-colors cursor-pointer group"
          title="Click to browse all real-time statutory circulars & news"
        >
          <div className="relative flex items-center justify-center">
            <Radio className="w-3 h-3 text-red-400 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-red-500 rounded-full animate-ping"></span>
          </div>
          <span className="uppercase text-[9px] font-extrabold tracking-wider text-indigo-100">
            {isLive ? 'Live Feed' : 'Tax Updates'}
          </span>
          <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
        </button>

        {/* Center Marquee Content (Slow, highly readable glide) */}
        <div className="flex-1 overflow-hidden relative flex items-center h-full">
          {loading ? (
            <div className="flex items-center gap-1.5 pl-3 text-[11px] text-zinc-400">
              <RefreshCw className="w-2.5 h-2.5 animate-spin text-indigo-400" />
              <span>Connecting to official PIB, CBIC, and tax circular feeds...</span>
            </div>
          ) : (
            <div 
              className="whitespace-nowrap flex items-center gap-8 pl-3"
              style={{
                animation: `tickerAnim ${ANIMATION_DURATION} linear infinite`,
                animationPlayState: isPaused ? 'paused' : 'running'
              }}
            >
              {/* Primary list */}
              {articles.map((item, idx) => (
                <a
                  key={`ticker-primary-${item.id}-${idx}`}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[11px] text-zinc-200 hover:text-white group transition-colors py-0.5 cursor-pointer"
                >
                  <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border shadow-2xs ${getCategoryColor(item.category)}`}>
                    {item.category}
                  </span>

                  {item.isOfficialGovt && (
                    <span className="text-[8px] font-semibold bg-emerald-950/90 text-emerald-300 border border-emerald-600/50 px-1 py-0.5 rounded flex items-center gap-0.5">
                      <Landmark className="w-2.5 h-2.5 text-emerald-400" /> Govt
                    </span>
                  )}

                  <span className="font-medium text-zinc-100 group-hover:underline group-hover:text-indigo-200 underline-offset-2 text-[11.5px] tracking-tight">
                    {item.title}
                  </span>

                  <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-mono">
                    • <span className="text-zinc-300">{item.source}</span> • <span className="text-zinc-500">{item.formattedTime}</span>
                  </span>

                  <span className="w-1 h-1 rounded-full bg-indigo-500/80 ml-2"></span>
                </a>
              ))}

              {/* Seamless duplicate for smooth infinite loop */}
              {articles.map((item, idx) => (
                <a
                  key={`ticker-dup-${item.id}-${idx}`}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[11px] text-zinc-200 hover:text-white group transition-colors py-0.5 cursor-pointer"
                >
                  <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border shadow-2xs ${getCategoryColor(item.category)}`}>
                    {item.category}
                  </span>

                  {item.isOfficialGovt && (
                    <span className="text-[8px] font-semibold bg-emerald-950/90 text-emerald-300 border border-emerald-600/50 px-1 py-0.5 rounded flex items-center gap-0.5">
                      <Landmark className="w-2.5 h-2.5 text-emerald-400" /> Govt
                    </span>
                  )}

                  <span className="font-medium text-zinc-100 group-hover:underline group-hover:text-indigo-200 underline-offset-2 text-[11.5px] tracking-tight">
                    {item.title}
                  </span>

                  <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-mono">
                    • <span className="text-zinc-300">{item.source}</span> • <span className="text-zinc-500">{item.formattedTime}</span>
                  </span>

                  <span className="w-1 h-1 rounded-full bg-indigo-500/80 ml-2"></span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Right Controls: Play/Pause and All Updates Only */}
        <div className="flex items-center gap-1.5 bg-zinc-950 px-2 h-full shrink-0 z-20 border-l border-zinc-800">
          {/* Pause / Resume Button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? "Resume Live Marquee" : "Pause Ticker to Read"}
            className={`px-2 py-0.5 rounded-full transition-colors flex items-center gap-1 text-[10px] font-semibold cursor-pointer ${
              isPaused 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            {isPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3" />}
            <span className="hidden sm:inline text-[9.5px]">{isPaused ? 'Resume' : 'Pause'}</span>
          </button>

          {/* All Updates Modal Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-zinc-200 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-full flex items-center gap-0.5 transition-all cursor-pointer"
          >
            <span>All Updates</span>
            <ChevronRight className="w-2.5 h-2.5" />
          </button>
        </div>

        {/* Smooth Linear Marquee Style */}
        <style>{`
          @keyframes tickerAnim {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          #tax-live-news-ticker-bar:hover .animate-ticker {
            animation-play-state: paused;
          }
        `}</style>
      </div>

      {/* Modal: Full Live Regulatory & Tax Bulletins */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[88vh] shadow-2xl flex flex-col border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-zinc-900">Live Tax & Government Regulatory Bulletins</h2>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Real-Time
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Continuous live updates sourced from PIB, News On AIR, CBIC, CBDT, MCA, and leading tax journals.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchNews(true)}
                  disabled={isRefreshing}
                  className="px-3.5 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-full flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : 'text-zinc-500'}`} />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter Bar & Search */}
            <div className="p-4 border-b border-zinc-100 bg-white flex flex-col sm:flex-row items-center gap-3 justify-between">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-zinc-900 text-white shadow-xs'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search live circulars..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs border border-zinc-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-zinc-50"
                />
              </div>
            </div>

            {/* Articles List */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-zinc-100 space-y-2">
              {filteredArticles.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 text-xs">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                  No regulatory updates found matching your search.
                </div>
              ) : (
                filteredArticles.map((article, idx) => (
                  <div
                    key={`modal-item-${article.id}-${idx}`}
                    className="pt-3 first:pt-0 flex items-start justify-between gap-4 group hover:bg-zinc-50/70 p-3 rounded-xl transition-colors"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
                          {article.category}
                        </span>

                        {article.isOfficialGovt && (
                          <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Landmark className="w-3 h-3 text-emerald-600" /> Official Govt
                          </span>
                        )}

                        <span className="text-xs font-semibold text-zinc-700">
                          {article.source}
                        </span>

                        <span className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" /> {article.formattedTime}
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold text-zinc-900 group-hover:text-indigo-600 transition-colors leading-snug">
                        {article.title}
                      </h3>
                    </div>

                    <a
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 rounded-full flex items-center gap-1 shrink-0 transition-colors mt-1 cursor-pointer"
                    >
                      <span>Read</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3.5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Showing {filteredArticles.length} active updates from {articles.length} live publications</span>
              </span>
              <span className="text-[11px] text-zinc-400">
                Auto-refreshes every 5 mins
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
