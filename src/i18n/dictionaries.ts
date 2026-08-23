import type { Locale } from "./config";

// 介面字串字典型別；兩套語系（zh-TW / en）必須提供相同結構
export interface Dictionary {
  appTitle: string;
  nav: {
    popular: string;
    upcoming: string;
    search: string;
    favorites: string;
    watchlist: string;
    watched: string;
    history: string;
    recommendations: string;
    topRated: string;
    highestGrossing: string;
    browse: string;
  };
  language: { label: string; zhTW: string; en: string };
  pages: {
    popular: string;
    popularSubtitle: string;
    upcoming: string;
    upcomingSubtitle: string;
    favorites: string;
    watchlist: string;
    watched: string;
    history: string;
    recommendations: string;
    recommendationsEyebrow: string;
    recommendationsSubtitle: string;
    topRated: string;
    topRatedSubtitle: string;
    highestGrossing: string;
    highestGrossingSubtitle: string;
    browse: string;
  };
  search: {
    placeholder: string;
    button: string;
    prompt: string;
    resultsFor: string;
    noResults: string;
    eyebrow: string;
    title: string;
    subtitle: string;
  };
  library: {
    remove: string;
    sortAdded: string;
    sortTitle: string;
    sortRating: string;
    ratingPlaceholder: string;
    emptyFavorites: string;
    emptyWatchlist: string;
    emptyWatched: string;
    favoritesEyebrow: string;
    favoritesTitle: string;
    favoritesSubtitle: string;
    watchlistEyebrow: string;
    watchlistTitle: string;
    watchlistSubtitle: string;
    watchedEyebrow: string;
    watchedTitle: string;
    watchedSubtitle: string;
  };
  history: {
    empty: string;
    clear: string;
    clearShort: string;
    justNow: string;
    earlierToday: string;
    yesterday: string;
    daysAgo: string;
  };
  recommendations: { related: string; relatedEmpty: string; forYouEmpty: string };
  movie: {
    overview: string;
    noOverview: string;
    releaseDate: string;
    runtime: string;
    minutes: string;
    genres: string;
    originalTitle: string;
    rating: string;
    trailer: string;
    cast: string;
    director: string;
    back: string;
  };
  person: { filmography: string; noBio: string };
  browse: {
    genre: string;
    year: string;
    sort: string;
    all: string;
    minRating: string;
    sortPopular: string;
    sortRating: string;
    sortNewest: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    genrePlaceholder: string;
    yearPlaceholder: string;
    ratingPlaceholder: string;
    loading: string;
    empty: string;
    noMore: string;
    clearFilters: string;
    summaryPrefix: string;
    summaryAll: string;
    summaryRatingSuffix: string;
    popularFirst: string;
    highestRatedFirst: string;
    newestFirst: string;
  };
  rating: {
    title: string;
    scorePrompt: string;
    note: string;
    notePlaceholder: string;
    save: string;
    saved: string;
    clear: string;
  };
  actions: {
    favorite: string;
    favorited: string;
    watchlist: string;
    watchlistAdded: string;
    watched: string;
    watchedDone: string;
    comingSoon: string;
  };
  demo: {
    actionNote: string;
    ratingNote: string;
    libraryEmpty: string;
    recommendationsEmpty: string;
    keepBrowsing: string;
  };
  home: {
    eyebrow: string;
    title: string;
    subtitle: string;
    rows: {
      forYou: { eyebrow: string; title: string };
      popular: { eyebrow: string; title: string };
      topRated: { eyebrow: string; title: string };
      grossing: { eyebrow: string; title: string };
      upcoming: { eyebrow: string; title: string };
    };
  };
  common: {
    empty: string;
    loading: string;
    noMore: string;
    loadError: string;
    retry: string;
    seeAll: string;
    viewDetails: string;
  };
  errors: {
    missingKey: string;
    invalidKey: string;
    network: string;
    http: string;
    notFound: string;
    generic: string;
  };
}

const zhTW: Dictionary = {
  appTitle: "Treehole",
  nav: {
    popular: "熱門",
    upcoming: "即將上映",
    search: "搜尋",
    favorites: "收藏",
    watchlist: "想看",
    watched: "已看過",
    history: "搜尋紀錄",
    recommendations: "推薦",
    topRated: "影史評分",
    highestGrossing: "史上最賣座",
    browse: "瀏覽",
  },
  language: { label: "語言", zhTW: "繁體中文", en: "English" },
  pages: {
    popular: "熱門電影",
    popularSubtitle: "從這裡看大家都在看什麼。",
    upcoming: "即將上映（台灣）",
    upcomingSubtitle: "即將在台灣上映的片，先排好。",
    favorites: "我的收藏",
    watchlist: "想看清單",
    watched: "已看過",
    history: "搜尋紀錄",
    recommendations: "為你推薦",
    recommendationsEyebrow: "為你",
    recommendationsSubtitle: "依你看過、留下的，一點一點更新。",
    topRated: "影史評分最高",
    topRatedSubtitle: "評分扛得住時間的，都在這裡。",
    highestGrossing: "史上最賣座（票房）",
    highestGrossingSubtitle: "按全球票房排序。",
    browse: "瀏覽電影",
  },
  search: {
    placeholder: "輸入電影名稱…",
    button: "搜尋",
    prompt: "輸入關鍵字開始搜尋電影。",
    resultsFor: "搜尋結果",
    noResults: "找不到符合的電影。",
    eyebrow: "找片",
    title: "在找哪一部?",
    subtitle: "輸入片名，或從最近找過的接著看。",
  },
  library: {
    remove: "拿掉",
    sortAdded: "最近加入",
    sortTitle: "片名",
    sortRating: "評分",
    ratingPlaceholder: "不限評分",
    emptyFavorites: "還沒有收藏。看到喜歡的，就留在這裡。",
    emptyWatchlist: "清單還空著。挑幾部，排進來。",
    emptyWatched: "還沒標記看過的片。看完一部，就記在這裡。",
    favoritesEyebrow: "收藏",
    favoritesTitle: "留下來的",
    favoritesSubtitle: "捨不得放掉的那些片，都在這裡。",
    watchlistEyebrow: "想看",
    watchlistTitle: "排隊中",
    watchlistSubtitle: "欠自己的那些片，慢慢看。",
    watchedEyebrow: "看過",
    watchedTitle: "走過的",
    watchedSubtitle: "看完的都記得，回頭再看看。",
  },
  history: {
    empty: "還沒找過任何電影。輸入片名，從這裡開始。",
    clear: "清除全部",
    clearShort: "清除",
    justNow: "剛剛",
    earlierToday: "今晚稍早",
    yesterday: "昨天",
    daysAgo: "{n} 天前",
  },
  recommendations: {
    related: "相關推薦",
    relatedEmpty: "暫無相關推薦。",
    forYouEmpty:
      "還沒有足夠的資料可推薦。先到電影詳情頁收藏或標記幾部已看過的電影，這裡就會依你的喜好推薦。",
  },
  movie: {
    overview: "簡介",
    noOverview: "暫無簡介。",
    releaseDate: "上映日期",
    runtime: "片長",
    minutes: "分鐘",
    genres: "類型",
    originalTitle: "原片名",
    rating: "評分",
    trailer: "預告片",
    cast: "主演",
    director: "導演：",
    back: "返回",
  },
  person: { filmography: "參演作品", noBio: "暫無人物簡介。" },
  browse: {
    genre: "類型",
    year: "年份",
    sort: "排序",
    all: "不限",
    minRating: "最低評分",
    sortPopular: "人氣",
    sortRating: "評分",
    sortNewest: "最新",
    eyebrow: "挑片",
    title: "慢慢挑",
    subtitle: "收窄條件，找今晚那一部。",
    genrePlaceholder: "所有類型",
    yearPlaceholder: "不限年份",
    ratingPlaceholder: "不限評分",
    loading: "整理片單中…",
    empty: "這個條件下沒有片。換個條件再挑。",
    noMore: "到底了，這個條件就這些。",
    clearFilters: "清除",
    summaryPrefix: "正在看",
    summaryAll: "全部電影",
    summaryRatingSuffix: " 分以上",
    popularFirst: "依人氣",
    highestRatedFirst: "依評分",
    newestFirst: "依最新",
  },
  rating: {
    title: "我的評分",
    scorePrompt: "給分（1–10）",
    note: "短評",
    notePlaceholder: "寫下你的想法…",
    save: "儲存",
    saved: "已儲存 ✓",
    clear: "清除評分",
  },
  actions: {
    favorite: "收藏",
    favorited: "已收藏 ✓",
    watchlist: "想看",
    watchlistAdded: "想看 ✓",
    watched: "標記已看過",
    watchedDone: "已看過 ✓",
    comingSoon: "後續階段啟用",
  },
  demo: {
    actionNote: "收藏、想看、已看過是本機版功能，這個 demo 不會保存。",
    ratingNote: "個人評分是本機版功能，這個 demo 不會保存。",
    libraryEmpty:
      "收藏、想看、已看過會儲存在本機版。這個線上 demo 只展示 TMDB 內容，不保存個人清單。",
    recommendationsEmpty:
      "個人化推薦會依你在本機版收藏與標記已看過的電影產生。這個線上 demo 不保存個人資料，先去看看其他電影吧。",
    keepBrowsing: "瀏覽電影",
  },
  home: {
    eyebrow: "片庫",
    title: "今晚想看什麼?",
    subtitle: "從這裡開始，慢慢找今晚那一部。",
    rows: {
      forYou: { eyebrow: "依你看過的", title: "為你挑的" },
      popular: { eyebrow: "此刻", title: "大家在看的" },
      topRated: { eyebrow: "歷來", title: "評分最高的" },
      grossing: { eyebrow: "票房", title: "最賣座的" },
      upcoming: { eyebrow: "之後", title: "還沒上映的" },
    },
  },
  common: {
    empty: "目前沒有資料。",
    loading: "載入中…",
    noMore: "已經到底了",
    loadError: "載入失敗，請稍後重試。",
    retry: "重試",
    seeAll: "查看全部",
    viewDetails: "查看詳情",
  },
  errors: {
    missingKey: "尚未設定 TMDB 金鑰，請在 .env 填入 TMDB_API_KEY 後重新整理。",
    invalidKey: "TMDB 金鑰無效，請確認 .env 的 TMDB_API_KEY 是否正確。",
    network: "無法連線到 TMDB，請檢查網路後重試。",
    http: "TMDB 服務回應異常，請稍後重試。",
    notFound: "找不到這部電影。",
    generic: "載入失敗，請稍後重試。",
  },
};

const en: Dictionary = {
  appTitle: "Treehole",
  nav: {
    popular: "Popular",
    upcoming: "Upcoming",
    search: "Search",
    favorites: "Favorites",
    watchlist: "Watchlist",
    watched: "Watched",
    history: "History",
    recommendations: "For You",
    topRated: "Top Rated",
    highestGrossing: "Highest Grossing",
    browse: "Browse",
  },
  language: { label: "Language", zhTW: "繁體中文", en: "English" },
  pages: {
    popular: "Popular Movies",
    popularSubtitle: "See what everyone is watching right now.",
    upcoming: "Upcoming (Taiwan)",
    upcomingSubtitle: "Coming soon to Taiwan. Start planning.",
    favorites: "My Favorites",
    watchlist: "Watchlist",
    watched: "Watched",
    history: "Search History",
    recommendations: "For You",
    recommendationsEyebrow: "For You",
    recommendationsSubtitle: "Updates as you watch and save more.",
    topRated: "Top Rated of All Time",
    topRatedSubtitle: "Films that have held up over time.",
    highestGrossing: "Highest Grossing",
    highestGrossingSubtitle: "Ranked by worldwide box office.",
    browse: "Browse",
  },
  search: {
    placeholder: "Enter a movie title…",
    button: "Search",
    prompt: "Type a keyword to start searching.",
    resultsFor: "Search results",
    noResults: "No matching movies found.",
    eyebrow: "Find",
    title: "What are you looking for?",
    subtitle: "Type a title, or pick up where you left off.",
  },
  library: {
    remove: "Remove",
    sortAdded: "Newest added",
    sortTitle: "Title",
    sortRating: "By rating",
    ratingPlaceholder: "Any rating",
    emptyFavorites: "Nothing saved yet. Find a film you like and keep it here.",
    emptyWatchlist: "Your list is empty. Pick a few and queue them up.",
    emptyWatched: "Nothing logged yet. Finish one and mark it here.",
    favoritesEyebrow: "Saved",
    favoritesTitle: "The ones you kept",
    favoritesSubtitle: "The films you couldn't let go of.",
    watchlistEyebrow: "Up next",
    watchlistTitle: "Waiting in line",
    watchlistSubtitle: "Films you owe yourself. Take your time.",
    watchedEyebrow: "Watched",
    watchedTitle: "Films you've seen",
    watchedSubtitle: "Everything you've watched, right here.",
  },
  history: {
    empty: "No searches yet. Type a title to begin.",
    clear: "Clear all",
    clearShort: "Clear",
    justNow: "Just now",
    earlierToday: "Earlier today",
    yesterday: "Yesterday",
    daysAgo: "{n} days ago",
  },
  recommendations: {
    related: "You might also like",
    relatedEmpty: "No related movies.",
    forYouEmpty:
      "Not enough data yet. Favorite or mark a few movies as watched, and recommendations will show up here based on your taste.",
  },
  movie: {
    overview: "Overview",
    noOverview: "No overview available.",
    releaseDate: "Release date",
    runtime: "Runtime",
    minutes: "min",
    genres: "Genres",
    originalTitle: "Original title",
    rating: "Rating",
    trailer: "Trailer",
    cast: "Cast",
    director: "Director: ",
    back: "Back",
  },
  person: { filmography: "Filmography", noBio: "No biography available." },
  browse: {
    genre: "Genre",
    year: "Year",
    sort: "Sort",
    all: "All",
    minRating: "Min rating",
    sortPopular: "Popular",
    sortRating: "Rating",
    sortNewest: "Newest",
    eyebrow: "Browse",
    title: "Take your time",
    subtitle: "Narrow the list and find the one for tonight.",
    genrePlaceholder: "All genres",
    yearPlaceholder: "Any year",
    ratingPlaceholder: "Any rating",
    loading: "Sorting the list…",
    empty: "No films under these filters. Try another set.",
    noMore: "That is everything for these filters.",
    clearFilters: "Clear",
    summaryPrefix: "Browsing",
    summaryAll: "All films",
    summaryRatingSuffix: "+",
    popularFirst: "Popular first",
    highestRatedFirst: "Highest rated first",
    newestFirst: "Newest first",
  },
  rating: {
    title: "My rating",
    scorePrompt: "Score (1–10)",
    note: "Note",
    notePlaceholder: "Write your thoughts…",
    save: "Save",
    saved: "Saved ✓",
    clear: "Clear rating",
  },
  actions: {
    favorite: "Favorite",
    favorited: "Favorited ✓",
    watchlist: "Watchlist",
    watchlistAdded: "In watchlist ✓",
    watched: "Mark watched",
    watchedDone: "Watched ✓",
    comingSoon: "Coming in a later stage",
  },
  demo: {
    actionNote:
      "Favorites, watchlist and watched are local-version features. This demo won't save them.",
    ratingNote:
      "Personal ratings are a local-version feature. This demo won't save them.",
    libraryEmpty:
      "Favorites, watchlist and watched are stored in the local version. This online demo only showcases TMDB content and doesn't keep personal lists.",
    recommendationsEmpty:
      "Personalized picks come from the movies you favorite and mark as watched in the local version. This online demo doesn't store personal data — browse some movies instead.",
    keepBrowsing: "Browse movies",
  },
  home: {
    eyebrow: "Library",
    title: "What are you watching tonight?",
    subtitle: "Start here, then find the one for tonight.",
    rows: {
      forYou: { eyebrow: "From your history", title: "Picked for you" },
      popular: { eyebrow: "Right now", title: "What people are watching" },
      topRated: { eyebrow: "All-time", title: "Highest rated" },
      grossing: { eyebrow: "Box office", title: "Biggest earners" },
      upcoming: { eyebrow: "Soon", title: "Not out yet" },
    },
  },
  common: {
    empty: "Nothing here yet.",
    loading: "Loading…",
    noMore: "You've reached the end",
    loadError: "Failed to load. Please retry later.",
    retry: "Retry",
    seeAll: "See all",
    viewDetails: "View details",
  },
  errors: {
    missingKey:
      "TMDB API key is not set. Add TMDB_API_KEY to .env and refresh.",
    invalidKey: "Invalid TMDB API key. Check TMDB_API_KEY in .env.",
    network: "Cannot reach TMDB. Check your network and retry.",
    http: "TMDB returned an unexpected response. Please retry later.",
    notFound: "Movie not found.",
    generic: "Failed to load. Please retry later.",
  },
};

const dictionaries: Record<Locale, Dictionary> = { "zh-TW": zhTW, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
