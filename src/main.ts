import './assets/global.css';

import {createApp} from 'vue'
import {createPinia} from 'pinia'

import App from './App.vue'
import router from './router'

// vant 组件库
import 'vant/lib/index.css';
import {
    Button,
    NavBar,
    Tabbar,
    TabbarItem,
    Tab,
    Tabs,
    List,
    Cell,
    NoticeBar,
    Image,
    Icon,
    Circle,
    Step,
    Steps,
    Popup
} from "vant";

const app = createApp(App)

app.use(createPinia())
app.use(router)

// 注册组件
app.use(Button);
app.use(NavBar);
app.use(Tabbar);
app.use(TabbarItem);
app.use(Tab);
app.use(Tabs);
app.use(List);
app.use(Cell);
app.use(NoticeBar);
app.use(Image);
app.use(Icon);
app.use(Circle);
app.use(Step);
app.use(Steps);
app.use(Popup);

// 请求库配置相关
import "@/api/config";

app.mount('#app')
