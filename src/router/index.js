import { createRouter, createWebHistory } from "vue-router";
import MainTimer from "../views/MainTimer/MainTimer.vue";
import TimeUpPage from "../views/TimeUpPage/TimeUpPage.vue";
import CountdownPage from "../views/CountdownPage/CountdownPage.vue";
import HistoryPage from "../views/PomodoroHistory/PomodoroHistory.vue";

const routes = [
  {
    path: "/",
    name: "MainTimer",
    component: MainTimer,
  },
  {
    path: "/countdown",
    name: "CountdownPage",
    component: CountdownPage,
  },
  {
    path: "/timeup",
    name: "TimeUpPage",
    component: TimeUpPage,
  },
  {
    path: "/history",
    name: "HistoryPage",
    component: HistoryPage,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
