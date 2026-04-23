import { returnPostBody } from "../templates/post/.js"

export async function httpFetch(route, method, body, responseType) {
    let link = 'https://api.darflen.com'

    try {
        var json = {}
        json.method = method || "GET"
        if (!(method=="GET") && !(method=="HEAD")) {
            json.body = JSON.stringify(body) || {}
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
                    post.stats.comments
                )
            }

            return new Response(html, {headers: {'Content-Type': 'text/html'}})
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

    return rewriter.transform(response)
}