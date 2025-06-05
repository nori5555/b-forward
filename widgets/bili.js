// Bilibili Widget for ForwardWidget (使用RSShub RSS源)
var WidgetMetadata = {
id: “bilibili_rsshub_widget”,
title: “哔哩哔哩视频 (RSShub)”,
description: “通过RSShub RSS源获取B站视频内容”,
author: “ForwardWidget Developer”,
site: “https://www.bilibili.com”,
version: “1.1.0”,
requiredVersion: “0.0.1”,
modules: [
{
title: “全站排行榜”,
description: “获取B站全站排行榜视频”,
requiresWebView: false,
functionName: “getRankingVideos”,
sectionMode: true,
params: [
{
name: “rid”,
title: “排行榜分区”,
type: “enumeration”,
description: “选择排行榜分区”,
value: “0”,
enumOptions: [
{ title: “全站”, value: “0” },
{ title: “动画”, value: “1” },
{ title: “番剧”, value: “13” },
{ title: “国创”, value: “167” },
{ title: “音乐”, value: “3” },
{ title: “舞蹈”, value: “129” },
{ title: “游戏”, value: “4” },
{ title: “知识”, value: “36” },
{ title: “科技”, value: “188” },
{ title: “运动”, value: “234” },
{ title: “汽车”, value: “223” },
{ title: “生活”, value: “160” },
{ title: “美食”, value: “211” },
{ title: “动物圈”, value: “217” },
{ title: “鬼畜”, value: “119” },
{ title: “时尚”, value: “155” },
{ title: “娱乐”, value: “5” },
{ title: “影视”, value: “181” }
]
},
{
name: “day”,
title: “时间范围”,
type: “enumeration”,
description: “排行榜时间范围”,
value: “3”,
enumOptions: [
{ title: “3日”, value: “3” },
{ title: “7日”, value: “7” },
{ title: “30日”, value: “30” }
]
}
]
},
{
title: “UP主视频”,
description: “获取指定UP主的视频”,
requiresWebView: false,
functionName: “getUploaderVideos”,
sectionMode: true,
params: [
{
name: “uid”,
title: “UP主UID”,
type: “input”,
description: “输入UP主的UID (数字)”,
value: “”,
placeholders: [
{ title: “例: 777536”, value: “777536” },
{ title: “例: 9617619”, value: “9617619” }
]
}
]
},
{
title: “番剧更新”,
description: “获取番剧更新时间表”,
requiresWebView: false,
functionName: “getBangumiTimeline”,
sectionMode: true,
params: [
{
name: “before”,
title: “时间范围”,
type: “enumeration”,
description: “获取多少天内的番剧”,
value: “7”,
enumOptions: [
{ title: “7天内”, value: “7” },
{ title: “15天内”, value: “15” },
{ title: “30天内”, value: “30” }
]
}
]
},
{
title: “热门直播”,
description: “获取热门直播间”,
requiresWebView: false,
functionName: “getPopularLive”,
sectionMode: true,
params: [
{
name: “parent_area_id”,
title: “直播分区”,
type: “enumeration”,
description: “选择直播分区”,
value: “0”,
enumOptions: [
{ title: “全部”, value: “0” },
{ title: “娱乐”, value: “1” },
{ title: “网游”, value: “2” },
{ title: “手游”, value: “3” },
{ title: “单机游戏”, value: “6” },
{ title: “生活”, value: “10” },
{ title: “知识”, value: “11” },
{ title: “赛事”, value: “13” }
]
}
]
}
]
};

// RSShub API 基础配置
const RSSHUB_BASE_URL = “https://rsshub.app”;
// 可以配置多个RSShub实例作为备用
const RSSHUB_INSTANCES = [
“https://rsshub.app”,
“https://rss.shab.fun”,
“https://rsshub.ktachibana.party”
];

// 获取排行榜视频
async function getRankingVideos(params = {}) {
try {
const rid = params.rid || “0”;
const day = params.day || “3”;

```
    const rssUrl = `${RSSHUB_BASE_URL}/bilibili/ranking/${rid}/${day}`;
    
    const response = await Widget.http.get(rssUrl, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
    });
    
    return parseRSSFeed(response.data, "ranking");
    
} catch (error) {
    console.error("获取排行榜失败:", error);
    // 尝试备用RSShub实例
    return await tryAlternativeRSSHub("getRankingVideos", params, error);
}
```

}

// 获取UP主视频
async function getUploaderVideos(params = {}) {
try {
const uid = params.uid;

```
    if (!uid) {
        throw new Error("请输入UP主UID");
    }
    
    const rssUrl = `${RSSHUB_BASE_URL}/bilibili/user/video/${uid}`;
    
    const response = await Widget.http.get(rssUrl, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
    });
    
    return parseRSSFeed(response.data, "uploader");
    
} catch (error) {
    console.error("获取UP主视频失败:", error);
    return await tryAlternativeRSSHub("getUploaderVideos", params, error);
}
```

}

// 获取番剧时间表
async function getBangumiTimeline(params = {}) {
try {
const before = params.before || “7”;

```
    const rssUrl = `${RSSHUB_BASE_URL}/bilibili/bangumi/timeline/${before}`;
    
    const response = await Widget.http.get(rssUrl, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
    });
    
    return parseRSSFeed(response.data, "bangumi");
    
} catch (error) {
    console.error("获取番剧时间表失败:", error);
    return await tryAlternativeRSSHub("getBangumiTimeline", params, error);
}
```

}

// 获取热门直播
async function getPopularLive(params = {}) {
try {
const parentAreaId = params.parent_area_id || “0”;

```
    const rssUrl = `${RSSHUB_BASE_URL}/bilibili/live/area/${parentAreaId}`;
    
    const response = await Widget.http.get(rssUrl, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
    });
    
    return parseRSSFeed(response.data, "live");
    
} catch (error) {
    console.error("获取热门直播失败:", error);
    return await tryAlternativeRSSHub("getPopularLive", params, error);
}
```

}

// 解析RSS Feed
function parseRSSFeed(xmlData, type) {
try {
const $ = Widget.html.load(xmlData);
const items = [];

```
    $('item').each((index, element) => {
        const $item = $(element);
        const title = $item.find('title').text();
        const link = $item.find('link').text();
        const description = $item.find('description').text();
        const pubDate = $item.find('pubDate').text();
        
        // 从描述中提取更多信息
        const descHtml = Widget.html.load(description);
        let posterPath = "";
        let author = "";
        let duration = "";
        let viewCount = "";
        let danmakuCount = "";
        
        // 尝试从描述HTML中提取图片
        const img = descHtml('img').first();
        if (img.length) {
            posterPath = img.attr('src') || "";
            if (posterPath && !posterPath.startsWith('http')) {
                posterPath = 'https:' + posterPath;
            }
        }
        
        // 从链接提取视频ID
        let videoId = "";
        const bvMatch = link.match(/BV[A-Za-z0-9]+/);
        const avMatch = link.match(/av(\d+)/);
        
        if (bvMatch) {
            videoId = bvMatch[0];
        } else if (avMatch) {
            videoId = `av${avMatch[1]}`;
        }
        
        // 根据类型处理不同的数据
        let mediaType = "video";
        let genreTitle = "视频";
        
        switch (type) {
            case "live":
                mediaType = "live";
                genreTitle = "直播";
                break;
            case "bangumi":
                mediaType = "tv";
                genreTitle = "番剧";
                break;
            default:
                mediaType = "video";
                genreTitle = "视频";
        }
        
        items.push({
            id: videoId || `item_${index}`,
            type: "url",
            title: title,
            posterPath: posterPath,
            backdropPath: posterPath,
            releaseDate: pubDate ? new Date(pubDate).toISOString().split('T')[0] : "",
            mediaType: mediaType,
            rating: "0",
            genreTitle: genreTitle,
            duration: 0,
            durationText: duration || "未知",
            videoUrl: link,
            link: link,
            description: descHtml.text() || title,
            author: author || "B站用户",
            viewCount: viewCount || "0",
            danmakuCount: danmakuCount || "0"
        });
    });
    
    return items;
    
} catch (error) {
    console.error("解析RSS Feed失败:", error);
    throw new Error("RSS数据解析失败");
}
```

}

// 尝试备用RSShub实例
async function tryAlternativeRSSHub(functionName, params, originalError) {
for (let i = 1; i < RSSHUB_INSTANCES.length; i++) {
try {
console.log(`尝试备用RSShub实例: ${RSSHUB_INSTANCES[i]}`);

```
        // 临时切换到备用实例
        const originalBaseUrl = RSSHUB_BASE_URL;
        RSSHUB_BASE_URL = RSSHUB_INSTANCES[i];
        
        let result;
        switch (functionName) {
            case "getRankingVideos":
                result = await getRankingVideos(params);
                break;
            case "getUploaderVideos":
                result = await getUploaderVideos(params);
                break;
            case "getBangumiTimeline":
                result = await getBangumiTimeline(params);
                break;
            case "getPopularLive":
                result = await getPopularLive(params);
                break;
            default:
                throw originalError;
        }
        
        // 恢复原始URL
        RSSHUB_BASE_URL = originalBaseUrl;
        return result;
        
    } catch (error) {
        console.error(`备用实例 ${RSSHUB_INSTANCES[i]} 也失败:`, error);
        continue;
    }
}

// 所有实例都失败，抛出原始错误
throw originalError;
```

}

// 获取视频详情
async function loadDetail(link) {
try {
// 对于RSShub源，直接返回链接作为视频URL
return {
videoUrl: link,
title: “B站视频”,
description: “通过RSShub获取的B站视频”,
duration: 0,
author: “B站用户”
};

```
} catch (error) {
    console.error("获取视频详情失败:", error);
    throw error;
}
```

}

// 工具函数：格式化时长
function formatDuration(seconds) {
if (!seconds || seconds === 0) return “未知”;

```
const hours = Math.floor(seconds / 3600);
const minutes = Math.floor((seconds % 3600) / 60);
const secs = seconds % 60;

if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
} else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
```

}

// 工具函数：解析时长字符串
function parseDuration(durationStr) {
if (!durationStr) return 0;

```
const parts = durationStr.split(':');
if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
} else if (parts.length === 3) {
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
}
return 0;
```

}
