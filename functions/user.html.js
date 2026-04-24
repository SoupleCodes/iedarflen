import { updatePageWithCookie } from "../cookie";
import { escapeHTML, httpFetch } from "./[[index]]";

export async function onRequest(context) {
    const { request, env } = context
    const assetUrl = new URL('/profile.html', request.url);
    let response = await env.ASSETS.fetch(assetUrl);
    const path = context.functionPath
    var rewriter = new HTMLRewriter()

    if (path) {
        const url = request.url
        const searchParams = URL.parse(url).searchParams
        const id = searchParams.get("id")
        const view = searchParams.get("view") || ""

        var user = await httpFetch('/users/$' + id, "GET", null)

        rewriter.on("#viewing td", {
            element(el) {
                el.setInnerContent('you are viewing ')
                el.append('<b>', { html: true, ContentOptions: 'after'})
                el.append(user.profile.username, { ContentOptions: 'after'})
                el.append('\'s</b> page', { html: true, ContentOptions: 'after'})
            }
        })
        rewriter.on("#profile-info td", {
            element(el) {
                if (view == 'my_posts') {
                    el.append('<iframe TARGET="_BLANK" MARGINWIDTH="0" MARGINHEIGHT="0" FRAMEBORDER="0" WIDTH="100%" HEIGHT="500" SRC="/posts&filterby=recent&origin=user', { html: true, ContentOptions: 'after'})
                    el.append('&origin_id=' + user.profile.username, { ContentOptions: 'after'})
                    el.append('"></iframe>', { html: true, ContentOptions: 'after'})
                } else {
                    el.setInnerContent(escapeHTML(user.profile.description).replaceAll("\n", "<br/>"), { html: true })
                }
            }
        })
        rewriter.on("img#picture", {
            element(el) {
                el.setAttribute("src", user.profile.images.icon.thumbnail)
            }
        })
        rewriter.on("#profile-more-links td", {
            element(el) {
                var linkStart = "/user.html?id=" + user.id
                el.setInnerContent("[ ")
                el.append('<a href="', { html: true, ContentOptions: 'after'})
                el.append(linkStart, { ContentOptions: 'after'})
                el.append('">view my profile</a>', { html: true, ContentOptions: 'after'})
                el.append(' - ', { ContentOptions: 'after'})
                el.append('<a href="', { html: true, ContentOptions: 'after'})
                el.append(linkStart + "&view=my_posts", { ContentOptions: 'after'})
                el.append('">view my posts</a> ]', { html: true, ContentOptions: 'after'})
            }
        })
        rewriter.on("table#content table tbody#stats", {
            element(el) {
                el.setInnerContent('<tr height="20"><td><h3>[ statistics ]</h3></td></tr>', { html: true })
                // Posts
                el.append('<tr><td>', { html: true, ContentOptions: 'after'})
                el.append(user.stats.posts + ' posts')
                el.append('</td></tr>', { html: true, ContentOptions: 'after'})
                // Followers
                el.append('<tr><td>', { html: true, ContentOptions: 'after'})
                el.append(user.stats.followers + ' followers')
                el.append('</td></tr>', { html: true, ContentOptions: 'after'})
                // Following
                el.append('<tr><td>', { html: true, ContentOptions: 'after'})
                el.append(user.stats.following + ' following')
                el.append('</td></tr>', { html: true, ContentOptions: 'after'})
                // Loves
                el.append('<tr><td>', { html: true, ContentOptions: 'after'})
                el.append(user.stats.loves + ' posts loved')
                el.append('</td></tr>', { html: true, ContentOptions: 'after'})
                // Communities
                el.append('<tr><td>', { html: true, ContentOptions: 'after'})
                el.append(user.stats.communities + ' communities created')
                el.append('</td></tr>', { html: true, ContentOptions: 'after'})

                // If user has links
                var links = user.profile.links
                if (links && Array.isArray(links) && (links.length > 0)) {
                    el.append('<tr valign="bottom" height="30"><td><h3>[ my links ]</h3></td></tr>', { html: true })
                    for (let i = 0; i < links.length; i++) {
                        let l = links[i]
                        
                        el.append('<tr><td><a href="', { html: true, ContentOptions: 'after'})
                        el.append(l.link, { ContentOptions: 'after'})
                        el.append('">', { html: true, ContentOptions: 'after'})
                        el.append(l.title, { ContentOptions: 'after'})
                        el.append('</a></td></tr>', { html: true, ContentOptions: 'after'})
                    }
                }
            }
        })
    }

    updatePageWithCookie(request, rewriter)
    return rewriter.transform(response)
}