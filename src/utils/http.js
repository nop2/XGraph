import axios from "axios";

const http = axios.create({
    baseURL: 'http://127.0.0.1:5000',
    timeout: 100000,
})

// 添加请求拦截器
http.interceptors.request.use((config) => {
    return config
}, (error) => {
    return Promise.reject(error)
})

// 添加响应拦截器
http.interceptors.response.use((response) => {
    // 2xx 范围内的状态码都会触发该函数。
    // 对响应数据做点什么
    return response.data
}, (error) => {
    console.dir(error)
    return Promise.reject(error)
})

export {http}
