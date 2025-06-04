var WidgetMetadata = {
  id: "nori.bilibili.user.videos",
  title: "B站用户视频",
  description: "通过 UID 获取 UP 主视频",
  author: "Nori",
  site: "https://space.bilibili.com/",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  modules: [
    {
      title: "UP主视频列表",
      description: "通过 UID 拉取视频",
      functionName: "fetchBilibiliVideos",
      params: [
        {
          name: "uid",
          title: "UP 主 UID",
          type: "input",
          description: "填写 B站 UP 主 UID",
          value: "672328094"
        }
      ]
    }
  ]
};

async function fetchBilibiliVideos(params = {}) {
  try {
    const uid = params.uid || "672328094";
    const url = `https://api.bilibili.com/x/space/arc/search?mid=${uid}&ps=30&pn=1`;

    const response = await Widget.http.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": `https://space.bilibili.com/${uid}`
      }
    });

    const data = response.data;
    if (!data || !data.data || !data.data.list || !data.data.list.vlist) {
      throw new Error("未获取到视频数据");
    }

    return data.data.list.vlist.map(video => ({
      id: video.aid.toString(),
      type: "url",
      title: video.title,
      posterPath: video.pic,
      releaseDate: video.created ? new Date(video.created * 1000).toISOString().split('T')[0] : "",
      mediaType: "tv",
      link: `https://www.bilibili.com/video/av${video.aid}`,
      description: video.description
    }));
  } catch (error) {
    console.error("处理失败:", error);
    throw error;
  }
}
