import type { Locale } from "./config";

// 介面字串字典型別；兩套語系（zh-TW / en）必須提供相同結構
export interface Dictionary {
  appTitle: string;
  nav: {
    search: string;
    favorites: string;
    watchlist: string;
    watched: string;
    browse: string;
    openMenu: string;
    closeMenu: string;
    skipToContent: string;
  };
  language: { label: string; zhTW: string; en: string };
  pages: {
    popular: string;
    upcoming: string;
    recommendations: string;
    topRated: string;
    highestGrossing: string;
  };
  search: {
    placeholder: string;
    button: string;
    resultsFor: string;
    noResults: string;
    title: string;
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
    favoritesTitle: string;
    watchlistTitle: string;
    watchedTitle: string;
  };
  recommendations: { related: string; relatedEmpty: string; forYouEmpty: string };
  movie: {
    noOverview: string;
    minutes: string;
    rating: string;
    trailer: string;
    cast: string;
    director: string;
    back: string;
  };
  person: { filmography: string; noBio: string; showMore: string; showLess: string };
  browse: {
    genre: string;
    year: string;
    sort: string;
    all: string;
    minRating: string;
    sortPopular: string;
    sortRating: string;
    sortNewest: string;
    title: string;
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
  };
  home: {
    eyebrow: string;
    rows: {
      forYou: string;
      popular: string;
      topRated: string;
      grossing: string;
      upcoming: string;
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
    prev: string;
    next: string;
    filmCount: string;
    browse: string;
    saveError: string;
    removeError: string;
  };
  unlock: {
    title: string;
    hint: string;
    passcode: string;
    submit: string;
    wrong: string;
    failed: string;
    notConfigured: string;
  };
  errors: {
    missingKey: string;
    invalidKey: string;
    network: string;
    http: string;
    notFound: string;
    pageNotFound: string;
    generic: string;
  };
}

const zhTW: Dictionary = {
  appTitle: "Treehole",
  nav: {
    search: "搜尋",
    favorites: "收藏",
    watchlist: "想看",
    watched: "已看過",
    browse: "瀏覽",
    openMenu: "開啟選單",
    closeMenu: "關閉選單",
    skipToContent: "跳到主要內容",
  },
  language: { label: "語言", zhTW: "繁體中文", en: "English" },
  pages: {
    popular: "熱門",
    upcoming: "即將上映",
    recommendations: "為你推薦",
    topRated: "評分最高",
    highestGrossing: "最賣座",
  },
  search: {
    placeholder: "輸入電影名稱…",
    button: "搜尋",
    resultsFor: "搜尋結果",
    noResults: "找不到符合的電影。",
    title: "搜尋",
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
    favoritesTitle: "收藏",
    watchlistTitle: "想看",
    watchedTitle: "已看過",
  },
  recommendations: {
    related: "相關推薦",
    relatedEmpty: "暫無相關推薦。",
    forYouEmpty:
      "還沒有足夠的資料可推薦。先到電影詳情頁收藏或標記幾部已看過的電影，這裡就會依你的喜好推薦。",
  },
  movie: {
    noOverview: "暫無簡介。",
    minutes: "分鐘",
    rating: "評分",
    trailer: "預告片",
    cast: "主演",
    director: "導演：",
    back: "返回",
  },
  person: {
    filmography: "參演作品",
    noBio: "暫無人物簡介。",
    showMore: "展開全文",
    showLess: "收合",
  },
  browse: {
    genre: "類型",
    year: "年份",
    sort: "排序",
    all: "不限",
    minRating: "最低評分",
    sortPopular: "人氣",
    sortRating: "評分",
    sortNewest: "最新",
    title: "瀏覽",
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
  },
  home: {
    eyebrow: "今晚這部",
    rows: {
      forYou: "為你推薦",
      popular: "熱門",
      topRated: "評分最高",
      grossing: "最賣座",
      upcoming: "即將上映",
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
    prev: "上一批",
    next: "下一批",
    filmCount: "{n} 部",
    browse: "瀏覽電影",
    saveError: "沒有存成功，請再試一次。",
    removeError: "沒有拿掉，請再試一次。",
  },
  unlock: {
    title: "這個站是私人的",
    hint: "片庫只有一個人在用。輸入通行碼繼續。",
    passcode: "通行碼",
    submit: "進入",
    wrong: "通行碼不對。",
    failed: "伺服器出了問題，請再試一次。",
    notConfigured:
      "站台還沒設定通行碼，現在沒有人進得來。請設定 OWNER_PASSCODE 與 OWNER_SECRET 兩個環境變數。",
  },
  errors: {
    missingKey: "尚未設定 TMDB 金鑰，請在 .env 填入 TMDB_API_KEY 後重新整理。",
    invalidKey: "TMDB 金鑰無效，請確認 .env 的 TMDB_API_KEY 是否正確。",
    network: "無法連線到 TMDB，請檢查網路後重試。",
    http: "TMDB 服務回應異常，請稍後重試。",
    notFound: "找不到這部電影。",
    pageNotFound: "找不到這個頁面。",
    generic: "載入失敗，請稍後重試。",
  },
};

const en: Dictionary = {
  appTitle: "Treehole",
  nav: {
    search: "Search",
    favorites: "Favorites",
    watchlist: "Watchlist",
    watched: "Watched",
    browse: "Browse",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    skipToContent: "Skip to content",
  },
  language: { label: "Language", zhTW: "繁體中文", en: "English" },
  pages: {
    popular: "Popular",
    upcoming: "Upcoming",
    recommendations: "For You",
    topRated: "Top Rated",
    highestGrossing: "Highest Grossing",
  },
  search: {
    placeholder: "Enter a movie title…",
    button: "Search",
    resultsFor: "Search results",
    noResults: "No matching movies found.",
    title: "Search",
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
    favoritesTitle: "Favorites",
    watchlistTitle: "Watchlist",
    watchedTitle: "Watched",
  },
  recommendations: {
    related: "You might also like",
    relatedEmpty: "No related movies.",
    forYouEmpty:
      "Not enough data yet. Favorite or mark a few movies as watched, and recommendations will show up here based on your taste.",
  },
  movie: {
    noOverview: "No overview available.",
    minutes: "min",
    rating: "Rating",
    trailer: "Trailer",
    cast: "Cast",
    director: "Director: ",
    back: "Back",
  },
  person: {
    filmography: "Filmography",
    noBio: "No biography available.",
    showMore: "Read more",
    showLess: "Show less",
  },
  browse: {
    genre: "Genre",
    year: "Year",
    sort: "Sort",
    all: "All",
    minRating: "Min rating",
    sortPopular: "Popular",
    sortRating: "Rating",
    sortNewest: "Newest",
    title: "Browse",
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
  },
  home: {
    eyebrow: "Tonight",
    rows: {
      forYou: "For You",
      popular: "Popular",
      topRated: "Top Rated",
      grossing: "Highest Grossing",
      upcoming: "Upcoming",
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
    prev: "Previous",
    next: "Next",
    filmCount: "{n} films",
    browse: "Browse movies",
    saveError: "Couldn't save. Please try again.",
    removeError: "Couldn't remove it. Please try again.",
  },
  unlock: {
    title: "This site is private",
    hint: "This library belongs to one person. Enter the passcode to continue.",
    passcode: "Passcode",
    submit: "Enter",
    wrong: "Wrong passcode.",
    failed: "Something went wrong on the server. Please try again.",
    notConfigured:
      "No passcode is configured, so nobody can get in. Set the OWNER_PASSCODE and OWNER_SECRET environment variables.",
  },
  errors: {
    missingKey:
      "TMDB API key is not set. Add TMDB_API_KEY to .env and refresh.",
    invalidKey: "Invalid TMDB API key. Check TMDB_API_KEY in .env.",
    network: "Cannot reach TMDB. Check your network and retry.",
    http: "TMDB returned an unexpected response. Please retry later.",
    notFound: "Movie not found.",
    pageNotFound: "Page not found.",
    generic: "Failed to load. Please retry later.",
  },
};

const dictionaries: Record<Locale, Dictionary> = { "zh-TW": zhTW, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
