function debounce (fn, wait) {
    let timer
    return function (...args) {
        let _this = this
        if (timer) {
            clearTimeout(timer)
            timer = null
        }
        timer = setTimeout(() => {
            fn.apply(_this, args)
        }, wait)
    }
}