import HomeView from "@/views/HomeView.vue";

const routes = [
    {
        path: '/',
        name: '首页',
        component: () => import('../layout/BasicLayout.vue'),
        children: [
            {
                path: '/',
                name: '首页',
                component: HomeView
            }
        ]
    },
    {
        path: '/about',
        name: 'about',
        // route level code-splitting
        // this generates a separate chunk (About.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        component: () => import('../views/AboutView.vue')
    }
]

export default routes
