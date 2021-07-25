import { getAppChanges } from "../application/app.helper.js";
export function reroute(){
    // reroute中 需要知道 应该挂载哪个应用，要卸载哪个应用
    
    // 根据当前所有应用过滤出 不同的应用类型
    const {appToLoad, appsToMount, appsToUnmount } = getAppChanges();
    // 需要 去加载应用
    console.log(appToLoad, appsToMount, appsToUnmount);




    
}