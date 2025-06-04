v// B站Forward模块 - 完整实现
// 基于Widget API规范

/**
 * 搜索B站视频
 * @param {Object} params - 搜索参数
 * @param {string} params.keyword - 搜索关键词
 * @param {number} params.page - 页码，默认1
 * @param {number} params.pageSize - 每页数量，默认20
 * @returns {Array} 视频列表
 */
async function searchVideos(params = {}) {
    try {
        // 1. 参数验证
        if (!params.keyword) {
            throw new Error("缺少搜索关键词");
        }

        const page = params.page || 1;
        const pageSize = params.pageSize || 20;

        // 2. 发送搜索请求
        const searchUrl = `https://api.bilibili.com/x/web-interface/search/type`;
        const response = await Widget.http.get(searchUrl, {
            params: {
                search_type: 'video',
                keyword: params.keyword,
                page: page,
                pagesize: pageSize,
                order: 'totalrank',
                duration: 0,
                tids: 0
            },
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Referer": "https://www.bilibili.com"
            }
        });

        // 3. 解析响应数据
        const data = response.data;
        if (data.code !== 0) {
            throw new Error(`API请求失败: ${data.message}`);
        }

        const videos = data.data.result || [];

        // 4. 返回格式化结果
        return videos.map(video => ({
            id: video.bvid,
            type: "url",
            title: video.title.replace(/<[^>]*>/g, ''), // 移除HTML标签
            posterPath: `https:${video.pic}`,
            backdropPath: `https:${video.pic}@720w_405h_1c.webp`,
            releaseDate: formatDate(video.pubdate),
            mediaType: "movie",
            rating: formatRating(video.play),
            genreTitle: video.typename || "视频",
            duration: video.duration,
            durationText: formatDuration(video.duration),
            previewUrl: "",
            videoUrl: "", // 需要通过loadDetail获取
            link: `https://www.bilibili.com/video/${video.bvid}`,
            description: video.description || video.title,
            author: video.author,
            playCount: video.play,
            childItems: []
        }));

    } catch (error) {
        console.error("搜索视频失败:", error);
        throw error;
    }
}

/**
 * 获取热门视频
 * @param {Object} params - 参数
 * @param {number} params.page - 页码
 * @returns {Array} 热门视频列表
 */
async function getHotVideos(params = {}) {
    try {
        const page = params.page || 1;

        // 获取热门视频
        const response = await Widget.http.get("https://api.bilibili.com/x/web-interface/popular", {
            params: {
                ps: 20,
                pn: page
            },
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Referer": "https://www.bilibili.com"
            }
        });

        const data = response.data;
        if (data.code !== 0) {
            throw new Error(`获取热门视频失败: ${data.message}`);
        }

        const videos = data.data.list || [];

        return videos.map(video => ({
            id: video.bvid,
            type: "url",
            title: video.title,
            posterPath: `https:${video.pic}`,
            backdropPath: `https:${video.pic}@720w_405h_1c.webp`,
            releaseDate: formatDate(video.pubdate),
            mediaType: "movie",
            rating: formatRating(video.stat.view),
            genreTitle: video.tname || "热门",
            duration: video.duration,
            durationText: formatDuration(video.duration),
            previewUrl: "",
            videoUrl: "",
            link: `https://www.bilibili.com/video/${video.bvid}`,
            description: video.desc || video.title,
            author: video.owner.name,
            playCount: video.stat.view,
            childItems: []
        }));

    } catch (error) {
        console.error("获取热门视频失败:", error);
        throw error;
    }
}

/**
 * 加载视频详情和播放地址
 * @param {string} link - 视频链接或bvid
 * @returns {Object} 包含videoUrl的视频详情
 */
async function loadDetail(link) {
    try {
        // 1. 提取bvid
        let bvid = link;
        if (link.includes('bilibili.com')) {
            const match = link.match(/\/video\/(BV[a-zA-Z0-9]+)/);
            if (match) {
                bvid = match[1];
            }
        }

        if (!bvid || !bvid.startsWith('BV')) {
            throw new Error("无效的视频ID");
        }

        // 2. 获取视频基本信息
        const videoInfoUrl = `https://api.bilibili.com/x/web-interface/view`;
        const infoResponse = await Widget.http.get(videoInfoUrl, {
            params: { bvid: bvid },
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Referer": "https://www.bilibili.com"
            }
        });

        const infoData = infoResponse.data;
        if (infoData.code !== 0) {
            throw new Error(`获取视频信息失败: ${infoData.message}`);
        }

        const videoInfo = infoData.data;
        const cid = videoInfo.cid;

        // 3. 获取播放地址
        const playUrl = await getPlayUrl(bvid, cid);

        // 4. 返回完整视频信息
        return {
            id: bvid,
            type: "url",
            title: videoInfo.title,
            posterPath: `https:${videoInfo.pic}`,
            backdropPath: `https:${videoInfo.pic}@720w_405h_1c.webp`,
            releaseDate: formatDate(videoInfo.pubdate),
            mediaType: "movie",
            rating: formatRating(videoInfo.stat.view),
            genreTitle: videoInfo.tname || "视频",
            duration: videoInfo.duration,
            durationText: formatDuration(videoInfo.duration),
            previewUrl: "",
            videoUrl: playUrl, // 关键：播放地址
            link: `https://www.bilibili.com/video/${bvid}`,
            description: videoInfo.desc || videoInfo.title,
            author: videoInfo.owner.name,
            playCount: videoInfo.stat.view,
            childItems: []
        };

    } catch (error) {
        console.error("加载视频详情失败:", error);
        throw error;
    }
}

/**
 * 获取视频播放地址
 * @param {string} bvid - 视频ID
 * @param {number} cid - 分集ID
 * @returns {string} 播放地址
 */
async function getPlayUrl(bvid, cid) {
    try {
        // 尝试不同清晰度获取播放地址
        const qualities = [80, 64, 32, 16]; // 1080P, 720P, 480P, 360P
        
        for (const qn of qualities) {
            try {
                const playUrlApi = `https://api.bilibili.com/x/player/playurl`;
                const response = await Widget.http.get(playUrlApi, {
                    params: {
                        bvid: bvid,
                        cid: cid,
                        qn: qn,
                        type: '',
                        otype: 'json',
                        fourk: 1,
                        fnver: 0,
                        fnval: 16
                    },
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                        "Referer": "https://www.bilibili.com"
                    }
                });

                const data = response.data;
                if (data.code === 0 && data.data && data.data.durl && data.data.durl.length > 0) {
                    return data.data.durl[0].url;
                }
            } catch (e) {
                console.log(`清晰度 ${qn} 获取失败，尝试下一个`);
                continue;
            }
        }

        throw new Error("无法获取播放地址");

    } catch (error) {
        console.error("获取播放地址失败:", error);
        throw error;
    }
}

/**
 * 获取UP主视频列表
 * @param {Object} params - 参数
 * @param {string} params.mid - UP主ID
 * @param {number} params.page - 页码
 * @returns {Array} UP主视频列表
 */
async function getUploaderVideos(params = {}) {
    try {
        if (!params.mid) {
            throw new Error("缺少UP主ID");
        }

        const page = params.page || 1;
        const pageSize = 20;

        const response = await Widget.http.get("https://api.bilibili.com/x/space/arc/search", {
            params: {
                mid: params.mid,
                ps: pageSize,
                pn: page,
                order: 'pubdate'
            },
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Referer": "https://www.bilibili.com"
            }
        });

        const data = response.data;
        if (data.code !== 0) {
            throw new Error(`获取UP主视频失败: ${data.message}`);
        }

        const videos = data.data.list.vlist || [];

        return videos.map(video => ({
            id: video.bvid,
            type: "url",
            title: video.title,
            posterPath: `https:${video.pic}`,
            backdropPath: `https:${video.pic}@720w_405h_1c.webp`,
            releaseDate: formatDate(video.created),
            mediaType: "movie",
            rating: formatRating(video.play),
            genreTitle: video.typename || "视频",
            duration: video.length,
            durationText: video.length,
            previewUrl: "",
            videoUrl: "",
            link: `https://www.bilibili.com/video/${video.bvid}`,
            description: video.description || video.title,
            author: video.author,
            playCount: video.play,
            childItems: []
        }));

    } catch (error) {
        console.error("获取UP主视频失败:", error);
        throw error;
    }
}

/**
 * 获取分区视频
 * @param {Object} params - 参数
 * @param {number} params.tid - 分区ID
 * @param {number} params.page - 页码
 * @returns {Array} 分区视频列表
 */
async function getCategoryVideos(params = {}) {
    try {
        const tid = params.tid || 0; // 0为全站
        const page = params.page || 1;

        const response = await Widget.http.get("https://api.bilibili.com/x/web-interface/newlist", {
            params: {
                rid: tid,
                pn: page,
                ps: 20,
                type: 0
            },
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Referer": "https://www.bilibili.com"
            }
        });

        const data = response.data;
        if (data.code !== 0) {
            throw new Error(`获取分区视频失败: ${data.message}`);
        }

        const videos = data.data.archives || [];

        return videos.map(video => ({
            id: video.bvid,
            type: "url",
            title: video.title,
            posterPath: `https:${video.pic}`,
            backdropPath: `https:${video.pic}@720w_405h_1c.webp`,
            releaseDate: formatDate(video.pubdate),
            mediaType: "movie",
            rating: formatRating(video.stat.view),
            genreTitle: video.tname || "视频",
            duration: video.duration,
            durationText: formatDuration(video.duration),
            previewUrl: "",
            videoUrl: "",
            link: `https://www.bilibili.com/video/${video.bvid}`,
            description: video.desc || video.title,
            author: video.owner.name,
            playCount: video.stat.view,
            childItems: []
        }));

    } catch (error) {
        console.error("获取分区视频失败:", error);
        throw error;
    }
}

// 工具函数

/**
 * 格式化时间戳为日期
 */
function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toISOString().split('T')[0];
}

/**
 * 格式化播放量为评分
 */
function formatRating(playCount) {
    if (playCount > 1000000) {
        return "9.0";
    } else if (playCount > 100000) {
        return "8.0";
    } else if (playCount > 10000) {
        return "7.0";
    } else {
        return "6.0";
    }
}

/**
 * 格式化时长
 */
function formatDuration(seconds) {
    if (typeof seconds === 'string' && seconds.includes(':')) {
        return seconds;
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

// 导出函数 - 根据你的环境选择合适的导出方式

// CommonJS 导出 (Node.js)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        searchVideos,
        getHotVideos,
        loadDetail,
        getUploaderVideos,
        getCategoryVideos
    };
}

// ES6 模块导出
if (typeof exports !== 'undefined') {
    exports.searchVideos = searchVideos;
    exports.getHotVideos = getHotVideos;
    exports.loadDetail = loadDetail;
    exports.getUploaderVideos = getUploaderVideos;
    exports.getCategoryVideos = getCategoryVideos;
}

// 全局对象导出 (浏览器环境)
if (typeof window !== 'undefined') {
    window.BilibiliForward = {
        searchVideos,
        getHotVideos,
        loadDetail,
        getUploaderVideos,
        getCategoryVideos
    };
}
