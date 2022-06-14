#!/usr/bin/env node

const { JSDOM } = require("jsdom")
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))

const target = process.argv[process.argv.length - 1] //目标url 从参数读入

const judge = (url, protocol, origin, href) => {
    if (url.startsWith("//")) { //省略协议的写法
        url = `${protocol}${url}`
    } else if (url.startsWith("/")) { //文件位于网站根目录
        url = `${origin}${url}`
    } else if (url.startsWith("./")) { //使用相对路径
        url = href.slice(0, href.lastIndexOf("/")) + url.slice(1)
    } else if (!url.startsWith("http")) { //相对路径的js文件加上origin 构造完整url
        url = href.slice(0, href.lastIndexOf("/")) + "/" + url
    }
    if ((url.endsWith(".js") && !url.endsWith(".min.js")) || (url.endsWith(".css") && !url.endsWith(".min.css"))) { //加上.map构造出sourcemap文件路径
        url = `${url}.map`
        console.log(url)
        fetch(url).then(res => {
            if (res.status == 200) {
                console.log(`------bingo------\n${url} 疑似存在sourcemap文件泄露\n`)
            }
        }).catch(e => {
            console.log(`fetch ${url} 失败: ${e}`)
        })
    }
}

fetch(target).then(res => res.text()).then(res => {
    const { document } = (new JSDOM(res)).window
    const scripts = document.querySelectorAll("script")
    const links = document.querySelectorAll("link")
    const { protocol, origin, href } = new URL(target) //包含协议和域名
    for (let { src } of scripts) {
        judge(src, protocol, origin, href)
    }
    for (let { href: src } of links) {
        judge(src, protocol, origin, href)
    }
})
