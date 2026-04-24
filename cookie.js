export function getJSONfromCookie(c) {
    var cookieVal = c.split("=")[1]
    var user_id = cookieVal.split("||")[0]
    var user_token = cookieVal.split("||")[1]

    return { user_id, user_token }
}

export function updatePageWithCookie(req, rewriter) {
    var cookie = req.headers.get("Cookie")
    if (cookie) {
        const { user_id, user_token } = getJSONfromCookie(cookie)
        rewriter.on("table#nav table td:nth-child(3)", {
            element(el) {
                el.setInnerContent('<form action="/auth&r=logout&=auth_token=' + user_token + '" method="POST" target=""></form><h3>[ <a href="/user.html?id=' + user_id + '">me</a>' + ' - <a href="/settings">settings</a>' + ' - <a href="#" onclick="document.forms[0].submit();event.returnValue = false;return false;">logout</a> ]</h3>', { html: true })
            }
        })
    }
}