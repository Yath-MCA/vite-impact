import { getWindowRef, isLocalHost } from './errorContext.js';
import { formatStackHtml } from './errorMailHtml.js';
import { buildMetaMailPayload, sendMailIfAllowed, shareErrorMail } from './errorMailService.js';
import { shouldSkipMetaVisit } from './errorVisitThrottle.js';

const META_MODULES = [
  'checkIsExistErrorLog',
  'SEND_ERROR_MAIL',
  'ErrorShareMail',
  'addTeamIdsMail',
  'mailBody',
  'ERROR_ON_ERROR_MAIL',
  'GET_MAIL_TABLE_FORMAT'
];

let localTraceCount = 0;

export function resetErrorLogTraceState() {
  localTraceCount = 0;
}

function maybeUnlockSnapshot() {
  const snap = getWindowRef()?.IMPACT_SELECTION?._SNAPSHOT;
  if (typeof snap === 'function') {
    snap({ unlock: true });
  }
}

function isMetaPath(errModule) {
  const win = getWindowRef();
  return META_MODULES.includes(errModule) || win?.SHARED_KEY == null;
}

function searchQuery() {
  const search = getWindowRef()?.location?.search || '';
  return search.startsWith('?') ? search.slice(1) : search;
}

export function errorLogTrace(errModule, errMessage) {
  if (arguments.length < 1) {
    console.log('Arguments errModule and anyVariable are expected');
    return;
  }
  if (typeof errModule !== 'string') {
    console.log('The type of errModule is not match, please use string');
    return;
  }

  const win = getWindowRef() || {};
  if (!win.CanSendLocalMail && isLocalHost()) {
    localTraceCount += 1;
    if (localTraceCount > 1) return false;
    return;
  }

  const stack = new Error().stack || '';
  const stackHtml = formatStackHtml(errModule, stack);

  const run = async () => {
    if (isMetaPath(errModule)) {
      if (shouldSkipMetaVisit(searchQuery())) return;
      await sendMailIfAllowed(buildMetaMailPayload(errModule, stack, errMessage, stackHtml));
      maybeUnlockSnapshot();
      return;
    }
    await shareErrorMail(errModule, stack, errMessage, stackHtml);
    maybeUnlockSnapshot();
  };

  return run();
}
