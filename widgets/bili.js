var WidgetMetadata = {
  id: "up.bilibili.videos",
  title: "B站 UP 主视频",
  description: "抓取指定B站UP主的全部投稿",
  author: "你自己的名字",
  site: "https://www.bilibili.com/",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  detailCacheDuration: 300,
  modules: [
    {
      title: "UP主投稿",
      description: "抓取该UP主全部视频",
      requiresWebView: false,
      functionName: "loadUpVideos",
      cacheDuration: 3600,
      params: [
        {
          name: "mid",
          title: "UP主UID",
          type: "input",
          placeholder: "例如672328094",
          required: true
        }
      ]
    }
  ]
};
async function loadUpVideos(params = {}) {
  const mid = params.mid;
  if (!mid) throw new Error("缺少UP主UID");

  const PAGE_SIZE = 30;
  let page = 1;
  let hasMore = true;
  const allVideos = [];

  while (hasMore) {
    const url = `https://api.bilibili.com/x/space/arc/search?mid=${mid}&pn=${page}&ps=${PAGE_SIZE}`;
    try {
      const response = await Widget.http.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          Referer: "https://www.bilibili.com/",
        }
      });

      const data = response.data;
      if (data.code !== 0) throw new Error(`B站接口错误：${data.message}`);

      const vlist = data.data.list.vlist;
      if (!vlist.length) break;

      const videos = vlist.map((v, index) => ({
        id: `${v.bvid}-${index}`,
        type: "url",
        title: v.title,
        description: `${formatDate(v.created)} · 播放 ${parsePlayCount(v.play)}`,
        link: `https://www.bilibili.com/video/${v.bvid}`,
        imgSrc: fixPicUrl(v.pic),
        backdropPath: fixPicUrl(v.pic),
        mediaType: "movie"
      }));

      allVideos.push(...videos);
      page++;
    } catch (err) {
      console.error("抓取失败：", err.message);
      throw err;
    }
  }

  return allVideos;
}
#辅助函数
function parsePlayCount(play) {
  if (typeof play === 'number') return play;
  if (play.includes("万")) return parseFloat(play) * 10000;
  if (play.includes("亿")) return parseFloat(play) * 100000000;
  return parseInt(play) || 0;
}

function formatDate(ts) {
  const date = new Date(ts * 1000);
  return date.toISOString().split("T")[0];
}

function fixPicUrl(url) {
  if (!url) return "";
  if (url.startsWith("//")) return "https:" + url;
  if (!url.startsWith("http")) return "https://i0.hdslb.com" + (url.startsWith("/") ? "" : "/") + url;
  return url;
}
module.exports = {
  WidgetMetadata,
  loadUpVideos
};
