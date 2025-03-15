// 根据 Promise/A+ 实现的 Promise
// Promise States
const PENDING = 'pending'
const FULLFILLED = 'fullfilled'
const REJECTED = 'rejected'
class Promise {
    #value = undefined
    #reason = undefined
    #status = PENDING
    #onFullfilledCallbacks = []
    #onRejectedCallbacks = []
    constructor(executor) {
        // executor 内部可能报错
        const resolve = (value) => {
            // 成功，执行resolve
            // 2.1
            if (this.#status === PENDING) {
                this.#value = value
                this.#status = FULLFILLED
                // 2.2.6.1 then 可能会执行多次,按顺序依次执行
                this.#onFullfilledCallbacks.forEach(fn => fn(this.#value))
            }
        }
        const reject = (e) => {
            // 失败，执行 reject
            // 2.1
            if (this.#status === PENDING) {
                this.#reason = e
                this.#status = REJECTED
                // 2.2.6.2
                this.#onRejectedCallbacks.forEach(fn => fn(this.#reason))
            }
        }
        try {
            executor(resolve, reject)
        } catch (e) {
            reject(e)
        }
    }
    then (onFullfilled, onRejected) {
        // 2.2.1 / 2.2.5 / 2.2.7.3 / 2.2.7.4
        onFullfilled = typeof onFullfilled === 'function' ? onFullfilled : value => value
        onRejected = typeof onRejected === 'function' ? onRejected : (reason) => { throw reason }
        // 2.2.7 实现值穿透
        let promise2 = new Promise((resolve, reject) => {
            // 2.2.2
            let self = this
            if (this.#status === FULLFILLED) {
                // 2.2.4 既可以使用宏任务 setTimeout
                // 也可以使用微任务 process.nextTick 实现异步
                setTimeout(() => {
                    try {
                        let x = onFullfilled(self.#value)
                        // 2.2.7.1
                        self.resolvePromise(promise2, x, resolve, reject)
                    } catch (e) {
                        reject(e)
                    }
                })
            } else if (this.#status === REJECTED) {
                // 2.2.3
                // 2.2.4
                setTimeout(() => {
                    try {
                        let x = onRejected(self.#reason)
                        // 2.2.7.1
                        self.resolvePromise(promise2, x, resolve, reject)
                    } catch (e) {
                        reject(e)
                    }
                })
            } if (this.#status === PENDING) {
                // executor 内部有异步操作
                // 2.2.6.1 保存成功函数队列
                this.#onFullfilledCallbacks.push(() => {
                    setTimeout(() => {
                        try {
                            let x = onFullfilled(self.#value)
                            self.resolvePromise(promise2, x, resolve, reject)
                        } catch (e) {
                            reject(e)
                        }
                    })
                })
                // 2.2.6.2 保存失败函数队列
                this.#onRejectedCallbacks.push(() => {
                    setTimeout(() => {
                        try {
                            let x = onRejected(self.#reason)
                            self.resolvePromise(promise2, x, resolve, reject)
                        } catch (e) {
                            reject(e)
                        }
                    })
                })
            }
        })
        return promise2
    }
    catch (onRejected) {
        return this.then(null, onRejected)
    }
    /**
     * 无论 status 为 fullfilled 还是 rejected，finally 都会执行
     * @param {*} callback 
     * @returns Promise
     */
    finally (callback) {
        // similar to calling then(onFinally, onFinally)
        return this.then(value => {
            return Promise.resolve(callback()).then(() => value)
        }, e => {
            return Promise.resolve(callback()).then(null, () => {
                throw e
            })
        })
    }
    resolvePromise (promise2, x, resolve, reject) {
        // 主要解决 x 是 promise/thenable 对象的问题
        // 2.3.1
        if (promise2 === x) {
            reject(new TypeError('circle'))
        }
        // 2.3.3
        if (x && typeof x === 'object' || typeof x === 'function') {
            let firstUsed = false
            try {
                let then = x.then
                if (typeof then === 'function') {
                    // 2.3.3.3
                    then.call(x, (y) => {
                        // 2.3.3.3.3
                        if (firstUsed) {
                            return
                        }
                        firstUsed = true
                        // 2.3.3.3.1
                        this.resolvePromise(promise2, y, resolve, reject)
                    }, (r) => {
                        if (firstUsed) {
                            return
                        }
                        firstUsed = true
                        // 2.3.3.3.2
                        reject(r)
                    })
                } else {
                    // 2.3.3.4
                    if (firstUsed) {
                        return
                    }
                    firstUsed = true
                    resolve(x)
                }
            } catch (e) {
                // 2.3.3.2
                if (firstUsed) {
                    return
                }
                firstUsed = true
                reject(e)
            }
        } else {
            // 2.3.4
            resolve(x)
        }
    }
    /**
     * 
     * @param {Promise, thenable, value} value 
     * @returns Promise
     */
    static resolve (value) {
        // value is promise，return Promise
        if (value instanceof Promise) {
            return value
        }
        return new Promise((resolve, reject) => {
            if (value && value.then && typeof value.then === 'function') {
                value.then(resolve, reject)
            } else {
                resolve(value)
            }
        })
    }
    /**
     * 返回 以 e 为参数的 reject promise
     * @param {reason} e 
     * @returns Promise
     */
    static reject (e) {
        return new Promise((resolve, reject) => {
            reject(e)
        })
    }
}
