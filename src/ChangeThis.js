/**
 * call、apply、bind 最主要的作用是修改函数内部 this 的指向
 * 其次 call、apply 只有第 2 个参数格式不一样，前者 ...arr，后者 arr
 * bind 重新绑定 this 的指向，但不执行。而 call、apply 直接执行
 */

// 模拟 call eg: function.myCall(newObj, ...arr)
Function.prototype.myCall = function (context) {
    // 重新指向 this 上下文环境，默认为 window
    context = context ? Object(context) : window
    context.fn = this // 重置 this 上下文

    let args = [...arguments].slice(1)
    // 执行函数
    context.fn(...args)
    // 删除 fn
    delete context.fn
}


// apply 的实现跟 call 差不多，只有参数的不同
Function.prototype.myApply = function (context) {
    context = context ? Object(context) : window
    context.fn = this

    let args = [...arguments][1]
    if (!args) { // 没有第 2 个参数
        context.fn()
    } else {
        context.fn(...args)
    }
    delete context.fn
}

// bind 没有立即执行函数，本质是返回新的函数
Function.prototype.myBind = function (context) {
    context = context ? Object(context) : window

    let fn = this
    // bind 可以传入多个参数，最后合并到调用的地方
    let args = [...arguments].slice(1)
    return function () {
        return fn.apply(context, args.concat(...arguments))
    }
}