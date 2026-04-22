function updatePostsIframe(filterby, me) {
    var frames = window.frames
    var postFrame = frames[0]

    var selectedEl = document.all["selected"]
    selectedEl.setAttribute("id", "")
    selectedEl.setAttribute("style", "")
    me.setAttribute("id", "selected")
    me.style.fontWeight = "bold"

    postFrame.document.location.href = "/posts&filterby=" + filterby
}