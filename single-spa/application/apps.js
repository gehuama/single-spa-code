import { reroute } from "../navigation/reroute.js";
import { NOT_LOADED } from "./app.helper.js";
/**
 * @param {*} appName 应用名称 navigation
 * @param {*} loadApp 应用加载函数 此函数会返回 bootstrap mount unmount
 * @param {*} activeWhen 当前什么时候激活 location => location.hash == '/a'
 * @param {*} custom 用户自定义参数
 */
export const apps =[]; // 这里用于存放所有的应用
export function registerApplication(appName,loadApp,activeWhen,customProps){
    const registration = {
        name: appName,
        loadApp,
        activeWhen,
        customProps,
        status: NOT_LOADED // 默认应用为加载状态
    }
    apps.push(registration); // 保存到数组中，后续可以在数组里筛选需要的app 是加载 还是 卸载 还是挂载

    // 需要加载应用 ，注册完毕后 需要进行应用的加载
    reroute(); // 重写路径, 后续切换路由 要再次做这些事， single-spa的核心
}