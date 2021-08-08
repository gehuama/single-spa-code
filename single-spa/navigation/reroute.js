import { BOOTSTRAPPING, getAppChanges, LOADED_SOURCE_CODE, MOUNTED, NOT_BOOTSTRAPPED, NOT_LOADED, NOT_MOUNTED, shouldBeActive, UNMOUNTING } from "../application/app.helper.js";
import { started } from "../start.js";

// 将数组方法转化成链式 即将数组拍平
function flattenFnArray(fns) { // vue3 路由钩子的组合 koa中的组合 redux中的组合
    fns = Array.isArray(fns) ? fns : [fns];
    return function (customProps) {
        // promise 将多个promise组合成一个promise链 异步串行
        return fns.reduce((resultPromise, fn) => resultPromise.then(() => fn(customProps)), Promise.resolve());
    }
}
// 要加载的app转化成Promise
function toLoadPromise(app) {
    return Promise.resolve().then(() => {
        // 获取应用的钩子方法 接入协议
        if (app.status !== NOT_LOADED) { // 只有当状态为NOT_LOADED(未加载状态)的时候 才需要加载 返回当前app让去加载
            return app;
        }
        // 其他情况更新 应用状态为LOADED_SOURCE_CODE（正在加载文件资源）
        app.status = LOADED_SOURCE_CODE;

        // 这个只运行一次，上面做了判断
        return app.loadApp().then(val => {
            let { bootstrap, mount, unmount } = val; // 获取应用的接入协议 子应用暴露的方法
            app.status = NOT_BOOTSTRAPPED;
            app.bootstrap = flattenFnArray(bootstrap);
            app.mount = flattenFnArray(mount);
            app.unmount = flattenFnArray(unmount);
            return app;
        });
    })
}
// 需要移除的app转化成Promise
function toUnmountPromise(app) {
    return Promise.resolve().then(() => {
        if (app.status !== MOUNTED) { // 当前状态不是 MOUNTED（挂载成功），返回当前app
            return app;
        }
        // 应用状态为UNMOUNTING（卸载中，卸载后回到 NOT_MOUNTED）
        app.status = UNMOUNTING;  //标记成正在卸载 调用卸载逻辑 并且标记成未挂载
        return app.unmount(app.customProps).then(() => {
            // 卸载完成更新状态为 NOT_MOUNTED（调用了mount 方法）
            app.status = NOT_MOUNTED;
        })
    })
}
// 启动
function toBootstrapPromise(app) {
    return Promise.resolve().then(() => {
        if (app.status !== NOT_BOOTSTRAPPED) {
            return app;
        }
        app.status = BOOTSTRAPPING;
        return app.bootstrap(app.customProps).then(() => {
            app.status = NOT_MOUNTED;
            return app;
        })
    })
}
// 挂载
function toMountPromise(app) {
    return Promise.resolve().then(() => {
        if (app.status !== NOT_MOUNTED) {
            return app;
        }
        return app.mount(app.customProps).then(() => {
            app.status = MOUNTED;
            return app;
        })
    })
}
// 尝试启动和挂载 注意：挂载之前先卸载
// a->b b->a a->b
function tryBootstrapAndMount(app, unmountPromises) {
    return Promise.resolve().then(() => {
        if (shouldBeActive(app)) {
            // 先启动，启动完等它卸载完成，卸载完成再挂载
            return toBootstrapPromise(app).then(app => unmountPromises.then(() => toMountPromise(app)));
        }
    });
}

export function reroute() {
    // reroute中 需要知道 应该挂载哪个应用，要卸载哪个应用




    // 根据当前所有应用过滤出 不同的应用类型
    const { appToLoad, appsToMount, appsToUnmount } = getAppChanges(); // 每次都得知道当前应用是否挂载
    // 需要 去加载应用,预先加载
    if (started) {
        return performAppChanges();
    }
    // 需要加载的apps
    return loadApps(); // 应用加载就是把应用的钩子拿到（systemJs jsonp fetch）

    // 加载App
    function loadApps() {
        // 需要加载的列表 映射 把加载的列表 映射成promise
        let loadPromises = appToLoad.map(toLoadPromise); // NOT_BOOTSTRAPPED
        // 加载完，即全部的promise执行完成
        return Promise.all(loadPromises);
    }
    // 处理app的修改 需要调用bootstrap 调用mount和unmount
    function performAppChanges() {
        // 应用启动了 需要卸载不需要的应用
        // ？应用可能之前没有加载过(如果没加载，还是需要加载的) =>启动并挂载需要的
        let unmountPromises = Promise.all(appsToUnmount.map(toUnmountPromise)); // 卸载，就启动 注意promise是并发请求，因此卸载不会影响再次启动加载
        // toLoadPromise(app) 需要拿到加载完的app继续.then NOT_BOOTSTRAPPED
        appToLoad.map(app => toLoadPromise(app).then(app => tryBootstrapAndMount(app, unmountPromises)));
        // 有可能 start 是异步加载的 此时loadApp已经被调用过了，需要直接挂载就可以了
        appsToMount.map(app => tryBootstrapAndMount(app, unmountPromises));
    }
}

// registerApplication 目的就是注册应用 实现应用的加载
// start 方法目的就是启动应用和 执行 用户的钩子（可能钩子不存在，需要去加载）