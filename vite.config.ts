import { fileURLToPath, URL } from 'node:url'

import { build, defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueDevTools from 'vite-plugin-vue-devtools'

import { resolve, join } from 'path';
import { writeFileSync, mkdirSync } from 'fs';

import { execSync } from 'child_process'

// https://vitejs.dev/config/
// 每次构建时写入构建时间和Git信息
function getCustomInfo() {
    // 公告
    const announcement = {
        switch: false,
        info: "登山系统维护中, 我们将尽快重新上线",
    };
    // 更新信息
    const updateInfo = {
        switch: true,
        header: "更新提示",
        body: "服务器热更新, 点击刷新\n建议您更新, 防止出现打卡数据异常\n功能更新：现已上线工会排行榜",
    };
    // 天气信息
    const weather = {
        switch: {
            info: true,
            warn: true,
        },
        config: {
            api: "https://ydqc.csu.edu.cn/weather",
            province: "湖南",
            city: "长沙",
        },
        info: {
            title: {
                apply: "中央气象台发布天气预警",
                cancel: "天气预警解除"
            },
            body: {
                apply: "请仔细评估天气情况，及时返回到安全地带。\n如遇紧急情况，请及时拨打紧急电话！",
                cancel: "继续征服岳麓山吧！"
            }
        }
    }
    return { announcement, updateInfo, weather };
}

function getGitCommitInfo() {
    try {
        const commitId = execSync('git rev-parse --short HEAD').toString().trim()
        const commitMessage = execSync('git log -1 --pretty=%s').toString().trim()
        const branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
        const fileStats = execSync('git diff --shortstat HEAD~1').toString().trim()
        const tagInfo = execSync('git describe --tags --always').toString().trim()
            .toString()
            .trim()
            .split('\n')
        const commitInfo = {
            commitId: commitId,
            commitMessage: commitMessage,
            branchName: branchName,
            fileStats: fileStats,
            tagInfo: tagInfo,
        }
        return { commitInfo }
    } catch (error) {
        console.warn('无法获取 Git 提交信息')
        return {}
    }
}

function buildInfoPlugin() {
    let outDir = '';
    let root = '';

    return {
        name: 'build-info',
        configResolved(config: { root: string; build: { outDir: string } }) {
            root = config.root
            outDir = resolve(root, config.build.outDir)
        },
        closeBundle() {
            // 预定义信息(如公告, 更新日志等)
            const { announcement, updateInfo, weather } = getCustomInfo()

            // 获取构建时间
            const buildTime = new Date().toISOString()

            // 获取 Git 信息
            const { commitInfo } = getGitCommitInfo()

            // 构建输出内容
            const buildInfo = {
                time: buildTime,
                commitInfo,
                announcement,
                updateInfo,
                weather,
            }

            // 确保输出目录存在
            mkdirSync(outDir, { recursive: true })

            // 写入文件
            const outputPath = join(outDir, 'build-info.json')
            writeFileSync(outputPath, JSON.stringify(buildInfo, null, 2))

            console.log('构建信息已写入:', outputPath)
            console.log(buildInfo)
        }
    };
}

export default defineConfig({
    plugins: [
        vue(),
        VueDevTools(),
        buildInfoPlugin(),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    server: {
        host: '0.0.0.0',
        proxy: {
            '/api': {
                // debug-bridge 配置对应端口
                target: 'http://localhost:8080',
                changeOrigin: true,
                rewrite: path => path.replace("/api/v1", "")
            },
            '/uploads': {
                // debug-bridge 配置对应端口
                target: 'http://localhost:8080',
                changeOrigin: true,
            },
        }
    }
})
