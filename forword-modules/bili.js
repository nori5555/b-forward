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
  const uid = params.uid;
  if (!uid) throw new Error("缺少必要参数：UID");

  const url = `https://api.bilibili.com/x/space/wbi/arc/search?mid=${uid}&pn=1&ps=20`;

  const response = await Widget.http.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Referer": `https://space.bilibili.com/${uid}`
    }
  });

  const list = response.data?.data?.list?.vlist || [];
  return list.map(item => ({
    id: item.bvid,
    type: "url",
    title: item.title,
    posterPath: item.pic,
    releaseDate: item.created,
    mediaType: "video",
    videoUrl: `https://www.bilibili.com/video/${item.bvid}`,
    link: `https://www.bilibili.com/video/${item.bvid}`,
    description: item.description || ""
  }));
}
