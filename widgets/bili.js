WidgetMetadata = {
  id: "bilibili_user",
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
  const uid = params.uid || "7784568";  // 默认UID（哔哩哔哩科技）
  const url = `https://api.bilibili.com/x/space/arc/search?mid=${uid}&ps=20&pn=1`;
  const res = await $http.get(url);
  const list = res.data.data.list.vlist || [];

  return list.map(video => ({
    title: video.title,
    description: `${video.author} · ${video.play}次观看`,
    icon: video.pic.startsWith("http") ? video.pic : "https:" + video.pic,
    url: "https://www.bilibili.com/video/" + video.bvid
  }));
}
