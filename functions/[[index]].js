import { updatePageWithCookie, getJSONfromCookie } from "../cookie";
import { returnPostBody } from "../templates/post/.js"

export function escapeHTML(s) {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export async function httpFetch(route, method, body, responseType, token) {
    let link = 'https://api.darflen.com'

    try {
        var json = {}
        json.method = method || "GET"
        if (!(method=="GET") && !(method=="HEAD")) {
            json.body = body
        }
        if (token) {
            json.headers = 'Authorization: Bearer ' + token
        }
        var response = await fetch(link + route, json)
        if (responseType == 'text') {
            return await response.text()
        } else {
            return await response.json()
        }
    } catch (error) {
        console.error(error)
    }
}

export async function onRequest(context) {
    const { request, env } = context
    const assetUrl = new URL('/home.html', request.url);
    let response = await env.ASSETS.fetch(assetUrl);
    const path = context.functionPath
    var rewriter = new HTMLRewriter()

    if (path) {        
        if (path.startsWith("/posts")) {
            const url = request.url
            const searchParams = new URLSearchParams(url)
            const filterby = searchParams.get("filterby")
            const origin = searchParams.get("origin")
            const originID = searchParams.get("origin_id")

            var postsRes
            if (origin == "user") {
                postsRes = await httpFetch('/users/' + originID + '/posts', 'GET')
            } else {
                postsRes = await httpFetch('/explore/' + filterby + '/get/1', 'GET')
            }

            var posts = postsRes.posts.slice(0,25)
            var html = '<head><link rel="stylesheet" type="text/css" href="/styles/index.css"></head>'
            for (let i = 0; i < posts.length; i++) {
                let post = posts[i]
                
                html += await returnPostBody(
                    post.id,
                    post.content,
                    post.author.profile.username,
                    post.author.id,
                    post.stats.views,
                    post.miscellaneous.creation_time * 1000,
                    post.stats.comments,
                    post.author.profile.status || "offline"
                )
            }

            return new Response(html, {headers: {'Content-Type': 'text/html'}})
        } else if (path.startsWith("/auth")) {
            const url = request.url
            const searchParams = new URLSearchParams(url)
            const r = searchParams.get("r")
            switch (r) {
                case 'login':
                    var data = await request.text()
                    var json = Object.fromEntries(new URLSearchParams(data))

                    const formData = new FormData();
                    formData.append("email", json.email);
                    formData.append("password", json.password);

                    const loginRes = await httpFetch('/auth/login', 'POST', formData, 'json')
                    var newCookie = `identif_string=${loginRes.id}||${loginRes.token}; Expires=${new Date(new Date().getTime() + 20000000).toUTCString()}; secure; HttpOnly; SameSite=Strict; Cache-Control=no-cache;`
                    
                    // Set cookie
                    const response = await fetch(assetUrl);
                    const newResponse = new Response(response.body, response);

                    newResponse.headers.append("Set-Cookie", newCookie)
                    return newResponse
                case 'logout':
                    var cookie = request.headers.get("Cookie")
                    if (cookie) {
                        const { user_id, user_token } = getJSONfromCookie(cookie)
                        const response = await fetch(assetUrl);
                        const newResponse = new Response(response.body, response);

                        newResponse.headers.set("Set-Cookie", `identif_string=${user_id}||${user_token}; Expires=${new Date(-1).toUTCString()}; secure; HttpOnly; SameSite=Strict; Cache-Control=no-cache;`)

                        const url = request.url
                        const searchParams = new URLSearchParams(url)
                        const auth_token = searchParams.get("auth_token")

                        const logOutRes = await httpFetch('/auth/logout', 'POST', null, 'json', auth_token)
                        console.log(logOutRes)
                        return newResponse
                    }
                case 'register':
                        var data = await request.text()
                        var json = Object.fromEntries(new URLSearchParams(data))

                        const formDataReg = new FormData();
                        formDataReg.append("email", json.email);
                        formDataReg.append("username", json.username);
                        formDataReg.append("password", json.password);
                        formDataReg.append("month", Number(json.month));
                        formDataReg.append("day", Number(json.day));
                        formDataReg.append("year", Number(json.year));

                        const regRes = httpFetch('/auth/register', 'POST', formDataReg, 'json')
                        console.log(regRes)
                default:
                        return new Response("This page will redirect you to home.", {headers: {'Content-Type': 'text/html'}})
            }

        } else if (path.startsWith("/")) {
            var usersRes = await httpFetch('/explore/users/popular/get', 'GET')
            var users = usersRes.users
            rewriter.on("table#content table tbody#stats", {
                element(el) {
                    el.setInnerContent('<tr height="20"><td><h3>[ top 15 users ]</h3></td></tr>', { html: true })
                    for (let i = 0; i < users.length; i++) {
                        let u = users[i]
                        
                        el.append('<tr><td><a href="/user.html?id=', { html: true, ContentOptions: 'after'})
                        el.append(u.id, { ContentOptions: 'after'})
                        el.append('">', { html: true, ContentOptions: 'after'})
                        el.append('~' + u.profile.username, { ContentOptions: 'after'})
                        el.append('</a></td></tr>', { html: true, ContentOptions: 'after'})
                    }
                }
            })
        }
    }

    updatePageWithCookie(request, rewriter)
    return rewriter.transform(response)
}