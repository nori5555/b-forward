var WidgetMetadata = {
  id: "bilibili_user_videos",
  title: "B站UP主视频",
  description: "默认显示大耳朵TV的投稿，可自定义 UID",
  author: "nori5555",
  site: "https://space.bilibili.com/",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  modules: [
    {
      title: "UP主视频",
      description: "展示 B站 UP 主的所有视频，默认大耳朵TV",
      requiresWebView: false,
      functionName: "fetchBilibiliVideos",
      sectionMode: false,
      params: [
        {
          name: "uid",
          title: "B站UID",
          type: "input",
          description: "输入 B站 UP 主 UID，自定义订阅内容",
          value: "672328094" // 默认值为大耳朵TV
        }
      ]
    }
  ]
};

async function fetchBilibiliVideos(params = {}) {
  try {
    const uid = params.uid || "672328094"; // 如果为空，则使用默认 UID
    const url = `https://rsshub.app/bilibili/user/video/${uid}`;

    const response = await Widget.http.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": `https://space.bilibili.com/${uid}`
      }
    });

    const $ = Widget.html.load(response.data);
    const items = $("item");

    return items.map((i, el) => {
      const title = $(el).find("title").text();
      const link = $(el).find("link").text();
      const description = $(el).find("description").text();
      const pubDate = $(el).find("pubDate").text();
      const coverMatch = description.match(/<img src="(.*?)"/);
      const cover = coverMatch ? coverMatch[1] : "";

      return {
        id: link,
        type: "url",
        title: title,
        posterPath: cover,
        backdropPath: cover,
        releaseDate: pubDate,
        mediaType: "tv",
        description: title,
        link: link
      };
    }).get();
  } catch (error) {
    console.error("处理失败:", error);
    throw error;
  }
}
