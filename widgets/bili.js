WidgetMetadata = {
  id: "bilibili_user_videos",  // 修复ID匹配问题
  title: "B站用户视频",
  version: "1.0.0",
  author: "nori5555",
  desc: "展示指定B站用户的投稿视频",
  modules: [
    {
      title: "UP主投稿视频",
      functionName: "loadUserVideos",
      cacheDuration: 3600,
      icon: "https://www.bilibili.com/favicon.ico",
      params: [
        {
          name: "uid",
          title: "B站用户UID",
          type: "string",
          required: true,
          placeholder: "请输入UID，例如 7784568"
        }
      ]
    }
  ]
}

async function loadUserVideos(params) {
  try {
    const uid = params.uid || "7784568";  // 默认UID（哔哩哔哩科技）
    
    // 添加请求头和错误处理
    const url = `https://api.bilibili.com/x/space/arc/search?mid=${uid}&ps=20&pn=1`;
    
    const res = await $http.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.bilibili.com/',
        'Origin': 'https://www.bilibili.com'
      }
    });
    
    // 检查响应状态
    if (!res.data || res.data.code !== 0) {
      throw new Error(`API请求失败: ${res.data?.message || '未知错误'}`);
    }
    
    const list = res.data.data?.list?.vlist || [];
    
    if (list.length === 0) {
      return [{
        title: "未找到视频",
        description: "该用户暂无投稿视频或UID不存在",
        icon: "https://www.bilibili.com/favicon.ico",
        url: `https://space.bilibili.com/${uid}`
      }];
    }

    return list.map(video => ({
      title: video.title,
      description: `${video.author} · ${video.play}次观看 · ${formatDate(video.created)}`,
      icon: video.pic.startsWith("http") ? video.pic : "https:" + video.pic,
      url: "https://www.bilibili.com/video/" + video.bvid
    }));
    
  } catch (error) {
    console.error('B站视频获取失败:', error);
    return [{
      title: "获取失败",
      description: `错误: ${error.message}`,
      icon: "https://www.bilibili.com/favicon.ico",
      url: "https://www.bilibili.com"
    }];
  }
}

// 格式化日期辅助函数
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
  } else {
    return date.toLocaleDateString();
  }
}
