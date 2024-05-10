// 第一版 deepClone
// instanceof Object、typeof 的类型检测对于数组、正则对象没有很好的检测
// for...in 只能列举可枚举属性（也可以列举原型上 property）
// 无法解决循环引用问题
function deepClone (source) {
    if (source instanceof Object === false) {
        return source
    }
    // 初始化 target 形状
    let target = Array.isArray(source) ? [] : {}
    for (let key in source) {
        // 只拷贝自身 property
        if (source.hasOwnProperty(key)) {
            if (typeof source[key] === 'object') {
                target[key] = deepClone(source[key])
            } else {
                target[key] = source[key]
            }
        }
    }
    return target
}

/**
 * 最终版
 * 解决不可枚举属性复制
 * 支持多数据复制：Date、正则、Function，完善数据类型检测
 * 解决循环引用问题
 */
function cloneDeep (obj, hash = new WeakMap()) {
    // 多数据复制问题
    // Date 对象
    if (obj instanceof Date) {
        return new Date(obj)
    }
    // 正则对象
    if (obj instanceof RegExp) {
        return new RegExp(obj)
    }
    // 存在循环引用，使用 WeakMap 保存的引用对象，弱引用防止内存泄漏
    if (hash.has(obj)) {
        return hash.get(obj)
    }
    // 对象自身 property 行为
    let allDesc = Object.getOwnPropertyDescriptor(obj)
    // 通过 create 初始化创建 target 对象，保留原对象 property 行为特性
    let cloneObj = Object.create(Object.getPrototypeOf(obj), allDesc)

    // WeakMap 结构保存着引用对象 obj
    hash.set(obj, cloneObj)
    // Reflect.ownKeys 解决不可枚举、key 为 symbol 的 property 问题
    for (let key of Reflect.ownKeys(obj)) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            cloneObj = cloneDeep(obj[key], hash)
        } else {
            cloneObj[key] = obj[key]
        }
    }
    return cloneObj
}