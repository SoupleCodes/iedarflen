import { updatePageWithCookie, getJSONfromCookie } from "../cookie";
import { httpFetch } from "./[[index]]";
import { returnPostBody } from "../templates/post/.js"

export async function onRequest(context) {
    const { request, env } = context
    const assetUrl = new URL('/post.html', request.url);
    let response = await env.ASSETS.fetch(assetUrl);
    const path = context.functionPath
    var rewriter = new HTMLRewriter()

    if (path) {
        const url = request.url
        const searchParams = URL.parse(url).searchParams
        const comment = searchParams.get("comment")
        const id = searchParams.get("id")

        var postRes = await httpFetch('/posts/' + id, "GET", null)
        var post = postRes.post
        var commentsURl = '/comments&post_id=' + id

        var cookie = request.headers.get("Cookie")
        if (cookie) {
            const { user_token } = getJSONfromCookie(cookie)
            rewriter.on("#post-comment form", {
                element(el) {
                    el.setAttribute("action", '/postmessage&auth_token=' + user_token + '&post_id=' + id)
                }
            })
        } else {
            rewriter.on("#post-comment", {
                element(el) {
                    el.setInnerContent("")
                }
            })
        }

        rewriter.on("#post td", {
            async element(el) {
                el.setInnerContent(await returnPostBody(
                    post.id,
                    post.content,
                    post.author.profile.username,
                    post.author.id,
                    post.stats.views,
                    post.miscellaneous.creation_time * 1000,
                    post.stats.comments,
                    post.author.profile.status || "offline"
                ), { html: true })
            }
        })
        rewriter.on("iframe", {
            element(el) {
                el.setAttribute("src", commentsURl)
            }
        })
    }

    updatePageWithCookie(request, rewriter)
    return rewriter.transform(response)
}