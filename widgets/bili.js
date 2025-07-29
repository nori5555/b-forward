WidgetMetadata = {
  id: "bilibili_user_videos",
  title: "B站用户视频播放器",
  version: "2.0.0",
  author: "nori5555",
  desc: "获取B站用户全部视频并支持直接播放",
  modules: [
    {
      title: "UP主视频播放",
      functionName: "loadUserVideos",
      cacheDuration: 1800, // 30分钟缓存
      icon: "https://www.bilibili.com/favicon.ico",
      params: [
        {
          name: "uid",
          title: "B站用户UID",
          type: "string",
          required: true,
          placeholder: "请输入UID，例如 7784568"
        },
        {
          name: "quality",
          title: "视频质量",
          type: "select",
          required: false,
          default: "720P",
          options: [
            { value: "1080P", text: "1080P高清" },
            { value: "720P", text: "720P高清" },
            { value: "480P", text: "480P标清" },
            { value: "360P", text: "360P流畅" }
          ]
        },
        {
          name: "proxy",
          title: "使用代理播放",
          type: "boolean",
          required: false,
          default: true,
          description: "启用后通过代理服务器播放，提高兼容性"
        }
      ]
    }
  ]
}

// 视频缓存管理
class VideoCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 100; // 最大缓存100个视频
    this.ttl = 3600000; // 1小时过期
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  set(key, data) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
  }
  
  clear() {
    this.cache.clear();
  }
}

const videoCache = new VideoCache();

// 代理服务器配置
const PROXY_SERVERS = [
  'https://cors-anywhere.herokuapp.com/',
  'https://api.allorigins.win/raw?url=',
  'https://cors.bridged.cc/',
  // 可以添加更多代理服务器
];

async function loadUserVideos(params) {
  try {
    const uid = params.uid || "7784568";
    const quality = params.quality || "720P";
    const useProxy = params.proxy !== false;
    
    // 检查缓存
    const cacheKey = `user_videos_${uid}_${quality}`;
    const cachedData = videoCache.get(cacheKey);
    if (cachedData) {
      console.log('使用缓存数据');
      return cachedData;
    }
    
    console.log(`获取用户 ${uid} 的全部视频...`);
    
    // 获取用户全部视频
    const allVideos = await getAllUserVideos(uid);
    
    if (allVideos.length === 0) {
      return [{
        title: "未找到视频",
        description: "该用户暂无投稿视频或UID不存在",
        icon: "https://www.bilibili.com/favicon.ico",
        url: `https://space.bilibili.com/${uid}`,
        type: "link"
      }];
    }
    
    // 处理视频播放链接
    const processedVideos = await processVideosForPlayback(allVideos, quality, useProxy);
    
    // 缓存处理后的数据
    videoCache.set(cacheKey, processedVideos);
    
    return processedVideos;
    
  } catch (error) {
    console.error('B站视频获取失败:', error);
    return [{
      title: "获取失败",
      description: `错误: ${error.message}`,
      icon: "https://www.bilibili.com/favicon.ico",
      url: "https://www.bilibili.com",
      type: "link"
    }];
  }
}

// 获取用户全部视频
async function getAllUserVideos(uid) {
  const allVideos = [];
  let page = 1;
  const pageSize = 50;
  let hasMore = true;
  
  while (hasMore && page <= 20) { // 最多获取20页，防止无限循环
    try {
      const url = `https://api.bilibili.com/x/space/arc/search?mid=${uid}&ps=${pageSize}&pn=${page}`;
      
      const res = await $http.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.bilibili.com/',
          'Origin': 'https://www.bilibili.com'
        }
      });
      
      if (!res.data || res.data.code !== 0) {
        console.error(`第${page}页获取失败:`, res.data?.message);
        break;
      }
      
      const pageData = res.data.data?.list?.vlist || [];
      if (pageData.length === 0) {
        hasMore = false;
        break;
      }
      
      allVideos.push(...pageData);
      page++;
      
      // 添加延迟避免请求过快
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`获取第${page}页视频失败:`, error);
      break;
    }
  }
  
  console.log(`共获取到 ${allVideos.length} 个视频`);
  return allVideos;
}

// 处理视频播放链接
async function processVideosForPlayback(videos, quality, useProxy) {
  const processed = [];
  
  for (let i = 0; i < Math.min(videos.length, 30); i++) { // 限制前30个视频避免处理太久
    const video = videos[i];
    try {
      // 尝试获取视频播放链接
      const playData = await getVideoPlayUrl(video.bvid, quality, useProxy);
      
      const videoItem = {
        title: video.title,
        description: `${video.author} · ${formatViewCount(video.play)}次观看 · ${formatDate(video.created)}`,
        icon: video.pic.startsWith("http") ? video.pic : "https:" + video.pic,
        duration: formatDuration(video.length),
        bvid: video.bvid,
        quality: quality,
        originalUrl: `https://www.bilibili.com/video/${video.bvid}`
      };
      
      if (playData && playData.url) {
        videoItem.url = playData.url;
        videoItem.type = "video";
        videoItem.headers = playData.headers;
        videoItem.proxy = useProxy;
        
        // 添加多个备用链接
        if (playData.backupUrls && playData.backupUrls.length > 0) {
          videoItem.backupUrls = playData.backupUrls;
        }
      } else {
        // 降级为链接模式
        videoItem.url = videoItem.originalUrl;
        videoItem.type = "link";
      }
      
      processed.push(videoItem);
      
    } catch (error) {
      console.error(`处理视频 ${video.bvid} 失败:`, error);
      // 降级为链接模式
      processed.push({
        title: video.title,
        description: `${video.author} · ${formatViewCount(video.play)}次观看 · ${formatDate(video.created)}`,
        icon: video.pic.startsWith("http") ? video.pic : "https:" + video.pic,
        url: `https://www.bilibili.com/video/${video.bvid}`,
        type: "link",
        duration: formatDuration(video.length),
        bvid: video.bvid
      });
    }
  }
  
  // 如果还有更多视频，添加"查看更多"选项
  if (videos.length > 30) {
    processed.push({
      title: `还有 ${videos.length - 30} 个视频...`,
      description: "点击查看用户主页或调整参数获取更多",
      icon: "https://www.bilibili.com/favicon.ico",
      url: `https://space.bilibili.com/${videos[0]?.mid || ''}`,
      type: "link"
    });
  }
  
  return processed;
}

// 获取视频播放URL
async function getVideoPlayUrl(bvid, quality, useProxy) {
  try {
    // 首先获取视频信息
    const infoUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
    const infoRes = await $http.get(infoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.bilibili.com/'
      }
    });
    
    if (!infoRes.data || infoRes.data.code !== 0) {
      throw new Error('获取视频信息失败');
    }
    
    const cid = infoRes.data.data.cid;
    const aid = infoRes.data.data.aid;
    
    // 尝试多种方式获取播放链接
    const playUrls = await Promise.allSettled([
      getPlayUrlMethod1(aid, cid, quality),
      getPlayUrlMethod2(aid, cid, quality),
      getPlayUrlMethod3(bvid, cid, quality)
    ]);
    
    for (const result of playUrls) {
      if (result.status === 'fulfilled' && result.value) {
        const playData = result.value;
        
        if (useProxy && playData.url) {
          // 尝试使用代理
          const proxiedData = await tryProxyUrls(playData);
          if (proxiedData) {
            return proxiedData;
          }
        }
        
        return playData;
      }
    }
    
    return null;
    
  } catch (error) {
    console.error(`获取视频 ${bvid} 播放链接失败:`, error);
    return null;
  }
}

// 播放链接获取方法1 - 官方API
async function getPlayUrlMethod1(aid, cid, quality) {
  try {
    const playUrl = `https://api.bilibili.com/x/player/playurl?avid=${aid}&cid=${cid}&qn=${getQualityCode(quality)}&type=&otype=json&platform=html5&high_quality=1`;
    
    const playRes = await $http.get(playUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': `https://www.bilibili.com/video/av${aid}`
      }
    });
    
    if (playRes.data && playRes.data.code === 0 && playRes.data.data.durl) {
      const durl = playRes.data.data.durl[0];
      return {
        url: durl.url,
        backupUrls: durl.backup_url || [],
        headers: {
          'Referer': 'https://www.bilibili.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      };
    }
    
    return null;
  } catch (error) {
    console.error('方法1获取失败:', error);
    return null;
  }
}

// 播放链接获取方法2 - 移动端API
async function getPlayUrlMethod2(aid, cid, quality) {
  try {
    const playUrl = `https://api.bilibili.com/x/player/playurl?avid=${aid}&cid=${cid}&qn=${getQualityCode(quality)}&platform=android&mobi_app=android`;
    
    const playRes = await $http.get(playUrl, {
      headers: {
        'User-Agent': 'bili-universal/10770 CFNetwork/1240.0.4 Darwin/20.6.0',
        'Referer': 'https://www.bilibili.com/'
      }
    });
    
    if (playRes.data && playRes.data.code === 0 && playRes.data.data.durl) {
      const durl = playRes.data.data.durl[0];
      return {
        url: durl.url,
        backupUrls: durl.backup_url || [],
        headers: {
          'Referer': 'https://www.bilibili.com/',
          'User-Agent': 'bili-universal/10770 CFNetwork/1240.0.4 Darwin/20.6.0'
        }
      };
    }
    
    return null;
  } catch (error) {
    console.error('方法2获取失败:', error);
    return null;
  }
}

// 播放链接获取方法3 - 第三方解析
async function getPlayUrlMethod3(bvid, cid, quality) {
  try {
    // 这里可以接入第三方解析服务
    // 例如：const parseUrl = `https://api.example.com/parse?bvid=${bvid}&cid=${cid}`;
    // 由于没有具体的第三方服务，这里返回null
    return null;
  } catch (error) {
    console.error('方法3获取失败:', error);
    return null;
  }
}

// 尝试代理URL
async function tryProxyUrls(playData) {
  for (const proxy of PROXY_SERVERS) {
    try {
      const proxiedUrl = proxy + encodeURIComponent(playData.url);
      
      // 测试代理是否可用
      const testRes = await $http.head(proxiedUrl, {
        timeout: 5000,
        headers: playData.headers
      });
      
      if (testRes.status >= 200 && testRes.status < 400) {
        return {
          ...playData,
          url: proxiedUrl,
          originalUrl: playData.url,
          proxy: proxy
        };
      }
    } catch (error) {
      console.warn(`代理 ${proxy} 不可用:`, error);
      continue;
    }
  }
  
  return null;
}

// 质量代码映射
function getQualityCode(quality) {
  const qualityMap = {
    '1080P': 80,
    '720P': 64,
    '480P': 32,
    '360P': 16
  };
  return qualityMap[quality] || 64;
}

// 格式化播放次数
function formatViewCount(count) {
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + '万';
  }
  return count.toString();
}

// 格式化视频时长
function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// 格式化日期
function formatDate(timestamp) {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return "今天";
  } else if (days === 1) {
    return "昨天";
  } else if (days < 30) {
    return `${days}天前`;
  } else if (days < 365) {
    const months = Math.floor(days / 30);
    return `${months}个月前`;
  } else {
    const years = Math.floor(days / 365);
    return `${years}年前`;
  }
}
