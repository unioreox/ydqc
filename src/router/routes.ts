/**
 * @author grtsinry43
 * @date 2024/10/16
 * 路由配置
 * 这里的路由配置用于动态生成 NavBar 和 BottomBar
 * 注意：
 * 1. 每一个对象代表一个路由组，其 name 决定菜单名称，而 component 决定 layout 样式
 * 2. 每一个对象的 meta 具有 meta-icon 属性，用于生成菜单图标，如果需要隐藏则设置 hideInMenu: true（比如一些登录页面，二次确认页面）
 * 3. children 为路由组内的路由，其 name 决定上方导航栏名称，而 component 决定页面组件
 */

const routes = [
    {
        path: '/',
        name: '首页 ',
        component: () => import('../layout/BasicLayout.vue'),
        meta: {
            icon: 'guide-o',
            hideInMenu: false
        },
        children: [
            {
                path: '',
                name: '首页',
                component: () => import(/* webpackChunkName: "Home" */'@/views/HomeView.vue')
            }
        ]
    },
    {
        path: "/activity",
        name: "活动 ",
        component: () => import("@/layout/BasicLayout.vue"),
        meta: {
            icon: "flag-o",
        },
        children: [
            {
                path: '',
                name: "活动",
                component: () => import("@/views/activity/ActivityView.vue"),
            },
            {
                path: "review/:id",
                name: "活动回顾",
                component: () => import("@/views/activity/ActivityReview.vue"),
            }
        ],
    },
    {
        path: '/leaderboard',
        name: '排行榜 ',
        component: () => import('../layout/BasicLayout.vue'),
        meta: {
            icon: 'bar-chart-o',
            hideInMenu: false
        },
        children: [
            {
                path: '',
                name: '排行榜',
                component: () => import(/* webpackChunkName: "LeaderBoard" */'@/views/leaderBoard/LeaderBoardView.vue')
            }
        ]
    },
    {
        path: '/user',
        name: '我的 ',
        component: () => import( '../layout/BasicLayout.vue'),
        meta: {
            icon: 'user-o',
            hideInMenu: false
        },
        children: [
            {
                path: '',
                name: '我的',
                component: () => import(/* webpackChunkName: "User" */'@/views/user/UserView.vue')
            },
            {
                path: 'profile',
                name: '个人信息',
                component: () => import(/* webpackChunkName: "UserInfo" */'@/views/user/UserInfoView.vue')
            },
            {
                path: 'records',
                name: '记录查询',
                component: () => import(/* webpackChunkName: "UserRecords" */'@/views/user/UserRecordsView.vue')
            },
            {
                path: 'edit',
                name: '修改资料',
                component: () => import(/* webpackChunkName: "UserEdit" */'@/views/user/UserEditView.vue')
            }
        ]
    },
    {
        path: "/login",
        name: "登录 ",
        component: () => import("@/views/login/LoginView.vue"),
        meta: {
            hideInMenu: true
        }
    },
    {
        path: "/banned",
        name: "封禁 ",
        component: () => import("@/views/banned/BannedView.vue"),
        meta: {
            hideInMenu: true
        }
    },
    {
        path: "/finish",
        name: "恭喜完成 ",
        component: () => import("@/layout/BasicLayout.vue"),
        meta: {
            hideInMenu: true
        },
        children: [
            {
                path: "",
                name: "恭喜完成",
                component: () => import("@/views/finish/FinishView.vue"),
            },
            {
                path: ":id",
                name: "证书分享",
                component: () => import("@/views/finish/FinishSharedView.vue"),
            }
        ]
    },
    {
        path: "/feedback",
        name: "问题反馈 ",
        component: () => import("@/layout/BasicLayout.vue"),
        meta: {
            hideInMenu: true
        },
        children: [
            {
                path: "",
                name: "问题反馈",
                component: () => import("@/views/feedback/FeedbackView.vue"),
            }
        ],
    },
    {
        path: "/team",
        name: "加入团队 ",
        component: () => import("@/layout/BasicLayout.vue"),
        meta: {
            hideInMenu: true,
        },
        children: [
            {
                path: "",
                name: "加入团队",
                component: () => import("@/views/team/TeamView.vue"),
            }
        ],
    }
]

export default routes
