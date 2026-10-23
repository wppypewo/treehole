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
  /** 榜單的欄名與即將上映片表的空狀態 */
  lists: {
    rank: string;
    film: string;
    year: string;
    score: string;
    upcomingEmpty: string;
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
    emptyFavorites: string;
    emptyWatchlist: string;
    emptyWatched: string;
    /** 片庫有片、但評分門檻篩到一部不剩。和「片庫是空的」是兩回事，不能共用一句 */
    filteredEmpty: string;
    favoritesTitle: string;
    watchlistTitle: string;
    watchedTitle: string;
    /** 兩段式拿掉：第一下換成確認與取消，第二下才真的送出 */
    confirmRemove: string;
    cancel: string;
    /** 按鈕的完整名稱，{title} 由呼叫端代入；畫面上只顯示「拿掉」 */
    removeNamed: string;
    /** 排序／篩選那組分段鍵的組名，給報讀用 */
    sortGroup: string;
    filterGroup: string;
    watchlist: {
      sortQueue: string;
      sortRuntime: string;
      sortTitle: string;
      markWatched: string;
      markWatchedNamed: string;
      /** 從想看清單標記看過之後的狀態列。{title} 由呼叫端代入 */
      markedWatched: string;
      /** 清單太長時只查前幾部的片長與導演，照實講 */
      partialDetails: string;
    };
    watched: {
      filterAll: string;
      filterHigh: string;
      filterUnrated: string;
      unrated: string;
      /** 刊頭右側「今年 {n} 部」 */
      thisYear: string;
      /** 看過日期解析不了的那一組 */
      undated: string;
    };
    favorites: {
      sortRecent: string;
      sortTitle: string;
      sortMine: string;
    };
  };
  recommendations: { related: string; relatedEmpty: string; forYouEmpty: string };
  movie: {
    noOverview: string;
    minutes: string;
    /** TMDB 分數與票數。{score}／{n} 由呼叫端代入 */
    tmdbScore: string;
    trailer: string;
    /** 預告片播放鍵的報讀名稱。{title} 由呼叫端代入 */
    playTrailer: string;
    /** 片名下方演職員表的欄名，不帶冒號 */
    director: string;
    cast: string;
    /** 頁尾演員照片列的標題 */
    castRail: string;
    /** 右欄「我的紀錄」 */
    ledger: string;
    /** 資料庫讀不到時，「我的紀錄」裡唯一的一行 */
    ledgerUnavailable: string;
  };
  person: {
    filmography: string;
    noBio: string;
    /** 演出、幕後兩邊都沒有作品 */
    noCredits: string;
    showMore: string;
    showLess: string;
    /** 年表的兩個分頁與它們的組名 */
    acting: string;
    crew: string;
    creditKind: string;
    /** 「飾 {role}」 */
    as: string;
    self: string;
    voice: string;
    uncredited: string;
    /** 卡司排序前三位的標記 */
    lead: string;
    /** 沒有上映日的那一組 */
    undated: string;
    /** 還沒上映的片：「{date} 上映」 */
    opens: string;
    /** 「{date}生」 */
    born: string;
    died: string;
    /** TMDB known_for_department 的英文原文 → 顯示文字 */
    departments: Record<string, string>;
    /** TMDB crew job 的英文原文 → 顯示文字。沒列到的照原文顯示 */
    jobs: Record<string, string>;
  };
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
    loading: string;
    empty: string;
    noMore: string;
    clearFilters: string;
    /** 摘要列黏住之後，跳回條件面板的那顆鍵 */
    editFilters: string;
    summaryPrefix: string;
    summaryAll: string;
    summaryRatingSuffix: string;
    popularFirst: string;
    highestRatedFirst: string;
    newestFirst: string;
  };
  rating: {
    scorePrompt: string;
    note: string;
    notePlaceholder: string;
    save: string;
    saved: string;
    clear: string;
  };
  actions: {
    /** 三顆切換鍵那一組的欄名 */
    group: string;
    favorite: string;
    watchlist: string;
    watched: string;
    /** 標記看過時順手移出想看，畫面上要講 */
    removedFromWatchlist: string;
    undo: string;
    /** 三顆鍵底下對齊的日期。{date} 是「9/12」這種短寫 */
    since: { watchlist: string; watched: string; favorites: string };
  };
  home: {
    tonight: {
      /** 開場那部片的來由。{n}／{total} 由呼叫端代入 */
      oldest: string;
      nth: string;
      /** 想看清單是空的、或片庫讀不到時的替代來源，照實講 */
      fallbackEmpty: string;
      fallbackError: string;
      open: string;
      next: string;
      stillCredit: string;
    };
    facts: {
      year: string;
      runtime: string;
      director: string;
      genres: string;
      minutes: string;
    };
    watchlist: {
      title: string;
      /** 只有整張清單的片長都拿得到時才顯示，否則數字是錯的 */
      totalHours: string;
      totalMinutes: string;
      all: string;
      /** 放映表最右欄，{date} 是「9/12」這種短寫 */
      added: string;
    };
    diary: { title: string; score: string; all: string };
    out: { title: string; source: string };
    schedule: { title: string; source: string };
    lists: string;
  };
  /** 全站頁尾。TMDB 的使用條款要求標示資料來源，並註明未經 TMDB 背書 */
  footer: {
    /** 頁尾的地標名稱 */
    label: string;
    notice: string;
    source: string;
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
    /** 404 頁的標題 */
    pageNotFound: string;
    pageNotFoundBody: string;
    /** 整頁載不出來時的標題；說明另由 tmdbErrorMessage 給 */
    loadFailed: string;
    reload: string;
    home: string;
    searchTitles: string;
    generic: string;
  };
}

const zhTW: Dictionary = {
  appTitle: "Treehole",
  nav: {
    search: "搜尋",
    favorites: "收藏",
    watchlist: "想看",
    watched: "看過",
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
  lists: {
    rank: "名次",
    film: "片名",
    year: "年份",
    score: "TMDB",
    upcomingEmpty: "TMDB 目前沒有今天以後的台灣上映日。",
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
    emptyFavorites: "收藏是空的。在電影頁按「收藏」加入。",
    emptyWatchlist: "想看清單是空的。在電影頁按「想看」加入。",
    emptyWatched: "還沒有看過的紀錄。在電影頁按「標記看過」記下一部。",
    filteredEmpty: "這個評分門檻下沒有片。",
    favoritesTitle: "收藏",
    watchlistTitle: "想看",
    watchedTitle: "看過",
    confirmRemove: "確定拿掉",
    cancel: "取消",
    removeNamed: "從這張清單拿掉《{title}》",
    sortGroup: "排序",
    filterGroup: "篩選",
    watchlist: {
      sortQueue: "加入先後",
      sortRuntime: "片長",
      sortTitle: "片名",
      markWatched: "看過了",
      markWatchedNamed: "把《{title}》記為看過",
      markedWatched: "《{title}》記為看過，已移出想看。",
      partialDetails: "片長與導演只查了前 {n} 部。",
    },
    watched: {
      filterAll: "全部",
      filterHigh: "8 分以上",
      filterUnrated: "未評分",
      unrated: "未評分",
      thisYear: "今年 {n} 部",
      undated: "日期不明",
    },
    favorites: {
      sortRecent: "最近收藏",
      sortTitle: "片名",
      sortMine: "我的評分",
    },
  },
  recommendations: {
    related: "相關推薦",
    relatedEmpty: "TMDB 沒有列出相關的片。",
    forYouEmpty:
      "推薦從你的片庫推算。收藏或標記看過幾部之後，這裡才會有片。",
  },
  movie: {
    noOverview: "TMDB 沒有這部片的簡介。",
    minutes: "分鐘",
    tmdbScore: "TMDB {score}（{n} 人評分）",
    trailer: "預告片",
    playTrailer: "播放預告片：{title}",
    director: "導演",
    cast: "主演",
    castRail: "演員",
    ledger: "我的紀錄",
    ledgerUnavailable: "片庫暫時讀不到，這部片的紀錄先不顯示，也先不能改。",
  },
  person: {
    filmography: "作品",
    noBio: "TMDB 沒有這個人的簡介。",
    noCredits: "TMDB 沒有這個人的電影作品紀錄。",
    showMore: "展開全文",
    showLess: "收合",
    acting: "演出",
    crew: "幕後",
    creditKind: "作品類別",
    as: "飾 {role}",
    self: "本人",
    voice: "（配音）",
    uncredited: "（未掛名）",
    lead: "主演",
    undated: "年份未定",
    opens: "{date}上映",
    born: "{date}生",
    died: "{date}逝世",
    departments: {
      Acting: "演員",
      Directing: "導演",
      Writing: "編劇",
      Production: "製片",
      Camera: "攝影",
      Editing: "剪輯",
      Sound: "聲音",
      Art: "美術",
      "Costume & Make-Up": "服裝與化妝",
      "Visual Effects": "視覺效果",
      Lighting: "燈光",
      Crew: "劇組",
    },
    jobs: {
      Director: "導演",
      "Co-Director": "聯合導演",
      Screenplay: "編劇",
      Writer: "編劇",
      Story: "故事",
      // TMDB 的職務名，指的是寫原始電影故事（不是改編自別的作品）
      Screenstory: "電影故事",
      Novel: "原著小說",
      Characters: "角色原創",
      Idea: "構想",
      Producer: "製片",
      "Executive Producer": "監製",
      "Co-Producer": "聯合製片",
      "Director of Photography": "攝影指導",
      "Camera Operator": "攝影機操作",
      Editor: "剪輯",
      "Original Music Composer": "配樂",
      Music: "音樂",
      Songs: "歌曲",
      "Theme Song Performance": "主題曲演唱",
      Singer: "演唱",
      Book: "原著",
      Author: "原著",
      Adaptation: "改編",
      "Assistant Director": "副導演",
      "Production Design": "美術設計",
      "Art Direction": "藝術指導",
      "Set Designer": "佈景設計",
      Decorator: "陳設",
      "Set Decoration": "陳設",
      "Costume Design": "服裝設計",
      Casting: "選角",
      "Sound Designer": "音效設計",
      "Visual Effects Supervisor": "視覺效果總監",
      Stunts: "特技",
    },
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
    loading: "整理片單中…",
    empty: "這個條件下沒有片。換個條件再挑。",
    noMore: "到底了，這個條件就這些。",
    clearFilters: "清除",
    editFilters: "改條件",
    summaryPrefix: "正在看",
    summaryAll: "全部電影",
    summaryRatingSuffix: " 分以上",
    popularFirst: "依人氣",
    highestRatedFirst: "依評分",
    newestFirst: "依最新",
  },
  rating: {
    scorePrompt: "評分",
    note: "短評",
    notePlaceholder: "只有你看得到。",
    save: "儲存",
    saved: "已儲存",
    clear: "清除評分",
  },
  actions: {
    group: "片庫",
    favorite: "收藏",
    watchlist: "想看",
    watched: "看過",
    removedFromWatchlist: "已從想看清單移除。",
    undo: "復原",
    since: { watchlist: "{date} 加入", watched: "{date} 看過", favorites: "{date} 收藏" },
  },
  home: {
    tonight: {
      oldest: "今晚：想看清單裡放最久的一部",
      nth: "今晚：想看清單依加入先後的第 {n} 部，共 {total} 部",
      fallbackEmpty: "想看清單還是空的，先放 TMDB 熱門榜第一部。",
      fallbackError: "片庫暫時讀不到，先放 TMDB 熱門榜第一部。",
      open: "打開這部",
      next: "換一部",
      stillCredit: "劇照 · TMDB",
    },
    facts: {
      year: "年份",
      runtime: "片長",
      director: "導演",
      genres: "類型",
      minutes: "{n} 分鐘",
    },
    watchlist: {
      title: "想看",
      totalHours: "全部看完約 {h} 小時 {m} 分",
      totalMinutes: "全部看完約 {m} 分鐘",
      all: "整張清單",
      added: "{date} 加入",
    },
    diary: { title: "最近看過", score: "我給 {n} 分", all: "全部看過的片" },
    out: { title: "外面在放", source: "TMDB 熱門" },
    schedule: { title: "即將上映", source: "台灣院線" },
    lists: "其他片單",
  },
  footer: {
    label: "頁尾",
    notice: "本站使用 TMDB API，但未經 TMDB 背書或認證。",
    source: "片目、劇照與評分來自 TMDB",
  },
  common: {
    empty: "TMDB 沒有回傳任何片。",
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
      "站台還沒設定通行碼，或通行碼短於 16 個字元，現在沒有人進得來。請設定 OWNER_PASSCODE（至少 16 個字元）與 OWNER_SECRET 兩個環境變數。",
  },
  errors: {
    missingKey: "尚未設定 TMDB 金鑰，請在 .env 填入 TMDB_API_KEY 後重新整理。",
    invalidKey: "TMDB 金鑰無效，請確認 .env 的 TMDB_API_KEY 是否正確。",
    network: "無法連線到 TMDB，請檢查網路後重試。",
    http: "TMDB 服務回應異常，請稍後重試。",
    notFound: "找不到這部電影。",
    pageNotFound: "找不到這個頁面",
    pageNotFoundBody: "網址可能打錯了，或 TMDB 上已經沒有這筆資料。",
    loadFailed: "這一頁暫時載入不了",
    reload: "重新載入",
    home: "回首頁",
    searchTitles: "搜尋片名",
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
  lists: {
    rank: "Rank",
    film: "Film",
    year: "Year",
    score: "TMDB",
    upcomingEmpty: "TMDB lists no Taiwan release dates from today on.",
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
    emptyFavorites: "No favorites yet. Use Favorite on any film page to add one.",
    emptyWatchlist: "Your watchlist is empty. Use Watchlist on any film page to add one.",
    emptyWatched: "No films logged yet. Use Mark watched on any film page to log one.",
    filteredEmpty: "No films at this rating threshold.",
    favoritesTitle: "Favorites",
    watchlistTitle: "Watchlist",
    watchedTitle: "Watched",
    confirmRemove: "Remove it",
    cancel: "Cancel",
    removeNamed: "Remove “{title}” from this list",
    sortGroup: "Sort",
    filterGroup: "Filter",
    watchlist: {
      sortQueue: "Order added",
      sortRuntime: "Runtime",
      sortTitle: "Title",
      markWatched: "Watched it",
      markWatchedNamed: "Mark “{title}” as watched",
      markedWatched: "“{title}” marked watched and taken off the watchlist.",
      partialDetails: "Runtime and director were looked up for the first {n} films only.",
    },
    watched: {
      filterAll: "All",
      filterHigh: "8 and up",
      filterUnrated: "Unrated",
      unrated: "Unrated",
      thisYear: "{n} this year",
      undated: "Date unknown",
    },
    favorites: {
      sortRecent: "Recently saved",
      sortTitle: "Title",
      sortMine: "My rating",
    },
  },
  recommendations: {
    related: "You might also like",
    relatedEmpty: "TMDB lists no related films.",
    forYouEmpty:
      "Recommendations come from your library. Favorite or mark a few films watched and they will show up here.",
  },
  movie: {
    noOverview: "TMDB has no overview for this film.",
    minutes: "min",
    tmdbScore: "TMDB {score} ({n} votes)",
    trailer: "Trailer",
    playTrailer: "Play trailer: {title}",
    director: "Director",
    cast: "Starring",
    castRail: "Cast",
    ledger: "My record",
    ledgerUnavailable: "Your library can't be reached right now, so this film's record is hidden and can't be edited yet.",
  },
  person: {
    filmography: "Filmography",
    noBio: "TMDB has no biography for this person.",
    noCredits: "TMDB has no film credits for this person.",
    showMore: "Read more",
    showLess: "Show less",
    acting: "Acting",
    crew: "Crew",
    creditKind: "Credit type",
    as: "as {role}",
    self: "Self",
    voice: " (voice)",
    uncredited: " (uncredited)",
    lead: "Lead",
    undated: "No date",
    opens: "Opens {date}",
    born: "Born {date}",
    died: "Died {date}",
    // TMDB 的原文就是英文，不必翻
    departments: {},
    jobs: {},
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
    loading: "Sorting the list…",
    empty: "No films under these filters. Try another set.",
    noMore: "That is everything for these filters.",
    clearFilters: "Clear",
    editFilters: "Change filters",
    summaryPrefix: "Browsing",
    summaryAll: "All films",
    summaryRatingSuffix: "+",
    popularFirst: "Popular first",
    highestRatedFirst: "Highest rated first",
    newestFirst: "Newest first",
  },
  rating: {
    scorePrompt: "Score",
    note: "Note",
    notePlaceholder: "Only you can see this.",
    save: "Save",
    saved: "Saved",
    clear: "Clear rating",
  },
  actions: {
    group: "Library",
    favorite: "Favorite",
    watchlist: "Watchlist",
    watched: "Watched",
    removedFromWatchlist: "Removed from your watchlist.",
    undo: "Undo",
    since: { watchlist: "Added {date}", watched: "Watched {date}", favorites: "Saved {date}" },
  },
  home: {
    tonight: {
      oldest: "Tonight: the film that has waited longest on your watchlist",
      nth: "Tonight: film {n} of {total} on your watchlist, oldest first",
      fallbackEmpty: "Your watchlist is empty, so this is the top film on TMDB's popular list.",
      fallbackError: "Your library could not be read, so this is the top film on TMDB's popular list.",
      open: "Open",
      next: "Another one",
      stillCredit: "Still · TMDB",
    },
    facts: {
      year: "Year",
      runtime: "Runtime",
      director: "Director",
      genres: "Genres",
      minutes: "{n} min",
    },
    watchlist: {
      title: "Watchlist",
      totalHours: "About {h} h {m} min to watch them all",
      totalMinutes: "About {m} min to watch them all",
      all: "Full list",
      added: "Added {date}",
    },
    diary: { title: "Recently watched", score: "I gave it {n}", all: "All watched" },
    out: { title: "Out there", source: "TMDB popular" },
    schedule: { title: "Coming soon", source: "Taiwan release dates" },
    lists: "More lists",
  },
  footer: {
    label: "Footer",
    notice: "This product uses the TMDB API but is not endorsed or certified by TMDB.",
    source: "Film data, stills and scores from TMDB",
  },
  common: {
    empty: "TMDB returned no films.",
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
      "No passcode is configured, or it is shorter than 16 characters, so nobody can get in. Set OWNER_PASSCODE (at least 16 characters) and OWNER_SECRET.",
  },
  errors: {
    missingKey:
      "TMDB API key is not set. Add TMDB_API_KEY to .env and refresh.",
    invalidKey: "Invalid TMDB API key. Check TMDB_API_KEY in .env.",
    network: "Cannot reach TMDB. Check your network and retry.",
    http: "TMDB returned an unexpected response. Please retry later.",
    notFound: "Movie not found.",
    pageNotFound: "Page not found",
    pageNotFoundBody: "The address may be mistyped, or TMDB no longer has this entry.",
    loadFailed: "This page couldn't load",
    reload: "Reload",
    home: "Home",
    searchTitles: "Search titles",
    generic: "Failed to load. Please retry later.",
  },
};

const dictionaries: Record<Locale, Dictionary> = { "zh-TW": zhTW, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
