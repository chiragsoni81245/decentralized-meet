function wait(seconds, callback = undefined, ...args) {
    return new Promise((resolve) => setTimeout(() => {
        callback && callback(...args)
        resolve()
    }, seconds * 1000))
}