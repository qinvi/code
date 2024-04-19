/**
 * 根据 promise/a+ 实现 promise
 * 在 then 方法内部本来要拓展 promise resolve procedure 部分规范的
 * 个人认为不太好理解，就简单从 Promise 特性入手
 */
const PENDING = 'pending'
const FULLFILLED = 'fullfilled'
const REJECTED = 'rejected'

class Promise {
    status = PENDING
    value = undefined
    reason = undefined
    #onFullfilledCallbacks = []
    #onRejectedCallbacks = []
    constructor(executor) {
        // executor 执行
        const resolve = (value) => {
            // 状态相关规范
            if (this.status === PENDING) {
                this.status = FULLFILLED
                this.value = value
                // 执行微任务绑定的 callback
                this.#onFullfilledCallbacks.forEach((fn) => fn(this.value))
            }
        }
        const reject = (e) => {
            if (this.status === PENDING) {
                this.status = REJECTED
                this.reason = e
                // 执行微任务绑定的 callback
                this.#onRejectedCallbacks.forEach((fn) => fn(this.reason))
            }
        }
        // onFullfilled、onRejected 有可能抛出错误
        try {
            executor(resolve, reject)
        } catch (e) {
            reject(e)
        }
    }
    then (onFullfilled, onRejected) {
        // 值传透 resolve、reject
        // Promise/A+ 规范有描述 onFullfilled / onRejected 不为 function 情况
        onFullfilled = typeof onFullfilled === 'function' ? onFullfilled : value => value
        onRejected = typeof onRejected === 'function' ? onRejected : (reason) => {
            throw new Error(reason instanceof Error ? reason.message.reason : reason)
        }
        // 当前宏任务中添加微任务延时绑定 callback
        // then 返回 Promise
        const self = this
        return new Promise((resolve, reject) => {
            if (this.status === PENDING) {
                this.onFullfilledCallbacks.push(() => {
                    try {
                        setTimeout(() => {
                            // 获取上一步 promise 结果
                            const result = onFullfilled(self.value)
                            // result 可能为 promise 或者普通值
                            // result 为 promise 时，promise2 必须等到 promise1 状态发生变化，onFullfilledCallbacks 会储存 pending 时的逻辑
                            // result 为普通值（状态发生了变化），直接执行 promise 结果
                            result instanceof Promise ? result.then(resolve, reject) : resolve(result)
                        })
                    } catch (e) {
                        reject(e)
                    }
                })
                this.onRejectedCallbacks.push(() => {
                    try {
                        setTimeout(() => {
                            const result = onRejected(self.reason)
                            result instanceof Promise ? result.then(resolve, reject) : reject(result)
                        })
                    } catch (e) {
                        reject(e)
                    }
                })
            } else if (this.status === FULLFILLED) {
                try {
                    setTimeout(() => {
                        const result = onFullfilled(self.value)
                        result instanceof Promise ? result.then(resolve, reject) : resolve(result)
                    })
                } catch (e) {
                    reject(e)
                }
            } else if (this.status === REJECTED) {
                try {
                    setTimeout(() => {
                        const result = onRejected(self.reason)
                        result instanceof Promise ? result.then(resolve, reject) : reject(result)
                    })
                } catch (e) {
                    reject(e)
                }
            }
        })
    }
    catch (onRejected) {
        // 等同于 then(null, reject)
        return this.then(null, onRejected)
    }
    /**
     * 
     * @param {*} value Promise || thenable 对象 || 普通值
     * @returns Promise
     */
    static resolve (value) {
        // value 为 promise 则直接返回
        if (value instanceof Promise) {
            return value
        }
        // value 不是 promise，则返回一个 promise 对象
        return new Promise((resolve, reject) => {
            // 如果 value 为 thenable 对象
            if (value && value.then && typeof value.then === 'function') {
                // Promise.resolve() will call the then() method with two callbacks it prepared
                // 这里代码执行效果跟原生不一样，需要添加异步操作才有相同效果，但是 MDN 定义上没有相关描述
                value.then(resolve, reject)
            } else {
                // fulfilled with the value
                resolve(value)
            }
        })
    }
    static reject (e) {
        // 返回一个 reject 的 Promise 对象，参数为所传入的参数
        return new Promise((resolve, reject) => {
            reject(e)
        })
    }
    /**
     * 
     * @param {*} promises 数组可为空，直接返回 fullfill 完成
     * 其余特性要求可去 MDN 查询
     * @returns Promise(iterable)
     */
    static all (promises) {
        return new Promise((resolve, reject) => {
            const len = promises.length
            let result = []
            let count = 0
            if (len === 0) {
                resolve(result)
            } else {
                // iterable 非空的情况
                for (let i = 0; i < len; i++) {
                    // Promise.resolve 执行结果
                    Promise.resolve(promises[i]).then((value) => {
                        result[i] = value
                        if (++count === len) {
                            resolve(result)
                        }
                    }, (e) => {
                        reject(e)
                        // 跳出循环
                        return
                    })
                }
            }
        })
    }
    /**
     * 
     * @param {*} promises 如果 promises 为空，Promise 处于 pending 状态，即不调用 resolve/reject
     * 其余特性要求可去 MDN 查询
     * @returns Promise
     */
    static race (promises) {
        return new Promise((resolve, reject) => {
            const len = promises.length
            if (len === 0) { // pending
                return
            }
            for (let i = 0; i < len; i++) {
                Promise.resolve(promises[i]).then((value) => {
                    resolve(value)
                    return
                }, (e) => {
                    reject(e)
                    return
                })
            }
        })
    }
}

export default Promise



