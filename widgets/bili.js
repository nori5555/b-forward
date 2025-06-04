var WidgetMetadata = {
  id: "nori.bili.module",
  title: "B站视频",
  description: "通过UID获取UP主视频",
  version: "1.0.0",
  requiredVersion: "0.0.1", // ✅ 建议补上
  author: "nori5555"
};

var widget = {
  async run(params = {}) {
    return [
      {
        id: "bilibili.1",
        type: "url",
        title: "示例视频",
        posterPath: "https://i0.hdslb.com/bfs/archive/00.jpg",
        backdropPath: "https://i0.hdslb.com/bfs/archive/00.jpg",
        releaseDate: "2024-01-01",
        mediaType: "video",
        rating: "5",
        genreTitle: "搞笑",
        duration: 123,
        durationText: "02:03",
        previewUrl: "",
        videoUrl: "https://www.bilibili.com/video/example",
        link: "https://www.bilibili.com/video/example",
        description: "这是一个示例视频描述"
      }
    ];
  }
};
