// 可以先执行函数，也可以最后才执行函数
function throttle (fn, wait) {
    let timer
    return function (...args) {
        let _this = this
        if (timer) {
            return
        }
        timer = setTimeout(() => {
            fn.apply(_this, args)
            timer = null
        }, wait)
    }
}