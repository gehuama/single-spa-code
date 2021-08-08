import { reroute } from "./reroute.js";

function urlRoute() {
    reroute();
}
// 浏览器兼容问题 如果不支持要退回hash， 在 reroute方法中要实现批处理 防抖
window.addEventListener('hashchange', urlRoute);
window.addEventListener('popstate', urlRoute);

const routerEventsListeningTo = ['hashchange', 'popstate']

// 子应用 里面也可能会有路由系统，需要先加载父应用的事件， 再去调用子应用
// 需要先加载父应用 在加载子应用

export const capturedEventsListeners = { // 父应用加载子应用后再触发
    hashchange: [],
    popstate: []
}

const originalAddEventListener = window.addEventListener;
const originalRemoveEventListener = window.removeEventListener;

window.addEventListener = function (eventName, fn) {
    if (routerEventsListeningTo.includes(eventName) && !capturedEventsListeners[eventName].some(l => fn == l)) {
        capturedEventsListeners[eventName].push(fn);
    }
    return originalAddEventListener.apply(this, arguments);
}

window.removeEventListener = function (eventName, fn) {
    if (routerEventsListeningTo.includes(eventName)) {
        capturedEventsListeners[eventName] = capturedEventsListeners[eventName].filters(l => fn != l);
    }
    return originalRemoveEventListener.apply(this, arguments);
}

// 如果使用的是history.pushState 可以实现页面跳转 但是他不会触发popstate
history.pushState =function(){ // 解决historyApi调用时可以触发 popstate
    window.dispatchEvent(new PopStateEvent("popstate"));
}