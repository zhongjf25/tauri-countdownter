import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";

const app = createApp(App);

// 注册Element Plus
app.use(ElementPlus);

// 注册路由
app.use(router);

app.mount("#app");
