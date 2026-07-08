/*jslint white:true, for:true */
/*global LinkSessionCore, LinkSessionModule */

/**
 * Landing bundle entry — session service without BaseModule dialog.
 */
class LinkSessionModule extends LinkSessionCore {
    static getInstance() {
        if (!LinkSessionModule._instance) {
            LinkSessionModule._instance = new LinkSessionModule();
        }
        return LinkSessionModule._instance;
    }
}

window.LinkSessionModule = LinkSessionModule;
window.LinkSessionService = LinkSessionModule;

document.addEventListener('DOMContentLoaded', () => {
    window.RE_DIRECT_CUR_SESSION = function (response, options) {
        return LinkSessionModule.getInstance().redirectCurrentSession(response, options);
    };
});
