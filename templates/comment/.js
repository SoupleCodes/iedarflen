import { escapeHTML } from "../../functions/[[index]]";
import html from "../comment/.html";

export async function returnCommentBody(id, content, author, author_id, date) {
    const response = new Response(html)

    return new HTMLRewriter()
        .on('table', {
            element(el) {
                el.setAttribute("id", "comment-" + id)
            }
        })
        .on('#comment-content td', {
            element(el) {
                el.setInnerContent(escapeHTML(content).replaceAll("\n", "<br/>"), { html: true })
            }
        })
        .on('#comment-stats td', {
            element(el) {
                el.setInnerContent(new Date(date).toLocaleString().split(",")[0] + ' by ')
                el.append('<a target="_blank" href="/user.html?id=', { html: true, ContentOptions: 'after'})
                el.append(author_id, { ContentOptions: 'after'})
                el.append('"><b><i>', { html: true, ContentOptions: 'after'})
                el.append(author, { ContentOptions: 'after'})
                el.append('</i></b></a>', { html: true, ContentOptions: 'after'})
            }
        })
        .transform(response).text()
}