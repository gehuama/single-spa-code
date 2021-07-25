import { apps } from './apps.js';
export const NOT_LOADED = "NOT_LOADED"; // 应用默认状态是未加载状态
export const LOADED_SOURCE_CODE = "NOT_LOADED"; // 正在加载文件资源
export const NOT_BOOTSTRAPPED = "NOT_BOOTSTRAPPED"; // 此时没有调用 bootstrap
export const BOOTSTRAPPING = "BOOTSTRAPPING"; // 正在启动中，此时 bootstrap 调用完毕后，需要标识成没有挂载
export const NOT_MOUNTED = "NOT_MOUNTED"; // 调用了mount 方法
export const MOUNTED = "MOUNTED"; // 表示挂载成功
export const UNMOUNTING = "UNMOUNTING"; // 卸载中，卸载后回到 NOT_MOUNTED

// 当前应用是否被挂载了 状态是不是 MOUNTED
export function isActive(app) {
    return app.status === MOUNTED;
}
// 路径匹配到才会加载应用
export function shouldBeActive(app) { // 如果返回的是true 就要进行加载
    return app.activeWhen(window.location);
}

export function getAppChanges() { // 拿不到所有app的？ 如何获取
    const appToLoad = []; // 需要加载的列表
    const appsToMount = []; // 需要挂载的列表
    const appsToUnmount = []; // 需要移除的列表
    apps.forEach(app => {
        const appShouldBeActive = shouldBeActive(app); // 确认这个app是否需要加载
        switch (app.status) {
            case NOT_LOADED: 
            case LOADED_SOURCE_CODE:
                // 当前应用状态为 为加载状态或者正在加载文件资源状态时，并且当前子应用就是需要加载的子应用时，因此确认为要加载的应用
                if(appShouldBeActive){
                    appToLoad.push(app); // 没有被加载就是要去加载的app，如果正在加载资源，说明也没有加载过
                }
                break;
            case NOT_BOOTSTRAPPED:
            case NOT_MOUNTED:
                if(appShouldBeActive){
                    appsToMount.push(app); // 没启动过、没挂载过 说明等会要挂载他
                }
            case MOUNTED:
                if(appShouldBeActive){
                    appsToUnmount.push(app); // 正在挂载中 但是路径不匹配了 就是要卸载的
                }
            default:
                break;
        }
    });


    return { appToLoad, appsToMount, appsToUnmount }
}