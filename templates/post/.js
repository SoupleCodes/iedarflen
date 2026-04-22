import html from "../post/.html";

export async function returnPostBody(id, content, author, author_id, view_count, date, comment_count) {
    const response = new Response(html)

    return new HTMLRewriter()
        .on('table', {
            element(el) {
                el.setAttribute("id", "post-" + id)
            }
        })
        .on('#post-content td', {
            element(el) {
                el.setInnerContent(content)
            }
        })
        .on('#post-stats td', {
            element(el) {
                el.setInnerContent('[ from ')
                el.append('<a href="/user.html?id=', { html: true, ContentOptions: 'after'})
                el.append(author_id, { ContentOptions: 'after'})
                el.append('">', { html: true, ContentOptions: 'after'})
                el.append('~' + author, { ContentOptions: 'after'})
                el.append('</a>', { html: true, ContentOptions: 'after'})
                el.append(" - viewed " + view_count + " " + ((view_count == 1) ? " time" : " times") + " - " + new Date(date).toUTCString() + " - ", { ContentOptions: 'after'})

                el.append('<a href="/post.html?id=', { html: true, ContentOptions: 'after'})
                el.append(id, { ContentOptions: 'after'})
                el.append('">', { html: true, ContentOptions: 'after'})
                el.append('view ' + comment_count + ((comment_count == 1) ? " comment" : " comments"), { ContentOptions: 'after'})
                el.append('</a> ]', { html: true, ContentOptions: 'after'})
            }
        })
        .transform(response).text()
}
// ContentOptions