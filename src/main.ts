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
    Popup,
    CellGroup,
    Field,
    Picker,
    Form,
    Swipe,
    SwipeItem,
    Barrage,
    Space,
    FloatingBubble,
    Toast,
    Area,
    FloatingPanel,
    Divider,
    TextEllipsis,
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
app.use(CellGroup);
app.use(Field);
app.use(Picker);
app.use(Form);
app.use(Swipe);
app.use(SwipeItem);
app.use(Barrage);
app.use(Space);
app.use(FloatingBubble);
app.use(Toast);
app.use(Area);
app.use(FloatingPanel);
app.use(Divider);
app.use(TextEllipsis);

// 请求库配置相关
import "@/api/config";

app.mount('#app')
